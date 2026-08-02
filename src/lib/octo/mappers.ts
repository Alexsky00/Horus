import type { Tour } from "@prisma/client";
import { OctoConfig, currencyPrecision, toMinorUnits } from "./config";

/** OCTO impose un `optionId`. Horus n'a pas de variantes de tour : une seule option par produit. */
export const DEFAULT_OPTION_ID = "DEFAULT";

export type OctoPricing = {
  original: number;
  retail: number;
  net: number | null;
  currency: string;
  currencyPrecision: number;
  includedTaxes: unknown[];
};

/** Heures de départ locales d'un tour, ex: ["09:00", "14:00"]. */
export function tourStartTimes(tour: Tour): string[] {
  try {
    const parsed = JSON.parse(tour.startTimes);
    if (Array.isArray(parsed)) {
      const valid: string[] = parsed.filter(
        (t: unknown): t is string => typeof t === "string" && /^\d{2}:\d{2}$/.test(t)
      );
      if (valid.length) return Array.from(new Set(valid)).sort();
    }
  } catch {
    // startTimes corrompu : on ne fait pas tomber l'API pour autant
  }
  return ["09:00"];
}

/**
 * Unités (types de billet) vendables pour un tour, sans tarification.
 *
 * Deux cas très différents :
 * - `pricingMode: "person"` → une unité ADULT, `paxCount: 1`. Le revendeur
 *   achète N unités pour N voyageurs.
 * - `pricingMode: "group"` → une seule unité couvrant tout le groupe
 *   (`maxQuantity: 1`, `paxCount: capacity`). Sans ça, un tour privatisé à 250 €
 *   serait facturé 250 € × nombre de participants.
 */
export function tourUnitDefs(tour: Tour) {
  if (tour.pricingMode === "person") {
    return [
      {
        id: `${tour.id}_ADULT`,
        internalName: "Adulto",
        reference: null,
        type: "ADULT" as const,
        requiredContactFields: [] as string[],
        restrictions: {
          minAge: 0,
          maxAge: 99,
          idRequired: false,
          minQuantity: null as number | null,
          maxQuantity: null as number | null,
          paxCount: 1,
          accompaniedBy: [] as string[],
        },
      },
    ];
  }

  return [
    {
      id: `${tour.id}_GROUP`,
      internalName: "Grupo privado",
      reference: null,
      type: "OTHER" as const,
      requiredContactFields: [] as string[],
      restrictions: {
        minAge: 0,
        maxAge: 99,
        idRequired: false,
        minQuantity: 1 as number | null,
        maxQuantity: 1 as number | null,
        paxCount: tour.capacity,
        accompaniedBy: [] as string[],
      },
    },
  ];
}

export function makePricing(amount: number, cfg: OctoConfig): OctoPricing {
  const retail = toMinorUnits(amount, cfg.currency);
  return {
    original: retail,
    retail,
    net: retail,
    currency: cfg.currency,
    currencyPrecision: currencyPrecision(cfg.currency),
    includedTaxes: [],
  };
}

/** Tour Horus → Produit OCTO. `withPricing` suit la capability demandée par le revendeur. */
export function tourToProduct(tour: Tour, cfg: OctoConfig, withPricing: boolean) {
  const units = tourUnitDefs(tour).map((u) =>
    withPricing ? { ...u, pricing: [makePricing(tour.price, cfg)] } : u
  );

  const option = {
    id: DEFAULT_OPTION_ID,
    default: true,
    internalName: "DEFAULT",
    reference: null,
    availabilityLocalStartTimes: tourStartTimes(tour),
    cancellationCutoff: `${cfg.cancellationCutoffHours} hours`,
    cancellationCutoffAmount: cfg.cancellationCutoffHours,
    cancellationCutoffUnit: "hour" as const,
    requiredContactFields: ["firstName", "lastName", "emailAddress"],
    restrictions: {
      minUnits: 1,
      maxUnits: tour.pricingMode === "person" ? tour.capacity : 1,
    },
    units,
    ...(withPricing ? { pricingFrom: [makePricing(tour.price, cfg)] } : {}),
  };

  return {
    id: tour.id,
    internalName: tour.name,
    reference: tour.category,
    locale: "es",
    timeZone: cfg.timeZone,
    // Horus tient une capacité réelle : jamais de vente sans vérifier la dispo.
    allowFreesale: false,
    instantConfirmation: true,
    instantDelivery: true,
    availabilityRequired: true,
    availabilityType: "START_TIME" as const,
    deliveryFormats: ["PDF_URL"],
    deliveryMethods: ["VOUCHER"],
    // Le guide coche les noms sur une liste au départ, il ne scanne pas de QR code.
    redemptionMethod: "MANIFEST" as const,
    options: [option],
  };
}

/** Nombre de voyageurs réels représentés par une unité (1 pour un adulte, N pour un groupe privatisé). */
export function unitPaxCount(tour: Tour, unitId: string): number | null {
  const unit = tourUnitDefs(tour).find((u) => u.id === unitId);
  return unit ? unit.restrictions.paxCount : null;
}
