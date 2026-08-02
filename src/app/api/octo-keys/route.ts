import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeLog } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * Gestion des clés d'API OCTO depuis l'Admin.
 *
 * Une clé = une relation revendeur↔fournisseur, comme le recommande la spec :
 * révoquer Civitatis ne doit pas couper Viator.
 */

// GET /api/octo-keys
export async function GET() {
  const keys = await prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(keys, { headers: { "Cache-Control": "no-store" } });
}

// POST /api/octo-keys — génère une clé pour un revendeur
export async function POST(req: NextRequest) {
  const { name, source } = await req.json();

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Falta el nombre del revendedor" }, { status: 400 });
  }

  const token = `hor_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().slice(0, 8)}`;

  const key = await prisma.apiKey.create({
    data: { name: name.trim(), source: source || "civitatis", token },
  });

  await writeLog("created", null, `Clave API OCTO creada para ${key.name}`);

  return NextResponse.json(key, { status: 201 });
}
