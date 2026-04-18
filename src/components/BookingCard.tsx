"use client";
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
  pending: "border-amber-500",
  confirmed: "border-green-500",
  refused: "border-red-500 opacity-60",
};

export default function BookingCard({
  booking,
  onAction,
  onDelete,
}: {
  booking: Booking;
  onAction: (id: string, status: "confirmed" | "refused") => void;
  onDelete: (id: string) => void;
}) {
  const date = new Date(booking.date);
  const dateStr = date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  function handleDelete() {
    if (confirm(`¿Eliminar la reserva de ${booking.guestName}?`)) {
      onDelete(booking.id);
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
          <StatusBadge status={booking.status} />
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

      {booking.status === "pending" && (
        <div className="flex gap-2 mt-3">
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
    pending: { label: "Pendiente", cls: "bg-amber-500/20 text-amber-300" },
    confirmed: { label: "Confirmada", cls: "bg-green-500/20 text-green-300" },
    refused: { label: "Rechazada", cls: "bg-red-500/20 text-red-400" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-600 text-slate-300" };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
}
