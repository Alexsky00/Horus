import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/push/subscribe — enregistre un abonnement push
export async function POST(req: NextRequest) {
  const { endpoint, keys } = await req.json();

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Abonnement invalide" }, { status: 400 });
  }

  const subscription = await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });

  return NextResponse.json({ ok: true, id: subscription.id });
}

// DELETE /api/push/subscribe — désabonnement
export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json();
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return NextResponse.json({ ok: true });
}
