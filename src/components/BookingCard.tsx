"use client";

export type Booking = {
  id: string;
  source: string;
  guestName: string;
  guestEmail: string;
  tourName: string;
  date: string;
  participants: number;
  status: string;
  notes: string | null;
  externalRef: string | null;
};

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
}: {
  booking: Booking;
  onAction: (id: string, status: "confirmed" | "refused") => void;
}) {
  const date = new Date(booking.date);
  const dateStr = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const timeStr = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`bg-slate-800 rounded-lg p-4 border-l-4 ${STATUS_STYLES[booking.status] ?? "border-slate-600"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[booking.source] ?? "bg-slate-600 text-slate-200"}`}>
            {booking.source.toUpperCase()}
          </span>
          {booking.externalRef && (
            <span className="ml-2 text-xs text-slate-500">{booking.externalRef}</span>
          )}
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <h3 className="font-semibold text-white">{booking.tourName}</h3>
      <p className="text-slate-400 text-sm">
        {dateStr} à {timeStr} · {booking.participants} pers.
      </p>
      <p className="text-slate-300 text-sm mt-1">
        {booking.guestName} — <a href={`mailto:${booking.guestEmail}`} className="text-amber-400 hover:underline">{booking.guestEmail}</a>
      </p>
      {booking.notes && <p className="text-slate-500 text-xs mt-1 italic">{booking.notes}</p>}

      {booking.status === "pending" && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onAction(booking.id, "confirmed")}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-medium py-1.5 rounded"
          >
            ✓ Accepter
          </button>
          <button
            onClick={() => onAction(booking.id, "refused")}
            className="flex-1 bg-red-700 hover:bg-red-600 text-white text-sm font-medium py-1.5 rounded"
          >
            ✗ Refuser
          </button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "En attente", cls: "bg-amber-500/20 text-amber-300" },
    confirmed: { label: "Confirmée", cls: "bg-green-500/20 text-green-300" },
    refused: { label: "Refusée", cls: "bg-red-500/20 text-red-400" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-600 text-slate-300" };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
}
