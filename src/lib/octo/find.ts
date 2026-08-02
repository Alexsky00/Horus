import type { Booking, Tour } from "@prisma/client";
import { prisma } from "@/lib/db";
import { invalidBookingUuid, unprocessable } from "./errors";

/** Charge une réservation OCTO et son tour. Les deux doivent exister pour que la réservation soit servable. */
export async function loadBooking(uuid: unknown): Promise<{ booking: Booking; tour: Tour }> {
  if (typeof uuid !== "string" || !uuid) throw invalidBookingUuid(uuid);

  const booking = await prisma.booking.findUnique({ where: { octoUuid: uuid } });
  if (!booking) throw invalidBookingUuid(uuid);

  if (!booking.tourId) {
    throw unprocessable("This booking is not linked to a product", { uuid });
  }

  const tour = await prisma.tour.findUnique({ where: { id: booking.tourId } });
  if (!tour) throw unprocessable("The product of this booking no longer exists", { uuid });

  return { booking, tour };
}

/** Contact OCTO → colonnes Horus. `fullName` prime, sinon on recompose depuis prénom/nom. */
export function contactToHorus(contact: Record<string, unknown> | undefined) {
  const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

  const first = s(contact?.firstName);
  const last = s(contact?.lastName);
  const full = s(contact?.fullName) ?? ([first, last].filter(Boolean).join(" ") || null);

  return {
    guestName: full,
    guestEmail: s(contact?.emailAddress),
    phone: s(contact?.phoneNumber),
    nationality: s(contact?.country),
    notes: s(contact?.notes),
  };
}
