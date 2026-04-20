"use client";
import { useState } from "react";
import { getNationalityLabel } from "@/lib/nationalities";

export function Flag({ code, size = "1rem" }: { code: string; size?: string }) {
  return (
    <span
      className={`fi fi-${code.toLowerCase()}`}
      title={getNationalityLabel(code)}
      style={{ fontSize: size, borderRadius: 2, display: "inline-block" }}
    />
  );
}

export type Booking = {
  id: string;
  source: string;
  guestName: string;
  guestEmail: string;
  tourName: string;
  date: string;
  participants: number;
  duration: number | null;
  nationality: string | null;
  routeType: string | null;
  allDay: boolean;
  status: string;
  phone: string | null;
  notes: string | null;
  externalRef: string | null;
  price: number | null;
};

const ROUTE_LABELS: Record<string, string> = {
  corta: "🟢 Ruta corta",
  media: "🟡 Ruta media",
  larga: "🔴 Ruta larga",
};

function bookingCode(b: Booking): string {
  const routeChar = ({ corta: "C", media: "M", larga: "L" } as Record<string, string>)[b.routeType ?? ""] ?? "";
  const sourceChar = b.source === "wordpress" ? "" : b.source.charAt(0).toUpperCase();
  return "R" + routeChar + sourceChar;
}

const SOURCE_COLORS: Record<string, string> = {
  viator: "bg-emerald-700 text-emerald-100",
  getyourguide: "bg-orange-700 text-orange-100",
  civitatis: "bg-blue-700 text-blue-100",
  wordpress: "bg-purple-700 text-purple-100",
  manual: "bg-slate-600 text-slate-200",
};

const STATUS_STYLES: Record<string, string> = {
  pending:   "border-amber-500",
  confirmed: "border-green-500",
  refused:   "border-red-500 opacity-60",
  conflict:  "border-purple-500 bg-purple-950/20",
};

const STATUS_OPTIONS: { value: string; label: string; cls: string }[] = [
  { value: "pending",   label: "Pendiente",    cls: "border-amber-500 text-amber-300 hover:bg-amber-500/20" },
  { value: "confirmed", label: "Confirmada",   cls: "border-green-500 text-green-300 hover:bg-green-500/20" },
  { value: "refused",   label: "Rechazada",    cls: "border-red-500 text-red-400 hover:bg-red-500/20" },
  { value: "conflict",  label: "⚡ Conflicto", cls: "border-purple-500 text-purple-400 hover:bg-purple-500/20" },
];

export default function BookingCard({
  booking,
  onAction,
  onDelete,
}: {
  booking: Booking;
  onAction: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [changeModal, setChangeModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const date = new Date(booking.date);
  const isPast = date < new Date();
  const dateStr = date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  function handleDelete() {
    if (confirm(`¿Eliminar la reserva de ${booking.guestName}?`)) {
      onDelete(booking.id);
    }
  }

  function handleStatusConfirm() {
    if (pendingStatus) {
      onAction(booking.id, pendingStatus);
      setChangeModal(false);
      setPendingStatus(null);
    }
  }

  return (
    <div className={`bg-slate-800 rounded-lg p-4 border-l-4 ${STATUS_STYLES[booking.status] ?? "border-slate-600"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[booking.source] ?? "bg-slate-600 text-slate-200"}`}>
            {booking.source.toUpperCase()}
          </span>
          <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded text-xs">
            {bookingCode(booking)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setChangeModal(true); setPendingStatus(booking.status); }}
            title="Cambiar estado"
            className="flex items-center gap-1 group"
          >
            <StatusBadge status={booking.status} />
            <span className="text-slate-600 group-hover:text-slate-400 text-xs transition-colors">✎</span>
          </button>
          <button
            onClick={handleDelete}
            title="Eliminar reserva"
            className="text-slate-600 hover:text-red-400 transition-colors text-sm leading-none"
          >
            ✕
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-white">{booking.tourName}</h3>
      <p className="text-slate-400 text-sm">
        {dateStr}
        {booking.allDay
          ? <span className="ml-2 text-amber-400 font-medium">☀ Toda la jornada</span>
          : <span> a las {timeStr}</span>
        }
        {" · "}{booking.participants} pers.
        {!booking.allDay && booking.duration && (
          <span className="ml-2 text-slate-500">· {formatDuration(booking.duration)}</span>
        )}
        {booking.routeType && (
          <span className="ml-2 text-slate-500">· {ROUTE_LABELS[booking.routeType] ?? booking.routeType}</span>
        )}
      </p>
      <p className="text-slate-300 text-sm mt-1">
        {booking.guestName}{booking.nationality && <Flag code={booking.nationality} size="1.1rem" />} — <a href={`mailto:${booking.guestEmail}`} className="text-amber-400 hover:underline">{booking.guestEmail}</a>
        {booking.phone && <span className="ml-2 text-slate-400">· <a href={`tel:${booking.phone}`} className="hover:text-amber-400">{booking.phone}</a></span>}
      </p>
      {booking.notes && <p className="text-slate-500 text-xs mt-1 italic">{booking.notes}</p>}

      {(booking.status === "pending" || booking.status === "conflict") && !isPast && (
        <div className="flex gap-2 mt-3">
          {booking.status === "conflict" && (
            <p className="w-full text-xs text-purple-400 mb-1">⚡ Conflicto de horario detectado — revisar antes de aceptar</p>
          )}
          <button
            onClick={() => onAction(booking.id, "confirmed")}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-medium py-1.5 rounded"
          >
            ✓ Aceptar
          </button>
          <button
            onClick={() => onAction(booking.id, "refused")}
            className="flex-1 bg-red-700 hover:bg-red-600 text-white text-sm font-medium py-1.5 rounded"
          >
            ✗ Rechazar
          </button>
        </div>
      )}

      {/* Modal changement de statut */}
      {changeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { setChangeModal(false); setPendingStatus(null); }}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-700">
              <p className="text-white font-semibold text-sm">Cambiar estado</p>
              <p className="text-slate-400 text-xs mt-0.5">{booking.guestName} — {booking.tourName}</p>
            </div>
            <div className="px-5 py-4 space-y-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPendingStatus(opt.value)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border transition-colors text-sm font-medium ${
                    pendingStatus === opt.value
                      ? opt.cls + " bg-opacity-30"
                      : "border-slate-700 text-slate-400 hover:border-slate-500"
                  } ${pendingStatus === opt.value ? opt.cls : ""}`}
                >
                  {pendingStatus === opt.value && <span className="mr-2">✓</span>}
                  {opt.label}
                  {opt.value === booking.status && <span className="ml-2 text-slate-600 text-xs font-normal">(actual)</span>}
                </button>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-slate-700 flex gap-2">
              <button
                onClick={() => { setChangeModal(false); setPendingStatus(null); }}
                className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-400 text-sm hover:border-slate-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleStatusConfirm}
                disabled={!pendingStatus || pendingStatus === booking.status}
                className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirmar cambio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDuration(minutes: number): string {
  if (minutes === 780) return "Día completo (8h–21h)";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:   { label: "Pendiente",     cls: "bg-amber-500/20 text-amber-300" },
    confirmed: { label: "Confirmada",    cls: "bg-green-500/20 text-green-300" },
    refused:   { label: "Rechazada",     cls: "bg-red-500/20 text-red-400" },
    conflict:  { label: "⚡ Conflicto",  cls: "bg-purple-500/20 text-purple-400 font-semibold" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-600 text-slate-300" };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
}
