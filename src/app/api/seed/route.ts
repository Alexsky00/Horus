import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/seed — génère ~13 mois de données de démo (passé + futur proche)
export async function POST() {
  const now = new Date();

  // ── Catalogue réel ─────────────────────────────────────────────────
  const catalogTours = await prisma.tour.findMany({ orderBy: { sortOrder: "asc" } });
  if (catalogTours.length === 0) {
    return NextResponse.json(
      { error: "El catálogo de tours está vacío. Ve a Admin → Catálogo de tours → «Inicializar catálogo» primero." },
      { status: 409 }
    );
  }

  // Helpers: tours filtrés par plateforme
  function toursFor(source: string) {
    return catalogTours.filter((t) => (JSON.parse(t.platforms) as string[]).includes(source));
  }
  function tourByName(name: string) {
    return catalogTours.find((t) => t.name === name) ?? null;
  }

  // ── Invités ────────────────────────────────────────────────────────
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

  const SOURCES = ["viator", "viator", "getyourguide", "getyourguide", "civitatis", "wordpress", "manual"];
  const HOURS = [8, 9, 9, 10, 10, 11, 14, 15];
  const STATUS_POOL = [
    "confirmed","confirmed","confirmed","confirmed","confirmed","confirmed",
    "pending","pending","pending",
    "refused","refused","refused",
    "conflict","conflict",
  ];

  function pick<T>(arr: T[], seed: number): T { return arr[Math.abs(seed) % arr.length]; }

  type BookingInput = {
    source: string; guestName: string; guestEmail: string; phone: string | null;
    tourName: string; tourId: string | null; date: Date; participants: number;
    duration: number | null; nationality: string; routeType: string | null;
    allDay: boolean; status: string; externalRef: string | null;
    notes: string | null; price: number;
  };

  const bookings: BookingInput[] = [];

  // ── Données historiques : 13 mois en arrière jusqu'à hier ─────────
  for (let m = 13; m >= 1; m--) {
    const year  = now.getFullYear() + Math.floor((now.getMonth() - m) / 12);
    const month = ((now.getMonth() - m) % 12 + 12) % 12;
    const density = [3, 3, 4, 5, 6, 7, 8, 8, 6, 5, 3, 3][month];

    for (let i = 0; i < density; i++) {
      const day  = 1 + (i * 4 + m * 3) % 27;
      const seed = m * 100 + i;

      const guest  = pick(GUESTS, seed + 7);
      const source = pick(SOURCES, seed + 11);
      const hour   = pick(HOURS, seed + 5);
      const parts  = 1 + ((seed * 3) % 8);
      const status = pick(STATUS_POOL, seed + 13);

      const date = new Date(year, month, day, hour, 0, 0, 0);
      if (date >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) continue;

      // Choisir un tour réel pour cette source
      const sourceTours = toursFor(source);
      if (sourceTours.length === 0) continue;
      const tour = pick(sourceTours, seed + 3);

      // Prix : per-person → ×participants, group → prix fixe avec légère variation
      const priceVariation = 0.9 + (seed % 3) * 0.1; // 0.9, 1.0, 1.1
      const price = tour.pricingMode === "person"
        ? Math.round(tour.price * parts)
        : Math.round(tour.price * priceVariation);

      bookings.push({
        source,
        guestName:    guest.name,
        guestEmail:   guest.email,
        phone:        guest.phone,
        tourName:     tour.name,
        tourId:       tour.id,
        date,
        participants: parts,
        duration:     tour.duration,
        nationality:  guest.nat,
        routeType:    tour.routeType,
        allDay:       false,
        status,
        externalRef:  source !== "manual" ? `${source.slice(0,3).toUpperCase()}-${String(seed).padStart(3,"0")}` : null,
        notes:        null,
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

  // Raccourcis vers les tours du catalogue
  const tCivitatis   = toursFor("civitatis")[0] ?? null;    // Ruta Muy Corta (60€/pers)
  const tViator      = toursFor("viator")[0] ?? null;       // Ruta Corta (160€ groupe)
  const tGYG         = toursFor("getyourguide")[0] ?? null; // Ruta Corta (160€ groupe)
  const tBarBlanca   = tourByName("Bardena Blanca");
  const tAtardecer   = tourByName("Atardecer");
  const tBarReales   = tourByName("Bardenas Reales");
  const tBarNegra    = tourByName("Bardena Negra");
  const tSend4x4     = tourByName("Senderismo + 4x4");
  const tTresBard    = tourByName("Las Tres Bardenas");
  const tSendMedia   = tourByName("Senderismo Media");
  const tBodega      = tourByName("Bardenas y Bodega");

  function fb(
    source: string, tour: typeof catalogTours[0] | null,
    guest: { name: string; email: string; phone: string | null; nat: string },
    daysOffset: number, hour: number, participants: number,
    status: string, externalRef: string | null, notes: string | null,
    min = 0,
  ): BookingInput {
    const t = tour ?? (toursFor(source)[0] ?? catalogTours[0]);
    const price = t.pricingMode === "person"
      ? Math.round(t.price * participants)
      : t.price;
    return {
      source, guestName: guest.name, guestEmail: guest.email, phone: guest.phone,
      tourName: t.name, tourId: t.id, date: d(daysOffset, hour, min),
      participants, duration: t.duration, nationality: guest.nat,
      routeType: t.routeType, allDay: false,
      status, externalRef, notes, price,
    };
  }

  const G = GUESTS;
  const futureBookings: BookingInput[] = [
    fb("viator",       tViator,    G[0],  2, 9,  3, "confirmed", "VIA-F01", null),
    fb("getyourguide", tGYG,       G[1],  3, 10, 5, "pending",   "GYG-F02", "Grupo con niños"),
    fb("civitatis",    tCivitatis, G[2],  4, 8,  8, "confirmed", "CIV-F03", "Llevar comida"),
    fb("manual",       tBarNegra,  G[3],  5, 14, 2, "refused",   null,      "Conflicto de horario"),
    fb("wordpress",    tBarReales, G[4],  6, 9,  4, "confirmed", null,      null, 30),
    fb("viator",       tViator,    G[5],  8, 11, 6, "confirmed", "VIA-F08", null),
    fb("getyourguide", tGYG,       G[6],  8, 15, 2, "pending",   "GYG-F08", null),
    fb("civitatis",    tCivitatis, G[7],  10, 8, 10,"confirmed", "CIV-F10", null),
    fb("manual",       tSendMedia, G[23], 11, 10, 3,"confirmed", null,      null),
    fb("viator",       tViator,    G[8],  13, 9,  4, "pending",  "VIA-F13", null),
    fb("getyourguide", tGYG,       G[9],  15, 9,  2, "confirmed","GYG-F15", null),
    fb("civitatis",    tCivitatis, G[10], 16, 10, 5, "confirmed","CIV-F16", "Grupo familiar"),
    fb("viator",       tViator,    G[12], 19, 9,  3, "confirmed","VIA-F19", null),
    fb("wordpress",    tBarBlanca, G[13], 20, 11, 6, "confirmed", null,     null),
    fb("civitatis",    tCivitatis, G[14], 22, 8,  8, "confirmed","CIV-F22", null),
    fb("manual",       tBodega,    G[16], 24, 10, 5, "confirmed", null,     "Aniversario"),
    fb("wordpress",    tAtardecer, G[17], 26, 9,  2, "confirmed", null,     null),
    fb("civitatis",    tCivitatis, G[18], 28, 10, 4, "confirmed","CIV-F28", null),
    fb("manual",       tTresBard,  G[19], 30, 9,  6, "confirmed", null,     null),
    // Conflictos futuros (même jour que Sophie Martin et Carlos López)
    fb("getyourguide", tGYG,       G[29], 2, 10,  2, "conflict", "GYG-CF1", "Se solapa con Sophie Martin"),
    fb("viator",       tSend4x4,   G[22], 4, 10,  4, "conflict", "VIA-CF2", "Se solapa con Carlos López"),
  ];

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

  const allBookings = [...bookings, ...futureBookings];

  try {
    await prisma.booking.createMany({ data: allBookings });
    await prisma.blockedSlot.createMany({ data: blockedSlots });

    const conflicts = allBookings.filter((b) => b.status === "conflict").length;
    await prisma.log.create({
      data: {
        action: "created",
        bookingId: null,
        details: `[DEMO] ${allBookings.length} reservas (${bookings.length} históricas + ${futureBookings.length} futuras, incl. ${conflicts} conflictos) + ${blockedSlots.length} bloqueados`,
      },
    });

    return NextResponse.json({
      created: allBookings.length,
      historical: bookings.length,
      future: futureBookings.length,
      blocked: blockedSlots.length,
    });
  } catch (err) {
    console.error("[seed] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
