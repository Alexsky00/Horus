"use client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { Booking } from "./BookingCard";

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#16a34a",
  refused: "#b91c1c",
};

export default function Calendar({ bookings }: { bookings: Booking[] }) {
  const events = bookings.map((b) => ({
    id: b.id,
    title: `${b.tourName} — ${b.guestName} (${b.participants})`,
    date: b.date,
    backgroundColor: STATUS_COLOR[b.status] ?? "#64748b",
    borderColor: STATUS_COLOR[b.status] ?? "#64748b",
    textColor: b.status === "pending" ? "#000" : "#fff",
  }));

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      locale="fr"
      firstDay={1}
      events={events}
      eventClick={(info) => {
        const b = bookings.find((x) => x.id === info.event.id);
        if (b) alert(`${b.tourName}\n${b.guestName} — ${b.guestEmail}\nStatut : ${b.status}\nParticipants : ${b.participants}`);
      }}
      height="auto"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,dayGridWeek",
      }}
    />
  );
}
