import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.setting.findMany();
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  return NextResponse.json(settings, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const body: Record<string, string> = await req.json();
  const ops = Object.entries(body).map(([key, value]) =>
    prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
  );
  await prisma.$transaction(ops);
  return NextResponse.json({ ok: true });
}
