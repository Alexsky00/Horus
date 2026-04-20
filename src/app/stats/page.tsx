"use client";
import { useEffect, useState, useCallback } from "react";
import { getNationalityLabel } from "@/lib/nationalities";

const MONTHS_ES    = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

interface Stats {
  filterYear: number;
  filterMonth: number;
  kpis: {
    totalBookings: number;
    confirmedBookings: number;
    confirmationRate: number;
    totalParticipants: number;
    avgGroupSize: number;
    allDayRate: number;
    totalRevenue: number | null;
    revenueCoverage: number;
  };
  byMonth: { label: string; confirmed: number; refused: number; conflict: number; pending: number; participants: number; revenue: number }[];
  byPlatform: { source: string; total: number; confirmed: number; participants: number; revenue: number; confirmationRate: number }[];
  topTours: { name: string; count: number; participants: number; revenue: number }[];
  topNationalities: { code: string; count: number }[];
  byDayOfWeek: { label: string; count: number }[];
  byTimeSlot: { slot: string; label: string; count: number }[];
  byRouteType: { routeType: string; count: number; participants: number; revenue: number }[];
  byDay: { date: string; total: number; confirmed: number }[];
}

const ROUTE_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  corta:   { label: "Ruta corta",      color: "bg-green-400",  dot: "bg-green-400"  },
  media:   { label: "Ruta media",      color: "bg-amber-400",  dot: "bg-amber-400"  },
  larga:   { label: "Ruta larga",      color: "bg-red-400",    dot: "bg-red-400"    },
  unknown: { label: "Sin especificar", color: "bg-slate-500",  dot: "bg-slate-500"  },
};

const SOURCE_COLORS: Record<string, string> = {
  viator: "bg-emerald-500", getyourguide: "bg-orange-500",
  civitatis: "bg-blue-500", wordpress: "bg-purple-500", manual: "bg-slate-500",
};

const DAYS_SHORT = ["L","M","X","J","V","S","D"];

function heatColor(count: number, max: number): string {
  if (count === 0 || max === 0) return "bg-slate-700/40";
  const r = count / max;
  if (r <= 0.25) return "bg-violet-700/60";
  if (r <= 0.50) return "bg-orange-600/65";
  if (r <= 0.75) return "bg-amber-400/70";
  return "bg-green-500/80";
}

type DayCell = { date: string; total: number; confirmed: number } | null;

function buildMonthGrid(
  year: number,
  month: number, // 0-11
  countMap: Record<string, { total: number; confirmed: number }>
): DayCell[][] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow    = (new Date(year, month, 1).getDay() + 6) % 7; // 0=Lun
  const cells: DayCell[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date: key, ...(countMap[key] ?? { total: 0, confirmed: 0 }) });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function Bar({ value, max, color = "bg-amber-400", height = "h-2" }: { value: number; max: number; color?: string; height?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className={`w-full bg-slate-700 rounded-full ${height} overflow-hidden`}>
      <div className={`${height} ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Kpi({ label, value, sub, color = "text-amber-400" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-slate-400 text-xs mt-0.5">{label}</div>
      {sub && <div className="text-slate-600 text-xs mt-0.5">{sub}</div>}
    </div>
  );
}

export default function StatsPage() {
  const today = new Date();
  // filterMonth: -1 = año completo, 0-11 = mes (0-indexed)
  const [filterYear,  setFilterYear]  = useState(() => today.getFullYear());
  const [filterMonth, setFilterMonth] = useState<number>(-1);
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const currentYear = today.getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);

  function prev() {
    if (filterMonth === -1) { setFilterYear(y => y - 1); }
    else if (filterMonth === 0) { setFilterYear(y => y - 1); setFilterMonth(11); }
    else setFilterMonth(m => m - 1);
  }
  function next() {
    if (filterMonth === -1) { setFilterYear(y => y + 1); }
    else if (filterMonth === 11) { setFilterYear(y => y + 1); setFilterMonth(0); }
    else setFilterMonth(m => m + 1);
  }

  const fetchStats = useCallback(async (year: number, month: number) => {
    setLoading(true);
    const monthParam = month >= 0 ? `&filterMonth=${month + 1}` : "";
    const res  = await fetch(`/api/stats?filterYear=${year}${monthParam}`);
    const data = await res.json();
    setStats(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(filterYear, filterMonth); }, [filterYear, filterMonth, fetchStats]);

  const maxMonth = stats ? Math.max(...stats.byMonth.map(m => m.confirmed + m.refused + m.conflict + m.pending), 1) : 1;
  const maxDay   = stats ? Math.max(...stats.byDayOfWeek.map(d => d.count), 1) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white font-bold text-xl">Estadísticas</h1>
          <p className="text-slate-400 text-sm mt-0.5">Resumen de actividad y rendimiento</p>
        </div>
        {/* Sélecteur mois / année — identique au Planning */}
        <div className="flex items-center gap-2">
          <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-500 text-white font-bold transition-colors">‹</button>
          <div className="flex items-center gap-2">
            <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white">
              <option value={-1}>Año completo</option>
              {MONTHS_ES.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-500 text-white font-bold transition-colors">›</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Cargando estadísticas…</div>
      ) : stats ? (
        <>
          {/* ── KPIs ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Kpi label="Reservas confirmadas" value={String(stats.kpis.confirmedBookings)} sub={`de ${stats.kpis.totalBookings} totales`} />
            <Kpi label="Tasa de confirmación" value={`${stats.kpis.confirmationRate}%`} color={stats.kpis.confirmationRate >= 70 ? "text-green-400" : "text-amber-400"} />
            <Kpi label="Participantes guiados" value={String(stats.kpis.totalParticipants)} color="text-blue-400" />
            <Kpi label="Media de grupo" value={`${stats.kpis.avgGroupSize} pers.`} color="text-slate-300" sub={`${stats.kpis.allDayRate}% jornada completa`} />
          </div>

          {/* Revenue KPI */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">Ingresos (confirmadas)</p>
              {stats.kpis.totalRevenue !== null ? (
                <p className="text-3xl font-bold text-amber-400">{stats.kpis.totalRevenue.toLocaleString("es-ES")} €</p>
              ) : (
                <p className="text-2xl font-bold text-slate-600">—</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-xs">Cobertura de precios</p>
              <p className="text-slate-300 text-sm font-semibold mt-0.5">{stats.kpis.revenueCoverage}% de reservas con precio</p>
              {stats.kpis.revenueCoverage < 100 && (
                <p className="text-slate-600 text-xs mt-0.5">Los ingresos reales pueden ser superiores</p>
              )}
            </div>
          </div>

          {/* ── Heatmap actividad anual ── */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-white font-semibold text-sm">Actividad del año — {filterYear}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Menos</span>
                {["bg-slate-700/40","bg-violet-700/60","bg-orange-600/65","bg-amber-400/70","bg-green-500/80"].map((c, i) => (
                  <div key={i} className={`w-3.5 h-3.5 rounded-sm ${c}`} />
                ))}
                <span>Más</span>
              </div>
            </div>
            <div className="px-5 py-4">
              {(() => {
                const cm: Record<string, { total: number; confirmed: number }> = {};
                for (const d of stats.byDay) cm[d.date] = d;
                const maxPerDay = stats.byDay.reduce((acc, d) => Math.max(acc, d.total), 0);
                return (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {Array.from({ length: 12 }, (_, m) => {
                      const rows = buildMonthGrid(filterYear, m, cm);
                      const flat = rows.flat();
                      return (
                        <div key={m}>
                          <p className="text-[10px] font-semibold text-slate-300 mb-0.5">{MONTHS_ES[m]}</p>
                          <div className="grid grid-cols-7 gap-px mb-px">
                            {DAYS_SHORT.map(d => (
                              <div key={d} className="text-[6px] text-slate-600 text-center">{d}</div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-px">
                            {flat.map((cell, ci) =>
                              cell === null
                                ? <div key={ci} className="aspect-square" />
                                : <div key={ci} className={`aspect-square rounded-sm relative group ${heatColor(cell.total, maxPerDay)}`}>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-[10px] whitespace-nowrap shadow-lg pointer-events-none">
                                      <p className="text-slate-300 font-medium mb-0.5">{cell.date}</p>
                                      {cell.total === 0
                                        ? <p className="text-slate-500">Sin reservas</p>
                                        : <>
                                            <p className="text-green-400">{cell.confirmed} confirmada{cell.confirmed !== 1 ? "s" : ""}</p>
                                            {cell.total - cell.confirmed > 0 && <p className="text-amber-400">{cell.total - cell.confirmed} otra{cell.total - cell.confirmed !== 1 ? "s" : ""}</p>}
                                          </>
                                      }
                                    </div>
                                  </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ── Reservas por mes ── */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl">
            <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm">Reservas por mes — {filterYear}</h2>
              <div className="flex gap-3 flex-wrap">
                {[["bg-green-500/80","Confirmadas"],["bg-amber-500/60","Pendientes"],["bg-red-600/70","Rechazadas"],["bg-purple-500/70","Conflictos"]].map(([cls, lbl]) => (
                  <div key={lbl} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-sm ${cls}`} />
                    <span className="text-slate-500 text-xs">{lbl}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 pb-4 pt-10">
              <div className="flex items-end gap-1.5 h-28">
                {stats.byMonth.map((m, idx) => {
                  const total      = m.confirmed + m.refused + m.conflict + m.pending;
                  const pct        = maxMonth > 0 ? (total / maxMonth) * 100 : 0;
                  const isSelected = filterMonth >= 0 && idx === filterMonth;
                  return (
                    <div key={m.label}
                      className={`flex-1 flex flex-col items-center gap-1 group relative transition-opacity duration-300 cursor-pointer ${isSelected ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
                      onClick={() => setFilterMonth(idx)}>
                      <div className="w-full flex flex-col justify-end" style={{ height: "96px" }}>
                        <div className={`w-full rounded-sm overflow-hidden flex flex-col-reverse ${isSelected ? "ring-1 ring-amber-400/60" : ""}`} style={{ height: `${Math.max(pct, 2)}%` }}>
                          {m.pending   > 0 && <div style={{ flex: m.pending }}   className="bg-amber-500/60" />}
                          {m.conflict  > 0 && <div style={{ flex: m.conflict }}  className="bg-purple-500/70" />}
                          {m.refused   > 0 && <div style={{ flex: m.refused }}   className="bg-red-600/70" />}
                          {m.confirmed > 0 && <div style={{ flex: m.confirmed }} className="bg-green-500/80" />}
                        </div>
                      </div>
                      <span className={`text-[10px] leading-tight text-center ${isSelected ? "text-amber-400 font-semibold" : "text-slate-600"}`}>{m.label}</span>
                      {total > 0 && (
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                          <p className="text-green-400">{m.confirmed} conf.</p>
                          {m.pending  > 0 && <p className="text-amber-400">{m.pending} pend.</p>}
                          {m.refused  > 0 && <p className="text-red-400">{m.refused} rech.</p>}
                          {m.conflict > 0 && <p className="text-purple-400">{m.conflict} confl.</p>}
                          {m.revenue  > 0 && <p className="text-amber-300 border-t border-slate-700 mt-1 pt-1">{m.revenue} €</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Plataformas + Top tours ── */}
          <div className="grid sm:grid-cols-2 gap-4">

            {/* Plataformas */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-700">
                <h2 className="text-white font-semibold text-sm">Por plataforma</h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                {stats.byPlatform.length === 0 ? <p className="text-slate-600 text-sm">Sin datos</p> : stats.byPlatform.map(p => (
                  <div key={p.source}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${SOURCE_COLORS[p.source] ?? "bg-slate-500"}`} />
                        <span className="text-slate-300 text-xs font-medium capitalize">{p.source}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{p.confirmed}/{p.total}</span>
                        <span className={p.confirmationRate >= 70 ? "text-green-400" : "text-amber-400"}>{p.confirmationRate}%</span>
                        {p.revenue > 0 && <span className="text-amber-300">{p.revenue} €</span>}
                      </div>
                    </div>
                    <Bar value={p.confirmed} max={p.total} color={SOURCE_COLORS[p.source] ?? "bg-slate-500"} />
                  </div>
                ))}
              </div>
            </div>

            {/* Top tours */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-700">
                <h2 className="text-white font-semibold text-sm">Tours más reservados</h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                {stats.topTours.length === 0 ? (
                  <p className="text-slate-600 text-sm">Sin datos</p>
                ) : stats.topTours.map((t, i) => (
                  <div key={t.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 text-xs w-4">{i + 1}.</span>
                        <span className="text-slate-300 text-xs font-medium truncate max-w-32">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{t.count} reservas</span>
                        <span>{t.participants} pers.</span>
                        {t.revenue > 0 && <span className="text-amber-300">{t.revenue} €</span>}
                      </div>
                    </div>
                    <Bar value={t.count} max={stats.topTours[0].count} color="bg-amber-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Nacionalidades + Día semana + Franja horaria ── */}
          <div className="grid sm:grid-cols-3 gap-4">

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-700">
                <h2 className="text-white font-semibold text-sm">Top nacionalidades</h2>
              </div>
              <div className="px-5 py-4 space-y-2.5">
                {stats.topNationalities.length === 0 ? (
                  <p className="text-slate-600 text-sm">Sin datos</p>
                ) : stats.topNationalities.map(n => (
                  <div key={n.code} className="flex items-center gap-2">
                    <span className={`fi fi-${n.code.toLowerCase()}`} style={{ fontSize: "1rem", borderRadius: 2 }} />
                    <span className="text-slate-300 text-xs flex-1 truncate">{getNationalityLabel(n.code)}</span>
                    <span className="text-slate-400 text-xs font-medium">{n.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-700">
                <h2 className="text-white font-semibold text-sm">Día de la semana</h2>
              </div>
              <div className="px-5 py-4 space-y-2">
                {stats.byDayOfWeek.map(d => (
                  <div key={d.label} className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs w-7">{d.label}</span>
                    <div className="flex-1">
                      <Bar value={d.count} max={maxDay} color="bg-blue-400" height="h-1.5" />
                    </div>
                    <span className="text-slate-400 text-xs w-4 text-right">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-700">
                <h2 className="text-white font-semibold text-sm">Franja horaria</h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                {stats.byTimeSlot.map(s => {
                  const maxSlot = Math.max(...stats.byTimeSlot.map(x => x.count), 1);
                  return (
                    <div key={s.slot}>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-400 text-xs">{s.label}</span>
                        <span className="text-slate-400 text-xs">{s.count}</span>
                      </div>
                      <Bar value={s.count} max={maxSlot} color="bg-teal-400" height="h-1.5" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Por tipo de ruta ── */}
          {stats.byRouteType.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-700">
                <h2 className="text-white font-semibold text-sm">Por tipo de ruta</h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                {(() => {
                  const maxRoute = Math.max(...stats.byRouteType.map(r => r.count), 1);
                  return stats.byRouteType.map(r => {
                    const cfg = ROUTE_CONFIG[r.routeType] ?? ROUTE_CONFIG.unknown;
                    return (
                      <div key={r.routeType}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                            <span className="text-slate-300 text-xs font-medium">{cfg.label}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{r.count} reservas</span>
                            <span>{r.participants} pers.</span>
                            {r.revenue > 0 && <span className="text-amber-300">{r.revenue.toLocaleString("es-ES")} €</span>}
                          </div>
                        </div>
                        <Bar value={r.count} max={maxRoute} color={cfg.color} />
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-slate-500 text-center py-12">Sin datos disponibles</p>
      )}
    </div>
  );
}
