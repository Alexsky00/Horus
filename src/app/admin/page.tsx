"use client";
import { useEffect, useState, useCallback } from "react";

type Settings = Record<string, string>;

const SOURCES = [
  {
    id: "wordpress",
    label: "WordPress",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/30",
    icon: "🌐",
    description: "Plugin de réservation WordPress (Amelia, WooCommerce Bookings…)",
    hasApiKey: false,
  },
  {
    id: "viator",
    label: "Viator",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/30",
    icon: "🧭",
    description: "Viator / TripAdvisor Experiences (accès partenaire requis)",
    hasApiKey: true,
  },
  {
    id: "getyourguide",
    label: "GetYourGuide",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    icon: "🗺",
    description: "GetYourGuide Supplier API (accès partenaire requis)",
    hasApiKey: true,
  },
  {
    id: "civitatis",
    label: "Civitatis",
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/30",
    icon: "🏛",
    description: "Civitatis (via Zapier/Make sur emails de confirmation)",
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

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/settings").then((r) => r.json()).then(setSettings);
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

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white font-bold text-xl">Administración — Integraciones</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure los flujos de entrada de reservas desde cada plataforma.
        </p>
      </div>

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
                      Coller cette URL dans les paramètres du plugin / de la plateforme source.
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
                      À renseigner également dans la plateforme source pour valider les requêtes entrantes.
                    </p>
                  </div>

                  {/* API Key (Viator / GYG) */}
                  {src.hasApiKey && (
                    <div>
                      <label className="block text-slate-400 text-xs font-medium mb-1.5">Clé API partenaire</label>
                      <input
                        type="text"
                        value={apiKey}
                        onChange={(e) => set(key(src.id, "apiKey"), e.target.value)}
                        placeholder="Clé fournie par la plateforme"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-slate-300 placeholder-slate-600"
                      />
                    </div>
                  )}

                  {/* Tour par défaut */}
                  <div>
                    <label className="block text-slate-400 text-xs font-medium mb-1.5">
                      Tour por defecto <span className="text-slate-600 font-normal">(si la plateforme n'envoie pas le nom)</span>
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
                      <p className="text-slate-500 text-xs">Les réservations entrantes sont directement confirmées (sans passer par Pendiente)</p>
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
          <span className="text-amber-400 font-semibold">Note :</span> Les endpoints webhook (
          <span className="font-mono">/api/webhooks/…</span>) sont en cours de développement (cf. Backlog INT1–INT4).
          La configuration ci-dessus sera active une fois ces intégrations déployées.
        </p>
      </div>
    </div>
  );
}
