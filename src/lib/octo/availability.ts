import type { Booking, BlockedSlot, Tour } from "@prisma/client";
import { prisma } from "@/lib/db";
import { OctoConfig } from "./config";
import { tourStartTimes } from "./mappers";
import {
  eachLocalDate,
  localToUtc,
  toUtcString,
  utcToLocalDate,
  utcToLocalDateTime,
} from "./tz";

/**
 * Moteur de disponibilité.
 *
 * Deux règles, tirées du métier d'un guide seul :
 *
 * 1. **Un seul tour à la fois.** Toute réservation qui chevauche le créneau —
 *    quel que soit le tour — le rend invendable. Le guide ne peut pas être à
 *    deux endroits.
 * 2. **Un départ est collectif.** Deux clients peuvent rejoindre *le même*
 *    départ (même tour, même heure) tant que la capacité le permet. C'est ce qui
 *    rend le tour vendable plusieurs fois sur Civitatis.
 *
 * La conséquence, contre-intuitive : vendre une place à 09:00 ne "remplit" pas
 * seulement ce départ, ça ferme aussi tous les autres tours qui chevauchent.
 */

/** Statuts qui occupent réellement l'agenda. */
const OCCUPYING = new Set(["confirmed", "pending", "conflict", "on_hold"]);

/**
 * `pending` bloque volontairement : c'est une demande que le guide n'a pas
 * encore tranchée. Si on vendait le créneau à une OTA et qu'il l'acceptait
 * ensuite, il serait en double réservation. On préfère perdre une vente qu'en
 * créer deux.
 */
export function occupiesSlot(b: Booking, now: Date): boolean {
  if (!OCCUPYING.has(b.status)) return false;
  // Un hold expiré ne réserve plus rien.
  if (b.status === "on_hold") return b.holdExpiresAt != null && b.holdExpiresAt.getTime() > now.getTime();
  return true;
}

export type Slot = {
  id: string; // availabilityId, ex "2026-08-14T09:00:00+02:00"
  startUtc: Date;
  endUtc: Date;
  localDate: string;
  available: boolean;
  status: "AVAILABLE" | "FREESALE" | "SOLD_OUT" | "LIMITED" | "CLOSED";
  vacancies: number;
  capacity: number;
  utcCutoffAt: Date;
};

type Ctx = {
  bookings: Booking[];
  blocked: BlockedSlot[];
  now: Date;
};

/** Client Prisma ou client de transaction — les deux exposent les mêmes modèles. */
type Db = Pick<typeof prisma, "booking" | "blockedSlot">;

export type AvailabilityOptions = {
  /**
   * Quand une réservation existante veut *changer* de créneau, elle ne doit pas
   * se compter elle-même comme un obstacle — ni sur le créneau qu'elle quitte,
   * ni sur son propre départ si seul le nombre de places change.
   */
  excludeBookingId?: string;

  /**
   * Client de transaction. Indispensable au moment de réserver : la disponibilité
   * doit être relue *à l'intérieur* de la transaction verrouillée, sinon deux
   * ventes simultanées lisent toutes deux « il reste de la place » avant que
   * l'une ou l'autre n'ait écrit — et le départ est survendu.
   */
  client?: Db;
};

/** Charge une fois les réservations et blocages couvrant la période (marge d'un jour pour les tours à cheval). */
async function loadContext(
  fromUtc: Date,
  toUtc: Date,
  opts: AvailabilityOptions
): Promise<Ctx> {
  const db: Db = opts.client ?? prisma;
  const pad = 24 * 60 * 60 * 1000;
  const gte = new Date(fromUtc.getTime() - pad);
  const lte = new Date(toUtc.getTime() + pad);

  const [bookings, blocked] = await Promise.all([
    db.booking.findMany({
      where: {
        date: { gte, lte },
        ...(opts.excludeBookingId ? { id: { not: opts.excludeBookingId } } : {}),
      },
    }),
    db.blockedSlot.findMany({ where: { date: { gte, lte } } }),
  ]);

  return { bookings, blocked, now: new Date() };
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  // Intervalles semi-ouverts : un tour qui finit à 12:00 n'entre pas en conflit avec celui de 12:00.
  return aStart < bEnd && bStart < aEnd;
}

/** Durée effective d'une réservation en ms (une réservation sans durée occupe un point). */
function bookingSpan(b: Booking): [number, number] {
  const start = b.date.getTime();
  const end = start + (b.duration ?? 0) * 60_000;
  return [start, Math.max(end, start + 1)];
}

function computeSlot(
  tour: Tour,
  localDate: string,
  startTime: string,
  cfg: OctoConfig,
  ctx: Ctx
): Slot {
  const startUtc = localToUtc(localDate, startTime, cfg.timeZone);
  const endUtc = new Date(startUtc.getTime() + tour.duration * 60_000);
  const utcCutoffAt = new Date(startUtc.getTime() - cfg.bookingCutoffHours * 3_600_000);

  const base = {
    id: utcToLocalDateTime(startUtc, cfg.timeZone),
    startUtc,
    endUtc,
    localDate,
    capacity: tour.capacity,
    utcCutoffAt,
  };

  const closed = (): Slot => ({
    ...base,
    available: false,
    status: "CLOSED",
    vacancies: 0,
  });

  // Trop tard pour réserver (ou déjà passé).
  if (ctx.now.getTime() >= utcCutoffAt.getTime()) return closed();

  const [slotStart, slotEnd] = [startUtc.getTime(), endUtc.getTime()];

  // Créneaux bloqués manuellement par le guide (congés, entretien du 4x4…).
  for (const bl of ctx.blocked) {
    if (bl.allDay) {
      if (utcToLocalDate(bl.date, cfg.timeZone) === localDate) return closed();
      continue;
    }
    const blStart = bl.date.getTime();
    const blEnd = blStart + (bl.duration ?? 0) * 60_000;
    if (overlaps(slotStart, slotEnd, blStart, Math.max(blEnd, blStart + 1))) return closed();
  }

  let booked = 0;

  for (const b of ctx.bookings) {
    if (!occupiesSlot(b, ctx.now)) continue;

    // Une réservation "toute la journée" ferme la journée entière.
    if (b.allDay) {
      if (utcToLocalDate(b.date, cfg.timeZone) === localDate) return closed();
      continue;
    }

    const [bStart, bEnd] = bookingSpan(b);
    if (!overlaps(slotStart, slotEnd, bStart, bEnd)) continue;

    // Même départ (même tour, même heure) → les clients se partagent la capacité.
    if (b.tourId === tour.id && bStart === slotStart) {
      booked += b.participants;
      continue;
    }

    // Sinon le guide est déjà pris ailleurs : rien à vendre sur ce créneau.
    return closed();
  }

  const vacancies = Math.max(0, tour.capacity - booked);

  return {
    ...base,
    available: vacancies > 0,
    status: vacancies > 0 ? "AVAILABLE" : "SOLD_OUT",
    vacancies,
  };
}

/** Tous les créneaux d'un tour entre deux dates locales incluses. */
export async function getSlots(
  tour: Tour,
  localDateStart: string,
  localDateEnd: string,
  cfg: OctoConfig,
  opts: AvailabilityOptions = {}
): Promise<Slot[]> {
  const dates = eachLocalDate(localDateStart, localDateEnd);
  if (!dates.length) return [];

  const fromUtc = localToUtc(dates[0], "00:00", cfg.timeZone);
  const toUtc = localToUtc(dates[dates.length - 1], "23:59", cfg.timeZone);
  const ctx = await loadContext(fromUtc, toUtc, opts);

  const startTimes = tourStartTimes(tour);
  const slots: Slot[] = [];

  for (const d of dates) {
    for (const st of startTimes) {
      slots.push(computeSlot(tour, d, st, cfg, ctx));
    }
  }

  return slots;
}

/** Retrouve un créneau précis à partir de son `availabilityId`. Renvoie null si l'id ne correspond à rien. */
export async function getSlotById(
  tour: Tour,
  availabilityId: string,
  cfg: OctoConfig,
  opts: AvailabilityOptions = {}
): Promise<Slot | null> {
  const parsed = new Date(availabilityId);
  if (Number.isNaN(parsed.getTime())) return null;

  const localDate = utcToLocalDate(parsed, cfg.timeZone);
  const slots = await getSlots(tour, localDate, localDate, cfg, opts);

  return slots.find((s) => s.id === availabilityId) ?? null;
}

/** Format de réponse OCTO pour POST /availability. */
export function slotToAvailability(slot: Slot, tour: Tour, cfg: OctoConfig) {
  return {
    id: slot.id,
    localDateTimeStart: slot.id,
    localDateTimeEnd: utcToLocalDateTime(slot.endUtc, cfg.timeZone),
    allDay: false,
    available: slot.available,
    status: slot.status,
    vacancies: slot.vacancies,
    capacity: slot.capacity,
    maxUnits: tour.pricingMode === "person" ? slot.vacancies : 1,
    utcCutoffAt: toUtcString(slot.utcCutoffAt),
    openingHours: [],
  };
}

/** Format de réponse OCTO pour POST /availability/calendar : un objet par jour. */
export function slotsToCalendar(slots: Slot[], cfg: OctoConfig) {
  const byDate = new Map<string, Slot[]>();
  for (const s of slots) {
    const list = byDate.get(s.localDate) ?? [];
    list.push(s);
    byDate.set(s.localDate, list);
  }

  return Array.from(byDate.entries()).map(([localDate, daySlots]) => {
    const openSlots = daySlots.filter((s: Slot) => s.status !== "CLOSED");
    const available = daySlots.some((s: Slot) => s.available);

    // Un guide ne fait qu'un tour à la fois : la dispo du jour, c'est le meilleur
    // créneau du jour — surtout pas la somme des créneaux, qui la surestimerait.
    const vacancies = openSlots.length
      ? Math.max.apply(null, openSlots.map((s: Slot) => s.vacancies))
      : 0;

    const status = available ? "AVAILABLE" : openSlots.length ? "SOLD_OUT" : "CLOSED";

    return {
      localDate,
      available,
      status,
      vacancies,
      capacity: daySlots[0]?.capacity ?? 0,
      openingHours: [],
    };
  });
}
