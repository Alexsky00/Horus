"use client";
import { useEffect, useState } from "react";

type Log = {
  id: string;
  action: string;
  bookingId: string | null;
  details: string;
  createdAt: string;
};

const ACTION_STYLES: Record<string, { label: string; cls: string; dot: string }> = {
  created:   { label: "Creada",     cls: "bg-blue-500/20 text-blue-300",   dot: "bg-blue-400" },
  confirmed: { label: "Confirmada", cls: "bg-green-500/20 text-green-300", dot: "bg-green-400" },
  refused:   { label: "Rechazada",  cls: "bg-red-500/20 text-red-400",     dot: "bg-red-400" },
  deleted:   { label: "Eliminada",  cls: "bg-slate-500/20 text-slate-400", dot: "bg-slate-500" },
};

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [clearing, setClearing] = useState(false);

  function fetchLogs() {
    setLoading(true);
    fetch("/api/logs")
      .then((r) => r.json())
      .then((data) => { setLogs(data); setLoading(false); });
  }

  useEffect(() => { fetchLogs(); }, []);

  async function clearLogs() {
    if (!confirm("¿Vaciar todos los logs? Esta acción es irreversible.")) return;
    setClearing(true);
    await fetch("/api/logs", { method: "DELETE" });
    setClearing(false);
    fetchLogs();
  }

  const displayed = logs.filter((l) => {
    if (filter !== "all" && l.action !== filter) return false;
    if (search.trim() && !l.details.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.action] = (acc[l.action] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-lg font-semibold text-white">Historial de actividad</h1>
        <div className="flex gap-2 items-center">
          <button onClick={fetchLogs} className="text-xs px-3 py-1.5 rounded-full border border-slate-600 text-slate-400 hover:border-slate-400">
            ↻ Actualizar
          </button>
          <button onClick={clearLogs} disabled={clearing || logs.length === 0}
            className="text-xs px-3 py-1.5 rounded-full border border-red-800 text-red-400 hover:bg-red-900/30 disabled:opacity-30">
            Vaciar logs
          </button>
        </div>
      </div>

      {/* Stats par action */}
      <div className="grid grid-cols-4 gap-2">
        {(["created", "confirmed", "refused", "deleted"] as const).map((a) => {
          const s = ACTION_STYLES[a];
          return (
            <button key={a} onClick={() => setFilter(filter === a ? "all" : a)}
              className={`rounded-lg p-2.5 border text-center transition-colors ${
                filter === a ? "border-amber-500 bg-amber-500/10" : "border-slate-700 bg-slate-800 hover:border-slate-600"
              }`}>
              <div className="text-xl font-bold text-white">{counts[a] ?? 0}</div>
              <div className={`text-xs mt-0.5 ${s.cls.split(" ")[1]}`}>{s.label}</div>
            </button>
          );
        })}
      </div>

      {/* Recherche + filtre */}
      <div className="flex gap-2 flex-wrap items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar en los detalles..."
          className="flex-1 min-w-40 bg-slate-800 border border-slate-600 rounded-full px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded-full px-3 py-1.5 text-sm text-slate-300">
          <option value="all">Todas las acciones</option>
          <option value="created">Creada</option>
          <option value="confirmed">Confirmada</option>
          <option value="refused">Rechazada</option>
          <option value="deleted">Eliminada</option>
        </select>
        <span className="text-xs text-slate-500 ml-auto">{displayed.length} entrada(s)</span>
      </div>

      {/* Liste */}
      {loading ? (
        <p className="text-slate-500 text-center py-8">Cargando...</p>
      ) : displayed.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-3xl mb-2">📋</p>
          <p>Sin entradas de log</p>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg divide-y divide-slate-700/60">
          {displayed.map((log) => {
            const s = ACTION_STYLES[log.action] ?? ACTION_STYLES.created;
            const date = new Date(log.createdAt);
            const dateStr = date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
            const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            return (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>
                      {s.label}
                    </span>
                    <span className="text-slate-300 text-sm truncate">{log.details}</span>
                  </div>
                  {log.bookingId && (
                    <p className="text-xs text-slate-600 mt-0.5 font-mono">{log.bookingId}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-400">{timeStr}</p>
                  <p className="text-xs text-slate-600">{dateStr}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
