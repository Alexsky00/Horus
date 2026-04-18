"use client";
import { useEffect, useState, useMemo } from "react";
import type { Booking } from "@/components/BookingCard";
import { Flag } from "@/components/BookingCard";
import { getNationalityLabel } from "@/lib/nationalities";
import type { BlockedSlot } from "@/lib/types";

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const ROUTE_LABELS: Record<string, string> = { corta: "C", media: "M", larga: "L" };

function bookingCode(b: Booking): string {
  const routeChar = ROUTE_LABELS[b.routeType ?? ""] ?? "";
  const sourceChar = b.source === "wordpress" ? "" : b.source.charAt(0).toUpperCase();
  return "R" + routeChar + sourceChar;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatEndTime(b: Booking): string {
  if (b.allDay) return "—";
  if (!b.duration) return "—";
  const end = new Date(new Date(b.date).getTime() + b.duration * 60_000);
  return end.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

type BlockedGroup = {
  id: string;
  reason: string | null;
  allDay: boolean;
  startDate: Date;
  endDate: Date;
  duration: number | null;
};

function groupBlockedSlots(slots: BlockedSlot[]): BlockedGroup[] {
  const allDay = [...slots.filter((s) => s.allDay)].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const partial = slots.filter((s) => !s.allDay);
  const groups: BlockedGroup[] = [];

  for (const slot of allDay) {
    const d = new Date(slot.date);
    const last = groups[groups.length - 1];
    if (last && last.allDay && last.reason === slot.reason) {
      const dayDiff = Math.round((d.getTime() - last.endDate.getTime()) / 86_400_000);
      if (dayDiff === 1) { last.endDate = d; continue; }
    }
    groups.push({ id: slot.id, reason: slot.reason, allDay: true, startDate: d, endDate: d, duration: null });
  }

  for (const slot of partial) {
    groups.push({ id: slot.id, reason: slot.reason, allDay: false, startDate: new Date(slot.date), endDate: new Date(slot.date), duration: slot.duration });
  }

  return groups.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

export default function PlanningPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocked, setBlocked] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [selectedYear, setSelectedYear]   = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed

  useEffect(() => {
    Promise.all([
      fetch("/api/bookings?status=confirmed").then((r) => r.json()),
      fetch("/api/blocked").then((r) => r.json()),
    ]).then(([b, bl]) => { setBookings(b); setBlocked(bl); setLoading(false); });
  }, []);

  // Années disponibles depuis les réservations et les bloquages
  const years = useMemo(() => {
    const set = new Set<number>();
    bookings.forEach((b) => set.add(new Date(b.date).getFullYear()));
    blocked.forEach((bl) => set.add(new Date(bl.date).getFullYear()));
    set.add(now.getFullYear());
    return Array.from(set).sort();
  }, [bookings, blocked]);

  // Réservations filtrées pour le mois sélectionné
  const filtered = useMemo(() => {
    return bookings
      .filter((b) => {
        const d = new Date(b.date);
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [bookings, selectedYear, selectedMonth]);

  // Navigation mois
  function prevMonth() {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear((y) => y - 1); }
    else setSelectedMonth((m) => m - 1);
  }
  function nextMonth() {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear((y) => y + 1); }
    else setSelectedMonth((m) => m + 1);
  }

  const filteredBlocked = useMemo(() => {
    return blocked.filter((bl) => {
      const d = new Date(bl.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [blocked, selectedYear, selectedMonth]);

  const totalParticipants = filtered.reduce((sum, b) => sum + b.participants, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-white font-bold text-xl">Planning — Confirmadas</h1>

        {/* Sélecteur mois */}
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-500 text-white font-bold transition-colors">‹</button>
          <div className="flex items-center gap-2">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white">
              {MONTHS_ES.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-500 text-white font-bold transition-colors">›</button>
        </div>
      </div>

      {/* Résumé */}
      <div className="flex gap-4 text-sm text-slate-400">
        <span><span className="text-white font-semibold">{filtered.length}</span> reservas</span>
        <span><span className="text-white font-semibold">{totalParticipants}</span> personas</span>
        {filteredBlocked.length > 0 && (
          <span><span className="text-slate-300 font-semibold">🔒 {filteredBlocked.length}</span> bloqueado{filteredBlocked.length > 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Tableau */}
      {loading ? (
        <p className="text-slate-400 text-sm">Cargando...</p>
      ) : filtered.length === 0 && filteredBlocked.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-4xl mb-3">📅</p>
          <p>Sin actividad en {MONTHS_ES[selectedMonth]} {selectedYear}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="text-left px-3 py-2 text-slate-400 font-medium">Fecha</th>
                <th className="text-left px-3 py-2 text-slate-400 font-medium">Código</th>
                <th className="text-left px-3 py-2 text-slate-400 font-medium">Tour</th>
                <th className="text-left px-3 py-2 text-slate-400 font-medium">Cliente</th>
                <th className="text-left px-3 py-2 text-slate-400 font-medium">Inicio</th>
                <th className="text-left px-3 py-2 text-slate-400 font-medium">Fin</th>
                <th className="text-left px-3 py-2 text-slate-400 font-medium">Pers.</th>
                <th className="text-left px-3 py-2 text-slate-400 font-medium">Nacionalidad</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Fusionner réservations et bloquages groupés triés par date
                type Row = { type: "booking"; data: Booking } | { type: "blocked"; data: BlockedGroup };
                const rows: Row[] = [
                  ...filtered.map((b): Row => ({ type: "booking", data: b })),
                  ...groupBlockedSlots(filteredBlocked).map((g): Row => ({ type: "blocked", data: g })),
                ].sort((a, b) => {
                  const dateA = a.type === "booking" ? new Date(a.data.date) : a.data.startDate;
                  const dateB = b.type === "booking" ? new Date(b.data.date) : b.data.startDate;
                  return dateA.getTime() - dateB.getTime();
                });

                return rows.map((row, i) => {
                  if (row.type === "blocked") {
                    const g = row.data;
                    const sameDay = g.startDate.toDateString() === g.endDate.toDateString();
                    const dateLabel = sameDay
                      ? formatDate(g.startDate.toISOString())
                      : `${formatShortDate(g.startDate)} – ${formatShortDate(g.endDate)}`;
                    const timeStr = g.allDay ? "Jornada completa" : g.startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
                    const endStr = g.allDay || !g.duration ? "—" : new Date(g.startDate.getTime() + g.duration * 60_000).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
                    return (
                      <tr key={"bl-" + g.id} className="border-b border-slate-700/50 bg-slate-900/40">
                        <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{dateLabel}</td>
                        <td className="px-3 py-2"><span className="text-slate-600 text-xs">🔒</span></td>
                        <td className="px-3 py-2 text-slate-500 italic max-w-40 truncate">{g.reason ?? "Bloqueado"}</td>
                        <td className="px-3 py-2 text-slate-600">—</td>
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap font-mono text-xs">{timeStr}</td>
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap font-mono text-xs">{endStr}</td>
                        <td className="px-3 py-2 text-slate-600 text-center">—</td>
                        <td className="px-3 py-2 text-slate-600">—</td>
                      </tr>
                    );
                  }
                  const b = row.data;
                  return (
                    <tr key={b.id} className={`border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors ${i % 2 === 0 ? "" : "bg-slate-800/20"}`}>
                      <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap">{formatDate(b.date)}</td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded text-xs">
                          {bookingCode(b)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-white font-medium max-w-40 truncate">{b.tourName}</td>
                      <td className="px-3 py-2.5 text-slate-300 max-w-32 truncate">{b.guestName}</td>
                      <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap font-mono">
                        {b.allDay ? <span className="text-amber-400 text-xs">☀ Jornada</span> : formatTime(b.date)}
                      </td>
                      <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap font-mono">{formatEndTime(b)}</td>
                      <td className="px-3 py-2.5 text-slate-200 text-center">{b.participants}</td>
                      <td className="px-3 py-2.5">
                        {b.nationality ? (
                          <div className="flex items-center gap-1.5">
                            <Flag code={b.nationality} size="1rem" />
                            <span className="text-slate-400 text-xs">{getNationalityLabel(b.nationality)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
            {filtered.length > 1 && (
              <tfoot className="bg-slate-800 border-t border-slate-600">
                <tr>
                  <td colSpan={6} className="px-3 py-2 text-slate-400 text-xs font-medium">Total</td>
                  <td className="px-3 py-2 text-white font-bold text-center">{totalParticipants}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
