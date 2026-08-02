import type { Tour } from "@prisma/client";
import { prisma } from "@/lib/db";
import { badRequest, invalidOptionId, invalidProductId, invalidUnitId } from "./errors";
import { DEFAULT_OPTION_ID, tourUnitDefs, unitPaxCount } from "./mappers";

/** Le tour doit exister, être actif et exposé aux OTA — sinon il n'existe pas du point de vue OCTO. */
export async function resolveTour(productId: unknown): Promise<Tour> {
  if (typeof productId !== "string" || !productId) throw invalidProductId(productId);

  const tour = await prisma.tour.findFirst({
    where: { id: productId, active: true, octoEnabled: true },
  });

  if (!tour) throw invalidProductId(productId);
  return tour;
}

/** Horus n'expose qu'une option par produit. */
export function assertOption(optionId: unknown): void {
  if (optionId !== DEFAULT_OPTION_ID) throw invalidOptionId(optionId);
}

export type UnitRequest = { id: string; quantity: number };

/** Convertit une liste `units` (id + quantité) en nombre de voyageurs. */
export function paxFromUnits(tour: Tour, units: unknown): number {
  if (units == null) return 0;
  if (!Array.isArray(units)) throw badRequest("`units` must be an array");

  let pax = 0;

  for (const u of units) {
    if (!u || typeof u !== "object") throw badRequest("Each unit must be an object");

    const { id, quantity } = u as { id?: unknown; quantity?: unknown };
    const paxCount = typeof id === "string" ? unitPaxCount(tour, id) : null;
    if (paxCount == null) throw invalidUnitId(id);

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 0) {
      throw badRequest("Unit `quantity` must be a non-negative integer", { unitId: id });
    }

    pax += paxCount * qty;
  }

  return pax;
}

export type UnitItemRequest = { uuid?: string; unitId: string };

/** Valide les `unitItems` d'une création de réservation (un item = un billet). */
export function parseUnitItems(
  tour: Tour,
  unitItems: unknown
): { items: { uuid: string; unitId: string }[]; pax: number } {
  if (!Array.isArray(unitItems) || unitItems.length === 0) {
    throw badRequest("`unitItems` is required and must contain at least one item");
  }

  const known = new Set(tourUnitDefs(tour).map((u) => u.id));
  const items: { uuid: string; unitId: string }[] = [];
  let pax = 0;

  for (const raw of unitItems) {
    if (!raw || typeof raw !== "object") throw badRequest("Each unitItem must be an object");

    const { unitId, uuid } = raw as { unitId?: unknown; uuid?: unknown };
    if (typeof unitId !== "string" || !known.has(unitId)) throw invalidUnitId(unitId);

    const paxCount = unitPaxCount(tour, unitId);
    if (paxCount == null) throw invalidUnitId(unitId);

    items.push({
      uuid: typeof uuid === "string" && uuid ? uuid : crypto.randomUUID(),
      unitId,
    });
    pax += paxCount;
  }

  return { items, pax };
}
