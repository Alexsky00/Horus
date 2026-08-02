import { NextRequest, NextResponse } from "next/server";
import { authenticate, octoHeaders } from "@/lib/octo/auth";
import { getSlots, slotsToCalendar } from "@/lib/octo/availability";
import { getOctoConfig } from "@/lib/octo/config";
import { badRequest, withOctoErrors } from "@/lib/octo/errors";
import { assertOption, paxFromUnits, resolveTour } from "@/lib/octo/resolve";
import { isLocalDate } from "@/lib/octo/tz";

export const dynamic = "force-dynamic";

/**
 * POST /api/octo/availability/calendar — un objet par jour.
 *
 * Sert à griser les dates dans un sélecteur côté revendeur. Volontairement plus
 * grossier que /availability : il ne renvoie pas d'`availabilityId`, donc on ne
 * peut pas réserver depuis ce seul appel.
 */
export async function POST(req: NextRequest) {
  return withOctoErrors(async () => {
    await authenticate(req);

    const body = await req.json().catch(() => {
      throw badRequest("Request body must be valid JSON");
    });

    assertOption(body.optionId);

    if (!isLocalDate(body.localDateStart) || !isLocalDate(body.localDateEnd)) {
      throw badRequest("`localDateStart` and `localDateEnd` (YYYY-MM-DD) are required");
    }
    if (body.localDateStart > body.localDateEnd) {
      throw badRequest("`localDateStart` must be before `localDateEnd`");
    }

    const [tour, cfg] = await Promise.all([resolveTour(body.productId), getOctoConfig()]);
    const requestedPax = paxFromUnits(tour, body.units);

    const slots = await getSlots(tour, body.localDateStart, body.localDateEnd, cfg);

    const adjusted = slots.map((s) =>
      requestedPax > 0 && s.available && s.vacancies < requestedPax
        ? { ...s, available: false, status: "SOLD_OUT" as const }
        : s
    );

    return NextResponse.json(slotsToCalendar(adjusted, cfg), { headers: octoHeaders(req) });
  });
}
