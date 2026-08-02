import type { Prisma } from "@prisma/client";

/**
 * Réservations qui occupent réellement l'agenda du guide.
 *
 * Avant OCTO, "occupé" voulait dire "confirmé". Ça ne suffit plus : une OTA peut
 * détenir un hold de 30 minutes sur un créneau pendant qu'elle encaisse son
 * client. Si le formulaire manuel ignorait ces holds, le guide pourrait vendre
 * en direct un créneau que Civitatis est en train de vendre — exactement la
 * double réservation qu'on cherche à éliminer.
 *
 * Un hold périmé, lui, ne réserve plus rien.
 */
export function occupyingBookingsWhere(now: Date = new Date()): Prisma.BookingWhereInput {
  return {
    OR: [{ status: "confirmed" }, { status: "on_hold", holdExpiresAt: { gt: now } }],
  };
}
