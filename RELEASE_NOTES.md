# Horus — Release Notes

---

## v1.8.1
_Release date: 2026-04-21_
_Status: Stable_

### Bug fixes
- **Admin — delete confirmation** — clicking ✕ on a tour now shows a confirm dialog before deleting (was immediate)
- **Inactive tour hidden from booking form** — dashboard and calendar booking forms now fetch `/api/tours` (active only) instead of `/api/tours?all=true`; inactive tours no longer appear in the tour select

### Improvements
- **Dashboard booking date** — date now includes full year (e.g. `22/04/2026 09:00`) with a single-letter day-of-week badge (L/M/X/J/V/S/D)
- **Admin — catalog row editing** — each tour row has an ✎ button that expands an inline edit form for all fields (name, category, duration, price, pricing mode, route type, platforms)
- **Admin — category select** — "Nueva ruta" category field is now a dropdown listing all known categories, with a "Custom category" option that reveals a free-text input
- **Admin — route tariffs section removed** — pricing is now managed entirely through the tour catalog
- **Stats — heatmap** — colors changed to blue shades (4 levels); legend updated accordingly; grid changed to 6 months per row (was 4), reducing overall height

---

## v1.8
_Release date: 2026-04-20_
_Status: Stable_

### New features
- **Admin — Tour catalog** — new section to manage 14 tours: initialization, inline price CRUD, active/inactive toggle, delete with confirmation, manual add
- **Admin — free-text category** — category field in "Nueva ruta" accepts any string with autocomplete suggestions from existing tours
- **Booking form (dashboard + calendar)** — tour select filtered by platform; auto-fills name, duration, route type and price on selection
- **Civitatis — per-person pricing** — `price × participants` formula shown live in the form; per-person breakdown shown on BookingCard
- **BookingCard** — price displayed in green; per-person breakdown for Civitatis (`60€/pers.`)
- **Calendar side panel** — "Precio" row visible when a booking has a price (between Participantes and Tipo ruta)
- **Stats — top tours** — colored platform badges (Viator / GYG / Civitatis / WordPress / Manual) displayed under each tour name
- **Demo seed** — requires catalog initialized first; uses real tour names and IDs from catalog; Civitatis uses per-person pricing

---

## v1.7.2
_Release date: 2026-04-20_
_Status: Stable_

### New features
- **Statistics page** — new `/stats` page with annual activity heatmap (12 independent mini-calendars, dynamic color scale: purple → orange → yellow → green) and "Año completo" / monthly filter mode
- **Stats bar chart** — bars switch between full-year and month highlight; click a bar to switch month filter; tooltip with confirmed / pending / refused / conflict counts
- **Admin — tariff pre-fill** — tariff fields are pre-filled with saved values on load (fields disabled until fetch completes to avoid empty flicker)
- **Route tariff auto-fill** — selecting a route type in the booking form auto-fills the price field with the tariff configured in Admin

### Bug fixes
- **Past bookings locked** — Accept / Refuse buttons hidden for past pending or conflict bookings (cannot confirm a tour that already happened)
- **API cache** — all GET API routes now return `Cache-Control: no-store` and are marked `force-dynamic`, preventing stale data after actions
- **Multi-tab sync** — Calendar and Planning tabs auto-refresh data when they regain focus (visibilitychange event), no manual reload needed

---

## v1.6
_Release date: 2026-04-19_
_Status: Stable_

### Bug fixes
- **allDay filter reactive** — "☀ Solo jornada completa" toggle now filters instantly without page refresh (was missing from `useMemo` dependency array)
- **Quick sort always visible** — "Ordenar: Fecha · Cliente · Tour · Pers." bar no longer hidden when the filter panel is open
- **Blocked slot error in Spanish** — API error message changed from "Créneau bloqué" (French) to "Franja bloqueada" (Spanish)
- **Conflict notification** — creating a booking that auto-receives conflict status now shows a dismissible purple banner above the form for ~8 seconds
- **Error banner dismissible** — overlap error banner now has a ✕ button; also auto-clears when any filter or sort changes

### Improvements
- **Conflict color** — conflict status color changed from rose (#f43f5e) to purple (#a855f7) across all views (cards, calendar, tiles, banners)
- **Calendar side panel — conflict status** — conflict bookings now display "⚡ Conflicto" badge in purple in the side panel (previously fell back to amber "Pendiente")
- **Calendar side panel — conflict actions** — Aceptar / Rechazar buttons are now visible for conflict bookings in the calendar side panel (same as pending)
- **Full Spanish UI** — all remaining French strings translated to Spanish (admin page descriptions, VersionFooter release notes)
- **Splash screen** — animated logo transition on first app open (scale + fade in, progress bar, fade out); plays once per session

---

## v1.5
_Release date: 2026-04-18_
_Status: Stable_

### Improvements
- **Color themes** — 6 palettes selectable from the Admin menu: Noche (default slate), Océano (teal), Bosque (green), Vino (purple), Desierto (warm brown), Ártico (blue). Applied instantly without page reload, persisted in DB.
- **No theme flash** — inline script in `<head>` applies the theme before first paint on every page navigation.

---

## v1.4
_Release date: 2026-04-18_
_Status: Stable_

### Improvement
- **Release notes** — clicking the version number in the footer opens a modal showing the full version history

---

## v1.3
_Release date: 2026-04-15_
_Status: Stable_

### Improvements
- **Phone field** — optional phone number on bookings (cards, calendar panel, forms, demo data)
- **Calendar search** — quick search bar filters events by guest name, tour name, or booking code
- **Calendar status filter** — Todos / Pendiente / Confirmada / Rechazada buttons above the calendar
- **Dashboard all-day filter** — "☀ Solo jornada completa" toggle in the filter panel
- **Block form date pre-fill** — "Bloquear horario" form pre-fills with the date visible in the current calendar view
- **Create booking from calendar** — clicking a time slot in week/day view opens the booking form pre-filled with date and time
- **Planning — grouped blocked slots** — consecutive allDay blocked slots with same reason merged into one row (e.g. "3 may – 14 may")
- **Week/day view** — removed "all day" header row; event labels wrap to two lines without overflowing adjacent columns

---

## v1.2
_Release date: 2026-04-14_
_Status: Stable_

### Bug fixes
- **Booking form time** — form now initializes at 09:00 instead of current clock time; selected time is always used
- **Block form time selector** — `<select>` 06:00–21:30 replacing `<input type="time" step=1800>` (cross-browser)
- **ExternalRef** — OTA reference (VIA-001…) removed from calendar side panel

### Improvements
- **allDay conflict** — a confirmed allDay booking blocks the entire day; confirming any booking on an allDay day is refused
- **allDay in calendar (week/day)** — allDay bookings display as a solid 06:00–22:00 block with status color (amber/green/red)
- **Blocked slot in calendar (week/day)** — allDay blocked slots display as a solid 06:00–22:00 block (slate-700) instead of a background overlay
- **Blocked slot color** — unified to `#334155` (slate-700) for visibility against the dark theme

---

## v1.1
_Release date: 2026-04-13_
_Status: Stable_

### Bug fixes
- **Booking code** — auto-generated code badge (RCV, RC, RMV…) now visible on dashboard cards and in calendar side panel
- **ExternalRef hidden** — OTA reference codes (VIA-001, GYG-xxx…) removed from all UI; stored in DB only
- **allDay indicator** — "☀ Toda la jornada" displayed on dashboard cards and calendar side panel for all-day bookings; time no longer shown for all-day events
- **Time selector** — `<select>` with 30-min steps (06:00–21:30) replaces `<input type="time" step=1800>` in both booking form and block form (cross-browser compatible)
- **Timezone fix (Gantt)** — all-day events no longer appear one day off in monthly Gantt; `toLocalKey()` helper uses local date parts instead of UTC
- **Calendar navigation** — switching views no longer resets to today; Gantt month stays in sync when navigating in week/day view
- **Data reset** — full reset now also clears blocked slots; dashboard auto-redirects after reset

### Improvement
- **Planning** — "Cliente" column added to the confirmed bookings table

### Demo data
- 27 bookings + 35 blocked slots

---

## v1.0-Alpha
_Release date: 2026-04-12_
_Status: Internal alpha — superseded by v1.1_

### Features included
- **Dashboard** — booking list with stat tiles (Pending / Confirmed / Refused / Total / Blocked), search, multi-criteria filters, quick sort, pagination
- **Booking management** — create, accept, refuse, delete bookings with anti-double-booking check
- **Booking fields** — source (5 platforms), tour, guest, email, participants, date/time, duration, nationality (flag), route type (corta/media/larga), all-day, notes, external ref
- **Booking code** — auto-generated code: R + route char (C/M/L) + source initial (empty for WordPress)
- **Blocked slots** — create/delete time blocks (all-day or partial); blocks prevent new bookings on that slot
- **Calendar** — FullCalendar with week/month/day/list views, colour-coded by status, blocked slots displayed as grey overlays, click-to-detail side panel
- **Monthly Gantt** — custom monthly view with booking bars, late-label fix, blocked slot bars
- **Planning page** — confirmed bookings table by month, merged with blocked slots, month/year navigation
- **Logs** — full action history (created / confirmed / refused / deleted), filterable
- **Demo seed** — 27 bookings + 37 blocked slots covering a full year of scenarios
- **Reset** — full data wipe (bookings + blocked slots + logs) with double confirmation
- **PWA** — installable on mobile, push notifications

### Known limitations
- No user authentication
- No multi-guide support
- No pricing / invoicing
- Push notifications require manual VAPID key setup
