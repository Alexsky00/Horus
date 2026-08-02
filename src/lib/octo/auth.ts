import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { OctoError } from "./errors";

export type Reseller = { id: string; name: string; source: string };

/**
 * Authentifie un revendeur via `Authorization: Bearer <token>`.
 *
 * La spec distingue nettement les deux échecs : token absent → 401 UNAUTHORIZED,
 * token présent mais inconnu ou révoqué → 403 FORBIDDEN. L'outil
 * d'auto-certification teste les deux séparément.
 */
export async function authenticate(req: NextRequest): Promise<Reseller> {
  const header = req.headers.get("authorization");

  if (!header) {
    throw new OctoError("UNAUTHORIZED", "Missing Authorization header");
  }

  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) {
    throw new OctoError("UNAUTHORIZED", "Authorization header must be a Bearer token");
  }

  const token = match[1].trim();
  const key = await prisma.apiKey.findUnique({ where: { token } });

  if (!key || !key.active) {
    throw new OctoError("FORBIDDEN", "The API key is invalid or has been revoked");
  }

  touchLastUsed(key.id);

  return { id: key.id, name: key.name, source: key.source };
}

/**
 * `lastUsedAt` n'est qu'un indicateur de vie affiché dans l'Admin. L'écrire à
 * chaque appel ajouterait une écriture SQL sur le chemin critique d'une
 * plateforme qui interroge les disponibilités des dizaines de fois par minute.
 * Une fois toutes les 5 minutes suffit largement.
 */
const LAST_USED_THROTTLE_MS = 5 * 60_000;
const lastTouched = new Map<string, number>();

function touchLastUsed(keyId: string): void {
  const now = Date.now();
  const prev = lastTouched.get(keyId) ?? 0;
  if (now - prev < LAST_USED_THROTTLE_MS) return;

  lastTouched.set(keyId, now);

  // Best-effort : tracer l'usage ne doit jamais faire échouer la requête.
  prisma.apiKey
    .update({ where: { id: keyId }, data: { lastUsedAt: new Date(now) } })
    .catch(() => {});
}

/**
 * Capacités demandées via l'en-tête `Octo-Capabilities` (ou `?_capabilities=`).
 * Elles doivent être renvoyées à l'identique dans la réponse.
 */
export function requestedCapabilities(req: NextRequest): string[] {
  const raw =
    req.headers.get("octo-capabilities") ?? req.nextUrl.searchParams.get("_capabilities") ?? "";

  return raw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

/** En-têtes de réponse OCTO : on renvoie les capacités qu'on supporte réellement. */
export function octoHeaders(req: NextRequest): Record<string, string> {
  const supported = new Set(SUPPORTED_CAPABILITIES);
  const echoed = requestedCapabilities(req).filter((c) => supported.has(c));

  return {
    "Content-Type": "application/json",
    "Octo-Capabilities": echoed.join(", "),
    "Cache-Control": "no-store",
  };
}

/**
 * Capacités implémentées. On n'annonce que `pricing` : Horus connaît le prix de
 * chaque tour. `content`, `pickups`, `dropoffs` et `notifications` restent hors
 * périmètre du cœur — elles sont optionnelles dans la spec.
 */
export const SUPPORTED_CAPABILITIES = ["octo/pricing"];
