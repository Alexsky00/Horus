import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/seed — génère un jeu de données de démo sur le prochain mois
export async function POST() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper : date relative à aujourd'hui avec heure fixée
  function d(daysOffset: number, hour: number, min = 0): Date {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + daysOffset);
    dt.setHours(hour, min, 0, 0);
    return dt;
  }

  const bookings = [
    // --- Semaine 1 ---
    {
      source: "viator", tourName: "Bardenas Reales", guestName: "Sophie Martin",
      guestEmail: "sophie.martin@mail.fr", phone: "+33 6 12 34 56 78", date: d(1, 9), participants: 3,
      duration: 120, nationality: "FR", routeType: "corta", allDay: false,
      status: "confirmed", externalRef: "VIA-001", notes: null,
    },
    {
      source: "getyourguide", tourName: "Camino del Ebro", guestName: "Hans Müller",
      guestEmail: "hans@mail.de", phone: "+49 151 23456789", date: d(2, 10), participants: 5,
      duration: 180, nationality: "DE", routeType: "media", allDay: false,
      status: "pending", externalRef: "GYG-002", notes: "Grupo con niños",
    },
    {
      source: "civitatis", tourName: "Sierra de Urbasa", guestName: "Carlos López",
      guestEmail: "carlos@mail.es", phone: "+34 612 345 678", date: d(3, 8), participants: 8,
      duration: null, nationality: "ES", routeType: "larga", allDay: true,
      status: "confirmed", externalRef: "CIV-003", notes: "Llevar comida",
    },
    {
      source: "manual", tourName: "Monasterio de Leyre", guestName: "James Smith",
      guestEmail: "james@mail.uk", phone: "+44 7700 900123", date: d(4, 14), participants: 2,
      duration: 90, nationality: "GB", routeType: null, allDay: false,
      status: "refused", externalRef: null, notes: "Conflicto de horario",
    },
    {
      source: "wordpress", tourName: "Bardenas Reales", guestName: "Maria Rossi",
      guestEmail: "maria@mail.it", phone: "+39 347 123 4567", date: d(5, 9, 30), participants: 4,
      duration: 120, nationality: "IT", routeType: "corta", allDay: false,
      status: "confirmed", externalRef: null, notes: null,
    },

    // --- Semaine 2 ---
    {
      source: "viator", tourName: "Ruta del Vino Navarra", guestName: "Emma Johnson",
      guestEmail: "emma@mail.us", phone: "+1 415 555 0123", date: d(7, 11), participants: 6,
      duration: 240, nationality: "US", routeType: "media", allDay: false,
      status: "confirmed", externalRef: "VIA-007", notes: null,
    },
    {
      source: "getyourguide", tourName: "Bardenas Reales", guestName: "Pieter van Dam",
      guestEmail: "pieter@mail.nl", phone: null, date: d(7, 15), participants: 2,
      duration: 60, nationality: "NL", routeType: "corta", allDay: false,
      status: "pending", externalRef: "GYG-007B", notes: null,
    },
    // Réservation multi-jours (finit le lendemain)
    {
      source: "viator", tourName: "Noche en Bardenas", guestName: "Laura Fernández",
      guestEmail: "laura@mail.es", phone: "+34 634 567 890", date: d(8, 20), participants: 4,
      duration: 480, nationality: "ES", routeType: "larga", allDay: false,
      status: "confirmed", externalRef: "VIA-008", notes: "Observación nocturna",
    },
    {
      source: "civitatis", tourName: "Sierra de Urbasa", guestName: "João Silva",
      guestEmail: "joao@mail.pt", phone: "+351 912 345 678", date: d(9, 8), participants: 10,
      duration: null, nationality: "PT", routeType: "larga", allDay: true,
      status: "confirmed", externalRef: "CIV-009", notes: null,
    },
    {
      source: "manual", tourName: "Camino del Ebro", guestName: "Lucas Oliveira",
      guestEmail: "lucas@mail.br", phone: "+55 11 91234 5678", date: d(10, 10), participants: 3,
      duration: 180, nationality: "BR", routeType: "media", allDay: false,
      status: "confirmed", externalRef: null, notes: null,
    },

    // --- Semaine 3 ---
    {
      source: "viator", tourName: "Bardenas Reales", guestName: "Antoine Dubois",
      guestEmail: "antoine@mail.fr", phone: "+33 7 98 76 54 32", date: d(12, 9), participants: 4,
      duration: 120, nationality: "FR", routeType: null, allDay: false,
      status: "pending", externalRef: "VIA-012", notes: null,
    },
    {
      source: "wordpress", tourName: "Ruta del Vino Navarra", guestName: "Klaus Weber",
      guestEmail: "klaus@mail.de", phone: null, date: d(13, 14), participants: 7,
      duration: 300, nationality: "DE", routeType: "larga", allDay: false,
      status: "refused", externalRef: null, notes: "Cancelado por el cliente",
    },
    {
      source: "getyourguide", tourName: "Monasterio de Leyre", guestName: "Valentina Cruz",
      guestEmail: "valentina@mail.ar", phone: "+54 9 11 2345 6789", date: d(14, 9), participants: 2,
      duration: 120, nationality: "AR", routeType: "corta", allDay: false,
      status: "confirmed", externalRef: "GYG-014", notes: null,
    },
    {
      source: "civitatis", tourName: "Sierra de Urbasa", guestName: "Diego Ramírez",
      guestEmail: "diego@mail.mx", phone: "+52 1 55 1234 5678", date: d(15, 10), participants: 5,
      duration: 210, nationality: "MX", routeType: "media", allDay: false,
      status: "confirmed", externalRef: "CIV-015", notes: "Grupo familiar",
    },
    {
      source: "manual", tourName: "Bardenas Reales", guestName: "Yuki Tanaka",
      guestEmail: "yuki@mail.jp", phone: "+81 90 1234 5678", date: d(17, 8), participants: 12,
      duration: null, nationality: "JP", routeType: "larga", allDay: true,
      status: "pending", externalRef: null, notes: "Grupo agencia japonesa — pendiente pago",
    },

    // --- Semaine 4 ---
    {
      source: "viator", tourName: "Camino del Ebro", guestName: "Liam Tremblay",
      guestEmail: "liam@mail.ca", phone: "+1 514 555 0198", date: d(18, 9), participants: 3,
      duration: 120, nationality: "CA", routeType: "corta", allDay: false,
      status: "confirmed", externalRef: "VIA-018", notes: null,
    },
    {
      source: "wordpress", tourName: "Bardenas Reales", guestName: "Isabel García",
      guestEmail: "isabel@mail.es", phone: "+34 698 765 432", date: d(19, 11), participants: 6,
      duration: 180, nationality: "ES", routeType: "media", allDay: false,
      status: "confirmed", externalRef: null, notes: null,
    },
    {
      source: "getyourguide", tourName: "Ruta del Vino Navarra", guestName: "Oliver Brown",
      guestEmail: "oliver@mail.uk", phone: null, date: d(20, 10), participants: 4,
      duration: 120, nationality: "GB", routeType: null, allDay: false,
      status: "refused", externalRef: "GYG-020", notes: "No show",
    },
    {
      source: "civitatis", tourName: "Sierra de Urbasa", guestName: "Erik Lindqvist",
      guestEmail: "erik@mail.se", phone: "+46 70 123 45 67", date: d(21, 8), participants: 8,
      duration: null, nationality: "SE", routeType: "larga", allDay: true,
      status: "confirmed", externalRef: "CIV-021", notes: null,
    },
    {
      source: "viator", tourName: "Monasterio de Leyre", guestName: "Astrid Olsen",
      guestEmail: "astrid@mail.no", phone: "+47 412 34 567", date: d(22, 9, 30), participants: 3,
      duration: 120, nationality: "NO", routeType: "corta", allDay: false,
      status: "pending", externalRef: "VIA-022", notes: null,
    },

    // --- Semaine 5 ---
    {
      source: "manual", tourName: "Camino del Ebro", guestName: "Claire Dupont",
      guestEmail: "claire@mail.fr", phone: "+33 6 87 65 43 21", date: d(23, 10), participants: 5,
      duration: 240, nationality: "FR", routeType: "media", allDay: false,
      status: "confirmed", externalRef: null, notes: "Aniversario — pedir detalle",
    },
    {
      source: "wordpress", tourName: "Bardenas Reales", guestName: "Giulia Ferrari",
      guestEmail: "giulia@mail.it", phone: "+39 338 765 4321", date: d(25, 9), participants: 2,
      duration: 120, nationality: "IT", routeType: "corta", allDay: false,
      status: "confirmed", externalRef: null, notes: null,
    },
    {
      source: "getyourguide", tourName: "Sierra de Urbasa", guestName: "Michael Davis",
      guestEmail: "michael@mail.us", phone: "+1 312 555 0187", date: d(26, 8), participants: 15,
      duration: null, nationality: "US", routeType: "larga", allDay: true,
      status: "pending", externalRef: "GYG-026", notes: "Grupo empresa — factura necesaria",
    },
    {
      source: "civitatis", tourName: "Ruta del Vino Navarra", guestName: "Stefan Bauer",
      guestEmail: "stefan@mail.de", phone: "+49 176 98765432", date: d(27, 10), participants: 4,
      duration: 180, nationality: "DE", routeType: "media", allDay: false,
      status: "confirmed", externalRef: "CIV-027", notes: null,
    },
    {
      source: "viator", tourName: "Monasterio de Leyre", guestName: "Amélie Bernard",
      guestEmail: "amelie@mail.be", phone: null, date: d(28, 14), participants: 2,
      duration: 60, nationality: "BE", routeType: null, allDay: false,
      status: "refused", externalRef: "VIA-028", notes: "Cliente canceló",
    },
    {
      source: "manual", tourName: "Bardenas Reales", guestName: "Pablo Moreno",
      guestEmail: "pablo@mail.es", phone: "+34 677 890 123", date: d(29, 9), participants: 6,
      duration: 120, nationality: "ES", routeType: "corta", allDay: false,
      status: "confirmed", externalRef: null, notes: null,
    },
    {
      source: "wordpress", tourName: "Sierra de Urbasa", guestName: "Ana Martínez",
      guestEmail: "ana@mail.es", phone: "+34 655 432 109", date: d(30, 11), participants: 8,
      duration: 300, nationality: "ES", routeType: "larga", allDay: false,
      status: "pending", externalRef: null, notes: null,
    },
  ];

  // Helper : date absolue
  function abs(year: number, month: number, day: number, hour = 12, min = 0): Date {
    return new Date(year, month - 1, day, hour, min, 0, 0);
  }

  const blockedSlots = [
    // --- Vacaciones de verano ---
    { date: abs(2026, 8, 3),  duration: null, allDay: true,  reason: "Vacaciones verano" },
    { date: abs(2026, 8, 4),  duration: null, allDay: true,  reason: "Vacaciones verano" },
    { date: abs(2026, 8, 5),  duration: null, allDay: true,  reason: "Vacaciones verano" },
    { date: abs(2026, 8, 6),  duration: null, allDay: true,  reason: "Vacaciones verano" },
    { date: abs(2026, 8, 7),  duration: null, allDay: true,  reason: "Vacaciones verano" },
    { date: abs(2026, 8, 10), duration: null, allDay: true,  reason: "Vacaciones verano" },
    { date: abs(2026, 8, 11), duration: null, allDay: true,  reason: "Vacaciones verano" },
    { date: abs(2026, 8, 12), duration: null, allDay: true,  reason: "Vacaciones verano" },
    { date: abs(2026, 8, 13), duration: null, allDay: true,  reason: "Vacaciones verano" },
    { date: abs(2026, 8, 14), duration: null, allDay: true,  reason: "Vacaciones verano" },

    // --- Festivos ---
    { date: abs(2026, 10, 12), duration: null, allDay: true, reason: "Fiesta Nacional de España" },
    { date: abs(2026, 11, 1),  duration: null, allDay: true, reason: "Todos los Santos" },
    { date: abs(2026, 12, 8),  duration: null, allDay: true, reason: "Inmaculada Concepción" },
    { date: abs(2026, 12, 25), duration: null, allDay: true, reason: "Navidad" },
    { date: abs(2027, 1, 1),   duration: null, allDay: true, reason: "Año Nuevo" },
    { date: abs(2027, 1, 6),   duration: null, allDay: true, reason: "Reyes Magos" },
    { date: abs(2027, 4, 1),   duration: null, allDay: true, reason: "Jueves Santo" },
    { date: abs(2027, 4, 2),   duration: null, allDay: true, reason: "Viernes Santo" },
    { date: abs(2027, 5, 1),   duration: null, allDay: true, reason: "Día del Trabajo" },

    // --- Formación / eventos pro ---
    { date: abs(2026, 9, 15), duration: 240, allDay: false, reason: "Formación guías turísticos" },
    { date: abs(2026, 11, 20), duration: 180, allDay: false, reason: "Reunión asociación guías" },
    { date: abs(2027, 2, 10), duration: null, allDay: true, reason: "Congreso turismo Pamplona" },
    { date: abs(2027, 2, 11), duration: null, allDay: true, reason: "Congreso turismo Pamplona" },

    // --- Citas / personal ---
    { date: abs(2026, 10, 5,  9),  duration: 120, allDay: false, reason: "Cita médica" },
    { date: abs(2027, 3, 22, 14),  duration: 90,  allDay: false, reason: "Gestión administrativa" },
    { date: abs(2027, 5, 10),      duration: null, allDay: true, reason: "Día personal" },

    // --- Vacaciones Navidad ---
    { date: abs(2026, 12, 26), duration: null, allDay: true, reason: "Vacaciones Navidad" },
    { date: abs(2026, 12, 27), duration: null, allDay: true, reason: "Vacaciones Navidad" },
    { date: abs(2026, 12, 28), duration: null, allDay: true, reason: "Vacaciones Navidad" },
    { date: abs(2026, 12, 29), duration: null, allDay: true, reason: "Vacaciones Navidad" },
    { date: abs(2026, 12, 30), duration: null, allDay: true, reason: "Vacaciones Navidad" },
    { date: abs(2026, 12, 31), duration: null, allDay: true, reason: "Vacaciones Navidad" },
    { date: abs(2027, 1, 2),   duration: null, allDay: true, reason: "Vacaciones Navidad" },
    { date: abs(2027, 1, 3),   duration: null, allDay: true, reason: "Vacaciones Navidad" },

    // --- 💍 Mariage Clara & Alexis ---
    { date: abs(2027, 7, 3), duration: null, allDay: true, reason: "💍 Boda de Clara y Alexis" },
  ];

  try {
    await prisma.booking.createMany({ data: bookings });
    await prisma.blockedSlot.createMany({ data: blockedSlots });

    await prisma.log.create({
      data: {
        action: "created",
        bookingId: null,
        details: `[DEMO] Datos de demo cargados : ${bookings.length} reservas + ${blockedSlots.length} bloqueados`,
      },
    });

    return NextResponse.json({ created: bookings.length, blocked: blockedSlots.length });
  } catch (err) {
    console.error("[seed] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
