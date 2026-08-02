import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticate, octoHeaders, requestedCapabilities } from "@/lib/octo/auth";
import { bookingToOcto, octoStatus } from "@/lib/octo/booking";
import { getOctoConfig } from "@/lib/octo/config";
import { invalidBookingUuid, unprocessable, withOctoErrors } from "@/lib/octo/errors";
import { loadBooking } from "@/lib/octo/find";

export const dynamic = "force-dynamic";

/**
 * POST /api/octo/bookings/:uuid/extend — rallonge le hold.
 *
 * Cas d'usage : le client du revendeur est encore sur la page de paiement quand
 * le hold arrive à échéance.
 */
export async function POST(req: NextRequest, { params }: { params: { uuid: string } }) {
  return withOctoErrors(async () => {
    await authenticate(req);

    const body = await req.json().catch(() => ({}));
    const cfg = await getOctoConfig();
    const withPricing = requestedCapabilities(req).includes("octo/pricing");

    const { booking, tour } = await loadBooking(params.uuid);
    const status = octoStatus(booking);

    // Une fois le hold expiré, le créneau est peut-être déjà revendu : on ne
    // ressuscite pas, on refuse.
    if (status === "EXPIRED") throw invalidBookingUuid(params.uuid);

    if (status !== "ON_HOLD") {
      throw unprocessable(`Only ON_HOLD bookings can be extended, this one is ${status}`, {
        status,
      });
    }

    const minutes =
      Number.isInteger(body.expirationMinutes) && body.expirationMinutes > 0
        ? Number(body.expirationMinutes)
        : cfg.holdMinutes;

    const extended = await prisma.booking.update({
      where: { id: booking.id },
      data: { holdExpiresAt: new Date(Date.now() + minutes * 60_000) },
    });

    return NextResponse.json(bookingToOcto(extended, tour, cfg, withPricing), {
      headers: octoHeaders(req),
    });
  });
}
