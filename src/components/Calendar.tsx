"use client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useState, useRef } from "react";
import type FullCalendarType from "@fullcalendar/react";
import type { Booking } from "./BookingCard";
import { Flag } from "./BookingCard";

const STATUS_COLOR: Record<string, string> = {
  pending:   "#f59e0b",
  confirmed: "#16a34a",
  refused:   "#b91c1c",
};

// Plage horaire affichée dans la grille mensuelle
const DAY_START_H = 6;   // 06h00
const DAY_END_H   = 22;  // 22h00
const DAY_RANGE   = (DAY_END_H - DAY_START_H) * 60; // en minutes

type View = "month" | "week" | "day";

export default function Calendar({
  bookings,
  onBookingClick,
}: {
  bookings: Booking[];
  onBookingClick: (booking: Booking) => void;
}) {
  const [view, setView] = useState<View>("week");
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() }; // month 0-indexed
  });
  // Date de référence pour les vues FullCalendar semaine/jour
  const [fcDate, setFcDate] = useState<Date>(new Date());
  const [fcTitle, setFcTitle] = useState<string>("");
  const fcRef = useRef<FullCalendarType>(null);

  function prevMonth() {
    setCurrent((c) =>
      c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }
    );
  }
  function nextMonth() {
    setCurrent((c) =>
      c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }
    );
  }
  function fcPrev() { fcRef.current?.getApi().prev(); }
  function fcNext() { fcRef.current?.getApi().next(); }
  function goToday() {
    const d = new Date();
    setCurrent({ year: d.getFullYear(), month: d.getMonth() });
    setFcDate(d);
    fcRef.current?.getApi().today();
  }

  // Clic sur un jour → passer en vue jour
  function handleDayClick(date: Date) {
    if (fcRef.current) {
      // FullCalendar déjà monté (depuis vue semaine) → changer via API
      const api = fcRef.current.getApi();
      api.gotoDate(date);
      api.changeView("timeGridDay");
      setView("day");
    } else {
      // Depuis la vue mois → FullCalendar va se monter avec initialDate/initialView
      setFcDate(date);
      setView("day");
    }
  }

  function switchFcView(v: View) {
    setView(v);
    if (v !== "month" && fcRef.current) {
      fcRef.current.getApi().changeView(v === "week" ? "timeGridWeek" : "timeGridDay");
    }
  }

  const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DAYS_ES   = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

  // --- Toolbar commun ---
  const toolbar = (
    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <button onClick={() => view === "month" ? prevMonth() : fcPrev()} className="w-8 h-8 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-500 text-white font-bold text-base transition-colors">‹</button>
        <span className="text-white font-semibold text-sm min-w-36 text-center">
          {view === "month" ? `${MONTHS_ES[current.month]} ${current.year}` : fcTitle}
        </span>
        <button onClick={() => view === "month" ? nextMonth() : fcNext()} className="w-8 h-8 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-500 text-white font-bold text-base transition-colors">›</button>
        <button onClick={goToday} className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-500 rounded text-white font-medium transition-colors ml-1">Hoy</button>
      </div>
      <div className="flex gap-1">
        {(["month","week","day"] as View[]).map((v) => (
          <button key={v} onClick={() => switchFcView(v)}
            className={`text-xs px-3 py-1 rounded border transition-colors ${view === v ? "bg-amber-500 border-amber-500 text-black font-medium" : "border-slate-600 text-slate-400 hover:border-slate-400"}`}>
            {v === "month" ? "Mes" : v === "week" ? "Semana" : "Día"}
          </button>
        ))}
      </div>
    </div>
  );

  // --- Vue semaine / jour : FullCalendar ---
  if (view === "week" || view === "day") {
    const events = bookings.map((b) => ({
      id: b.id,
      title: `${b.tourName} — ${b.guestName} (${b.participants})`,
      start: b.date,
      end: b.duration ? new Date(new Date(b.date).getTime() + b.duration * 60_000).toISOString() : undefined,
      backgroundColor: STATUS_COLOR[b.status] ?? "#64748b",
      borderColor:     STATUS_COLOR[b.status] ?? "#64748b",
      textColor: b.status === "pending" ? "#000" : "#fff",
      extendedProps: { nationality: b.nationality },
    }));

    return (
      <div>
        {toolbar}
        <FullCalendar
          ref={fcRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view === "week" ? "timeGridWeek" : "timeGridDay"}
          initialDate={fcDate}
          locale="es"
          firstDay={1}
          events={events}
          eventClick={(info) => {
            const b = bookings.find((x) => x.id === info.event.id);
            if (b) onBookingClick(b);
          }}
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          headerToolbar={false}
          datesSet={(info) => setFcTitle(info.view.title)}
          eventContent={(arg) => (
            <div className="px-1 py-0.5 text-xs leading-tight cursor-pointer flex items-center gap-1">
              <span className="font-semibold shrink-0">{arg.timeText}</span>
              <span className="opacity-90 truncate">{arg.event.title}</span>
              {arg.event.extendedProps.nationality && (
                <Flag code={arg.event.extendedProps.nationality} size="0.9rem" />
              )}
            </div>
          )}
        />
      </div>
    );
  }

  // --- Vue mois custom (Gantt) ---
  const firstDay = new Date(current.year, current.month, 1);
  // Lundi = 0 dans notre grille
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const totalCells  = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const today       = new Date();

  type DayEntry = { booking: Booking; mode: "single" | "start" | "end" };

  // Assign stable row indices so multi-day bookings share the same vertical slot
  // on their start day and end day.
  const bookingRow: Record<string, number> = {};
  const rowMap: Record<string, number[]> = {}; // dateKey -> occupied slot numbers

  const sortedForRows = [...bookings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  sortedForRows.forEach((b) => {
    const startDate = new Date(b.date);
    const startKey  = startDate.toISOString().slice(0, 10);

    // Find first free slot on the start day
    const occupied = rowMap[startKey] ?? [];
    let slot = 0;
    while (occupied.includes(slot)) slot++;

    bookingRow[b.id] = slot;
    (rowMap[startKey] ??= []).push(slot);

    if (b.duration) {
      const endDate = new Date(startDate.getTime() + b.duration * 60_000);
      const endKey  = endDate.toISOString().slice(0, 10);
      if (endKey !== startKey) {
        (rowMap[endKey] ??= []).push(slot); // reserve same slot on end day
      }
    }
  });

  // Indexe les réservations par jour, en gérant les réservations multi-jours
  const byDay: Record<string, DayEntry[]> = {};
  bookings.forEach((b) => {
    const startDate = new Date(b.date);
    const startKey  = startDate.toISOString().slice(0, 10);

    if (b.duration) {
      const endDate = new Date(startDate.getTime() + b.duration * 60_000);
      const endKey  = endDate.toISOString().slice(0, 10);

      if (endKey !== startKey) {
        (byDay[startKey] ??= []).push({ booking: b, mode: "start" });
        (byDay[endKey]   ??= []).push({ booking: b, mode: "end" });
      } else {
        (byDay[startKey] ??= []).push({ booking: b, mode: "single" });
      }
    } else {
      (byDay[startKey] ??= []).push({ booking: b, mode: "single" });
    }
  });

  const BAR_H   = 15;
  const ROW_GAP = 18;
  const maxSlots = Object.values(rowMap).length
    ? Math.max(...Object.values(rowMap).map((slots) => Math.max(...slots) + 1))
    : 1;
  const CELL_H  = 24 + maxSlots * ROW_GAP + 4;

  return (
    <div>
      {toolbar}

      {/* En-têtes jours */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_ES.map((d) => (
          <div key={d} className="text-xs text-slate-500 text-center py-1 font-medium">{d}</div>
        ))}
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7 border-t border-l border-slate-700">
        {Array.from({ length: totalCells }).map((_, i) => {
          const dayNum = i - startOffset + 1;
          const isValid = dayNum >= 1 && dayNum <= daysInMonth;
          const date = isValid ? new Date(current.year, current.month, dayNum) : null;
          const key = date ? date.toISOString().slice(0, 10) : "";
          const dayBookings = (byDay[key] ?? []).sort(
            (a, b) => new Date(a.booking.date).getTime() - new Date(b.booking.date).getTime()
          );
          const isToday = date
            ? date.getDate() === today.getDate() &&
              date.getMonth() === today.getMonth() &&
              date.getFullYear() === today.getFullYear()
            : false;
          const isWeekend = date ? date.getDay() === 0 || date.getDay() === 6 : false;

          return (
            <div
              key={i}
              onClick={() => date && handleDayClick(date)}
              style={{ height: CELL_H }}
              className={`relative border-b border-r border-slate-700 overflow-hidden select-none ${
                isValid ? "cursor-pointer hover:bg-slate-700/30 transition-colors" : "bg-slate-900/40"
              } ${isWeekend && isValid ? "bg-slate-800/60" : ""}`}
            >
              {/* Numéro du jour */}
              {isValid && (
                <span className={`absolute top-1 left-1.5 text-[10px] font-medium z-10 leading-none ${
                  isToday
                    ? "bg-amber-500 text-black w-4 h-4 rounded-full flex items-center justify-center"
                    : "text-slate-400"
                }`}>
                  {dayNum}
                </span>
              )}

              {/* Barres horizontales Gantt */}
              {isValid && dayBookings.map(({ booking: b, mode }) => {
                const startDate = new Date(b.date);
                const color     = STATUS_COLOR[b.status] ?? "#64748b";
                const textColor = b.status === "pending" ? "#000" : "#fff";
                const top       = 22 + (bookingRow[b.id] ?? 0) * ROW_GAP;

                // --- Mode "end" : la réservation finit ce jour-là ---
                if (mode === "end") {
                  const endDate   = new Date(startDate.getTime() + (b.duration ?? 0) * 60_000);
                  const endMin    = (endDate.getHours() - DAY_START_H) * 60 + endDate.getMinutes();
                  const endPct    = Math.max(4, Math.min(100, (endMin / DAY_RANGE) * 100));
                  const endStr    = endDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
                  const startStr  = startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });

                  return (
                    <div
                      key={b.id + "-end"}
                      onClick={(e) => { e.stopPropagation(); onBookingClick(b); }}
                      title={`Suite de ${startStr} — fin ${endStr} — ${b.tourName}`}
                      style={{
                        top,
                        left:            0,
                        width:           `${endPct}%`,
                        height:          BAR_H,
                        backgroundColor: color,
                        opacity:         0.75,
                        borderRight:     `3px solid rgba(0,0,0,0.35)`,
                      }}
                      className="absolute z-20 cursor-pointer rounded-r-sm overflow-hidden hover:brightness-110 transition-all flex items-center justify-end pr-1"
                    >
                      <span style={{ color: textColor, fontSize: 9, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap" }}>
                        →{endStr}
                      </span>
                    </div>
                  );
                }

                // --- Mode "start" ou "single" ---
                const minFromStart = (startDate.getHours() - DAY_START_H) * 60 + startDate.getMinutes();
                const leftPct      = Math.max(0, Math.min(98, (minFromStart / DAY_RANGE) * 100));
                const timeStr      = startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });

                // "start" = s'étend jusqu'au bord droit (suite demain)
                // "single" = largeur proportionnelle à la durée
                const durMin   = b.duration ?? 60;
                const widthPct = mode === "start"
                  ? 100 - leftPct          // jusqu'au bord
                  : Math.max(2, Math.min(100 - leftPct, (durMin / DAY_RANGE) * 100));

                // Si la barre commence trop tard (>72%), l'heure déborde à droite.
                // Dans ce cas on affiche le label à gauche du bord de la barre.
                const isLate = leftPct > 72;
                return (
                  <div
                    key={b.id + "-" + mode}
                    onClick={(e) => { e.stopPropagation(); onBookingClick(b); }}
                    title={`${timeStr} — ${b.tourName} (${b.guestName})${b.nationality ? " " + b.nationality : ""}${mode === "start" ? " → suite demain" : ""}`}
                    style={{
                      top,
                      left:            `${leftPct}%`,
                      width:           mode === "single" ? `max(36px, ${widthPct}%)` : `${widthPct}%`,
                      height:          BAR_H,
                      backgroundColor: color,
                      borderLeft:      `3px solid rgba(0,0,0,0.30)`,
                      borderRadius:    mode === "start" ? "3px 0 0 3px" : "3px",
                    }}
                    className="absolute z-20 cursor-pointer hover:brightness-110 transition-all"
                  >
                    <span style={{
                      position: "absolute",
                      top: "50%", transform: "translateY(-50%)",
                      ...(isLate
                        ? { right: "calc(100% + 1px)", color }          // hors barre, à gauche
                        : { left: "2px", color: textColor }),            // dans la barre
                      fontSize: 9, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap",
                    }}>
                      {timeStr}{mode === "start" ? "→" : ""}{!isLate && b.nationality && <Flag code={b.nationality} size="0.75rem" />}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Légende heure */}
      <div className="flex justify-between mt-1 px-0.5">
        {[6,8,10,12,14,16,18,20,22].map((h) => (
          <span key={h} className="text-[9px] text-slate-600">{h}h</span>
        ))}
      </div>
    </div>
  );
}
