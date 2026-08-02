import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeLog } from "@/lib/log";
import { getSlotById } from "@/lib/octo/availability";
import { NO_CONTACT_YET, bookingPrice, bookingToOcto, makeSupplierRef } from "@/lib/octo/booking";
import { authenticate, octoHeaders, requestedCapabilities } from "@/lib/octo/auth";
import { getOctoConfig } from "@/lib/octo/config";
import {
  badRequest,
  invalidAvailabilityId,
  unprocessable,
  withOctoErrors,
} from "@/lib/octo/errors";
import { expireStaleHolds } from "@/lib/octo/holds";
import { withCalendarLock } from "@/lib/octo/lock";
import { DEFAULT_OPTION_ID } from "@/lib/octo/mappers";
import { assertOption, parseUnitItems, resolveTour } from "@/lib/octo/resolve";
import { isLocalDate, localToUtc, utcToLocalDate } from "@/lib/octo/tz";

export const dynamic = "force-dynamic";

/**
 * POST /api/octo/bookings — pose un hold sur un créneau.
 *
 * La réservation naît ON_HOLD : elle bloque le créneau (le moteur de dispo la
 * compte), mais elle n'est pas encore vendue. Le revendeur a `expirationMinutes`
 * pour encaisser son client puis appeler /confirm. Passé ce délai, le créneau
 * se libère tout seul.
 *
 * On ne notifie pas le guide à ce stade : un hold est transitoire, le prévenir
 * ici le noierait sous les notifications de paniers abandonnés.
 */
export async function POST(req: NextRequest) {
  return withOctoErrors(async () => {
    const reseller = await authenticate(req);

    const body = await req.json().catch(() => {
      throw badRequest("Request body must be valid JSON");
    });

    const withPricing = requestedCapabilities(req).includes("octo/pricing");
    assertOption(body.optionId);

    // Idempotence : le revendeur fournit l'uuid. S'il rejoue la requête (timeout
    // réseau de son côté), on lui rend la réservation existante au lieu d'en
    // créer une seconde.
    const uuid: string = typeof body.uuid === "string" && body.uuid ? body.uuid : crypto.randomUUID();

    // Trois lectures indépendantes : un aller-retour au lieu de trois.
    // On ne balaie PAS les holds périmés ici : le moteur de disponibilité les
    // ignore déjà, donc ce serait une écriture SQL gratuite sur le chemin le
    // plus critique de l'application — celui qui encaisse une vente.
    const [cfg, tour, existing] = await Promise.all([
      getOctoConfig(),
      resolveTour(body.productId),
      prisma.booking.findUnique({ where: { octoUuid: uuid } }),
    ]);

    if (existing) {
      return NextResponse.json(bookingToOcto(existing, tour, cfg, withPricing), {
        headers: octoHeaders(req),
      });
    }

    const { items, pax } = parseUnitItems(tour, body.unitItems);

    const maxUnits = tour.pricingMode === "person" ? tour.capacity : 1;
    if (items.length > maxUnits) {
      throw unprocessable(`This option accepts at most ${maxUnits} unit(s) per booking`, {
        maxUnits,
      });
    }

    if (typeof body.availabilityId !== "string" || !body.availabilityId) {
      throw invalidAvailabilityId(body.availabilityId);
    }

    const availabilityId: string = body.availabilityId;
    const holdMinutes =
      Number.isInteger(body.expirationMinutes) && body.expirationMinutes > 0
        ? Number(body.expirationMinutes)
        : cfg.holdMinutes;

    // Vérifier la place puis la réserver doit être atomique. Sans le verrou,
    // deux ventes simultanées lisent toutes deux « il reste de la place » avant
    // que l'une n'ait écrit : le départ est survendu et le guide se retrouve
    // devant deux groupes. La relecture ci-dessous passe par `tx` — c'est ce qui
    // rend le verrou utile.
    const { booking, slotId } = await withCalendarLock(async (tx) => {
      const slot = await getSlotById(tour, availabilityId, cfg, { client: tx });
      if (!slot) throw invalidAvailabilityId(availabilityId);

      if (!slot.available) {
        throw unprocessable("This availability is no longer bookable", { availabilityId });
      }

      if (pax > slot.vacancies) {
        throw unprocessable(
          `Only ${slot.vacancies} place(s) left on this departure, ${pax} requested`,
          { availabilityId, vacancies: slot.vacancies }
        );
      }

      const created = await tx.booking.create({
        data: {
          source: reseller.source,
          // Le contact n'arrive qu'à la confirmation : on ne le connaît pas encore.
          guestName: NO_CONTACT_YET,
          guestEmail: "",
          tourName: tour.name,
          tourId: tour.id,
          date: slot.startUtc,
          participants: pax,
          duration: tour.duration,
          routeType: tour.routeType,
          allDay: false,
          status: "on_hold",
          price: bookingPrice(tour, pax, items.length),
          notes: typeof body.notes === "string" ? body.notes : null,

          octoUuid: uuid,
          octoOptionId: DEFAULT_OPTION_ID,
          availabilityId: slot.id,
          supplierRef: makeSupplierRef(tour.routeType, reseller.source),
          unitItems: JSON.stringify(items),
          holdExpiresAt: new Date(Date.now() + holdMinutes * 60_000),
          testMode: body.testMode === true,
        },
      });

      return { booking: created, slotId: slot.id };
    });

    await writeLog(
      "pending",
      booking.id,
      `[OCTO ${reseller.name}] Hold ${holdMinutes} min — ${tour.name} — ${slotId} (${pax} pers.)`
    );

    return NextResponse.json(bookingToOcto(booking, tour, cfg, withPricing), {
      headers: octoHeaders(req),
    });
  });
}

// GET /api/octo/bookings — liste filtrée des réservations du revendeur
export async function GET(req: NextRequest) {
  return withOctoErrors(async () => {
    await authenticate(req);
    await expireStaleHolds();

    const cfg = await getOctoConfig();
    const withPricing = requestedCapabilities(req).includes("octo/pricing");
    const q = req.nextUrl.searchParams;

    const resellerReference = q.get("resellerReference");
    const supplierReference = q.get("supplierReference");
    const productId = q.get("productId");
    const optionId = q.get("optionId");
    const localDate = q.get("localDate");
    const localDateStart = q.get("localDateStart");
    const localDateEnd = q.get("localDateEnd");

    if (optionId) assertOption(optionId);

    // Une plage de dates locales doit être convertie en instants UTC avant d'être
    // comparée à `date` — sinon on décale d'une à deux heures selon la saison.
    let dateFilter: { gte?: Date; lte?: Date } | undefined;

    const from = localDate ?? localDateStart;
    const to = localDate ?? localDateEnd;

    if (from || to) {
      if (from && !isLocalDate(from)) throw badRequest("Invalid localDate/localDateStart");
      if (to && !isLocalDate(to)) throw badRequest("Invalid localDate/localDateEnd");

      dateFilter = {
        ...(from ? { gte: localToUtc(from, "00:00", cfg.timeZone) } : {}),
        ...(to ? { lte: localToUtc(to, "23:59", cfg.timeZone) } : {}),
      };
    }

    const bookings = await prisma.booking.findMany({
      where: {
        // Seules les réservations nées d'OCTO ont un uuid : les saisies manuelles
        // du guide ne regardent pas le revendeur.
        octoUuid: { not: null },
        ...(resellerReference ? { resellerRef: resellerReference } : {}),
        ...(supplierReference ? { supplierRef: supplierReference } : {}),
        ...(productId ? { tourId: productId } : {}),
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      orderBy: { date: "asc" },
      take: 200,
    });

    const tourIds = Array.from(
      new Set(bookings.map((b) => b.tourId).filter((id): id is string => id != null))
    );
    const tours = await prisma.tour.findMany({ where: { id: { in: tourIds } } });
    const byId = new Map(tours.map((t) => [t.id, t]));

    const out = bookings
      .map((b) => {
        const tour = b.tourId ? byId.get(b.tourId) : undefined;
        return tour ? bookingToOcto(b, tour, cfg, withPricing) : null;
      })
      .filter(Boolean);

    return NextResponse.json(out, { headers: octoHeaders(req) });
  });
}
