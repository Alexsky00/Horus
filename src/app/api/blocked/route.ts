import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const slots = await prisma.blockedSlot.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(slots);
}

export async function DELETE() {
  await prisma.blockedSlot.deleteMany();
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const { date, duration, allDay, reason } = await req.json();
  if (!date) return NextResponse.json({ error: "Fecha obligatoria" }, { status: 400 });
  const slot = await prisma.blockedSlot.create({
    data: { date: new Date(date), duration: duration ? Number(duration) : null, allDay: allDay === true, reason: reason || null },
  });
  return NextResponse.json(slot, { status: 201 });
}
