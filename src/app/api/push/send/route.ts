import { NextRequest, NextResponse } from "next/server";
import { sendPushToAll } from "@/lib/push";

// POST /api/push/send — envoie une notification test
export async function POST(req: NextRequest) {
  const { title, body } = await req.json();
  await sendPushToAll({ title: title ?? "Test Horus", body: body ?? "Notification de test", url: "/" });
  return NextResponse.json({ ok: true });
}
