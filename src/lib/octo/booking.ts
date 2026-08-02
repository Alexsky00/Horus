import type { Booking, Tour } from "@prisma/client";
import { OctoConfig, toMinorUnits } from "./config";
import { DEFAULT_OPTION_ID, makePricing, tourToProduct, tourUnitDefs } from "./mappers";
import { toUtcString, utcToLocalDateTime } from "./tz";

/** Statuts OCTO ↔ statuts Horus. Horus en a plus (il gère aussi les demandes manuelles). */
const STATUS_MAP: Record<string, string> = {
  on_hold: "ON_HOLD",
  confirmed: "CONFIRMED",
  cancelled: "CANCELLED",
  expired: "EXPIRED",
  refused: "REJECTED",
  pending: "PENDING",
  conflict: "PENDING",
};

export function octoStatus(booking: Booking, now = new Date()): string {
  // Un hold dont le délai est écoulé est expiré, même si le balayage n'est pas encore passé.
  if (
    booking.status === "on_hold" &&
    booking.holdExpiresAt != null &&
    booking.holdExpiresAt.getTime() <= now.getTime()
  ) {
    return "EXPIRED";
  }
  return STATUS_MAP[booking.status] ?? "PENDING";
}

/** Une réservation reste annulable tant qu'on n'a pas franchi le délai d'annulation avant départ. */
export function isCancellable(booking: Booking, cfg: OctoConfig, now = new Date()): boolean {
  const status = octoStatus(booking, now);
  if (status !== "ON_HOLD" && status !== "CONFIRMED") return false;

  const cutoff = booking.date.getTime() - cfg.cancellationCutoffHours * 3_600_000;
  return now.getTime() < cutoff;
}

/** Référence fournisseur unique et lisible : préfixe métier + suffixe aléatoire. */
export function makeSupplierRef(routeType: string | null, source: string): string {
  const routeChar = ({ corta: "C", media: "M", larga: "L" } as Record<string, string>)[routeType ?? ""] ?? "";
  const sourceChar = source === "wordpress" ? "" : source.charAt(0).toUpperCase();

  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sans I/L/O/0/1, illisibles à l'oral
  const suffix = Array.from(
    { length: 6 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join("");

  return `R${routeChar}${sourceChar}-${suffix}`;
}

type StoredUnitItem = { uuid: string; unitId: string; resellerReference?: string | null };

function parseUnitItems(booking: Booking): StoredUnitItem[] {
  try {
    const parsed = JSON.parse(booking.unitItems ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Marque un client encore inconnu : un hold est posé avant que le revendeur n'ait le contact. */
export const NO_CONTACT_YET = "—";

function parseContact(booking: Booking): Record<string, unknown> {
  try {
    const parsed = JSON.parse(booking.contactJson ?? "null");
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
  } catch {
    // on retombe sur les colonnes natives
  }

  // Tant que la réservation n'est pas confirmée, le client n'existe pas encore :
  // on renvoie un contact vide plutôt que le nom fictif du hold.
  const name = booking.guestName === NO_CONTACT_YET ? "" : booking.guestName ?? "";
  const [firstName, ...rest] = name.split(" ");

  return {
    fullName: name || null,
    firstName: firstName || null,
    lastName: rest.join(" ") || null,
    emailAddress: booking.guestEmail || null,
    phoneNumber: booking.phone || null,
    locales: [],
    postalCode: null,
    country: booking.nationality || null,
    notes: null,
  };
}

/** Booking Horus → Booking OCTO complet (la spec exige les objets produit/option/unité imbriqués). */
export function bookingToOcto(
  booking: Booking,
  tour: Tour,
  cfg: OctoConfig,
  withPricing: boolean,
  now = new Date()
) {
  const product = tourToProduct(tour, cfg, withPricing);
  const option = product.options[0];
  const status = octoStatus(booking, now);

  const unitDefs = new Map(tourUnitDefs(tour).map((u) => [u.id, u]));
  const stored = parseUnitItems(booking);
  const contact = parseContact(booking);

  const endUtc = new Date(booking.date.getTime() + (booking.duration ?? tour.duration) * 60_000);

  const unitItems = stored.map((item) => ({
    uuid: item.uuid,
    resellerReference: item.resellerReference ?? null,
    supplierReference: null,
    unitId: item.unitId,
    unit: unitDefs.get(item.unitId) ?? null,
    status,
    utcRedeemedAt: null,
    contact: emptyContact(),
    ticket: null,
  }));

  return {
    id: booking.id,
    uuid: booking.octoUuid ?? booking.id,
    testMode: booking.testMode,
    resellerReference: booking.resellerRef ?? null,
    supplierReference: booking.supplierRef ?? null,
    status,
    utcCreatedAt: toUtcString(booking.createdAt),
    utcUpdatedAt: booking.updatedAt ? toUtcString(booking.updatedAt) : null,
    utcExpiresAt: booking.holdExpiresAt ? toUtcString(booking.holdExpiresAt) : null,
    utcRedeemedAt: null,
    utcConfirmedAt: booking.confirmedAt ? toUtcString(booking.confirmedAt) : null,
    productId: tour.id,
    product,
    optionId: DEFAULT_OPTION_ID,
    option,
    cancellable: isCancellable(booking, cfg, now),
    cancellation: booking.cancelledAt
      ? {
          refund: "FULL",
          reason: booking.cancelReason ?? null,
          utcCancelledAt: toUtcString(booking.cancelledAt),
        }
      : null,
    freesale: false,
    availabilityId: booking.availabilityId ?? utcToLocalDateTime(booking.date, cfg.timeZone),
    availability: {
      id: booking.availabilityId ?? utcToLocalDateTime(booking.date, cfg.timeZone),
      localDateTimeStart: utcToLocalDateTime(booking.date, cfg.timeZone),
      localDateTimeEnd: utcToLocalDateTime(endUtc, cfg.timeZone),
      allDay: false,
      openingHours: [],
    },
    contact,
    notes: booking.notes ?? null,
    deliveryMethods: ["VOUCHER"],
    voucher: null,
    unitItems,
    ...(withPricing && booking.price != null
      ? { pricing: makePricing(booking.price, cfg) }
      : {}),
  };
}

function emptyContact() {
  return {
    fullName: null,
    firstName: null,
    lastName: null,
    emailAddress: null,
    phoneNumber: null,
    locales: [],
    postalCode: null,
    country: null,
    notes: null,
  };
}

/** Prix total d'une réservation selon le mode de tarification du tour. */
export function bookingPrice(tour: Tour, pax: number, unitCount: number): number {
  // Tour privatisé : prix forfaitaire, une seule unité vendue.
  if (tour.pricingMode !== "person") return tour.price * Math.max(1, unitCount);
  return tour.price * pax;
}

export { toMinorUnits };
