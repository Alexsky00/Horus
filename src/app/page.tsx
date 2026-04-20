"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import BookingCard, { type Booking } from "@/components/BookingCard";
import PushSubscribe from "@/components/PushSubscribe";
import { NATIONALITIES } from "@/lib/nationalities";
import type { BlockedSlot } from "@/lib/types";

type StatusFilter = "all" | "pending" | "confirmed" | "refused" | "conflict" | "blocked";
type SortField = "date" | "guestName" | "tourName" | "participants" | "source";
type SortDir = "asc" | "desc";

const SOURCES = ["viator", "getyourguide", "civitatis", "wordpress", "manual"];
const PAGE_SIZE = 15;

export default function Dashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocked, setBlocked] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filtres
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [allDayOnly, setAllDayOnly] = useState(false);

  // Tri
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Pagination
  const [page, setPage] = useState(1);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/bookings");
    const data = await res.json();
    setBookings(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBookings();
    fetch("/api/blocked").then((r) => r.json()).then(setBlocked);
  }, [fetchBookings]);

  async function handleDelete(id: string) {
    await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    fetchBookings();
  }

  async function handleAction(id: string, status: string) {
    setActionError(null);
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json();
      setActionError(err.error ?? "Error");
      return;
    }
    fetchBookings();
  }

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  // Remet à la page 1 et efface l'erreur à chaque changement de filtre/tri
  useEffect(() => { setPage(1); setActionError(null); }, [statusFilter, sourceFilter, search, dateFrom, dateTo, allDayOnly, sortField, sortDir]);

  function resetFilters() {
    setStatusFilter("all");
    setSourceFilter("all");
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setAllDayOnly(false);
    setSortField("date");
    setSortDir("asc");
    setPage(1);
  }

  // Filtrage + tri côté client
  const displayed = useMemo(() => {
    let list = [...bookings];

    if (statusFilter !== "all") list = list.filter((b) => b.status === statusFilter);
    if (sourceFilter !== "all") list = list.filter((b) => b.source === sourceFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) =>
        b.guestName.toLowerCase().includes(q) ||
        b.tourName.toLowerCase().includes(q) ||
        b.guestEmail.toLowerCase().includes(q)
      );
    }
    if (dateFrom) list = list.filter((b) => new Date(b.date) >= new Date(dateFrom));
    if (dateTo)   list = list.filter((b) => new Date(b.date) <= new Date(dateTo + "T23:59:59"));
    if (allDayOnly) list = list.filter((b) => b.allDay);

    list.sort((a, b) => {
      let va: string | number, vb: string | number;
      if (sortField === "date")         { va = new Date(a.date).getTime(); vb = new Date(b.date).getTime(); }
      else if (sortField === "participants") { va = a.participants; vb = b.participants; }
      else { va = (a[sortField] as string).toLowerCase(); vb = (b[sortField] as string).toLowerCase(); }
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

    return list;
  }, [bookings, statusFilter, sourceFilter, search, dateFrom, dateTo, allDayOnly, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));
  const paginated  = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pending   = bookings.filter((b) => b.status === "pending").length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const refused   = bookings.filter((b) => b.status === "refused").length;
  const conflicts = bookings.filter((b) => b.status === "conflict").length;
  const activeFiltersCount = [
    statusFilter !== "all", sourceFilter !== "all",
    search, dateFrom, dateTo, allDayOnly,
    sortField !== "date" || sortDir !== "asc",
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <PushSubscribe />

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <Stat label="Pendientes"   value={pending}                                                                   color="text-amber-400"  onClick={() => setStatusFilter("pending")} />
        <Stat label="Confirmadas"  value={confirmed}                                                                  color="text-green-400"  onClick={() => setStatusFilter("confirmed")} />
        <Stat label="Rechazadas"   value={refused}                                                                    color="text-red-400"    onClick={() => setStatusFilter("refused")} />
        <Stat label="⚡ Conflictos" value={conflicts}                                                                 color="text-purple-400"   onClick={() => setStatusFilter("conflict")} highlight={conflicts > 0} />
        <Stat label="Total"        value={bookings.length}                                                            color="text-slate-300"  onClick={() => setStatusFilter("all")} />
        <Stat label="🔒 Bloqueados" value={blocked.filter(bl => new Date(bl.date) >= new Date()).length}              color="text-slate-400"  onClick={() => setStatusFilter("blocked")} />
      </div>

      {/* Barre de contrôle */}
      <div className="flex gap-2 items-center flex-wrap">
        {/* Recherche */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente, tour..."
          className="flex-1 min-w-36 bg-slate-800 border border-slate-600 rounded-full px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />

        {/* Bouton filtres */}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`text-sm px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
            activeFiltersCount > 0
              ? "bg-amber-500/20 border-amber-500 text-amber-300"
              : "border-slate-600 text-slate-400 hover:border-slate-400"
          }`}
        >
          Filtros {activeFiltersCount > 0 && <span className="bg-amber-500 text-black text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">{activeFiltersCount}</span>}
        </button>

        {/* Actualizar */}
        <button onClick={fetchBookings} className="text-sm px-3 py-1.5 rounded-full border border-slate-600 text-slate-400 hover:border-slate-400">
          ↻
        </button>
      </div>

      {/* Panneau filtres + tri */}
      {filtersOpen && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Statut */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Estado</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white">
                <option value="all">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="refused">Rechazada</option>
                <option value="conflict">⚡ Conflicto</option>
                <option value="blocked">🔒 Bloqueado</option>
              </select>
            </div>

            {/* Source */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Plataforma</label>
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white">
                <option value="all">Todas</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Date desde */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Fecha desde</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white" />
            </div>

            {/* Date hasta */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Fecha hasta</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white" />
            </div>

            {/* Ordenar por */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Ordenar por</label>
              <select value={sortField} onChange={(e) => setSortField(e.target.value as SortField)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white">
                <option value="date">Fecha</option>
                <option value="guestName">Cliente</option>
                <option value="tourName">Tour</option>
                <option value="participants">Participantes</option>
                <option value="source">Plataforma</option>
              </select>
            </div>

            {/* Direction */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Dirección</label>
              <div className="flex gap-2">
                <button onClick={() => setSortDir("asc")}
                  className={`flex-1 text-sm py-1.5 rounded border transition-colors ${sortDir === "asc" ? "bg-amber-500 border-amber-500 text-black font-medium" : "border-slate-600 text-slate-400"}`}>
                  ↑ Asc
                </button>
                <button onClick={() => setSortDir("desc")}
                  className={`flex-1 text-sm py-1.5 rounded border transition-colors ${sortDir === "desc" ? "bg-amber-500 border-amber-500 text-black font-medium" : "border-slate-600 text-slate-400"}`}>
                  ↓ Desc
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={allDayOnly} onChange={(e) => setAllDayOnly(e.target.checked)}
                className="w-4 h-4 accent-amber-500" />
              <span className="text-sm text-slate-300">☀ Solo jornada completa</span>
            </label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500">{statusFilter === "blocked" ? `${blocked.length} bloqueado(s)` : `${displayed.length} reserva(s) mostrada(s)`}</span>
              <button onClick={resetFilters} className="text-xs text-slate-400 hover:text-amber-400">
                Restablecer filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tri rapide par colonnes */}
      <div className="flex gap-2 flex-wrap text-xs text-slate-500">
        <span>Ordenar:</span>
        {([["date","Fecha"],["guestName","Cliente"],["tourName","Tour"],["participants","Pers."]] as [SortField,string][]).map(([f, label]) => (
          <button key={f} onClick={() => toggleSort(f)}
            className={`hover:text-slate-300 transition-colors ${sortField === f ? "text-amber-400 font-medium" : ""}`}>
            {label} {sortField === f ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>
        ))}
        <span className="ml-auto text-slate-600">{statusFilter === "blocked" ? `${blocked.length} bloqueado(s)` : `${displayed.length} resultado(s)`}</span>
      </div>

      {actionError && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded px-4 py-2 text-sm flex items-center justify-between gap-2">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-200 leading-none shrink-0">✕</button>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p className="text-slate-500 text-center py-8">Cargando...</p>
      ) : statusFilter === "blocked" ? (
        blocked.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-4xl mb-3">🔒</p>
            <p>Sin horarios bloqueados</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 border-b border-slate-700">
                <tr>
                  <th className="text-left px-3 py-2 text-slate-400 font-medium">Fecha</th>
                  <th className="text-left px-3 py-2 text-slate-400 font-medium">Hora</th>
                  <th className="text-left px-3 py-2 text-slate-400 font-medium">Duración</th>
                  <th className="text-left px-3 py-2 text-slate-400 font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {[...blocked]
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((bl) => {
                    const d = new Date(bl.date);
                    const dateStr = d.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
                    const timeStr = bl.allDay ? "Jornada completa" : d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
                    const endStr = bl.allDay || !bl.duration ? "—" : (() => {
                      const h = Math.floor(bl.duration / 60);
                      const m = bl.duration % 60;
                      return h === 0 ? `${m}min` : m === 0 ? `${h}h` : `${h}h${m}`;
                    })();
                    const isPast = d < new Date();
                    return (
                      <tr key={bl.id} className={`border-b border-slate-700/50 ${isPast ? "opacity-40" : "hover:bg-slate-800/50"} transition-colors`}>
                        <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap">{dateStr}</td>
                        <td className="px-3 py-2.5 text-slate-400 font-mono text-xs whitespace-nowrap">{timeStr}</td>
                        <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">{endStr}</td>
                        <td className="px-3 py-2.5 text-slate-300 italic">{bl.reason ?? <span className="text-slate-600">—</span>}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )
      ) : displayed.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">📭</p>
          <p>Sin reservas con estos filtros</p>
          <button onClick={resetFilters} className="text-xs text-amber-400 mt-2 hover:underline">
            Restablecer filtros
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map((b) => (
              <BookingCard key={b.id} booking={b} onAction={handleAction} onDelete={handleDelete} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, displayed.length)} de {displayed.length} reservas
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-2 py-1 text-xs rounded border border-slate-600 text-slate-400 hover:border-slate-400 disabled:opacity-30"
                >
                  «
                </button>
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="px-2 py-1 text-xs rounded border border-slate-600 text-slate-400 hover:border-slate-400 disabled:opacity-30"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "…")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-xs text-slate-600">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                          page === p
                            ? "bg-amber-500 border-amber-500 text-black font-medium"
                            : "border-slate-600 text-slate-400 hover:border-slate-400"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  className="px-2 py-1 text-xs rounded border border-slate-600 text-slate-400 hover:border-slate-400 disabled:opacity-30"
                >
                  ›
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-2 py-1 text-xs rounded border border-slate-600 text-slate-400 hover:border-slate-400 disabled:opacity-30"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <SimulateOTA onCreated={fetchBookings} />
    </div>
  );
}

function Stat({ label, value, color, onClick, highlight }: { label: string; value: number; color: string; onClick: () => void; highlight?: boolean }) {
  return (
    <button onClick={onClick} className={`rounded-lg p-3 border text-center w-full transition-colors ${
      highlight && value > 0
        ? "bg-purple-950/40 border-purple-500/60 hover:border-purple-400 animate-pulse"
        : "bg-slate-800 border-slate-700 hover:border-slate-500"
    }`}>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-slate-400 text-xs mt-0.5">{label}</div>
    </button>
  );
}

function SimulateOTA({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [routePrices, setRoutePrices] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    source: "viator",
    guestName: "Juan García",
    guestEmail: "juan@example.com",
    phone: "",
    tourName: "Bardenas Reales",
    date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) + "T09:00",
    participants: "2",
    duration: "",
    allDay: false,
    nationality: "",
    routeType: "",
    notes: "",
    price: "",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then((s: Record<string, string>) => setRoutePrices({
        corta: s["price.route.corta"] ?? "",
        media: s["price.route.media"] ?? "",
        larga: s["price.route.larga"] ?? "",
      }));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, participants: Number(form.participants), duration: form.duration ? Number(form.duration) : null, price: form.price ? Number(form.price) : null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Error ${res.status} — comprueba que la base de datos está conectada`);
        return;
      }
      const created = await res.json().catch(() => ({}));
      setOpen(false);
      onCreated();
      if (created?.status === "conflict") {
        setConflictWarning(`⚡ Conflicto detectado — la reserva de ${form.guestName} se ha creado con estado Conflicto. Revísala antes de aceptar.`);
        setTimeout(() => setConflictWarning(null), 8000);
      }
    } catch {
      setError("No se puede conectar con el servidor. ¿Está corriendo npm run dev?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-slate-700 pt-4">
      {conflictWarning && (
        <div className="mb-3 bg-purple-900/40 border border-purple-600 text-purple-300 rounded px-4 py-2 text-sm flex items-center justify-between gap-2">
          <span>{conflictWarning}</span>
          <button onClick={() => setConflictWarning(null)} className="text-purple-400 hover:text-purple-200 leading-none shrink-0">✕</button>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-colors">
        <span className="text-lg leading-none">+</span> Nueva reserva
      </button>

      {open && (
        <form onSubmit={submit} className="mt-3 bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-3">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded px-3 py-2 text-xs">⚠ {error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Plataforma</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white">
                <option value="viator">Viator</option>
                <option value="getyourguide">GetYourGuide</option>
                <option value="civitatis">Civitatis</option>
                <option value="wordpress">WordPress</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Tour / Excursión</label>
              <input value={form.tourName} onChange={(e) => setForm({ ...form, tourName: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Nombre del cliente</label>
              <input value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Email</label>
              <input type="email" value={form.guestEmail} onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Teléfono (opcional)</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+34 600 000 000"
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Fecha</label>
              <input
                type="date"
                value={form.date.slice(0, 10)}
                onChange={(e) => setForm({ ...form, date: e.target.value + "T" + (form.date.slice(11, 16) || "09:00") })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white" />
            </div>
            {!form.allDay && (
            <div>
              <label className="text-xs text-slate-400 block mb-1">Hora</label>
              <select
                value={form.date.slice(11, 16) || "09:00"}
                onChange={(e) => setForm({ ...form, date: form.date.slice(0, 10) + "T" + e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white">
                {Array.from({ length: 32 }, (_, i) => {
                  const h = Math.floor(i / 2) + 6;
                  const m = i % 2 === 0 ? "00" : "30";
                  const val = `${String(h).padStart(2, "0")}:${m}`;
                  return <option key={val} value={val}>{val}</option>;
                })}
              </select>
            </div>
            )}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Participantes</label>
              <input type="number" min="1" value={form.participants} onChange={(e) => setForm({ ...form, participants: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Nacionalidad (opcional)</label>
              <select value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white">
                <option value="">— Sin especificar</option>
                {NATIONALITIES.map(({ code, label }) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Tipo de ruta (opcional)</label>
              <select value={form.routeType} onChange={(e) => {
                const rt = e.target.value;
                const prevTariff = routePrices[form.routeType] ?? "";
                const newTariff  = routePrices[rt] ?? "";
                setForm(f => ({
                  ...f,
                  routeType: rt,
                  price: (f.price === "" || f.price === prevTariff) ? newTariff : f.price,
                }));
              }}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white">
                <option value="">— Sin especificar</option>
                <option value="corta">🟢 Ruta corta</option>
                <option value="media">🟡 Ruta media</option>
                <option value="larga">🔴 Ruta larga</option>
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer mt-4">
                <input type="checkbox" checked={form.allDay}
                  onChange={(e) => setForm({ ...form, allDay: e.target.checked, duration: e.target.checked ? "" : form.duration })}
                  className="w-4 h-4 accent-amber-500" />
                <span className="text-sm text-white font-medium">Toda la jornada</span>
              </label>
            </div>
            {!form.allDay && (
            <div>
              <label className="text-xs text-slate-400 block mb-1">Duración (opcional)</label>
              <select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white">
                <option value="">— Sin especificar</option>
                <option value="60">1h</option>
                <option value="90">1h30</option>
                <option value="120">2h</option>
                <option value="150">2h30</option>
                <option value="180">3h</option>
                <option value="240">4h</option>
                <option value="300">5h</option>
                <option value="360">6h</option>
              </select>
            </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Precio (€) <span className="text-slate-600">opcional</span>
              </label>
              <div className="relative">
                <input type="number" min="0" step="0.01" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder={form.routeType && routePrices[form.routeType] ? `Tarifa: ${routePrices[form.routeType]}` : "Ej: 250"}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white pr-7 placeholder-slate-500" />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">€</span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Notas (opcional)</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
              placeholder="Ej: vegetarianos, niños..." />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium px-4 py-1.5 rounded disabled:opacity-50">
              {loading ? "..." : "Crear reserva"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 text-sm px-3 py-1.5">
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
