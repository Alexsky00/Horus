"use client";
import { useState, useEffect, useCallback } from "react";
import BookingCard, { type Booking } from "@/components/BookingCard";
import PushSubscribe from "@/components/PushSubscribe";

type Filter = "all" | "pending" | "confirmed" | "refused";

export default function Dashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const params = filter !== "all" ? `?status=${filter}` : "";
    const res = await fetch(`/api/bookings${params}`);
    const data = await res.json();
    setBookings(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function handleAction(id: string, status: "confirmed" | "refused") {
    setActionError(null);
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json();
      setActionError(err.error ?? "Erreur");
      return;
    }
    fetchBookings();
  }

  const pending = bookings.filter((b) => b.status === "pending").length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;

  return (
    <div className="space-y-5">
      <PushSubscribe />

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="En attente" value={pending} color="text-amber-400" />
        <Stat label="Confirmées" value={confirmed} color="text-green-400" />
        <Stat label="Total" value={bookings.length} color="text-slate-300" />
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {(["pending", "all", "confirmed", "refused"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              filter === f
                ? "bg-amber-500 border-amber-500 text-black font-medium"
                : "border-slate-600 text-slate-400 hover:border-slate-400"
            }`}
          >
            {f === "all" ? "Toutes" : f === "pending" ? "En attente" : f === "confirmed" ? "Confirmées" : "Refusées"}
          </button>
        ))}
        <button
          onClick={fetchBookings}
          className="ml-auto text-sm px-3 py-1.5 rounded-full border border-slate-600 text-slate-400 hover:border-slate-400"
        >
          ↻ Rafraîchir
        </button>
      </div>

      {actionError && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded px-4 py-2 text-sm">
          {actionError}
        </div>
      )}

      {/* Liste des réservations */}
      {loading ? (
        <p className="text-slate-500 text-center py-8">Chargement...</p>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">📭</p>
          <p>Aucune réservation {filter !== "all" ? `avec le statut "${filter}"` : ""}</p>
          <p className="text-xs mt-2">Simule une réservation avec le bouton ci-dessous</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <BookingCard key={b.id} booking={b} onAction={handleAction} />
          ))}
        </div>
      )}

      {/* Simulation OTA rapide */}
      <SimulateOTA onCreated={fetchBookings} />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-slate-400 text-xs mt-0.5">{label}</div>
    </div>
  );
}

function SimulateOTA({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    source: "viator",
    guestName: "Jean Martin",
    guestEmail: "jean@example.com",
    tourName: "Randonnée Bardenas",
    date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    participants: "2",
    notes: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, participants: Number(form.participants) }),
    });
    setLoading(false);
    setOpen(false);
    onCreated();
  }

  return (
    <div className="border-t border-slate-700 pt-4">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-slate-400 hover:text-amber-400"
      >
        + Simuler une réservation OTA
      </button>

      {open && (
        <form onSubmit={submit} className="mt-3 bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
              >
                <option value="viator">Viator</option>
                <option value="getyourguide">GetYourGuide</option>
                <option value="civitatis">Civitatis</option>
                <option value="wordpress">WordPress</option>
                <option value="manual">Manuel</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Tour</label>
              <input
                value={form.tourName}
                onChange={(e) => setForm({ ...form, tourName: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Nom du client</label>
              <input
                value={form.guestName}
                onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Email</label>
              <input
                type="email"
                value={form.guestEmail}
                onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Date & heure</label>
              <input
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Participants</label>
              <input
                type="number"
                min="1"
                value={form.participants}
                onChange={(e) => setForm({ ...form, participants: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Notes (optionnel)</label>
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
              placeholder="Ex: végétariens, enfants..."
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium px-4 py-1.5 rounded disabled:opacity-50"
            >
              {loading ? "..." : "Créer la réservation"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 text-sm px-3 py-1.5">
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
