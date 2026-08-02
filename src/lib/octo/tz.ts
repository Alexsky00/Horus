/**
 * Helpers de fuseau horaire pour OCTO.
 *
 * OCTO raisonne en heure locale du fournisseur (`localDateTimeStart`,
 * `availabilityLocalStartTimes`…) alors que Postgres stocke de l'UTC.
 * Toute la conversion passe par ici, en tenant compte du DST — un tour à 09:00
 * n'a pas le même instant UTC en janvier et en juillet.
 *
 * Pas de dépendance externe : `Intl` connaît déjà la base tzdata.
 */

export const DEFAULT_TIMEZONE = "Europe/Madrid";

/** Décalage du fuseau (en minutes) en vigueur à l'instant `date`. Madrid : +60 l'hiver, +120 l'été. */
export function tzOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const f: Record<string, number> = {};
  for (const p of parts) if (p.type !== "literal") f[p.type] = Number(p.value);

  // `hour` vaut 24 à minuit avec hourCycle h24 selon les runtimes
  const asIfUtc = Date.UTC(f.year, f.month - 1, f.day, f.hour % 24, f.minute, f.second);
  return Math.round((asIfUtc - date.getTime()) / 60_000);
}

/** "+02:00" — suffixe d'offset ISO du fuseau à l'instant `date`. */
export function tzOffsetString(date: Date, timeZone: string): string {
  const off = tzOffsetMinutes(date, timeZone);
  const sign = off >= 0 ? "+" : "-";
  const abs = Math.abs(off);
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/**
 * Heure locale ("2026-08-14", "09:00") → instant UTC.
 *
 * On ne peut pas connaître l'offset avant de connaître l'instant, et l'instant
 * dépend de l'offset. On résout en deux passes : première estimation avec
 * l'offset du jour, puis correction si l'estimation tombe de l'autre côté d'un
 * changement d'heure.
 */
export function localToUtc(localDate: string, localTime: string, timeZone: string): Date {
  const [y, m, d] = localDate.split("-").map(Number);
  const [hh, mm] = localTime.split(":").map(Number);
  const naive = Date.UTC(y, m - 1, d, hh, mm, 0);

  const off1 = tzOffsetMinutes(new Date(naive), timeZone);
  let utc = new Date(naive - off1 * 60_000);

  const off2 = tzOffsetMinutes(utc, timeZone);
  if (off2 !== off1) utc = new Date(naive - off2 * 60_000);

  return utc;
}

/** Instant UTC → "2026-08-14" en heure locale. */
export function utcToLocalDate(date: Date, timeZone: string): string {
  const off = tzOffsetMinutes(date, timeZone);
  const shifted = new Date(date.getTime() + off * 60_000);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** Instant UTC → "2026-08-14T09:00:00+02:00" (format des `availabilityId` OCTO). */
export function utcToLocalDateTime(date: Date, timeZone: string): string {
  const off = tzOffsetMinutes(date, timeZone);
  const s = new Date(date.getTime() + off * 60_000);
  const ymd = `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}`;
  const hms = `${pad(s.getUTCHours())}:${pad(s.getUTCMinutes())}:${pad(s.getUTCSeconds())}`;
  return `${ymd}T${hms}${tzOffsetString(date, timeZone)}`;
}

/** Instant UTC → "2026-08-14T07:00:00Z". */
export function toUtcString(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Liste des dates locales "YYYY-MM-DD" de `start` à `end` inclus. */
export function eachLocalDate(start: string, end: string): string[] {
  const out: string[] = [];
  const [ys, ms, ds] = start.split("-").map(Number);
  const [ye, me, de] = end.split("-").map(Number);
  const cur = new Date(Date.UTC(ys, ms - 1, ds));
  const last = new Date(Date.UTC(ye, me - 1, de));

  while (cur <= last) {
    out.push(`${cur.getUTCFullYear()}-${pad(cur.getUTCMonth() + 1)}-${pad(cur.getUTCDate())}`);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/** Valide le format "YYYY-MM-DD". */
export function isLocalDate(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
