import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeLog } from "@/lib/log";
import { sendEmailFallback, sendPushToAll } from "@/lib/push";
import { authenticate, octoHeaders, requestedCapabilities } from "@/lib/octo/auth";
import { bookingToOcto, isCancellable, octoStatus } from "@/lib/octo/booking";
import { getOctoConfig } from "@/lib/octo/config";
import { unprocessable, withOctoErrors } from "@/lib/octo/errors";
import { loadBooking } from "@/lib/octo/find";

export const dynamic = "force-dynamic";

/**
 * POST /api/octo/bookings/:uuid/cancel
 *
 * L'annulation libère le créneau immédiatement (le moteur de dispo cesse de
 * compter la réservation), donc il peut être revendu dans la foulée.
 */
export async function POST(req: NextRequest, { params }: { params: { uuid: string } }) {
  return withOctoErrors(async () => {
    const reseller = await authenticate(req);

    const body = await req.json().catch(() => ({}));
    const cfg = await getOctoConfig();
    const withPricing = requestedCapabilities(req).includes("octo/pricing");

    const { booking, tour } = await loadBooking(params.uuid);
    const status = octoStatus(booking);

    // Annuler une réservation déjà annulée est sans effet, pas une erreur.
    if (status === "CANCELLED") {
      return NextResponse.json(bookingToOcto(booking, tour, cfg, withPricing), {
        headers: octoHeaders(req),
      });
    }

    if (status !== "ON_HOLD" && status !== "CONFIRMED") {
      throw unprocessable(`Cannot cancel a booking with status ${status}`, { status });
    }

    // `force` permet au revendeur de passer outre le délai d'annulation (geste
    // commercial, litige). Sans lui, le délai s'applique.
    if (!isCancellable(booking, cfg) && body.force !== true) {
      throw unprocessable("The cancellation cutoff has elapsed for this booking", {
        cancellationCutoff: `${cfg.cancellationCutoffHours} hours`,
      });
    }

    const reason = typeof body.reason === "string" ? body.reason : null;

    const cancelled = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: reason,
        holdExpiresAt: null,
      },
    });

    // Un hold abandonné ne mérite pas de notification ; une vente confirmée qui
    // saute, si — le guide doit savoir que sa journée s'est libérée.
    if (status === "CONFIRMED") {
      const when = cancelled.date.toLocaleString("es-ES", {
        timeZone: cfg.timeZone,
        dateStyle: "short",
        timeStyle: "short",
      });

      const msg = {
        title: `Reserva cancelada [${reseller.name.toUpperCase()}]`,
        body: `${cancelled.guestName} — ${tour.name} el ${when}${reason ? ` — ${reason}` : ""}`,
        url: "/",
      };

      await Promise.allSettled([
        sendPushToAll(msg),
        sendEmailFallback(msg.title, msg.body),
        writeLog(
          "refused",
          cancelled.id,
          `[OCTO ${reseller.name}] Cancelada — ${cancelled.guestName} — ${tour.name} — ${when}${reason ? ` (${reason})` : ""}`
        ),
      ]);
    } else {
      await writeLog(
        "refused",
        cancelled.id,
        `[OCTO ${reseller.name}] Hold cancelado — ${tour.name}`
      );
    }

    return NextResponse.json(bookingToOcto(cancelled, tour, cfg, withPricing), {
      headers: octoHeaders(req),
    });
  });
}
