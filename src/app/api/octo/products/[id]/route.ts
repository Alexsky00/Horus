import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticate, octoHeaders, requestedCapabilities } from "@/lib/octo/auth";
import { getOctoConfig } from "@/lib/octo/config";
import { invalidProductId, withOctoErrors } from "@/lib/octo/errors";
import { tourToProduct } from "@/lib/octo/mappers";

export const dynamic = "force-dynamic";

// GET /api/octo/products/:id
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withOctoErrors(async () => {
    await authenticate(req);

    const cfg = await getOctoConfig();
    const withPricing = requestedCapabilities(req).includes("octo/pricing");

    const tour = await prisma.tour.findFirst({
      where: { id: params.id, active: true, octoEnabled: true },
    });

    // OCTO ne connaît pas le 404 : un produit inconnu est un INVALID_PRODUCT_ID.
    if (!tour) throw invalidProductId(params.id);

    return NextResponse.json(tourToProduct(tour, cfg, withPricing), {
      headers: octoHeaders(req),
    });
  });
}
