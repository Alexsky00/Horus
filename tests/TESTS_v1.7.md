# HORUS — Manual Test Suite v1.7

> Version: **1.7**
> Date: 2026-04-19
> URL: http://localhost:3000
> Result legend: ✅ Pass · ❌ Fail · ⏭ Skipped

---

## Setup

| # | Action | Expected | Result |
|---|--------|----------|--------|
| P1 | Run `npm run dev` | Server running at http://localhost:3000 | |
| P2 | Open `/logs` → **"🗑 Vaciar toda la aplicación"** → confirm twice | App reset, dashboard shows 0 everywhere | |
| P3 | On `/logs` → **"✦ Cargar datos de demo"** → confirm | Success: ~80 historical bookings + 21 future + 35 blocked slots created | |

---

## 1 — Dashboard (`/`)

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 1.1 | Load the dashboard | 5 tiles visible: Pendientes / Confirmadas / Rechazadas / Total / 🔒 Bloqueados | |
| 1.2 | Check tile counts | Pendientes + Confirmadas + Rechazadas = Total | |
| 1.3 | Click **Pendientes** tile | List filtered to pending bookings only | |
| 1.4 | Click **Confirmadas** tile | List filtered to confirmed bookings | |
| 1.5 | Click **Total** tile | All bookings visible | |
| 1.6 | Click **🔒 Bloqueados** tile | Blocked slots list appears | |
| 1.7 | Type a guest name in the search bar | Only matching bookings shown | |
| 1.8 | Clear the search field | All bookings return | |
| 1.9 | Open **Filtros** → select a platform | List filtered to that platform | |
| 1.10 | Click **Restablecer filtros** | All filters reset | |
| 1.11 | Click **Fecha** (quick sort) | Sorted by date ascending | |
| 1.12 | Click **Fecha** again | Sort reversed (descending) | |
| 1.13 | Check pagination | Navigation buttons visible and working | |
| 1.14 | Inspect a pending booking card | **✓ Aceptar** and **✗ Rechazar** buttons visible | |
| 1.15 | Inspect a confirmed booking card | Green banner, no Aceptar/Rechazar buttons | |
| 1.16 | Check nationality flags | SVG flag displayed — no raw letter codes | |

---

## 2 — Create a Booking

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 2.1 | Click **+ Nueva reserva** | Form opens | |
| 2.2 | Submit with empty fields | Error: "Faltan campos obligatorios" | |
| 2.3 | Fill all required fields and submit | Booking created, Total tile +1 | |
| 2.4 | Select a nationality | Flag visible on the created booking card | |
| 2.5 | Check "Toda la jornada" | Time and duration fields disappear | |
| 2.6 | Check time selector | 30-min steps only (09:00, 09:30…) — no quarter hours | |
| 2.7 | Create booking A (09:00, 2h) → confirm it. Create booking B (09:30, same day) | Booking B gets status "conflict" automatically | |
| 2.8 | Create a booking on a fully blocked day | Error "Franja bloqueada" displayed | |

---

## 3 — Booking Actions

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 3.1 | On a pending card → **✓ Aceptar** | Status changes to "confirmed", tiles updated | |
| 3.2 | On a pending card → **✗ Rechazar** | Status changes to "refused" | |
| 3.3 | Try to confirm a booking conflicting with an existing confirmed one | Error message "Conflicto de horario" | |
| 3.4 | Click **Eliminar reserva** → confirm | Card disappears, Total -1 | |
| 3.5 | Click **Eliminar reserva** → cancel | Nothing happens | |

---

## 4 — Calendar (`/calendar`)

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 4.1 | Load `/calendar` | Week view by default | |
| 4.2 | Switch to Mes / Semana / Día / Lista views | Each view displays correctly | |
| 4.3 | Navigate with ‹ / › / Hoy | Period changes, title updates | |
| 4.4 | Check event colours (week view) | Amber = pending, Green = confirmed, Red = refused, Purple = conflict | |
| 4.5 | Click a pending event | Side panel opens with Aceptar / Rechazar buttons | |
| 4.6 | Click a conflict event | Aceptar / Rechazar buttons visible in side panel | |
| 4.7 | Navigate to a day with an all-day block | Entire day shown in grey | |
| 4.8 | Click a blocked slot → **Eliminar bloqueo** | Slot deleted, calendar updated | |
| 4.9 | Click **🔒 Bloquear horario** → create an all-day block | Block created, visible in calendar | |
| 4.10 | Verify the all-day block falls on the correct day | No one-day offset | |

---

## 5 — Planning (`/planning`)

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 5.1 | Open `/planning` | Table of confirmed bookings for the current month | |
| 5.2 | Check the summary bar | "X reservas · Y personas · 🔒 Z bloqueados" | |
| 5.3 | All-day booking row | Inicio = "☀ Jornada", Fin = "—" | |
| 5.4 | Navigate with ‹ / › and month selector | Month changes, data updates | |
| 5.5 | Navigate to a month with no activity | Message "Sin actividad en [Mes] [Año]" | |

---

## 6 — Statistics (`/stats`) — NEW in v1.7

### 6a · Time filter

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 6.1 | Open `/stats` | Filter defaults to **Año completo** + current year | |
| 6.2 | Check KPIs in "Año completo" mode | Data aggregated across the full year | |
| 6.3 | Click **‹** in "Año completo" mode | Year goes back by one | |
| 6.4 | Click **›** in "Año completo" mode | Year goes forward by one | |
| 6.5 | Select a specific month (e.g. Marzo) | KPIs recalculated for March only | |
| 6.6 | In month mode, click **‹** from Enero | Jumps to Diciembre of the previous year | |
| 6.7 | In month mode, click **›** from Diciembre | Jumps to Enero of the next year | |
| 6.8 | Switch back to "Año completo" | KPIs return to full-year aggregate | |

### 6b · Reservas por mes chart

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 6.9 | Check the bar chart | 12 bars Ene → Dic, stacked colours (green / amber / red / purple) | |
| 6.10 | In month mode | Active month bar at full opacity, others at 40% | |
| 6.11 | In "Año completo" mode | No bar highlighted | |
| 6.12 | Hover a bar | Tooltip shows confirmed / pending / refused / conflict counts | |
| 6.13 | Click a bar | Month filter switches to that month | |

### 6c · Annual activity heatmap — NEW in v1.7

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 6.14 | Check the heatmap layout | 12 independent mini-calendars (3 cols on mobile, 4 on desktop) | |
| 6.15 | Verify no cross-month contamination | March shows only days 1–31 of March | |
| 6.16 | Check padding cells | Empty (colourless) cells before day 1 and after the last day of each month | |
| 6.17 | Hover a cell with bookings | Tooltip: date + confirmed count + other count | |
| 6.18 | Hover a cell with no bookings | Tooltip: "Sin reservas" | |
| 6.19 | Check colour scale | Dynamic: purple (few) → orange → yellow → green (many), relative to the daily max | |
| 6.20 | Full year visible without scrolling | All 12 months fit within the viewport | |

---

## 7 — Logs (`/logs`)

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 7.1 | Open `/logs` | Events listed: created / confirmed / refused / deleted | |
| 7.2 | Confirm a booking → check logs | "confirmed" entry added at the top | |
| 7.3 | Filter by type "created" | Only creation logs shown | |
| 7.4 | **Vaciar logs** → confirm | All logs deleted | |
| 7.5 | **🗑 Vaciar toda la aplicación** → confirm twice | Entire app reset (bookings + blocks + logs) | |
| 7.6 | Check the demo data message | Correct volumes: ~80 historical + 21 future + 35 blocked | |

---

## 8 — Admin (`/admin`) — NEW in v1.7 (route tariffs)

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 8.1 | Open `/admin` | Tariff fields disabled and semi-transparent while loading (placeholder "…") | |
| 8.2 | Once loaded, with no tariffs saved | Fields empty with placeholder "ej: 120 / 200 / 350" | |
| 8.3 | Enter 120 / 200 / 350 → **Guardar tarifas** | "✓ Guardado" confirmation appears | |
| 8.4 | Navigate away then back to `/admin` | Fields pre-filled with 120 / 200 / 350 from the database | |
| 8.5 | Edit a tariff → save → reload the page | Updated value persisted | |
| 8.6 | Switch theme (e.g. Océano) | Colours update instantly without page reload | |
| 8.7 | Refresh the page | Océano theme still active | |

---

## 9 — Cross-page Consistency

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 9.1 | Confirm a booking from the dashboard | Shows as confirmed in /calendar AND /planning | |
| 9.2 | Delete a booking from /calendar | Disappears from dashboard and planning | |
| 9.3 | Create a blocked slot from /calendar | 🔒 tile count updates on dashboard | |
| 9.4 | Perform actions → check /stats | KPIs and heatmap reflect the changes | |

---

## Final Checklist

- [ ] Dashboard loads without console errors, tile counts are consistent
- [ ] Booking creation works end-to-end
- [ ] Calendar: navigation and event colours correct
- [ ] Planning: correct data, month navigation works
- [ ] Stats: "Año completo" and month filters work, heatmap shows 12 months without horizontal scroll
- [ ] Admin: tariff fields pre-filled after page reload
- [ ] Logs: reset actions work correctly
- [ ] Nationality flags display correctly (no raw letter codes)
