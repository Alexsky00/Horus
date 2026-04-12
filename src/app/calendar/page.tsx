"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { type Booking, Flag } from "@/components/BookingCard";
import type { BlockedSlot } from "@/lib/types";

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

const DURATIONS = [
  { value: "30",  label: "30 min" },
  { value: "60",  label: "1h" },
  { value: "90",  label: "1h30" },
  { value: "120", label: "2h" },
  { value: "180", label: "3h" },
  { value: "240", label: "4h" },
  { value: "300", label: "5h" },
  { value: "360", label: "6h" },
];

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocked, setBlocked] = useState<BlockedSlot[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Formulaire blocage
  const [showBlock, setShowBlock] = useState(false);
  const [blockForm, setBlockForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: "09:00",
    duration: "60",
    allDay: false,
    reason: "",
  });
  const [blockLoading, setBlockLoading] = useState(false);
  const [selectedBlocked, setSelectedBlocked] = useState<BlockedSlot | null>(null);

  async function deleteBlock(id: string) {
    if (!confirm("¿Eliminar este bloqueo?")) return;
    await fetch(`/api/blocked/${id}`, { method: "DELETE" });
    setSelectedBlocked(null);
    fetchBlocked();
  }

  function fetchBookings() {
    fetch("/api/bookings").then((r) => r.json()).then(setBookings);
  }
  function fetchBlocked() {
    fetch("/api/blocked").then((r) => r.json()).then(setBlocked);
  }

  useEffect(() => { fetchBookings(); fetchBlocked(); }, []);

  async function submitBlock(e: React.FormEvent) {
    e.preventDefault();
    setBlockLoading(true);
    const dateStr = blockForm.allDay
      ? `${blockForm.date}T12:00`
      : `${blockForm.date}T${blockForm.time}`;
    await fetch("/api/blocked", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: dateStr,
        duration: blockForm.allDay ? null : Number(blockForm.duration),
        allDay: blockForm.allDay,
        reason: blockForm.reason || null,
      }),
    });
    setBlockLoading(false);
    setShowBlock(false);
    fetchBlocked();
  }


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

      {/* Bouton + formulaire blocage */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => setShowBlock(!showBlock)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 text-sm rounded-lg transition-colors">
          🔒 {showBlock ? "Cancelar" : "Bloquear horario"}
        </button>
      </div>

      {showBlock && (
        <form onSubmit={submitBlock} className="bg-slate-800 border border-slate-600 rounded-lg p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-200">🔒 Bloquear créneau</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Fecha</label>
              <input type="date" value={blockForm.date}
                onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white" />
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer mb-1">
                <input type="checkbox" checked={blockForm.allDay}
                  onChange={(e) => setBlockForm({ ...blockForm, allDay: e.target.checked })}
                  className="w-4 h-4 accent-amber-500" />
                <span className="text-sm text-white">Toda la jornada</span>
              </label>
            </div>
            {!blockForm.allDay && <>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Hora inicio</label>
                <input type="time" step={1800} value={blockForm.time}
                  onChange={(e) => setBlockForm({ ...blockForm, time: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Duración</label>
                <select value={blockForm.duration}
                  onChange={(e) => setBlockForm({ ...blockForm, duration: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white">
                  {DURATIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            </>}
            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Motivo (opcional)</label>
              <input value={blockForm.reason}
                onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                placeholder="Ej: Vacaciones, enfermedad..."
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white" />
            </div>
          </div>
          <button type="submit" disabled={blockLoading}
            className="px-4 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded disabled:opacity-50">
            {blockLoading ? "Guardando..." : "Guardar bloqueo"}
          </button>
        </form>
      )}


<div className="flex gap-4 flex-col lg:flex-row">
        {/* Calendrier */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex-1 min-w-0">
          <FullCalendarComponent
            bookings={bookings}
            blocked={blocked}
            onBookingClick={(b) => { setSelectedBlocked(null); setSelected(b); }}
            onBlockedClick={(bl) => { setSelected(null); setSelectedBlocked(bl); }}
          />
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
                <span className="text-slate-200">
                  {selected.guestName}
                  {selected.nationality && <span className="ml-2"><Flag code={selected.nationality} size="1.2rem" /></span>}
                </span>
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
              {selected.routeType && (
                <div className="flex gap-2">
                  <span className="text-slate-500 w-24 flex-shrink-0">Tipo ruta</span>
                  <span className="text-slate-200">
                    {{ corta: "🟢 Corta", media: "🟡 Media", larga: "🔴 Larga" }[selected.routeType] ?? selected.routeType}
                  </span>
                </div>
              )}
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

        {/* Panneau créneau bloqué */}
        {selectedBlocked && (
          <div className="bg-slate-800 rounded-lg border-l-4 border-slate-500 border border-slate-700 p-5 w-full lg:w-80 flex-shrink-0 self-start">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-medium">🔒 Bloqueado</span>
              <button onClick={() => setSelectedBlocked(null)} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <p className="text-white font-semibold text-base mb-1">
              {selectedBlocked.reason ?? "Sin motivo"}
            </p>
            <p className="text-slate-400 text-sm mb-4">
              {new Date(selectedBlocked.date).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {!selectedBlocked.allDay && (
                <><br />{new Date(selectedBlocked.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                {selectedBlocked.duration && ` · ${Math.floor(selectedBlocked.duration / 60)}h${selectedBlocked.duration % 60 ? selectedBlocked.duration % 60 + "min" : ""}`}</>
              )}
              {selectedBlocked.allDay && <><br /><span className="text-slate-500">Jornada completa</span></>}
            </p>
            <button
              onClick={() => deleteBlock(selectedBlocked.id)}
              className="w-full text-xs text-slate-500 hover:text-red-400 transition-colors py-1 border border-slate-700 hover:border-red-800 rounded"
            >
              Eliminar bloqueo
            </button>
          </div>
        )}
      </div>

      {/* Légende */}
      <div className="flex gap-4 text-xs text-slate-400 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block"/> Pendiente</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-600 inline-block"/> Confirmada</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-700 inline-block"/> Rechazada</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-slate-600 inline-block"/> Bloqueado</span>
      </div>
    </div>
  );
}
