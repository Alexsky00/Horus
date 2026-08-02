import { NextRequest, NextResponse } from "next/server";
import { authenticate, octoHeaders } from "@/lib/octo/auth";
import { getSlots, slotToAvailability } from "@/lib/octo/availability";
import { getOctoConfig } from "@/lib/octo/config";
import { badRequest, withOctoErrors } from "@/lib/octo/errors";
import { assertOption, paxFromUnits, resolveTour } from "@/lib/octo/resolve";
import { isLocalDate, utcToLocalDate } from "@/lib/octo/tz";

export const dynamic = "force-dynamic";

/**
 * POST /api/octo/availability — un objet par créneau de départ.
 *
 * C'est ici que le revendeur récupère l'`availabilityId` sans lequel il ne peut
 * pas réserver. On accepte soit une plage de dates, soit une liste d'ids précis.
 */
export async function POST(req: NextRequest) {
  return withOctoErrors(async () => {
    await authenticate(req);

    const body = await req.json().catch(() => {
      throw badRequest("Request body must be valid JSON");
    });

    assertOption(body.optionId);

    // Indépendantes : un seul aller-retour au lieu de deux. Sur ce chemin, chaque
    // requête SQL évitée compte — les plateformes imposent un P90 sous la seconde.
    const [tour, cfg] = await Promise.all([resolveTour(body.productId), getOctoConfig()]);

    const requestedPax = paxFromUnits(tour, body.units);

    let start: string;
    let end: string;

    if (Array.isArray(body.availabilityIds) && body.availabilityIds.length > 0) {
      // Recherche par ids : on borne la plage sur les dates qu'ils désignent.
      const dates = body.availabilityIds.map((id: unknown) => {
        if (typeof id !== "string") throw badRequest("`availabilityIds` must be strings");
        const d = new Date(id);
        if (Number.isNaN(d.getTime())) throw badRequest("Invalid availabilityId", { availabilityId: id });
        return utcToLocalDate(d, cfg.timeZone);
      });
      start = dates.reduce((a: string, b: string) => (a < b ? a : b));
      end = dates.reduce((a: string, b: string) => (a > b ? a : b));
    } else {
      if (!isLocalDate(body.localDateStart) || !isLocalDate(body.localDateEnd)) {
        throw badRequest(
          "`localDateStart` and `localDateEnd` (YYYY-MM-DD) are required unless `availabilityIds` is provided"
        );
      }
      start = body.localDateStart;
      end = body.localDateEnd;
    }

    if (start > end) throw badRequest("`localDateStart` must be before `localDateEnd`");

    let slots = await getSlots(tour, start, end, cfg);

    if (Array.isArray(body.availabilityIds) && body.availabilityIds.length > 0) {
      const wanted = new Set(body.availabilityIds);
      slots = slots.filter((s) => wanted.has(s.id));
    }

    // Si le revendeur annonce combien de places il veut, un créneau qui n'en a
    // pas assez ne lui sert à rien : on le marque explicitement complet.
    const adjusted = slots.map((s) => {
      if (requestedPax > 0 && s.available && s.vacancies < requestedPax) {
        return { ...s, available: false, status: "SOLD_OUT" as const };
      }
      return s;
    });

    return NextResponse.json(
      adjusted.map((s) => slotToAvailability(s, tour, cfg)),
      { headers: octoHeaders(req) }
    );
  });
}
