"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Booking } from "@/components/BookingCard";

const FullCalendarComponent = dynamic(() => import("@/components/Calendar"), { ssr: false });

const SOURCE_COLORS: Record<string, string> = {
  viator: "bg-emerald-700 text-emerald-100",
  getyourguide: "bg-orange-700 text-orange-100",
  civitatis: "bg-blue-700 text-blue-100",
  wordpress: "bg-purple-700 text-purple-100",
  manual: "bg-slate-600 text-slate-200",
};

const STATUS_STYLES: Record<string, { label: string; cls: string; border: string }> = {
  pending:   { label: "Pendiente",  cls: "bg-amber-500/20 text-amber-300",  border: "border-amber-500" },
  confirmed: { label: "Confirmada", cls: "bg-green-500/20 text-green-300",  border: "border-green-500" },
  refused:   { label: "Rechazada",  cls: "bg-red-500/20 text-red-400",      border: "border-red-500"   },
};

function formatDuration(minutes: number): string {
  if (minutes === 780) return "Día completo (8h–21h)";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  function fetchBookings() {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then(setBookings);
  }

  useEffect(() => { fetchBookings(); }, []);

  async function handleDelete(id: string) {
    if (!confirm(`¿Eliminar la reserva de ${selected?.guestName}?`)) return;
    await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    setSelected(null);
    fetchBookings();
  }

  async function handleAction(id: string, status: "confirmed" | "refused") {
    setActionError(null);
    setActionLoading(true);
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setActionLoading(false);
    if (!res.ok) {
      const err = await res.json();
      setActionError(err.error ?? "Error");
      return;
    }
    const updated = await res.json();
    // Met à jour le panneau et la liste sans recharger tout
    setSelected(updated);
    fetchBookings();
  }

  const st = selected ? (STATUS_STYLES[selected.status] ?? STATUS_STYLES.pending) : null;
  const date = selected ? new Date(selected.date) : null;
  const dateStr = date?.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = date?.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-white">Calendario</h1>

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Calendrier */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex-1 min-w-0">
          <FullCalendarComponent bookings={bookings} onBookingClick={setSelected} />
        </div>

        {/* Panneau de détail */}
        {selected && st && (
          <div className={`bg-slate-800 rounded-lg border-l-4 ${st.border} border border-slate-700 p-5 w-full lg:w-80 flex-shrink-0 self-start`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[selected.source] ?? "bg-slate-600 text-slate-200"}`}>
                {selected.source.toUpperCase()}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                <button onClick={() => { setSelected(null); setActionError(null); }} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
              </div>
            </div>

            {/* Tour */}
            <h2 className="text-white font-semibold text-base mb-1">{selected.tourName}</h2>

            {/* Date + heure + durée */}
            <p className="text-slate-400 text-sm mb-3">
              {dateStr}<br />
              {timeStr}
              {selected.duration && (
                <span className="ml-2 text-slate-500">· {formatDuration(selected.duration)}</span>
              )}
            </p>

            <hr className="border-slate-700 mb-3" />

            {/* Client */}
            <div className="space-y-1.5 text-sm mb-3">
              <div className="flex gap-2">
                <span className="text-slate-500 w-24 flex-shrink-0">Cliente</span>
                <span className="text-slate-200">{selected.guestName}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500 w-24 flex-shrink-0">Email</span>
                <a href={`mailto:${selected.guestEmail}`} className="text-amber-400 hover:underline truncate">
                  {selected.guestEmail}
                </a>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500 w-24 flex-shrink-0">Participantes</span>
                <span className="text-slate-200">{selected.participants} pers.</span>
              </div>
              {selected.externalRef && (
                <div className="flex gap-2">
                  <span className="text-slate-500 w-24 flex-shrink-0">Ref. OTA</span>
                  <span className="text-slate-400 text-xs">{selected.externalRef}</span>
                </div>
              )}
            </div>

            {/* Notes */}
            {selected.notes && (
              <div className="bg-slate-700/50 rounded p-2 text-xs text-slate-400 italic mb-3">
                {selected.notes}
              </div>
            )}

            {/* Erreur */}
            {actionError && (
              <div className="bg-red-900/40 border border-red-700 text-red-300 rounded px-3 py-2 text-xs mb-3">
                ⚠ {actionError}
              </div>
            )}

            {/* Actions */}
            {selected.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(selected.id, "confirmed")}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-medium py-2 rounded disabled:opacity-50"
                >
                  ✓ Aceptar
                </button>
                <button
                  onClick={() => handleAction(selected.id, "refused")}
                  disabled={actionLoading}
                  className="flex-1 bg-red-700 hover:bg-red-600 text-white text-sm font-medium py-2 rounded disabled:opacity-50"
                >
                  ✗ Rechazar
                </button>
              </div>
            )}

            {/* Supprimer */}
            <button
              onClick={() => handleDelete(selected.id)}
              className="mt-3 w-full text-xs text-slate-500 hover:text-red-400 transition-colors py-1 border border-slate-700 hover:border-red-800 rounded"
            >
              Eliminar reserva
            </button>
          </div>
        )}
      </div>

      {/* Légende */}
      <div className="flex gap-4 text-xs text-slate-400 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block"/> Pendiente</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-600 inline-block"/> Confirmada</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-700 inline-block"/> Rechazada</span>
      </div>
    </div>
  );
}
