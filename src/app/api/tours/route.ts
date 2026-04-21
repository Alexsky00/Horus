import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Catalogue initial des 14 tours
const INITIAL_TOURS = [
  // Civitatis
  { name: "Ruta Muy Corta", category: "platform", duration: 120, price: 60, pricingMode: "person", routeType: "corta", platforms: JSON.stringify(["civitatis"]), sortOrder: 1 },
  // Viator / GetYourGuide
  { name: "Ruta Corta",     category: "platform", duration: 180, price: 160, pricingMode: "group", routeType: "corta", platforms: JSON.stringify(["viator", "getyourguide"]), sortOrder: 2 },
  // 4x4 (Página Web)
  { name: "Bardena Blanca",   category: "4x4", duration: 180, price: 160, pricingMode: "group", routeType: "corta",  platforms: JSON.stringify(["wordpress", "manual"]), sortOrder: 10 },
  { name: "Atardecer",        category: "4x4", duration: 150, price: 150, pricingMode: "group", routeType: "corta",  platforms: JSON.stringify(["wordpress", "manual"]), sortOrder: 11 },
  { name: "Bardenas Reales",  category: "4x4", duration: 240, price: 230, pricingMode: "group", routeType: "media",  platforms: JSON.stringify(["wordpress", "manual"]), sortOrder: 12 },
  { name: "Bardena Negra",    category: "4x4", duration: 240, price: 230, pricingMode: "group", routeType: "media",  platforms: JSON.stringify(["wordpress", "manual"]), sortOrder: 13 },
  { name: "Senderismo + 4x4", category: "4x4", duration: 300, price: 300, pricingMode: "group", routeType: "media",  platforms: JSON.stringify(["wordpress", "manual"]), sortOrder: 14 },
  { name: "Las Tres Bardenas",category: "4x4", duration: 360, price: 400, pricingMode: "group", routeType: "larga",  platforms: JSON.stringify(["wordpress", "manual"]), sortOrder: 15 },
  // Senderismo
  { name: "Senderismo Media", category: "senderismo", duration: 240, price: 180, pricingMode: "group", routeType: "media", platforms: JSON.stringify(["wordpress", "manual"]), sortOrder: 20 },
  { name: "Senderismo Larga", category: "senderismo", duration: 360, price: 250, pricingMode: "group", routeType: "larga", platforms: JSON.stringify(["wordpress", "manual"]), sortOrder: 21 },
  // Cultural
  { name: "Bardenas y Bodega",  category: "cultural", duration: 300, price: 250, pricingMode: "group", routeType: "media", platforms: JSON.stringify(["wordpress", "manual"]), sortOrder: 30 },
  { name: "Bardenas + Tudela",  category: "cultural", duration: 240, price: 180, pricingMode: "group", routeType: "media", platforms: JSON.stringify(["wordpress", "manual"]), sortOrder: 31 },
  { name: "Mitos y Leyendas",   category: "cultural", duration: 180, price: 180, pricingMode: "group", routeType: "media", platforms: JSON.stringify(["wordpress", "manual"]), sortOrder: 32 },
  // Autobús
  { name: "Ruta Autobús", category: "autobus", duration: 180, price: 200, pricingMode: "group", routeType: "corta", platforms: JSON.stringify(["manual"]), sortOrder: 40 },
];

// GET /api/tours?platform=viator&all=true
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");
  const all = searchParams.get("all") === "true";

  const tours = await prisma.tour.findMany({
    where: all ? {} : { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  if (platform) {
    const filtered = tours.filter((t) => {
      const platforms: string[] = JSON.parse(t.platforms);
      return platforms.includes(platform);
    });
    return NextResponse.json(filtered, { headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(tours, { headers: { "Cache-Control": "no-store" } });
}

// POST /api/tours — create or seed
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Seed action: initialize catalog if empty
  if (body.action === "seed") {
    const count = await prisma.tour.count();
    if (count > 0) {
      return NextResponse.json({ error: "Catalogue déjà initialisé", count }, { status: 409 });
    }
    await prisma.tour.createMany({ data: INITIAL_TOURS });
    return NextResponse.json({ created: INITIAL_TOURS.length });
  }

  // Create single tour
  const { name, category, duration, price, pricingMode, routeType, platforms, sortOrder } = body;
  if (!name || !category || !duration || !price || !routeType || !platforms) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }
  const tour = await prisma.tour.create({
    data: {
      name, category,
      duration: Number(duration),
      price: Number(price),
      pricingMode: pricingMode ?? "group",
      routeType,
      platforms: typeof platforms === "string" ? platforms : JSON.stringify(platforms),
      sortOrder: sortOrder ? Number(sortOrder) : 0,
    },
  });
  return NextResponse.json(tour, { status: 201 });
}
