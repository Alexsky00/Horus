import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticate, octoHeaders, requestedCapabilities } from "@/lib/octo/auth";
import { getOctoConfig } from "@/lib/octo/config";
import { withOctoErrors } from "@/lib/octo/errors";
import { tourToProduct } from "@/lib/octo/mappers";

export const dynamic = "force-dynamic";

// GET /api/octo/products — catalogue exposé aux revendeurs
export async function GET(req: NextRequest) {
  return withOctoErrors(async () => {
    await authenticate(req);

    const cfg = await getOctoConfig();
    const withPricing = requestedCapabilities(req).includes("octo/pricing");

    // Un tour n'est vendable par une OTA que s'il est actif *et* explicitement
    // exposé : `octoEnabled` est le garde-fou côté guide.
    const tours = await prisma.tour.findMany({
      where: { active: true, octoEnabled: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(
      tours.map((t) => tourToProduct(t, cfg, withPricing)),
      { headers: octoHeaders(req) }
    );
  });
}
