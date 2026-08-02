import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPushToAll, sendEmailFallback } from "@/lib/push";
import { writeLog } from "@/lib/log";
import { occupyingBookingsWhere } from "@/lib/occupancy";

// PATCH /api/bookings/:id — accepter ou refuser une réservation
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { status } = await req.json();

  if (!["pending", "confirmed", "refused", "conflict"].includes(status)) {
    return NextResponse.json({ error: "Status invalide" }, { status: 400 });
  }

  const existing = await prisma.booking.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }

  // Une réservation née d'OCTO a déjà été vendue et encaissée par la plateforme.
  // Le guide n'a pas autorité pour la refuser depuis Horus : l'annulation doit
  // partir du revendeur, sinon Horus et la plateforme divergent en silence.
  if (existing.octoUuid) {
    return NextResponse.json(
      {
        error:
          "Esta reserva viene de una plataforma conectada (OCTO). Debe cancelarse desde la plataforma, no desde Horus.",
      },
      { status: 409 }
    );
  }

  // Anti double-booking : si on veut confirmer, cherche un chevauchement de créneau
  if (status === "confirmed") {
    const dayStart = new Date(existing.date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(existing.date);
    dayEnd.setHours(23, 59, 59, 999);

    const confirmedThatDay = await prisma.booking.findMany({
      where: {
        ...occupyingBookingsWhere(),
        id: { not: id },
        date: { gte: dayStart, lte: dayEnd },
      },
    });

    const thisStart = existing.date.getTime();
    const thisEnd = thisStart + (existing.duration ?? 0) * 60_000;

    const conflict = confirmedThatDay.find((b) => {
      if (existing.allDay || b.allDay) return true;
      const bStart = b.date.getTime();
      const bEnd = bStart + (b.duration ?? 0) * 60_000;

      if ((existing.duration ?? 0) === 0 && (b.duration ?? 0) === 0) {
        return bStart === thisStart;
      }
      return thisStart < (bEnd || bStart + 1) && (thisEnd || thisStart + 1) > bStart;
    });

    if (conflict) {
      return NextResponse.json(
        { error: `Conflicto de horario con la reserva de ${conflict.guestName} (${conflict.tourName})` },
        { status: 409 }
      );
    }
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: { status },
  });

  const EMOJI: Record<string, string> = { confirmed: "✅", refused: "❌", pending: "🔄", conflict: "⚡" };
  const LABEL: Record<string, string> = { confirmed: "confirmada", refused: "rechazada", pending: "pendiente", conflict: "en conflicto" };
  const emoji = EMOJI[status] ?? "•";
  const msg = {
    title: `${emoji} Reserva ${LABEL[status] ?? status}`,
    body: `${booking.guestName} — ${booking.tourName} el ${booking.date.toLocaleDateString("es-ES")}`,
    url: "/",
  };

  await Promise.allSettled([
    sendPushToAll(msg),
    sendEmailFallback(msg.title, msg.body),
    writeLog(status as "confirmed" | "refused" | "pending" | "conflict", id, `${booking.guestName} — ${booking.tourName} — ${booking.date.toLocaleDateString("es-ES")} [→ ${status}]`),
  ]);

  return NextResponse.json(booking);
}

// DELETE /api/bookings/:id — supprime une réservation
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const booking = await prisma.booking.findUnique({ where: { id: params.id } });

  // Supprimer une réservation OCTO la ferait disparaître d'Horus alors que la
  // plateforme continuerait de la croire valide — et le client se présenterait.
  if (booking?.octoUuid) {
    return NextResponse.json(
      {
        error:
          "Esta reserva viene de una plataforma conectada (OCTO). Debe cancelarse desde la plataforma, no eliminarse aquí.",
      },
      { status: 409 }
    );
  }

  await prisma.booking.delete({ where: { id: params.id } });
  if (booking) {
    await writeLog("deleted", params.id, `${booking.guestName} — ${booking.tourName} — ${booking.date.toLocaleDateString("es-ES")}`);
  }
  return NextResponse.json({ ok: true });
}
