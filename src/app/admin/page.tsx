"use client";
import React, { useEffect, useState, useCallback } from "react";

type Settings = Record<string, string>;

type Tour = {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  pricingMode: string;
  routeType: string;
  platforms: string;
  active: boolean;
  sortOrder: number;
};

const THEMES = [
  {
    id: "slate",
    label: "Noche",
    bg: "#0f172a",
    surface: "#1e293b",
    accent: "#f59e0b",
  },
  {
    id: "ocean",
    label: "Océano",
    bg: "#061c1e",
    surface: "#0d3033",
    accent: "#2dd4bf",
  },
  {
    id: "forest",
    label: "Bosque",
    bg: "#031a0d",
    surface: "#082e17",
    accent: "#4ade80",
  },
  {
    id: "wine",
    label: "Vino",
    bg: "#110820",
    surface: "#1e1038",
    accent: "#c084fc",
  },
  {
    id: "desert",
    label: "Desierto",
    bg: "#160d04",
    surface: "#271808",
    accent: "#fb923c",
  },
  {
    id: "arctic",
    label: "Ártico",
    bg: "#060f1f",
    surface: "#0f1f3d",
    accent: "#60a5fa",
  },
];

const SOURCES = [
  {
    id: "wordpress",
    label: "WordPress",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/30",
    icon: "🌐",
    description: "Plugin de reservas WordPress (Amelia, WooCommerce Bookings…)",
    hasApiKey: false,
  },
  {
    id: "viator",
    label: "Viator",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/30",
    icon: "🧭",
    description: "Viator / TripAdvisor Experiences (acceso de socio requerido)",
    hasApiKey: true,
  },
  {
    id: "getyourguide",
    label: "GetYourGuide",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    icon: "🗺",
    description: "GetYourGuide Supplier API (acceso de socio requerido)",
    hasApiKey: true,
  },
  {
    id: "civitatis",
    label: "Civitatis",
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/30",
    icon: "🏛",
    description: "Civitatis (vía Zapier/Make en emails de confirmación)",
    hasApiKey: false,
  },
];

function generateSecret(len = 32): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function key(source: string, field: string) {
  return `integration.${source}.${field}`;
}

export default function AdminPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeSaved, setThemeSaved] = useState(false);

  // Tour catalog state
  const [tours, setTours] = useState<Tour[]>([]);
  const [toursLoaded, setToursLoaded] = useState(false);
  const [seedingTours, setSeedingTours] = useState(false);
  const [tourSaving, setTourSaving] = useState<string | null>(null);
  const [editingTourFull, setEditingTourFull] = useState<string | null>(null);
  const [editTourData, setEditTourData] = useState<{
    name: string; category: string; duration: string; price: string;
    pricingMode: string; routeType: string; platforms: string[]; sortOrder: string;
  } | null>(null);
  const [editCatCustomMode, setEditCatCustomMode] = useState(false);
  const [deletingTour, setDeletingTour] = useState<string | null>(null);
  const [showNewTour, setShowNewTour] = useState(false);
  const [newTour, setNewTour] = useState({
    name: "", category: "4x4", duration: "180", price: "",
    pricingMode: "group", routeType: "media",
    platforms: [] as string[], sortOrder: "",
  });
  const [creatingTour, setCreatingTour] = useState(false);
  const [catCustomMode, setCatCustomMode] = useState(false);

  async function fetchTours() {
    const r = await fetch("/api/tours?all=true");
    const data = await r.json();
    setTours(data);
    setToursLoaded(true);
  }

  async function seedTours() {
    setSeedingTours(true);
    await fetch("/api/tours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "seed" }),
    });
    setSeedingTours(false);
    await fetchTours();
  }

  async function toggleTourActive(tour: Tour) {
    setTourSaving(tour.id);
    await fetch(`/api/tours/${tour.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !tour.active }),
    });
    setTours((prev) => prev.map((t) => t.id === tour.id ? { ...t, active: !t.active } : t));
    setTourSaving(null);
  }

  function startEditTour(tour: Tour) {
    const platforms: string[] = JSON.parse(tour.platforms);
    const knownCats = ["4x4", "senderismo", "cultural", "autobus", "platform", ...tours.map((t) => t.category)];
    setEditCatCustomMode(!knownCats.includes(tour.category));
    setEditTourData({
      name: tour.name,
      category: tour.category,
      duration: String(tour.duration),
      price: String(tour.price),
      pricingMode: tour.pricingMode,
      routeType: tour.routeType ?? "media",
      platforms,
      sortOrder: String(tour.sortOrder ?? 0),
    });
    setEditingTourFull(tour.id);
  }

  async function saveTourFull(id: string) {
    if (!editTourData) return;
    setTourSaving(id);
    const updated = await fetch(`/api/tours/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editTourData.name,
        category: editTourData.category,
        duration: Number(editTourData.duration),
        price: Number(editTourData.price),
        pricingMode: editTourData.pricingMode,
        routeType: editTourData.routeType,
        platforms: editTourData.platforms,
        sortOrder: Number(editTourData.sortOrder) || 0,
      }),
    }).then((r) => r.json());
    setTours((prev) => prev.map((t) => t.id === id ? updated : t));
    setTourSaving(null);
    setEditingTourFull(null);
    setEditTourData(null);
  }

  function toggleEditPlatform(p: string) {
    setEditTourData((prev) => prev ? {
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter((x) => x !== p)
        : [...prev.platforms, p],
    } : prev);
  }

  async function createTour(e: React.FormEvent) {
    e.preventDefault();
    if (!newTour.name || !newTour.price || newTour.platforms.length === 0) return;
    setCreatingTour(true);
    await fetch("/api/tours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newTour.name,
        category: newTour.category,
        duration: Number(newTour.duration),
        price: Number(newTour.price),
        pricingMode: newTour.pricingMode,
        routeType: newTour.routeType,
        platforms: newTour.platforms,
        sortOrder: newTour.sortOrder ? Number(newTour.sortOrder) : 0,
      }),
    });
    setCreatingTour(false);
    setShowNewTour(false);
    setCatCustomMode(false);
    setNewTour({ name: "", category: "4x4", duration: "180", price: "", pricingMode: "group", routeType: "media", platforms: [], sortOrder: "" });
    await fetchTours();
  }

  function toggleNewTourPlatform(p: string) {
    setNewTour((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter((x) => x !== p)
        : [...prev.platforms, p],
    }));
  }

  async function deleteTour(id: string) {
    if (!window.confirm("Delete this tour?")) return;
    setDeletingTour(id);
    await fetch(`/api/tours/${id}`, { method: "DELETE" });
    setTours((prev) => prev.filter((t) => t.id !== id));
    setDeletingTour(null);
  }

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => { setSettings(data); });
    fetchTours();
  }, []);

  function get(k: string, fallback = "") {
    return settings[k] ?? fallback;
  }

  function set(k: string, v: string) {
    setSettings((prev) => ({ ...prev, [k]: v }));
  }

  async function save(source: string) {
    setSaving(source);
    const patch: Settings = {};
    for (const field of ["enabled", "secret", "apiKey", "autoConfirm", "defaultTour"]) {
      const k = key(source, field);
      if (settings[k] !== undefined) patch[k] = settings[k];
    }
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    setSaving(null);
    setSaved(source);
    setTimeout(() => setSaved(null), 2000);
  }

  async function saveTheme(themeId: string) {
    set("theme.id", themeId);
    setThemeSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ "theme.id": themeId }),
    });
    // Appliquer immédiatement
    localStorage.setItem("horus-theme", themeId);
    if (themeId === "slate") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", themeId);
    }
    setThemeSaving(false);
    setThemeSaved(true);
    setTimeout(() => setThemeSaved(false), 2000);
  }

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white font-bold text-xl">Administración</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configura la app y los flujos de entrada de reservas desde cada plataforma.
        </p>
      </div>

      {/* ── Logs ── */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-white font-semibold text-sm">Logs</h2>
            <p className="text-slate-400 text-xs mt-0.5">Historial de acciones — crear, confirmar, rechazar, eliminar</p>
          </div>
          <a
            href="/logs"
            className="px-4 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors shrink-0"
          >
            Ver logs →
          </a>
        </div>
      </div>

      {/* ── Catálogo de tours ── */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700 bg-slate-800/40 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-white font-semibold text-sm">Catálogo de tours</h2>
            <p className="text-slate-400 text-xs mt-0.5">Gestiona los tours disponibles, precios y plataformas</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {toursLoaded && tours.length === 0 && (
              <button
                onClick={seedTours}
                disabled={seedingTours}
                className="px-4 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-200 text-sm font-medium rounded transition-colors disabled:opacity-50"
              >
                {seedingTours ? "Inicializando…" : "Inicializar catálogo"}
              </button>
            )}
            <button
              onClick={() => setShowNewTour((v) => !v)}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium rounded transition-colors"
            >
              {showNewTour ? "Cancelar" : "+ Nueva ruta"}
            </button>
          </div>
        </div>
        <div className="px-5 py-4">
          {!toursLoaded ? (
            <p className="text-slate-500 text-sm">Cargando…</p>
          ) : tours.length === 0 ? (
            <p className="text-slate-500 text-sm">Catálogo vacío — usa el botón para inicializar los 14 tours.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs border-b border-slate-700">
                    <th className="text-left pb-2 font-medium pr-3">Tour</th>
                    <th className="text-left pb-2 font-medium pr-3">Categoría</th>
                    <th className="text-right pb-2 font-medium pr-3">Duración</th>
                    <th className="text-right pb-2 font-medium pr-3">Precio</th>
                    <th className="text-left pb-2 font-medium pr-3">Plataformas</th>
                    <th className="text-center pb-2 font-medium pr-3">Activo</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {tours.map((tour) => {
                    const h = Math.floor(tour.duration / 60);
                    const m = tour.duration % 60;
                    const durLabel = m > 0 ? `${h}h ${m}min` : `${h}h`;
                    const platforms: string[] = JSON.parse(tour.platforms);
                    const catColors: Record<string, string> = {
                      "4x4": "text-orange-400 bg-orange-400/10",
                      senderismo: "text-green-400 bg-green-400/10",
                      cultural: "text-purple-400 bg-purple-400/10",
                      autobus: "text-blue-400 bg-blue-400/10",
                      platform: "text-amber-400 bg-amber-400/10",
                    };
                    const platLabels: Record<string, string> = {
                      civitatis: "Civ", viator: "Vtr", getyourguide: "GYG",
                      wordpress: "WP", manual: "Man",
                    };
                    const isEditingFull = editingTourFull === tour.id;
                    const isSaving = tourSaving === tour.id;
                    const isDeleting = deletingTour === tour.id;
                    const PLAT_LIST = [
                      { id: "civitatis", label: "Civ" }, { id: "viator", label: "Vtr" },
                      { id: "getyourguide", label: "GYG" }, { id: "wordpress", label: "WP" },
                      { id: "manual", label: "Man" },
                    ];
                    const allKnownCats = Array.from(new Set(["4x4", "senderismo", "cultural", "autobus", "platform", ...tours.map((t) => t.category)]));
                    return (
                      <React.Fragment key={tour.id}>
                        {/* ── Normal row ── */}
                        <tr className={`${!tour.active ? "opacity-40" : ""} ${isEditingFull ? "bg-slate-700/30" : ""}`}>
                          <td className="py-2 pr-3">
                            <span className="text-white font-medium">{tour.name}</span>
                            {tour.pricingMode === "person" && (
                              <span className="ml-1.5 text-xs text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">por pers.</span>
                            )}
                          </td>
                          <td className="py-2 pr-3">
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${catColors[tour.category] ?? "text-slate-400 bg-slate-700"}`}>
                              {tour.category}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-right text-slate-300 tabular-nums">{durLabel}</td>
                          <td className="py-2 pr-3 text-right tabular-nums text-white">{tour.price}€</td>
                          <td className="py-2 pr-3">
                            <div className="flex flex-wrap gap-1">
                              {platforms.map((p) => (
                                <span key={p} className="text-xs text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded">
                                  {platLabels[p] ?? p}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 pr-3 text-center">
                            <button
                              onClick={() => toggleTourActive(tour)}
                              disabled={isSaving}
                              className={`relative w-9 h-5 rounded-full transition-colors disabled:opacity-50 ${tour.active ? "bg-emerald-500" : "bg-slate-600"}`}
                            >
                              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${tour.active ? "translate-x-4" : ""}`} />
                            </button>
                          </td>
                          <td className="py-2 text-right whitespace-nowrap">
                            <button
                              onClick={() => isEditingFull ? (setEditingTourFull(null), setEditTourData(null)) : startEditTour(tour)}
                              className={`text-xs mr-2 transition-colors ${isEditingFull ? "text-amber-400" : "text-slate-500 hover:text-amber-400"}`}
                              title="Editar"
                            >✎</button>
                            <button
                              onClick={() => deleteTour(tour.id)}
                              disabled={isDeleting}
                              className="text-slate-600 hover:text-red-400 transition-colors text-xs disabled:opacity-50"
                              title="Eliminar"
                            >{isDeleting ? "…" : "✕"}</button>
                          </td>
                        </tr>

                        {/* ── Edit row ── */}
                        {isEditingFull && editTourData && (
                          <tr>
                            <td colSpan={7} className="pb-3 pt-0">
                              <div className="bg-slate-800 border border-amber-500/30 rounded-lg p-3 space-y-3">
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                  {/* Name */}
                                  <div className="col-span-2">
                                    <label className="text-xs text-slate-400 block mb-1">Nombre</label>
                                    <input type="text" value={editTourData.name}
                                      onChange={(e) => setEditTourData((p) => p ? { ...p, name: e.target.value } : p)}
                                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
                                    />
                                  </div>
                                  {/* Category */}
                                  <div>
                                    <label className="text-xs text-slate-400 block mb-1">Categoría</label>
                                    <select
                                      value={editCatCustomMode ? "__custom__" : editTourData.category}
                                      onChange={(e) => {
                                        if (e.target.value === "__custom__") { setEditCatCustomMode(true); setEditTourData((p) => p ? { ...p, category: "" } : p); }
                                        else { setEditCatCustomMode(false); setEditTourData((p) => p ? { ...p, category: e.target.value } : p); }
                                      }}
                                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
                                    >
                                      {allKnownCats.map((c) => <option key={c} value={c}>{c}</option>)}
                                      <option value="__custom__">— Custom —</option>
                                    </select>
                                    {editCatCustomMode && (
                                      <input type="text" value={editTourData.category} autoFocus
                                        onChange={(e) => setEditTourData((p) => p ? { ...p, category: e.target.value } : p)}
                                        placeholder="Custom category…"
                                        className="w-full mt-1 bg-slate-700 border border-amber-500/50 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500"
                                      />
                                    )}
                                  </div>
                                  {/* Route type */}
                                  <div>
                                    <label className="text-xs text-slate-400 block mb-1">Tipo de ruta</label>
                                    <select value={editTourData.routeType}
                                      onChange={(e) => setEditTourData((p) => p ? { ...p, routeType: e.target.value } : p)}
                                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
                                    >
                                      <option value="corta">🟢 Corta</option>
                                      <option value="media">🟡 Media</option>
                                      <option value="larga">🔴 Larga</option>
                                    </select>
                                  </div>
                                  {/* Duration */}
                                  <div>
                                    <label className="text-xs text-slate-400 block mb-1">Duración</label>
                                    <select value={editTourData.duration}
                                      onChange={(e) => setEditTourData((p) => p ? { ...p, duration: e.target.value } : p)}
                                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
                                    >
                                      {[60,90,120,150,180,210,240,270,300,330,360].map((m) => {
                                        const h = Math.floor(m/60), r = m%60;
                                        return <option key={m} value={m}>{r > 0 ? `${h}h ${r}min` : `${h}h`}</option>;
                                      })}
                                    </select>
                                  </div>
                                  {/* Price */}
                                  <div>
                                    <label className="text-xs text-slate-400 block mb-1">Precio (€)</label>
                                    <input type="number" min="0" step="1" value={editTourData.price}
                                      onChange={(e) => setEditTourData((p) => p ? { ...p, price: e.target.value } : p)}
                                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
                                    />
                                  </div>
                                  {/* Pricing mode */}
                                  <div>
                                    <label className="text-xs text-slate-400 block mb-1">Tarificación</label>
                                    <select value={editTourData.pricingMode}
                                      onChange={(e) => setEditTourData((p) => p ? { ...p, pricingMode: e.target.value } : p)}
                                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
                                    >
                                      <option value="group">Por grupo</option>
                                      <option value="person">Por persona</option>
                                    </select>
                                  </div>
                                </div>
                                {/* Platforms */}
                                <div>
                                  <label className="text-xs text-slate-400 block mb-1">Plataformas</label>
                                  <div className="flex flex-wrap gap-2">
                                    {PLAT_LIST.map(({ id, label }) => {
                                      const on = editTourData.platforms.includes(id);
                                      return (
                                        <button key={id} type="button" onClick={() => toggleEditPlatform(id)}
                                          className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${on ? "bg-amber-500 border-amber-500 text-black" : "border-slate-600 text-slate-400 hover:border-slate-400"}`}
                                        >{on ? "✓ " : ""}{label}</button>
                                      );
                                    })}
                                  </div>
                                </div>
                                {/* Actions */}
                                <div className="flex items-center gap-3 pt-1">
                                  <button onClick={() => saveTourFull(tour.id)} disabled={isSaving || !editTourData.name || !editTourData.price || editTourData.platforms.length === 0}
                                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium rounded transition-colors disabled:opacity-40"
                                  >{isSaving ? "Guardando…" : "Guardar"}</button>
                                  <button type="button" onClick={() => { setEditingTourFull(null); setEditTourData(null); setEditCatCustomMode(false); }}
                                    className="text-slate-400 text-sm hover:text-slate-200"
                                  >Cancelar</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Formulaire nueva ruta ── */}
          {showNewTour && (
            <form onSubmit={createTour} className="mt-4 border border-slate-700 rounded-lg p-4 bg-slate-900/50 space-y-3">
              <p className="text-white text-sm font-semibold">Nueva ruta</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 block mb-1">Nombre <span className="text-red-400">*</span></label>
                  <input
                    value={newTour.name}
                    onChange={(e) => setNewTour((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ej: Bardenas Exprés"
                    required
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Categoría</label>
                  <select
                    value={catCustomMode ? "__custom__" : newTour.category}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") {
                        setCatCustomMode(true);
                        setNewTour((p) => ({ ...p, category: "" }));
                      } else {
                        setCatCustomMode(false);
                        setNewTour((p) => ({ ...p, category: e.target.value }));
                      }
                    }}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
                  >
                    {Array.from(new Set(["4x4", "senderismo", "cultural", "autobus", "platform", ...tours.map((t) => t.category)])).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__custom__">— Entrar manualmente categoría —</option>
                  </select>
                  {catCustomMode && (
                    <input
                      type="text"
                      value={newTour.category}
                      onChange={(e) => setNewTour((p) => ({ ...p, category: e.target.value }))}
                      placeholder="Type custom category…"
                      autoFocus
                      required
                      className="w-full mt-1 bg-slate-700 border border-amber-500/50 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500"
                    />
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tipo de ruta</label>
                  <select value={newTour.routeType} onChange={(e) => setNewTour((p) => ({ ...p, routeType: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white">
                    <option value="corta">🟢 Corta</option>
                    <option value="media">🟡 Media</option>
                    <option value="larga">🔴 Larga</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Duración (minutos)</label>
                  <select value={newTour.duration} onChange={(e) => setNewTour((p) => ({ ...p, duration: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white">
                    {[60,90,120,150,180,210,240,270,300,330,360].map((m) => {
                      const h = Math.floor(m / 60), r = m % 60;
                      return <option key={m} value={m}>{r > 0 ? `${h}h ${r}min` : `${h}h`}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Precio (€) <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <input
                      type="number" min="0" step="1"
                      value={newTour.price}
                      onChange={(e) => setNewTour((p) => ({ ...p, price: e.target.value }))}
                      placeholder="Ej: 200"
                      required
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white pr-7 placeholder-slate-500"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">€</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tarificación</label>
                  <select value={newTour.pricingMode} onChange={(e) => setNewTour((p) => ({ ...p, pricingMode: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white">
                    <option value="group">Por grupo</option>
                    <option value="person">Por persona</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Orden (opcional)</label>
                  <input
                    type="number" min="0" step="1"
                    value={newTour.sortOrder}
                    onChange={(e) => setNewTour((p) => ({ ...p, sortOrder: e.target.value }))}
                    placeholder="Ej: 50"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-2">Plataformas <span className="text-red-400">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "civitatis", label: "Civitatis" },
                    { id: "viator", label: "Viator" },
                    { id: "getyourguide", label: "GetYourGuide" },
                    { id: "wordpress", label: "WordPress" },
                    { id: "manual", label: "Manual" },
                  ].map(({ id, label }) => {
                    const checked = newTour.platforms.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleNewTourPlatform(id)}
                        className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                          checked
                            ? "bg-amber-500 border-amber-500 text-black"
                            : "border-slate-600 text-slate-400 hover:border-slate-400"
                        }`}
                      >
                        {checked ? "✓ " : ""}{label}
                      </button>
                    );
                  })}
                </div>
                {newTour.platforms.length === 0 && (
                  <p className="text-xs text-slate-600 mt-1">Selecciona al menos una plataforma</p>
                )}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={creatingTour || !newTour.name || !newTour.price || newTour.platforms.length === 0}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium rounded transition-colors disabled:opacity-40"
                >
                  {creatingTour ? "Guardando…" : "Crear ruta"}
                </button>
                <button type="button" onClick={() => { setShowNewTour(false); setCatCustomMode(false); }} className="text-slate-400 text-sm hover:text-slate-200">
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── Thème de couleurs ── */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700 bg-slate-800/40">
          <h2 className="text-white font-semibold text-sm">Tema de colores</h2>
          <p className="text-slate-400 text-xs mt-0.5">Elige la paleta de colores de la interfaz</p>
        </div>
        <div className="px-5 py-4">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {THEMES.map((theme) => {
              const active = (settings["theme.id"] ?? "slate") === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => saveTheme(theme.id)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                    active ? "border-white scale-105 shadow-lg shadow-black/40" : "border-transparent hover:border-slate-500"
                  }`}
                  title={theme.label}
                >
                  {/* Preview card */}
                  <div style={{ backgroundColor: theme.bg }} className="h-16 w-full flex flex-col p-1.5 gap-1">
                    {/* Header bar */}
                    <div style={{ backgroundColor: theme.surface }} className="rounded h-3 w-full" />
                    {/* Card rows */}
                    <div style={{ backgroundColor: theme.surface }} className="rounded h-2 w-3/4 opacity-80" />
                    <div style={{ backgroundColor: theme.surface }} className="rounded h-2 w-1/2 opacity-60" />
                    {/* Accent dot */}
                    <div className="flex justify-end mt-auto">
                      <div style={{ backgroundColor: theme.accent }} className="rounded-full h-2.5 w-2.5" />
                    </div>
                  </div>
                  {/* Label */}
                  <div style={{ backgroundColor: theme.surface }} className="py-1 text-center">
                    <span className="text-xs font-medium" style={{ color: theme.accent }}>{theme.label}</span>
                  </div>
                  {/* Active check */}
                  {active && (
                    <div className="absolute top-1 right-1 bg-white rounded-full w-4 h-4 flex items-center justify-center">
                      <span className="text-black text-xs font-bold leading-none">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {(themeSaving || themeSaved) && (
            <p className="text-xs mt-3 text-center text-slate-400">
              {themeSaving ? "Aplicando…" : "✓ Tema aplicado"}
            </p>
          )}
        </div>
      </div>

      {/* ── Integraciones ── */}
      <div className="space-y-4">
        {SOURCES.map((src) => {
          const enabled = get(key(src.id, "enabled")) === "true";
          const secret = get(key(src.id, "secret"));
          const apiKey = get(key(src.id, "apiKey"));
          const autoConfirm = get(key(src.id, "autoConfirm")) === "true";
          const defaultTour = get(key(src.id, "defaultTour"));
          const webhookUrl = `${origin}/api/webhooks/${src.id}`;
          const isSaving = saving === src.id;
          const isSaved = saved === src.id;

          return (
            <div key={src.id} className={`rounded-xl border ${src.border} bg-slate-800/60 overflow-hidden`}>
              {/* Header */}
              <div className={`flex items-center justify-between px-5 py-4 ${src.bg} border-b ${src.border}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{src.icon}</span>
                  <div>
                    <span className={`font-bold text-sm ${src.color}`}>{src.label}</span>
                    <p className="text-slate-400 text-xs mt-0.5">{src.description}</p>
                  </div>
                </div>
                {/* Toggle */}
                <button
                  onClick={() => set(key(src.id, "enabled"), enabled ? "false" : "true")}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${enabled ? "bg-emerald-500" : "bg-slate-600"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : ""}`} />
                </button>
              </div>

              {/* Body */}
              {enabled && (
                <div className="px-5 py-4 space-y-4">

                  {/* Webhook URL */}
                  <div>
                    <label className="block text-slate-400 text-xs font-medium mb-1.5">URL Webhook</label>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={webhookUrl}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-slate-300 cursor-default"
                      />
                      <button
                        onClick={() => copyToClipboard(webhookUrl, src.id + "-url")}
                        className="shrink-0 px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 transition-colors"
                      >
                        {copied === src.id + "-url" ? "✓ Copiado" : "Copiar"}
                      </button>
                    </div>
                    <p className="text-slate-600 text-xs mt-1">
                      Pega esta URL en los ajustes del plugin / de la plataforma origen.
                    </p>
                  </div>

                  {/* Secret */}
                  <div>
                    <label className="block text-slate-400 text-xs font-medium mb-1.5">Clave secreta</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={secret}
                        onChange={(e) => set(key(src.id, "secret"), e.target.value)}
                        placeholder="Sin clave"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-slate-300 placeholder-slate-600"
                      />
                      <button
                        onClick={() => set(key(src.id, "secret"), generateSecret())}
                        className="shrink-0 px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 transition-colors"
                      >
                        Generar
                      </button>
                      {secret && (
                        <button
                          onClick={() => copyToClipboard(secret, src.id + "-secret")}
                          className="shrink-0 px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 transition-colors"
                        >
                          {copied === src.id + "-secret" ? "✓" : "Copiar"}
                        </button>
                      )}
                    </div>
                    <p className="text-slate-600 text-xs mt-1">
                      Configúrala también en la plataforma origen para validar las solicitudes entrantes.
                    </p>
                  </div>

                  {/* API Key (Viator / GYG) */}
                  {src.hasApiKey && (
                    <div>
                      <label className="block text-slate-400 text-xs font-medium mb-1.5">Clave API de socio</label>
                      <input
                        type="text"
                        value={apiKey}
                        onChange={(e) => set(key(src.id, "apiKey"), e.target.value)}
                        placeholder="Clave proporcionada por la plataforma"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-slate-300 placeholder-slate-600"
                      />
                    </div>
                  )}

                  {/* Tour par défaut */}
                  <div>
                    <label className="block text-slate-400 text-xs font-medium mb-1.5">
                      Tour por defecto <span className="text-slate-600 font-normal">(si la plataforma no envía el nombre)</span>
                    </label>
                    <input
                      type="text"
                      value={defaultTour}
                      onChange={(e) => set(key(src.id, "defaultTour"), e.target.value)}
                      placeholder="ex: Bardenas Reales"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-300 placeholder-slate-600"
                    />
                  </div>

                  {/* Auto-confirmer */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 text-sm">Confirmación automática</p>
                      <p className="text-slate-500 text-xs">Las reservas entrantes se confirman directamente (sin pasar por Pendiente)</p>
                    </div>
                    <button
                      onClick={() => set(key(src.id, "autoConfirm"), autoConfirm ? "false" : "true")}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${autoConfirm ? "bg-emerald-500" : "bg-slate-600"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoConfirm ? "translate-x-5" : ""}`} />
                    </button>
                  </div>

                  {/* Save */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => save(src.id)}
                      disabled={isSaving}
                      className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                        isSaved
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-500 hover:bg-amber-400 text-black"
                      }`}
                    >
                      {isSaving ? "Guardando…" : isSaved ? "✓ Guardado" : "Guardar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Note */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-3">
        <p className="text-slate-400 text-xs leading-relaxed">
          <span className="text-amber-400 font-semibold">Nota:</span> Los endpoints webhook (
          <span className="font-mono">/api/webhooks/…</span>) están en desarrollo (cf. Backlog INT1–INT4).
          La configuración anterior estará activa una vez desplegadas estas integraciones.
        </p>
      </div>
    </div>
  );
}
