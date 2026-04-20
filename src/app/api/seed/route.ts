import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/seed — génère ~13 mois de données de démo (passé + futur proche)
export async function POST() {
  const now = new Date();

  // ── Données de référence ───────────────────────────────────────────
  const TOURS: { name: string; routeType: string | null; basePrice: number; durationMin: number | null; allDay: boolean }[] = [
    { name: "Bardenas Reales",       routeType: "corta",  basePrice: 180, durationMin: 120,  allDay: false },
    { name: "Bardenas Reales",       routeType: "media",  basePrice: 280, durationMin: 240,  allDay: false },
    { name: "Camino del Ebro",       routeType: "media",  basePrice: 240, durationMin: 180,  allDay: false },
    { name: "Sierra de Urbasa",      routeType: "larga",  basePrice: 500, durationMin: null, allDay: true  },
    { name: "Monasterio de Leyre",   routeType: "corta",  basePrice: 160, durationMin: 90,   allDay: false },
    { name: "Ruta del Vino Navarra", routeType: "media",  basePrice: 300, durationMin: 240,  allDay: false },
    { name: "Ruta del Vino Navarra", routeType: "larga",  basePrice: 420, durationMin: 360,  allDay: false },
    { name: "Noche en Bardenas",     routeType: "larga",  basePrice: 400, durationMin: 480,  allDay: false },
    { name: "Bardenas Express",      routeType: "corta",  basePrice: 140, durationMin: 60,   allDay: false },
    { name: "Complejo Bardenas",     routeType: null,     basePrice: 320, durationMin: null, allDay: true  },
  ];

  const SOURCES = ["viator", "viator", "getyourguide", "getyourguide", "civitatis", "wordpress", "manual"];

  const GUESTS = [
    { name: "Sophie Martin",    email: "sophie@mail.fr",    phone: "+33 6 12 34 56 78", nat: "FR" },
    { name: "Hans Müller",      email: "hans@mail.de",      phone: "+49 151 23456789",  nat: "DE" },
    { name: "Carlos López",     email: "carlos@mail.es",    phone: "+34 612 345 678",   nat: "ES" },
    { name: "James Smith",      email: "james@mail.uk",     phone: "+44 7700 900123",   nat: "GB" },
    { name: "Maria Rossi",      email: "maria@mail.it",     phone: "+39 347 123 4567",  nat: "IT" },
    { name: "Emma Johnson",     email: "emma@mail.us",      phone: "+1 415 555 0123",   nat: "US" },
    { name: "Pieter van Dam",   email: "pieter@mail.nl",    phone: null,                nat: "NL" },
    { name: "João Silva",       email: "joao@mail.pt",      phone: "+351 912 345 678",  nat: "PT" },
    { name: "Antoine Dubois",   email: "antoine@mail.fr",   phone: "+33 7 98 76 54 32", nat: "FR" },
    { name: "Valentina Cruz",   email: "valentina@mail.ar", phone: "+54 9 11 2345 6789",nat: "AR" },
    { name: "Diego Ramírez",    email: "diego@mail.mx",     phone: "+52 1 55 1234 5678",nat: "MX" },
    { name: "Yuki Tanaka",      email: "yuki@mail.jp",      phone: "+81 90 1234 5678",  nat: "JP" },
    { name: "Liam Tremblay",    email: "liam@mail.ca",      phone: "+1 514 555 0198",   nat: "CA" },
    { name: "Isabel García",    email: "isabel@mail.es",    phone: "+34 698 765 432",   nat: "ES" },
    { name: "Erik Lindqvist",   email: "erik@mail.se",      phone: "+46 70 123 45 67",  nat: "SE" },
    { name: "Astrid Olsen",     email: "astrid@mail.no",    phone: "+47 412 34 567",    nat: "NO" },
    { name: "Claire Dupont",    email: "claire@mail.fr",    phone: "+33 6 87 65 43 21", nat: "FR" },
    { name: "Giulia Ferrari",   email: "giulia@mail.it",    phone: "+39 338 765 4321",  nat: "IT" },
    { name: "Stefan Bauer",     email: "stefan@mail.de",    phone: "+49 176 98765432",  nat: "DE" },
    { name: "Pablo Moreno",     email: "pablo@mail.es",     phone: "+34 677 890 123",   nat: "ES" },
    { name: "Ana Martínez",     email: "ana@mail.es",       phone: "+34 655 432 109",   nat: "ES" },
    { name: "Oliver Brown",     email: "oliver@mail.uk",    phone: null,                nat: "GB" },
    { name: "Wei Zhang",        email: "wei@mail.cn",       phone: "+86 138 0013 8000", nat: "CN" },
    { name: "Lucas Oliveira",   email: "lucas@mail.br",     phone: "+55 11 91234 5678", nat: "BR" },
    { name: "Laura Fernández",  email: "laura@mail.es",     phone: "+34 634 567 890",   nat: "ES" },
    { name: "Marta González",   email: "marta@mail.es",     phone: "+34 611 223 344",   nat: "ES" },
    { name: "Michael Davis",    email: "michael@mail.us",   phone: "+1 312 555 0187",   nat: "US" },
    { name: "Amélie Bernard",   email: "amelie@mail.be",    phone: null,                nat: "BE" },
    { name: "Klaus Weber",      email: "klaus@mail.de",     phone: null,                nat: "DE" },
    { name: "Thomas Petit",     email: "thomas@mail.fr",    phone: "+33 6 55 44 33 22", nat: "FR" },
    { name: "Nadia Kovač",      email: "nadia@mail.hr",     phone: "+385 91 234 5678",  nat: "HR" },
    { name: "Marco Bianchi",    email: "marco@mail.it",     phone: "+39 333 456 7890",  nat: "IT" },
    { name: "Sara Johansson",   email: "sara@mail.se",      phone: "+46 73 456 78 90",  nat: "SE" },
    { name: "Pedro Alves",      email: "pedro@mail.pt",     phone: "+351 934 567 890",  nat: "PT" },
    { name: "Hannah Schmidt",   email: "hannah@mail.de",    phone: "+49 160 12345678",  nat: "DE" },
    { name: "Lucie Moreau",     email: "lucie@mail.fr",     phone: "+33 6 34 56 78 90", nat: "FR" },
  ];

  const HOURS = [8, 9, 9, 10, 10, 11, 14, 15];
  // Status weights: 60% confirmed, 15% pending, 15% refused, 10% conflict
  const STATUS_POOL = [
    "confirmed","confirmed","confirmed","confirmed","confirmed","confirmed",
    "pending","pending","pending",
    "refused","refused","refused",
    "conflict","conflict",
  ];

  // Déterministe simple (pas de Math.random pour reproductibilité)
  function pick<T>(arr: T[], seed: number): T {
    return arr[Math.abs(seed) % arr.length];
  }

  type BookingInput = {
    source: string; guestName: string; guestEmail: string; phone: string | null;
    tourName: string; date: Date; participants: number; duration: number | null;
    nationality: string; routeType: string | null; allDay: boolean;
    status: string; externalRef: string | null; notes: string | null; price: number;
  };

  const bookings: BookingInput[] = [];

  // ── Données historiques : 13 mois en arrière jusqu'à hier ─────────
  for (let m = 13; m >= 1; m--) {
    const year  = now.getFullYear() + Math.floor((now.getMonth() - m) / 12);
    const month = ((now.getMonth() - m) % 12 + 12) % 12; // 0-indexed

    // Densité saisonnière : plus de réservations en été/printemps
    const monthNum = month + 1; // 1-12
    const density = [3, 3, 4, 5, 6, 7, 8, 8, 6, 5, 3, 3][month];

    for (let i = 0; i < density; i++) {
      const day  = 1 + (i * 4 + m * 3) % 27; // jours répartis sur le mois
      const seed = m * 100 + i;

      const guest  = pick(GUESTS, seed + 7);
      const tour   = pick(TOURS, seed + 3);
      const source = pick(SOURCES, seed + 11);
      const hour   = pick(HOURS, seed + 5);
      const parts  = 1 + ((seed * 3) % 8); // 1 à 8 participants
      const status = pick(STATUS_POOL, seed + 13);

      const date = new Date(year, month, day, hour, 0, 0, 0);
      // Ne pas dépasser hier
      if (date >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) continue;

      const price = Math.round(tour.basePrice * (0.8 + (seed % 5) * 0.1) * Math.max(1, parts * 0.4));

      bookings.push({
        source,
        guestName:   guest.name,
        guestEmail:  guest.email,
        phone:       guest.phone,
        tourName:    tour.name,
        date,
        participants: parts,
        duration:    tour.durationMin,
        nationality: guest.nat,
        routeType:   tour.routeType,
        allDay:      tour.allDay,
        status,
        externalRef: status !== "manual" ? `${source.slice(0,3).toUpperCase()}-${String(seed).padStart(3,"0")}` : null,
        notes:       null,
        price,
      });
    }
  }

  // ── Données futures : prochaines 5 semaines ────────────────────────
  function d(daysOffset: number, hour: number, min = 0): Date {
    const dt = new Date(now);
    dt.setHours(0, 0, 0, 0);
    dt.setDate(dt.getDate() + daysOffset);
    dt.setHours(hour, min, 0, 0);
    return dt;
  }

  const futureBookings: BookingInput[] = [
    { source: "viator",      tourName: "Bardenas Reales",       guestName: "Sophie Martin",   guestEmail: "sophie@mail.fr",    phone: "+33 6 12 34 56 78", date: d(2,9),   participants: 3,  duration: 120,  nationality: "FR", routeType: "corta",  allDay: false, status: "confirmed", externalRef: "VIA-F01", notes: null,                                    price: 220 },
    { source: "getyourguide",tourName: "Camino del Ebro",        guestName: "Hans Müller",     guestEmail: "hans@mail.de",      phone: "+49 151 23456789",  date: d(3,10),  participants: 5,  duration: 180,  nationality: "DE", routeType: "media",  allDay: false, status: "pending",   externalRef: "GYG-F02", notes: "Grupo con niños",                      price: 320 },
    { source: "civitatis",   tourName: "Sierra de Urbasa",       guestName: "Carlos López",    guestEmail: "carlos@mail.es",    phone: "+34 612 345 678",   date: d(4,8),   participants: 8,  duration: null, nationality: "ES", routeType: "larga",  allDay: true,  status: "confirmed", externalRef: "CIV-F03", notes: "Llevar comida",                        price: 520 },
    { source: "manual",      tourName: "Monasterio de Leyre",    guestName: "James Smith",     guestEmail: "james@mail.uk",     phone: "+44 7700 900123",   date: d(5,14),  participants: 2,  duration: 90,   nationality: "GB", routeType: null,     allDay: false, status: "refused",   externalRef: null,      notes: "Conflicto de horario",                 price: 180 },
    { source: "wordpress",   tourName: "Bardenas Reales",        guestName: "Maria Rossi",     guestEmail: "maria@mail.it",     phone: "+39 347 123 4567",  date: d(6,9,30),participants: 4,  duration: 120,  nationality: "IT", routeType: "corta",  allDay: false, status: "confirmed", externalRef: null,      notes: null,                                    price: 240 },
    { source: "viator",      tourName: "Ruta del Vino Navarra",  guestName: "Emma Johnson",    guestEmail: "emma@mail.us",      phone: "+1 415 555 0123",   date: d(8,11),  participants: 6,  duration: 240,  nationality: "US", routeType: "media",  allDay: false, status: "confirmed", externalRef: "VIA-F08", notes: null,                                    price: 380 },
    { source: "getyourguide",tourName: "Bardenas Reales",        guestName: "Pieter van Dam",  guestEmail: "pieter@mail.nl",    phone: null,                date: d(8,15),  participants: 2,  duration: 60,   nationality: "NL", routeType: "corta",  allDay: false, status: "pending",   externalRef: "GYG-F08", notes: null,                                    price: 160 },
    { source: "civitatis",   tourName: "Sierra de Urbasa",       guestName: "João Silva",      guestEmail: "joao@mail.pt",      phone: "+351 912 345 678",  date: d(10,8),  participants: 10, duration: null, nationality: "PT", routeType: "larga",  allDay: true,  status: "confirmed", externalRef: "CIV-F10", notes: null,                                    price: 600 },
    { source: "manual",      tourName: "Camino del Ebro",        guestName: "Lucas Oliveira",  guestEmail: "lucas@mail.br",     phone: "+55 11 91234 5678", date: d(11,10), participants: 3,  duration: 180,  nationality: "BR", routeType: "media",  allDay: false, status: "confirmed", externalRef: null,      notes: null,                                    price: 240 },
    { source: "viator",      tourName: "Bardenas Reales",        guestName: "Antoine Dubois",  guestEmail: "antoine@mail.fr",   phone: "+33 7 98 76 54 32", date: d(13,9),  participants: 4,  duration: 120,  nationality: "FR", routeType: null,     allDay: false, status: "pending",   externalRef: "VIA-F13", notes: null,                                    price: 260 },
    { source: "getyourguide",tourName: "Monasterio de Leyre",    guestName: "Valentina Cruz",  guestEmail: "valentina@mail.ar", phone: "+54 9 11 2345 6789",date: d(15,9),  participants: 2,  duration: 120,  nationality: "AR", routeType: "corta",  allDay: false, status: "confirmed", externalRef: "GYG-F15", notes: null,                                    price: 160 },
    { source: "civitatis",   tourName: "Sierra de Urbasa",       guestName: "Diego Ramírez",   guestEmail: "diego@mail.mx",     phone: "+52 1 55 1234 5678",date: d(16,10), participants: 5,  duration: 210,  nationality: "MX", routeType: "media",  allDay: false, status: "confirmed", externalRef: "CIV-F16", notes: "Grupo familiar",                       price: 320 },
    { source: "viator",      tourName: "Camino del Ebro",        guestName: "Liam Tremblay",   guestEmail: "liam@mail.ca",      phone: "+1 514 555 0198",   date: d(19,9),  participants: 3,  duration: 120,  nationality: "CA", routeType: "corta",  allDay: false, status: "confirmed", externalRef: "VIA-F19", notes: null,                                    price: 210 },
    { source: "wordpress",   tourName: "Bardenas Reales",        guestName: "Isabel García",   guestEmail: "isabel@mail.es",    phone: "+34 698 765 432",   date: d(20,11), participants: 6,  duration: 180,  nationality: "ES", routeType: "media",  allDay: false, status: "confirmed", externalRef: null,      notes: null,                                    price: 380 },
    { source: "civitatis",   tourName: "Sierra de Urbasa",       guestName: "Erik Lindqvist",  guestEmail: "erik@mail.se",      phone: "+46 70 123 45 67",  date: d(22,8),  participants: 8,  duration: null, nationality: "SE", routeType: "larga",  allDay: true,  status: "confirmed", externalRef: "CIV-F22", notes: null,                                    price: 520 },
    { source: "manual",      tourName: "Ruta del Vino Navarra",  guestName: "Claire Dupont",   guestEmail: "claire@mail.fr",    phone: "+33 6 87 65 43 21", date: d(24,10), participants: 5,  duration: 240,  nationality: "FR", routeType: "media",  allDay: false, status: "confirmed", externalRef: null,      notes: "Aniversario",                          price: 350 },
    { source: "wordpress",   tourName: "Bardenas Reales",        guestName: "Giulia Ferrari",  guestEmail: "giulia@mail.it",    phone: "+39 338 765 4321",  date: d(26,9),  participants: 2,  duration: 120,  nationality: "IT", routeType: "corta",  allDay: false, status: "confirmed", externalRef: null,      notes: null,                                    price: 160 },
    { source: "civitatis",   tourName: "Ruta del Vino Navarra",  guestName: "Stefan Bauer",    guestEmail: "stefan@mail.de",    phone: "+49 176 98765432",  date: d(28,10), participants: 4,  duration: 180,  nationality: "DE", routeType: "media",  allDay: false, status: "confirmed", externalRef: "CIV-F28", notes: null,                                    price: 280 },
    { source: "manual",      tourName: "Bardenas Reales",        guestName: "Pablo Moreno",    guestEmail: "pablo@mail.es",     phone: "+34 677 890 123",   date: d(30,9),  participants: 6,  duration: 120,  nationality: "ES", routeType: "corta",  allDay: false, status: "confirmed", externalRef: null,      notes: null,                                    price: 300 },
    // Conflictos futuros
    { source: "getyourguide",tourName: "Bardenas Reales",        guestName: "Thomas Petit",    guestEmail: "thomas@mail.fr",    phone: "+33 6 55 44 33 22", date: d(2,10),  participants: 2,  duration: 120,  nationality: "FR", routeType: "corta",  allDay: false, status: "conflict",  externalRef: "GYG-CF1", notes: "Se solapa con Sophie Martin",          price: 160 },
    { source: "viator",      tourName: "Sierra de Urbasa",       guestName: "Wei Zhang",       guestEmail: "wei@mail.cn",       phone: "+86 138 0013 8000", date: d(4,10),  participants: 4,  duration: 180,  nationality: "CN", routeType: "media",  allDay: false, status: "conflict",  externalRef: "VIA-CF2", notes: "Se solapa con la jornada de Carlos", price: 280 },
  ];

  const allBookings = [...bookings, ...futureBookings];

  // ── Créneaux bloqués ──────────────────────────────────────────────
  function abs(year: number, month: number, day: number, hour = 12, min = 0): Date {
    return new Date(year, month - 1, day, hour, min, 0, 0);
  }

  const blockedSlots = [
    { date: abs(2026, 8, 3),   duration: null, allDay: true,  reason: "Vacaciones verano" },
    { date: abs(2026, 8, 4),   duration: null, allDay: true,  reason: "Vacaciones verano" },
    { date: abs(2026, 8, 5),   duration: null, allDay: true,  reason: "Vacaciones verano" },
    { date: abs(2026, 8, 6),   duration: null, allDay: true,  reason: "Vacaciones verano" },
    { date: abs(2026, 8, 7),   duration: null, allDay: true,  reason: "Vacaciones verano" },
    { date: abs(2026, 8, 10),  duration: null, allDay: true,  reason: "Vacaciones verano" },
    { date: abs(2026, 8, 11),  duration: null, allDay: true,  reason: "Vacaciones verano" },
    { date: abs(2026, 8, 12),  duration: null, allDay: true,  reason: "Vacaciones verano" },
    { date: abs(2026, 8, 13),  duration: null, allDay: true,  reason: "Vacaciones verano" },
    { date: abs(2026, 8, 14),  duration: null, allDay: true,  reason: "Vacaciones verano" },
    { date: abs(2026, 10, 12), duration: null, allDay: true,  reason: "Fiesta Nacional de España" },
    { date: abs(2026, 11, 1),  duration: null, allDay: true,  reason: "Todos los Santos" },
    { date: abs(2026, 12, 8),  duration: null, allDay: true,  reason: "Inmaculada Concepción" },
    { date: abs(2026, 12, 25), duration: null, allDay: true,  reason: "Navidad" },
    { date: abs(2026, 12, 26), duration: null, allDay: true,  reason: "Vacaciones Navidad" },
    { date: abs(2026, 12, 27), duration: null, allDay: true,  reason: "Vacaciones Navidad" },
    { date: abs(2026, 12, 28), duration: null, allDay: true,  reason: "Vacaciones Navidad" },
    { date: abs(2026, 12, 29), duration: null, allDay: true,  reason: "Vacaciones Navidad" },
    { date: abs(2026, 12, 30), duration: null, allDay: true,  reason: "Vacaciones Navidad" },
    { date: abs(2026, 12, 31), duration: null, allDay: true,  reason: "Vacaciones Navidad" },
    { date: abs(2027, 1, 1),   duration: null, allDay: true,  reason: "Año Nuevo" },
    { date: abs(2027, 1, 2),   duration: null, allDay: true,  reason: "Vacaciones Navidad" },
    { date: abs(2027, 1, 3),   duration: null, allDay: true,  reason: "Vacaciones Navidad" },
    { date: abs(2027, 1, 6),   duration: null, allDay: true,  reason: "Reyes Magos" },
    { date: abs(2027, 4, 1),   duration: null, allDay: true,  reason: "Jueves Santo" },
    { date: abs(2027, 4, 2),   duration: null, allDay: true,  reason: "Viernes Santo" },
    { date: abs(2027, 5, 1),   duration: null, allDay: true,  reason: "Día del Trabajo" },
    { date: abs(2026, 9, 15),  duration: 240,  allDay: false, reason: "Formación guías turísticos" },
    { date: abs(2026, 11, 20), duration: 180,  allDay: false, reason: "Reunión asociación guías" },
    { date: abs(2027, 2, 10),  duration: null, allDay: true,  reason: "Congreso turismo Pamplona" },
    { date: abs(2027, 2, 11),  duration: null, allDay: true,  reason: "Congreso turismo Pamplona" },
    { date: abs(2026, 10, 5, 9),  duration: 120, allDay: false, reason: "Cita médica" },
    { date: abs(2027, 3, 22, 14), duration: 90,  allDay: false, reason: "Gestión administrativa" },
    { date: abs(2027, 5, 10),  duration: null, allDay: true,  reason: "Día personal" },
    { date: abs(2027, 7, 3),   duration: null, allDay: true,  reason: "💍 Boda de Clara y Alexis" },
  ];

  try {
    await prisma.booking.createMany({ data: allBookings });
    await prisma.blockedSlot.createMany({ data: blockedSlots });

    const conflicts = allBookings.filter(b => b.status === "conflict").length;
    await prisma.log.create({
      data: {
        action: "created",
        bookingId: null,
        details: `[DEMO] ${allBookings.length} reservas (${bookings.length} históricas + ${futureBookings.length} futuras, incl. ${conflicts} conflictos) + ${blockedSlots.length} bloqueados`,
      },
    });

    return NextResponse.json({ created: allBookings.length, historical: bookings.length, future: futureBookings.length, blocked: blockedSlots.length });
  } catch (err) {
    console.error("[seed] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
