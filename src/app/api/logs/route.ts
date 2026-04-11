import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/logs?limit=100
export async function GET(req: NextRequest) {
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? 200);
  const logs = await prisma.log.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json(logs);
}

// DELETE /api/logs — vide tous les logs
export async function DELETE() {
  await prisma.log.deleteMany();
  return NextResponse.json({ ok: true });
}
