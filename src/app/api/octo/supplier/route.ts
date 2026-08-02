import { NextRequest, NextResponse } from "next/server";
import { authenticate, octoHeaders } from "@/lib/octo/auth";
import { getOctoConfig } from "@/lib/octo/config";
import { withOctoErrors } from "@/lib/octo/errors";

export const dynamic = "force-dynamic";

// GET /api/octo/supplier — identité et contact du fournisseur
export async function GET(req: NextRequest) {
  return withOctoErrors(async () => {
    await authenticate(req);
    const cfg = await getOctoConfig();

    return NextResponse.json(
      {
        id: "horus",
        name: cfg.supplierName,
        endpoint: `${req.nextUrl.origin}/api/octo`,
        contact: {
          website: cfg.supplierWebsite,
          email: cfg.supplierEmail,
          telephone: cfg.supplierTelephone,
          address: cfg.supplierAddress,
        },
      },
      { headers: octoHeaders(req) }
    );
  });
}
