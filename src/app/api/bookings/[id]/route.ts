import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPushToAll, sendEmailFallback } from "@/lib/push";

// PATCH /api/bookings/:id — accepter ou refuser une réservation
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { status } = await req.json();

  if (!["confirmed", "refused"].includes(status)) {
    return NextResponse.json({ error: "Status invalide" }, { status: 400 });
  }

  const existing = await prisma.booking.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }

  // Anti double-booking : si on veut confirmer, vérifier qu'il n'y a pas déjà un confirmed
  if (status === "confirmed") {
    const conflict = await prisma.booking.findFirst({
      where: {
        id: { not: id },
        tourName: existing.tourName,
        date: existing.date,
        status: "confirmed",
      },
    });
    if (conflict) {
      return NextResponse.json(
        { error: `Double booking détecté avec la réservation ${conflict.id}` },
        { status: 409 }
      );
    }
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: { status },
  });

  const emoji = status === "confirmed" ? "✅" : "❌";
  const msg = {
    title: `${emoji} Réservation ${status === "confirmed" ? "confirmée" : "refusée"}`,
    body: `${booking.guestName} — ${booking.tourName} le ${booking.date.toLocaleDateString("fr-FR")}`,
    url: "/",
  };

  await Promise.allSettled([
    sendPushToAll(msg),
    sendEmailFallback(msg.title, msg.body),
  ]);

  return NextResponse.json(booking);
}

// DELETE /api/bookings/:id — supprime une réservation
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.booking.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
