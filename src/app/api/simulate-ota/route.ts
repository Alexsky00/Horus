import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/simulate-ota
 *
 * Simule un webhook entrant depuis Viator, GetYourGuide, Civitatis ou WordPress.
 * En production, chaque OTA enverrait une requête similaire à cet endpoint.
 *
 * Sécurisé par un secret partagé dans le header X-Webhook-Secret.
 *
 * Exemple curl :
 *   curl -X POST http://localhost:3000/api/simulate-ota \
 *     -H "Content-Type: application/json" \
 *     -H "X-Webhook-Secret: change_moi_en_secret_aleatoire" \
 *     -d '{"source":"viator","guestName":"Marie Dupont","guestEmail":"marie@example.com","tourName":"Randonnée Bardenas","date":"2024-06-15T09:00:00Z","participants":2}'
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.OTA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();

  // On transfère directement vers l'API bookings (appel interne)
  const baseUrl = req.nextUrl.origin;
  const response = await fetch(`${baseUrl}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: body.source ?? "viator",
      guestName: body.guestName,
      guestEmail: body.guestEmail,
      tourName: body.tourName,
      date: body.date,
      participants: body.participants ?? 1,
      notes: body.notes ?? null,
      externalRef: body.externalRef ?? `OTA-${Date.now()}`,
    }),
  });

  const booking = await response.json();
  return NextResponse.json(booking, { status: response.status });
}
