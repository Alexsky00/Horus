import { prisma } from "@/lib/db";
import { DEFAULT_TIMEZONE } from "./tz";

/** Configuration OCTO, stockée dans la table Setting et éditable depuis l'Admin. */
export type OctoConfig = {
  supplierName: string;
  supplierEmail: string | null;
  supplierTelephone: string | null;
  supplierWebsite: string | null;
  supplierAddress: string | null;
  timeZone: string;
  currency: string;
  /** Délai avant le départ en deçà duquel on n'accepte plus de réservation (heures). */
  bookingCutoffHours: number;
  /** Délai avant le départ en deçà duquel une réservation n'est plus annulable (heures). */
  cancellationCutoffHours: number;
  /** Durée par défaut d'un hold ON_HOLD (minutes). */
  holdMinutes: number;
};

const DEFAULTS: OctoConfig = {
  supplierName: "Horus",
  supplierEmail: null,
  supplierTelephone: null,
  supplierWebsite: null,
  supplierAddress: null,
  timeZone: DEFAULT_TIMEZONE,
  currency: "EUR",
  bookingCutoffHours: 2,
  cancellationCutoffHours: 24,
  holdMinutes: 30,
};

const KEY = (f: string) => `octo.${f}`;

/**
 * Cache mémoire des réglages.
 *
 * La config OCTO est lue à chaque appel des plateformes mais ne change qu'à la
 * main, quelques fois par an. Sans cache, c'est un aller-retour SQL sur le
 * chemin critique de *chaque* vérification de disponibilité — et les SLA des
 * plateformes se comptent en centaines de millisecondes.
 *
 * TTL court : une modification depuis l'Admin s'applique au bout de 30 s au
 * pire. En serverless chaque instance a son propre cache, d'où l'expiration par
 * durée plutôt qu'une invalidation explicite, impossible entre instances.
 */
const CACHE_TTL_MS = 30_000;
let cached: { at: number; cfg: OctoConfig } | null = null;

/** À appeler après une écriture des réglages pour ne pas servir une valeur périmée dans la foulée. */
export function invalidateOctoConfig(): void {
  cached = null;
}

export async function getOctoConfig(): Promise<OctoConfig> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.cfg;

  const cfg = await loadOctoConfig();
  cached = { at: Date.now(), cfg };
  return cfg;
}

async function loadOctoConfig(): Promise<OctoConfig> {
  const rows = await prisma.setting.findMany({
    where: { key: { startsWith: "octo." } },
  });

  const s = new Map(rows.map((r) => [r.key, r.value]));
  const str = (f: string, d: string | null) => s.get(KEY(f))?.trim() || d;

  /**
   * Un réglage vide doit retomber sur sa valeur par défaut.
   *
   * Piège : `Number("")` vaut `0`, et `0` passe un test `>= 0`. Sans le garde
   * sur la chaîne vide, enregistrer le formulaire Admin avec les champs
   * numériques vides mettait `holdMinutes` à 0 — donc tout blocage expirait à
   * l'instant de sa création et plus aucune plateforme ne pouvait réserver.
   */
  const num = (f: string, d: number, min = 0) => {
    const raw = s.get(KEY(f))?.trim();
    if (!raw) return d;

    const v = Number(raw);
    return Number.isFinite(v) && v >= min ? v : d;
  };

  return {
    supplierName: str("supplier.name", DEFAULTS.supplierName) as string,
    supplierEmail: str("supplier.email", DEFAULTS.supplierEmail),
    supplierTelephone: str("supplier.telephone", DEFAULTS.supplierTelephone),
    supplierWebsite: str("supplier.website", DEFAULTS.supplierWebsite),
    supplierAddress: str("supplier.address", DEFAULTS.supplierAddress),
    timeZone: str("timezone", DEFAULTS.timeZone) as string,
    currency: str("currency", DEFAULTS.currency) as string,
    bookingCutoffHours: num("bookingCutoffHours", DEFAULTS.bookingCutoffHours),
    cancellationCutoffHours: num("cancellationCutoffHours", DEFAULTS.cancellationCutoffHours),
    // Un blocage de 0 minute n'a aucun sens : il expirerait avant d'être utilisable.
    holdMinutes: num("holdMinutes", DEFAULTS.holdMinutes, 1),
  };
}

/** Précision ISO 4217 : EUR/USD = 2 décimales, JPY = 0. */
export function currencyPrecision(currency: string): number {
  return ["JPY", "KRW", "VND", "CLP", "ISK"].includes(currency.toUpperCase()) ? 0 : 2;
}

/** 45.5 € → 4550 (OCTO exprime tous les prix en entiers, unité mineure). */
export function toMinorUnits(amount: number, currency: string): number {
  return Math.round(amount * Math.pow(10, currencyPrecision(currency)));
}
