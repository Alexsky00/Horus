import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPushToAll, sendEmailFallback } from "@/lib/push";

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

  return NextResponse.json(bookings);
}

// POST /api/bookings — crée une nouvelle réservation (depuis simulation OTA ou formulaire)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { source, guestName, guestEmail, tourName, date, participants, notes, externalRef } = body;

  if (!source || !guestName || !guestEmail || !tourName || !date || !participants) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const bookingDate = new Date(date);

  // Vérification anti double-booking : même tour, même date, déjà confirmé
  const conflict = await prisma.booking.findFirst({
    where: {
      tourName,
      date: bookingDate,
      status: "confirmed",
    },
  });

  const booking = await prisma.booking.create({
    data: {
      source,
      guestName,
      guestEmail,
      tourName,
      date: bookingDate,
      participants: Number(participants),
      notes: notes ?? null,
      externalRef: externalRef ?? null,
      status: conflict ? "refused" : "pending",
    },
  });

  // Notification push + email
  const pushMsg = {
    title: `Nouvelle réservation [${source.toUpperCase()}]`,
    body: `${guestName} — ${tourName} le ${bookingDate.toLocaleDateString("fr-FR")} (${participants} pers.)${conflict ? " ⚠️ CONFLIT DÉTECTÉ" : ""}`,
    url: "/",
  };

  await Promise.allSettled([
    sendPushToAll(pushMsg),
    sendEmailFallback(pushMsg.title, pushMsg.body),
  ]);

  return NextResponse.json(booking, { status: 201 });
}
