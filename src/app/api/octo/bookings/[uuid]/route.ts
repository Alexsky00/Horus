import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeLog } from "@/lib/log";
import { authenticate, octoHeaders, requestedCapabilities } from "@/lib/octo/auth";
import { getSlotById } from "@/lib/octo/availability";
import { bookingPrice, bookingToOcto, octoStatus } from "@/lib/octo/booking";
import { getOctoConfig } from "@/lib/octo/config";
import {
  badRequest,
  invalidAvailabilityId,
  unprocessable,
  withOctoErrors,
} from "@/lib/octo/errors";
import { contactToHorus, loadBooking } from "@/lib/octo/find";
import { expireStaleHolds } from "@/lib/octo/holds";
import { withCalendarLock } from "@/lib/octo/lock";
import { assertOption, parseUnitItems } from "@/lib/octo/resolve";

export const dynamic = "force-dynamic";

// GET /api/octo/bookings/:uuid
export async function GET(req: NextRequest, { params }: { params: { uuid: string } }) {
  return withOctoErrors(async () => {
    await authenticate(req);

    const cfg = await getOctoConfig();
    const withPricing = requestedCapabilities(req).includes("octo/pricing");
    const { booking, tour } = await loadBooking(params.uuid);

    return NextResponse.json(bookingToOcto(booking, tour, cfg, withPricing), {
      headers: octoHeaders(req),
    });
  });
}

/**
 * PATCH /api/octo/bookings/:uuid — modification (créneau, participants, contact).
 *
 * Le cas piégeux est le changement de créneau : il faut vérifier que le nouveau
 * est libre *sans* que l'ancien, encore détenu par cette même réservation, ne se
 * compte lui-même comme un obstacle. D'où la libération provisoire ci-dessous.
 */
export async function PATCH(req: NextRequest, { params }: { params: { uuid: string } }) {
  return withOctoErrors(async () => {
    const reseller = await authenticate(req);
    await expireStaleHolds();

    const body = await req.json().catch(() => {
      throw badRequest("Request body must be valid JSON");
    });

    const cfg = await getOctoConfig();
    const withPricing = requestedCapabilities(req).includes("octo/pricing");
    const { booking, tour } = await loadBooking(params.uuid);

    const status = octoStatus(booking);
    if (status !== "ON_HOLD" && status !== "CONFIRMED") {
      throw unprocessable(`Cannot modify a booking with status ${status}`, { status });
    }

    if (body.optionId !== undefined) assertOption(body.optionId);
    if (body.productId !== undefined && body.productId !== tour.id) {
      throw unprocessable("Changing the product of an existing booking is not supported", {
        productId: body.productId,
      });
    }

    const data: Record<string, unknown> = {};

    // ── Unités (nombre de voyageurs) ──
    let pax = booking.participants;
    let unitCount = 1;

    if (body.unitItems !== undefined) {
      const parsed = parseUnitItems(tour, body.unitItems);
      pax = parsed.pax;
      unitCount = parsed.items.length;
      data.unitItems = JSON.stringify(parsed.items);
      data.participants = pax;
      data.price = bookingPrice(tour, pax, unitCount);
    }

    // ── Créneau ──
    const targetId =
      typeof body.availabilityId === "string" && body.availabilityId
        ? body.availabilityId
        : booking.availabilityId;

    const slotChanged = targetId !== booking.availabilityId;
    const paxChanged = body.unitItems !== undefined && pax !== booking.participants;

    // ── Contact ──
    if (body.contact && typeof body.contact === "object") {
      const mapped = contactToHorus(body.contact as Record<string, unknown>);
      if (mapped.guestName) data.guestName = mapped.guestName;
      if (mapped.guestEmail) data.guestEmail = mapped.guestEmail;
      if (mapped.phone) data.phone = mapped.phone;
      if (mapped.nationality) data.nationality = mapped.nationality;
      data.contactJson = JSON.stringify(body.contact);
    }

    if (typeof body.notes === "string") data.notes = body.notes;
    if (typeof body.resellerReference === "string") data.resellerRef = body.resellerReference;

    if (Number.isInteger(body.expirationMinutes) && body.expirationMinutes > 0 && status === "ON_HOLD") {
      data.holdExpiresAt = new Date(Date.now() + Number(body.expirationMinutes) * 60_000);
    }

    // Déplacer une réservation, c'est prendre une place ailleurs : même course
    // que lors d'une création, donc même verrou. Une modification qui ne touche
    // ni au créneau ni au nombre de places n'a rien à revérifier.
    const updated =
      slotChanged || paxChanged
        ? await withCalendarLock(async (tx) => {
            if (!targetId) throw invalidAvailabilityId(targetId);

            // La réservation s'exclut elle-même du calcul, sinon elle bloquerait le
            // créneau qu'elle quitte et se compterait deux fois sur son propre départ.
            const slot = await getSlotById(tour, targetId, cfg, {
              excludeBookingId: booking.id,
              client: tx,
            });
            if (!slot) throw invalidAvailabilityId(targetId);

            if (!slot.available || pax > slot.vacancies) {
              throw unprocessable("The requested availability cannot accommodate this booking", {
                availabilityId: targetId,
                vacancies: slot.vacancies,
              });
            }

            return tx.booking.update({
              where: { id: booking.id },
              data: { ...data, availabilityId: slot.id, date: slot.startUtc },
            });
          })
        : await prisma.booking.update({ where: { id: booking.id }, data });

    await writeLog(
      "created",
      updated.id,
      `[OCTO ${reseller.name}] Reserva modificada — ${tour.name} — ${updated.availabilityId} (${updated.participants} pers.)`
    );

    return NextResponse.json(bookingToOcto(updated, tour, cfg, withPricing), {
      headers: octoHeaders(req),
    });
  });
}
