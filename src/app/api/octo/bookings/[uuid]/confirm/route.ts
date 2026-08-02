import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeLog } from "@/lib/log";
import { sendEmailFallback, sendPushToAll } from "@/lib/push";
import { authenticate, octoHeaders, requestedCapabilities } from "@/lib/octo/auth";
import { bookingToOcto, octoStatus } from "@/lib/octo/booking";
import { getOctoConfig } from "@/lib/octo/config";
import { badRequest, invalidBookingUuid, unprocessable, withOctoErrors } from "@/lib/octo/errors";
import { contactToHorus, loadBooking } from "@/lib/octo/find";

export const dynamic = "force-dynamic";

/**
 * POST /api/octo/bookings/:uuid/confirm — la vente est faite.
 *
 * Le hold devient une réservation ferme. C'est *ici* qu'on prévient le guide :
 * la place est vendue, il n'a rien à valider, il doit juste le savoir.
 */
export async function POST(req: NextRequest, { params }: { params: { uuid: string } }) {
  return withOctoErrors(async () => {
    const reseller = await authenticate(req);

    const body = await req.json().catch(() => {
      throw badRequest("Request body must be valid JSON");
    });

    const cfg = await getOctoConfig();
    const withPricing = requestedCapabilities(req).includes("octo/pricing");
    const { booking, tour } = await loadBooking(params.uuid);

    const status = octoStatus(booking);

    // Confirmer deux fois est inoffensif : on rend la réservation telle quelle.
    if (status === "CONFIRMED") {
      return NextResponse.json(bookingToOcto(booking, tour, cfg, withPricing), {
        headers: octoHeaders(req),
      });
    }

    // Un hold expiré a rendu son créneau : il n'y a plus rien à confirmer, et le
    // créneau a pu être revendu entre-temps.
    if (status === "EXPIRED") throw invalidBookingUuid(params.uuid);

    if (status !== "ON_HOLD") {
      throw unprocessable(`Cannot confirm a booking with status ${status}`, { status });
    }

    const contact = body.contact;
    if (!contact || typeof contact !== "object") {
      throw badRequest("`contact` is required to confirm a booking");
    }

    const mapped = contactToHorus(contact as Record<string, unknown>);
    if (!mapped.guestName) {
      throw badRequest("`contact` must include firstName/lastName or fullName");
    }

    const confirmed = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "confirmed",
        confirmedAt: new Date(),
        holdExpiresAt: null,
        guestName: mapped.guestName,
        guestEmail: mapped.guestEmail ?? "",
        phone: mapped.phone,
        nationality: mapped.nationality,
        notes: mapped.notes ?? booking.notes,
        resellerRef:
          typeof body.resellerReference === "string" ? body.resellerReference : booking.resellerRef,
        contactJson: JSON.stringify(contact),
      },
    });

    const when = confirmed.date.toLocaleString("es-ES", {
      timeZone: cfg.timeZone,
      dateStyle: "short",
      timeStyle: "short",
    });

    const msg = {
      title: `Reserva confirmada [${reseller.name.toUpperCase()}]`,
      body: `${confirmed.guestName} — ${tour.name} el ${when} (${confirmed.participants} pers.)`,
      url: "/",
    };

    // Ni le push ni le log ne doivent pouvoir faire échouer une vente déjà encaissée.
    await Promise.allSettled([
      sendPushToAll(msg),
      sendEmailFallback(msg.title, msg.body),
      writeLog(
        "confirmed",
        confirmed.id,
        `[OCTO ${reseller.name}] Venta confirmada — ${confirmed.guestName} — ${tour.name} — ${when} (${confirmed.participants} pers.)`
      ),
    ]);

    return NextResponse.json(bookingToOcto(confirmed, tour, cfg, withPricing), {
      headers: octoHeaders(req),
    });
  });
}
