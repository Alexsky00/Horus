import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPushToAll, sendEmailFallback } from "@/lib/push";
import { writeLog } from "@/lib/log";

export const dynamic = "force-dynamic";

// GET /api/bookings?status=pending&from=2024-01-01&to=2024-12-31
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const bookings = await prisma.booking.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(bookings, {
    headers: { "Cache-Control": "no-store" },
  });
}

// POST /api/bookings — crée une nouvelle réservation (depuis simulation OTA ou formulaire)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { source, guestName, guestEmail, phone, tourName, tourId, date, participants, duration, nationality, routeType, allDay, notes, externalRef, price } = body;

  if (!source || !guestName || !guestEmail || !tourName || !date || !participants) {
    return NextResponse.json({ error: "Faltan campos obligatorios (source, guestName, guestEmail, tourName, date, participants)" }, { status: 400 });
  }

  const bookingDate = new Date(date);
  const newDuration = duration ? Number(duration) : 0;

  // Anti double-booking : cherche toutes les réservations confirmées du même jour
  const dayStart = new Date(bookingDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(bookingDate);
  dayEnd.setHours(23, 59, 59, 999);

  const confirmedThatDay = await prisma.booking.findMany({
    where: { status: "confirmed", date: { gte: dayStart, lte: dayEnd } },
  });

  // Chevauchement : [newStart, newEnd[ coupe [existingStart, existingEnd[
  // Si aucune durée → on compare l'heure exacte
  const newStart = bookingDate.getTime();
  const newEnd = newStart + newDuration * 60_000;

  const conflict = confirmedThatDay.find((b) => {
    if (allDay === true || b.allDay) return true;
    const bStart = b.date.getTime();
    const bEnd = bStart + (b.duration ?? 0) * 60_000;
    if (newDuration === 0 && (b.duration ?? 0) === 0) return bStart === newStart;
    return newStart < (bEnd || bStart + 1) && (newEnd || newStart + 1) > bStart;
  }) ?? null;

  // Vérifier aussi les créneaux bloqués
  const blockedThatDay = await prisma.blockedSlot.findMany({
    where: { date: { gte: dayStart, lte: dayEnd } },
  });
  const blockedConflict = blockedThatDay.find((bl) => {
    if (bl.allDay) return true;
    const blStart = bl.date.getTime();
    const blEnd = blStart + (bl.duration ?? 0) * 60_000;
    return newStart < (blEnd || blStart + 1) && (newEnd || newStart + 1) > blStart;
  }) ?? null;

  if (blockedConflict) {
    return NextResponse.json(
      { error: `Franja bloqueada${blockedConflict.reason ? `: ${blockedConflict.reason}` : ""}` },
      { status: 409 }
    );
  }

  const booking = await prisma.booking.create({
    data: {
      source,
      guestName,
      guestEmail,
      tourName,
      date: bookingDate,
      participants: Number(participants),
      duration: newDuration || null,
      nationality: nationality ?? null,
      routeType: routeType ?? null,
      allDay: allDay === true,
      phone: phone ?? null,
      notes: notes ?? null,
      externalRef: externalRef ?? null,
      price: price != null ? Number(price) : null,
      tourId: tourId ?? null,
      status: conflict ? "conflict" : "pending",
    },
  });

  // Notification push + email
  const pushMsg = {
    title: `Nueva reserva [${source.toUpperCase()}]`,
    body: `${guestName} — ${tourName} el ${bookingDate.toLocaleDateString("es-ES")} (${participants} pers.)${conflict ? " ⚠️ CONFLICTO DETECTADO" : ""}`,
    url: "/",
  };

  await Promise.allSettled([
    sendPushToAll(pushMsg),
    sendEmailFallback(pushMsg.title, pushMsg.body),
    writeLog("created", booking.id, `[${source.toUpperCase()}] ${guestName} — ${tourName} — ${bookingDate.toLocaleDateString("es-ES")} (${participants} pers.)${conflict ? " ⚠ Conflicto, rechazada automáticamente" : ""}`),
  ]);

  return NextResponse.json(booking, { status: 201 });
}

// DELETE /api/bookings — supprime toutes les réservations
export async function DELETE() {
  const { count } = await prisma.booking.deleteMany();
  await writeLog("deleted", null, `Vaciado total: ${count} reservas eliminadas`);
  return NextResponse.json({ deleted: count });
}
