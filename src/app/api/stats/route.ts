import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const MONTH_LABELS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const now         = new Date();
  const filterYear       = parseInt(searchParams.get("filterYear") ?? String(now.getFullYear()));
  const filterMonthParam = searchParams.get("filterMonth");
  // 0 = año completo, 1–12 = mes específico
  const filterMonth      = filterMonthParam ? parseInt(filterMonthParam) : 0;

  // Toutes les réservations (filtrage en mémoire, dataset petit)
  const allBookings = await prisma.booking.findMany({ orderBy: { date: "asc" } });

  // ── KPIs : mois sélectionné ou année entière ─────────────────────
  const kpiStart = filterMonth > 0 ? new Date(filterYear, filterMonth - 1, 1)      : new Date(filterYear, 0, 1);
  const kpiEnd   = filterMonth > 0 ? new Date(filterYear, filterMonth, 0, 23, 59, 59, 999) : new Date(filterYear, 11, 31, 23, 59, 59, 999);
  const bookings = allBookings.filter(b => b.date >= kpiStart && b.date <= kpiEnd);

  // ── Graphique : année civile du mois sélectionné (jan → déc) ─────
  const chartStart    = new Date(filterYear, 0, 1);
  const chartEnd      = new Date(filterYear, 11, 31, 23, 59, 59, 999);
  const chartBookings = allBookings.filter(b => b.date >= chartStart && b.date <= chartEnd);

  const confirmed  = bookings.filter(b => b.status === "confirmed");
  const actionable = bookings.filter(b => ["confirmed", "refused", "conflict"].includes(b.status));

  // ── KPIs ─────────────────────────────────────────────────────────
  const totalParticipants = confirmed.reduce((s, b) => s + b.participants, 0);
  const confirmationRate  = actionable.length
    ? Math.round((confirmed.length / actionable.length) * 100) : 0;
  const avgGroupSize = confirmed.length
    ? Math.round((totalParticipants / confirmed.length) * 10) / 10 : 0;
  const allDayRate = confirmed.length
    ? Math.round((confirmed.filter(b => b.allDay).length / confirmed.length) * 100) : 0;

  const confirmedWithPrice = confirmed.filter(b => b.price != null);
  const totalRevenue = confirmedWithPrice.length
    ? confirmedWithPrice.reduce((s, b) => s + (b.price ?? 0), 0) : null;
  const revenueCoverage = confirmed.length
    ? Math.round((confirmedWithPrice.length / confirmed.length) * 100) : 0;

  // ── Par mois (année civile du graphique, Ene → Dic) ──────────────
  const monthMap: Record<string, { confirmed: number; refused: number; conflict: number; pending: number; participants: number; revenue: number }> = {};
  for (const label of MONTH_LABELS) {
    monthMap[label] = { confirmed: 0, refused: 0, conflict: 0, pending: 0, participants: 0, revenue: 0 };
  }
  for (const b of chartBookings) {
    const label = MONTH_LABELS[new Date(b.date).getMonth()];
    monthMap[label][b.status as keyof typeof monthMap[string]] =
      (monthMap[label][b.status as keyof typeof monthMap[string]] as number) + 1;
    if (b.status === "confirmed") {
      monthMap[label].participants += b.participants;
      monthMap[label].revenue     += b.price ?? 0;
    }
  }
  const byMonth = MONTH_LABELS.map(label => ({ label, ...monthMap[label] }));

  // ── Par jour (heatmap) ───────────────────────────────────────────
  const dayCountMap: Record<string, { total: number; confirmed: number }> = {};
  for (const b of chartBookings) {
    const d = new Date(b.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!dayCountMap[key]) dayCountMap[key] = { total: 0, confirmed: 0 };
    dayCountMap[key].total++;
    if (b.status === "confirmed") dayCountMap[key].confirmed++;
  }
  const byDay = Object.entries(dayCountMap).map(([date, v]) => ({ date, ...v }));

  // ── Par plateforme ───────────────────────────────────────────────
  const platformMap: Record<string, { total: number; confirmed: number; participants: number; revenue: number }> = {};
  for (const b of bookings) {
    if (!platformMap[b.source]) platformMap[b.source] = { total: 0, confirmed: 0, participants: 0, revenue: 0 };
    platformMap[b.source].total++;
    if (b.status === "confirmed") {
      platformMap[b.source].confirmed++;
      platformMap[b.source].participants += b.participants;
      platformMap[b.source].revenue     += b.price ?? 0;
    }
  }
  const byPlatform = Object.entries(platformMap)
    .map(([source, v]) => ({ source, ...v, confirmationRate: Math.round((v.confirmed / v.total) * 100) }))
    .sort((a, b) => b.total - a.total);

  // ── Top tours ────────────────────────────────────────────────────
  const tourMap: Record<string, { count: number; participants: number; revenue: number }> = {};
  for (const b of confirmed) {
    if (!tourMap[b.tourName]) tourMap[b.tourName] = { count: 0, participants: 0, revenue: 0 };
    tourMap[b.tourName].count++;
    tourMap[b.tourName].participants += b.participants;
    tourMap[b.tourName].revenue     += b.price ?? 0;
  }
  const topTours = Object.entries(tourMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ── Top nationalités ─────────────────────────────────────────────
  const natMap: Record<string, number> = {};
  for (const b of confirmed) {
    if (b.nationality) natMap[b.nationality] = (natMap[b.nationality] ?? 0) + 1;
  }
  const topNationalities = Object.entries(natMap)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // ── Par jour de la semaine ───────────────────────────────────────
  const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const dayMap: number[] = [0, 0, 0, 0, 0, 0, 0];
  for (const b of confirmed) dayMap[new Date(b.date).getDay()]++;
  const byDayOfWeek = DAYS.map((label, i) => ({ label, count: dayMap[i] }));

  // ── Par type de route ────────────────────────────────────────────
  const routeMap: Record<string, { count: number; participants: number; revenue: number }> = {};
  for (const b of confirmed) {
    const key = b.routeType ?? "unknown";
    if (!routeMap[key]) routeMap[key] = { count: 0, participants: 0, revenue: 0 };
    routeMap[key].count++;
    routeMap[key].participants += b.participants;
    routeMap[key].revenue     += b.price ?? 0;
  }
  const byRouteType = Object.entries(routeMap)
    .map(([routeType, v]) => ({ routeType, ...v }))
    .sort((a, b) => b.count - a.count);

  // ── Par tranche horaire ──────────────────────────────────────────
  const slotMap = { morning: 0, afternoon: 0, evening: 0, allday: 0 };
  for (const b of confirmed) {
    if (b.allDay) { slotMap.allday++; continue; }
    const h = new Date(b.date).getHours();
    if (h < 12) slotMap.morning++;
    else if (h < 17) slotMap.afternoon++;
    else slotMap.evening++;
  }
  const byTimeSlot = [
    { slot: "morning",   label: "Mañana (6–12h)",  count: slotMap.morning   },
    { slot: "afternoon", label: "Tarde (12–17h)",   count: slotMap.afternoon },
    { slot: "evening",   label: "Noche (17–22h)",   count: slotMap.evening   },
    { slot: "allday",    label: "Jornada completa",  count: slotMap.allday    },
  ];

  return NextResponse.json({
    filterYear,
    filterMonth,
    kpis: { totalBookings: bookings.length, confirmedBookings: confirmed.length, confirmationRate, totalParticipants, avgGroupSize, allDayRate, totalRevenue, revenueCoverage },
    byMonth,
    byDay,
    byPlatform,
    topTours,
    topNationalities,
    byDayOfWeek,
    byTimeSlot,
    byRouteType,
  }, { headers: { "Cache-Control": "no-store" } });
}
