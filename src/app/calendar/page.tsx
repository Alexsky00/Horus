"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Booking } from "@/components/BookingCard";

// FullCalendar est lourd, on le charge côté client uniquement
const FullCalendarComponent = dynamic(() => import("@/components/Calendar"), { ssr: false });

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then(setBookings);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-white">Calendrier</h1>
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <FullCalendarComponent bookings={bookings} />
      </div>
      <div className="flex gap-4 text-xs text-slate-400 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block"/> En attente</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-600 inline-block"/> Confirmée</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-700 inline-block"/> Refusée</span>
      </div>
    </div>
  );
}
