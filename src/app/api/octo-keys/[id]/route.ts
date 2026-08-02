import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeLog } from "@/lib/log";

export const dynamic = "force-dynamic";

// PATCH /api/octo-keys/:id — activer / révoquer
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { active } = await req.json();

  const key = await prisma.apiKey.update({
    where: { id: params.id },
    data: { active: Boolean(active) },
  });

  await writeLog(
    "created",
    null,
    `Clave API OCTO ${key.active ? "reactivada" : "revocada"} — ${key.name}`
  );

  return NextResponse.json(key);
}

// DELETE /api/octo-keys/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const key = await prisma.apiKey.findUnique({ where: { id: params.id } });
  await prisma.apiKey.delete({ where: { id: params.id } });

  if (key) await writeLog("deleted", null, `Clave API OCTO eliminada — ${key.name}`);

  return NextResponse.json({ ok: true });
}
