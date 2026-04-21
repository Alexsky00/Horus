# Horus — Technical Notes

---

## v1.8.1
_Date: 2026-04-21_

### Changes from v1.8

**Admin — delete tour confirmation** (`src/app/admin/page.tsx`)
Added `if (!window.confirm("Delete this tour?")) return;` at the top of `deleteTour()`.

**Booking form tour fetch** (`src/app/page.tsx`, `src/app/calendar/page.tsx`)
Changed `fetch("/api/tours?all=true")` to `fetch("/api/tours")` in both dashboard and calendar `useEffect`. The `?all=true` param bypasses the `active: true` filter — only the admin catalog page should use it.

**Dashboard date format** (`src/components/BookingCard.tsx`)
Replaced `toLocaleDateString` with manual template: `` `${dd}/${mm}/${yyyy} ${hh}:${mm}` ``. Day-of-week single-letter badge uses `DAY_LETTERS = ["D","L","M","X","J","V","S"]` (Spanish convention: X = miércoles to avoid M/M ambiguity). Rendered as a small `bg-slate-700` pill before the date string.

**Admin — catalog full row editing** (`src/app/admin/page.tsx`)
Replaced price-only inline edit (`editingTour` / `editPrice` / `saveTourPrice`) with full-row edit system:
- States: `editingTourFull: string | null`, `editTourData: {...} | null`, `editCatCustomMode: boolean`
- `startEditTour(tour)` — copies tour fields into `editTourData`, detects custom category
- `saveTourFull(id)` — PATCHes all fields, updates local state from API response
- `toggleEditPlatform(p)` — toggles platform in `editTourData.platforms`
- JSX: rows wrapped in `<React.Fragment>`. Normal row has ✎ button. When `editingTourFull === tour.id`, an extra `<tr colspan=7>` expands below with a grid form (name, category, route type, duration, price, pricing mode, platforms).

**Admin — category select** (`src/app/admin/page.tsx`)
`catCustomMode` and `editCatCustomMode` booleans. `<select>` lists all known categories (standard + from existing tours) + "— Custom category —" sentinel. Selecting sentinel sets custom mode and clears category value, showing a text input with `border-amber-500/50`.

**Admin — route tariffs removed** (`src/app/admin/page.tsx`)
Removed "Tarifas por tipo de ruta" section, `routePriceSaving`/`routePriceSaved` states, `saveRoutePrices()` function, `price.route.*` settings keys from fetch/save, `settingsLoaded` state (no longer needed).

**Stats — heatmap** (`src/app/stats/page.tsx`)
`heatColor`: replaced multi-color scale (violet/orange/amber/green) with 4 blue shades: `bg-blue-900/70` / `bg-blue-700/75` / `bg-blue-500/80` / `bg-blue-400/90`. Legend updated to match. Grid changed from `grid-cols-3 sm:grid-cols-4 gap-2` to `grid-cols-4 sm:grid-cols-6 gap-1.5`; month label reduced to `text-[9px]`; container padding reduced to `py-3`.

---

## v1.8
_Date: 2026-04-20_

### Changes from v1.7.2

**Tour model** (`prisma/schema.prisma`)
New `Tour` model: `id`, `name`, `category`, `duration` (Int minutes), `price` (Float), `pricingMode` ("group"|"person"), `routeType`, `platforms` (JSON string array), `active` (Boolean default true), `sortOrder` (Int default 0), `createdAt`.

**Tours API** (`src/app/api/tours/route.ts`, `src/app/api/tours/[id]/route.ts`)
- `GET /api/tours` — returns active tours only (`where: { active: true }`). `?all=true` skips filter (admin use).
- `POST /api/tours` — creates a tour. `platforms` array serialized to JSON string.
- `POST /api/tours` (seed) — seeds 14 default catalog tours when body contains `{ seed: true }`.
- `PATCH /api/tours/:id` — partial update, all fields optional.
- `DELETE /api/tours/:id` — hard delete.

**Booking model extension** (`prisma/schema.prisma`, `src/app/api/bookings/route.ts`)
Added `tourId String?` foreign key (nullable, no cascade). POST `/api/bookings` accepts `tourId`.

**Dashboard booking form** (`src/app/page.tsx`)
`allTours` state. `platformTours = allTours.filter(t => JSON.parse(t.platforms).includes(source))`. `applyTour(id)` sets name/duration/routeType/price from catalog. `handleParticipantsChange` recalculates price for `pricingMode === "person"`. `__manual__` sentinel for free-text tour entry. `tourId` sent to API (null if manual).

**Calendar booking form** (`src/app/calendar/page.tsx`)
Same tour select pattern. `calPlatformTours`, `calSelectedTour`, `calIsPerPerson`, `calComputedTotal`. Side panel: price row added with `{selected.price != null && ...}`.

**BookingCard price** (`src/components/BookingCard.tsx`)
Price shown in green after notes. Per-person breakdown for Civitatis: `(price / participants)€/pers.`

**Stats — top tours** (`src/app/api/stats/route.ts`, `src/app/stats/page.tsx`)
`tourMap` uses `Set<string>` for `sources`. Output: `sources: Array.from(v.sources)`. Page: colored platform badges under each tour name.

**Seed route** (`src/app/api/seed/route.ts`)
Returns 409 if catalog empty. Loads catalog, maps bookings to real tour IDs. Civitatis: `price = perPersonPrice × participants`. Others: group price with ±10% variation.

---

## v1.7.2
_Date: 2026-04-20_

### Changes from v1.6

**Stats page** (`src/app/stats/page.tsx`)
New page. `filterMonth` state: `-1` = "Año completo" (full year), `0–11` = specific month (0-indexed). `prev()`/`next()` navigate by year in year mode, by month (with year wrap) in month mode. Fetch URL: `&filterMonth=${month + 1}` when month selected, omitted for full year.

Bar chart: `isSelected = filterMonth >= 0 && idx === filterMonth`. Clicking a bar sets `filterMonth`. Bars at 40% opacity when not selected in month mode.

**Annual heatmap**
`buildMonthGrid(year, month, countMap): DayCell[][]` — builds each month as an independent 7-column grid. Padding `null` cells before day 1 (Mon-aligned) and trailing nulls to fill last row. No cross-month contamination (replaced previous GitHub-style weekly column approach).

`heatColor(count, max)` — dynamic scale relative to `maxPerDay` across the year:
- `= 0` → `bg-slate-700/40`
- `≤ 25%` → `bg-violet-700/60`
- `≤ 50%` → `bg-orange-600/65`
- `≤ 75%` → `bg-amber-400/70`
- `> 75%` → `bg-green-500/80`

Grid layout: `grid grid-cols-3 sm:grid-cols-4 gap-2`, cells `aspect-square rounded-sm`, inner `grid grid-cols-7 gap-px`.

**Stats API** (`src/app/api/stats/route.ts`)
`filterMonth=0` → full year KPIs (jan–dec). `filterMonth=1–12` → specific month. Added `byDay` array (per-day counts for heatmap). Added `export const dynamic = "force-dynamic"`.

**Admin — tariff pre-fill** (`src/app/admin/page.tsx`)
`settingsLoaded: boolean` state, initially `false`. Fetch callback: `.then(data => { setSettings(data); setSettingsLoaded(true); })`. Tariff inputs: `disabled={!settingsLoaded}`, `placeholder={settingsLoaded ? "ej: 120" : "…"}`, `className="...disabled:opacity-50"`.

**API cache fix** — all GET route handlers
Added `export const dynamic = "force-dynamic"` and `Cache-Control: no-store` response header to: `bookings/route.ts`, `blocked/route.ts`, `stats/route.ts`, `settings/route.ts`. Prevents Next.js route handler cache and browser HTTP cache from serving stale data after PATCH actions.

**Multi-tab auto-refresh**
`calendar/page.tsx` and `planning/page.tsx`: added `useEffect` that registers a `visibilitychange` event listener. On `document.visibilityState === "visible"`, re-fetches all data. Listener cleaned up on unmount. Fixes the scenario where a user confirms a booking in one tab and switches to calendar/planning tabs without navigating.

**Past bookings locked**
`BookingCard.tsx`: `isPast = new Date(booking.date) < new Date()`. Aceptar / Rechazar buttons only rendered when `(status === "pending" || status === "conflict") && !isPast`.
`calendar/page.tsx`: same check on `date` (derived from `selected.date`). Buttons hidden for past events in the side panel.

---

## v1.6
_Date: 2026-04-19_

### Changes from v1.5

**allDayOnly filter fix**
`allDayOnly` state was absent from the `displayed` `useMemo` dependency array and from the page-reset `useEffect` in `page.tsx`. Added to both — filter now reacts immediately on toggle without requiring a page refresh.

**Quick sort always visible**
Removed the `{!filtersOpen && ...}` wrapper around the quick sort bar in `page.tsx`. Sort buttons (Fecha / Cliente / Tour / Pers.) are now always rendered regardless of whether the filter panel is open.

**Conflict notification banner**
`SimulateOTA.submit()` now reads the created booking's JSON response. If `status === "conflict"`, a dismissible purple banner is rendered above the "+ Nueva reserva" button. Auto-dismisses after 8 seconds via `setTimeout`. State: `conflictWarning: string | null`.

**Error banner UX**
- Added ✕ dismiss button to the `actionError` banner on the dashboard.
- `actionError` is now cleared in the filter/sort reset `useEffect` (alongside `setPage(1)`), so changing any filter removes stale error messages automatically.

**"Franja bloqueada" — Spanish error**
`POST /api/bookings/route.ts`: error string changed from `"Créneau bloqué"` to `"Franja bloqueada"`.

**Conflict color — purple**
All conflict status colors migrated from rose (`rose-*` Tailwind, `#f43f5e` hex) to purple (`purple-*`, `#a855f7`). Files affected: `BookingCard.tsx`, `page.tsx`, `calendar/page.tsx`, `Calendar.tsx`.

**Calendar side panel — conflict status**
`STATUS_STYLES` in `calendar/page.tsx` was missing a `conflict` entry, causing conflict bookings to fall back to `STATUS_STYLES.pending` (amber). Added `conflict: { label: "⚡ Conflicto", cls: "bg-purple-500/20 text-purple-400", border: "border-purple-500" }`. The fallback for unknown statuses now uses a neutral slate style instead of forcing "Pendiente".

**Calendar side panel — conflict actions**
`selected.status === "pending"` condition widened to `selected.status === "pending" || selected.status === "conflict"` so that Aceptar / Rechazar buttons are visible for conflict bookings in the side panel.

**Splash screen** (`src/components/SplashScreen.tsx`)
Client component mounted in `layout.tsx` (alongside `ThemeLoader`). Renders a fixed full-screen overlay using `var(--bg)` and `var(--accent)` — adapts to the active theme. Animation phases controlled by `useState` + `useEffect` timeouts:
- `0–600ms` : logo scales in (cubic-bezier spring) + fade in
- `600–1400ms` : hold; CSS `@keyframes horus-progress` fills the amber progress bar
- `1400–2000ms` : overlay fades out (`opacity: 0`, `transition 0.55s`)
- `2000ms` : component unmounts, `sessionStorage.setItem("horus-splash-done", "1")`

`sessionStorage` flag prevents the splash from replaying on in-app navigation. Replays only on new tab/session (intended for PWA cold start).

**Workflow d'implémentation et de versioning**

```
┌─────────────────────────────────────────────────────────────────┐
│                     DÉVELOPPEMENT                               │
│              (features, bugs, améliorations)                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  "version prête       │
              │   à tester"           │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  • Incrémenter vX.Y   │
              │    (non livrée)       │
              │  • MAJ suite de tests │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   Tests manuels       │  ◄── utilisateur
              └───────────┬───────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
           ✅ OK                   ❌ NOK
              │                       │
              ▼                       ▼
  ┌───────────────────┐   ┌───────────────────────┐
  │  "version stable" │   │  Correction des bugs  │
  └─────────┬─────────┘   └───────────┬───────────┘
            │                         │
            ▼                         ▼
  ┌───────────────────┐   ┌───────────────────────┐
  │ MAJ 6 fichiers :  │   │ • Incrémenter vX.Y    │
  │ • RELEASE_NOTES   │   │   (patch)             │
  │ • TECH_NOTES      │   │ • TESTS_PATCH_        │
  │ • README          │   │   v{ver}-{sujet}.txt  │
  │ • VersionFooter   │   └───────────┬───────────┘
  │ • package.json    │               │
  │ • BACKLOG         │               ▼
  └───────────────────┘   ┌───────────────────────┐
                          │   Tests patch manuels │  ◄── utilisateur
                          └───────────┬───────────┘
                                      │
                          ┌───────────┴───────────┐
                          │                       │
                       ✅ OK                   ❌ NOK
                          │                       │
                          ▼                       │
              ┌───────────────────┐               │
              │  "version stable" │       ┌───────┘
              └───────────────────┘       │ (nouveau cycle patch)
                                          └──────────────────────►
```

**Règles :**
- Jamais de "version stable" sans validation manuelle
- Jamais de patch sans `TESTS_PATCH_` ciblé sur les NOK
- Le numéro de version est incrémenté avant les tests, pas après

---

## v1.5
_Date: 2026-04-18_

### Changes from v1.4

**Color themes**
6 palettes defined as CSS custom properties (`--bg`, `--surface`, `--surface2`, `--border`, `--border2`, `--btn`, `--accent`, `--accent-fg`) in `globals.css`. Theme overrides target `[data-theme="id"]` and also override the most common hardcoded Tailwind classes (`bg-slate-800`, `bg-slate-900`, `bg-slate-700`, border variants) via `!important` to avoid refactoring all components.

FullCalendar buttons and "now" indicator follow `var(--accent)`.

**ThemeLoader** (`src/components/ThemeLoader.tsx`) — client component mounted in layout. Fetches `/api/settings` on mount and applies `data-theme` attribute on `<html>`. Also updates `localStorage` for subsequent page loads.

**No-flash script** — inline `<script>` in `<head>` reads `localStorage.getItem('horus-theme')` synchronously before browser paint and sets `data-theme` on `<html>`. Eliminates the flash of default theme on page navigation.

**Theme persistence** — selected theme stored in `Setting` table under key `theme.id`. Saved immediately on click in Admin, applied to `document.documentElement` without reload.

---

## v1.4
_Date: 2026-04-18_

### Changes from v1.3

**VersionFooter client component**
`src/components/VersionFooter.tsx` — composant `"use client"` extrait du layout. Remplace le `<span>` statique du footer par un `<button>` qui ouvre une modale contenant les release notes de toutes les versions. La modale est en bottom-sheet sur mobile (arrondie en haut), centrée sur desktop. Les release notes sont inlinées dans le composant (tableau `RELEASE_NOTES`). Fermable par clic sur × ou sur l'arrière-plan.

---

## v1.3
_Date: 2026-04-15_

### Changes from v1.2

**Champ téléphone (`phone`)**
Ajouté en `String?` au modèle `Booking`. Affiché sur BookingCard, panneau latéral du calendrier (lien `tel:`), formulaire de création. Présent dans les données de démo (seed).

**Recherche rapide calendrier (I1)**
Barre de recherche au-dessus du calendrier filtre les réservations par nom client, nom de tour ou code avant envoi au composant FullCalendar.

**Planning — bloquages multi-jours (I2)**
Fonction `groupBlockedSlots()` dans `planning/page.tsx` : regroupe les créneaux allDay consécutifs (même raison, jours adjacents) en une seule ligne avec affichage de la plage ("3 may – 14 may"). Les créneaux partiels restent individuels.

**Filtre statut calendrier (I3)**
Boutons Todos / Pendiente / Confirmada / Rechazada au-dessus du calendrier. Filtre les réservations passées au composant FullCalendar.

**Toggle jornada completa dashboard (I4)**
Case à cocher "☀ Solo jornada completa" dans le panneau de filtres du dashboard. Filtre la liste sur `b.allDay === true`.

**Pré-remplissage date formulaire blocage (I5)**
Le formulaire "Bloquear horario" se pré-remplit avec la date du mois/semaine visible dans la vue courante du calendrier, via le callback `onDateChange` propagé depuis `Calendar.tsx`.

**Création de réservation depuis le calendrier**
Clic sur un créneau horaire (vues semaine/jour) ouvre un formulaire de création de réservation pré-rempli avec la date et l'heure cliquées (arrondi à 30 min).

**`allDaySlot={false}`**
Supprime la ligne d'en-tête "all day" inutile dans les vues semaine/jour de FullCalendar.

**Labels événements sur deux lignes (vue semaine)**
`eventContent` personnalisé : ligne 1 = heure + code + drapeau, ligne 2 = titre avec `break-words`. Empêche le débordement sur la colonne suivante.

---

## v1.2
_Date: 2026-04-14_

### Changes from v1.1

**allDay conflict check**
`POST /api/bookings` and `PATCH /api/bookings/[id]`: if the new/confirmed booking is `allDay`, it conflicts with any confirmed booking that day. Conversely, if any confirmed booking is `allDay`, it blocks all other bookings on that day.

**allDay rendering in FullCalendar (week/day)**
allDay bookings are no longer mapped as `allDay: true` events. They are rendered as timed events from `${dateStr}T06:00:00` to `${dateStr}T22:00:00` with the status color. allDay blocked slots use the same approach with `#334155` background.

**Blocked slot color**
Unified to `backgroundColor: "#334155"` / `borderColor: "#64748b"` in FullCalendar week/day view. Previous `#1e293b` was indistinguishable from the dark theme background.

**Booking form time initialization**
`date` state initialized as `...slice(0, 10) + "T09:00"` instead of `toISOString().slice(0, 16)` — prevents current clock time from being silently used when user doesn't touch the time selector.

---

## v1.1
_Date: 2026-04-13_

### Changes from v1.0-Alpha

**Timezone fix for Gantt (`toLocalKey`)**
`toISOString()` returns UTC, which shifts dates stored at T12:00 back one day when the local timezone is UTC+. Replaced with a `toLocalKey(d: Date)` helper using `getFullYear/getMonth/getDate` throughout the Gantt rendering logic.

**Calendar state sync**
Two state systems coexist: `current` (year/month for the custom Gantt) and `fcDate` (FullCalendar API). The `datesSet` callback now updates both — `setFcDate(info.view.currentStart)` and `setCurrent({ year, month })` — so navigating in week/day view keeps the Gantt in sync when switching back to month view.

**Time selector cross-browser**
`<input type="time" step={1800}>` does not enforce 30-min steps in all browsers. Replaced with `<select>` generating options 06:00–21:30 in both the booking form (`page.tsx`) and the block form (`calendar/page.tsx`).

**ExternalRef removed from UI**
`externalRef` field (e.g. VIA-001) is stored in the DB but no longer displayed anywhere in the UI — not on booking cards, not in the calendar side panel. Only the auto-generated booking code (RCV, RC, RMV…) is visible.

---

## v1.0-Alpha
_Date: 2026-04-12_

### Stack
| Layer       | Technology                        |
|-------------|-----------------------------------|
| Framework   | Next.js 14 (App Router)           |
| Database    | PostgreSQL via Supabase            |
| ORM         | Prisma                            |
| Styling     | Tailwind CSS                      |
| Calendar    | FullCalendar (React wrapper)       |
| Flags       | flag-icons (SVG CSS library)       |
| PWA/Push    | web-push + VAPID                  |
| Hosting     | Vercel (planned)                  |

### Database models

**Booking**
```
id           String   @id @default(cuid())
source       String                          // viator | getyourguide | civitatis | wordpress | manual
guestName    String
guestEmail   String
tourName     String
date         DateTime
participants Int
duration     Int?                            // minutes, null if allDay
nationality  String?                         // ISO 3166-1 alpha-2
routeType    String?                         // corta | media | larga
allDay       Boolean  @default(false)
notes        String?
externalRef  String?
status       String   @default("pending")    // pending | confirmed | refused
createdAt    DateTime @default(now())
```

**BlockedSlot**
```
id        String   @id @default(cuid())
date      DateTime                           // stored at T12:00 for allDay (timezone safety)
duration  Int?                               // minutes, null if allDay
allDay    Boolean  @default(false)
reason    String?
createdAt DateTime @default(now())
```

**Log**
```
id        String   @id @default(cuid())
action    String                             // created | confirmed | refused | deleted
bookingId String?
details   String
createdAt DateTime @default(now())
```

### Key API routes
| Method | Route                  | Description                          |
|--------|------------------------|--------------------------------------|
| GET    | /api/bookings          | List bookings (filter: status, from, to) |
| POST   | /api/bookings          | Create booking (anti-overlap check)  |
| PATCH  | /api/bookings/[id]     | Accept or refuse (anti-overlap check)|
| DELETE | /api/bookings/[id]     | Delete one booking                   |
| DELETE | /api/bookings          | Delete all bookings                  |
| GET    | /api/blocked           | List all blocked slots               |
| POST   | /api/blocked           | Create blocked slot                  |
| DELETE | /api/blocked           | Delete all blocked slots             |
| DELETE | /api/blocked/[id]      | Delete one blocked slot              |
| POST   | /api/seed              | Load demo dataset                    |
| GET    | /api/logs              | List logs                            |
| DELETE | /api/logs              | Delete all logs                      |

### Key technical decisions

**Timezone fix for allDay**
All-day dates are stored at T12:00 local time (not T00:00) to prevent UTC offset from shifting the date back one day on any timezone.

**Anti-double-booking**
Checked at two points: POST /api/bookings (auto-refuses on overlap) and PATCH /api/bookings/[id] (blocks confirmation if conflict with another confirmed booking). Blocked slots are also checked on POST.

**FullCalendar navigation**
Programmatic navigation uses `useRef<FullCalendarType>` + `fcRef.current.getApi().changeView()` / `.prev()` / `.next()`. The `datesSet` callback keeps the toolbar title in sync.

**Booking code format**
`"R" + routeChar (C/M/L or "") + sourceChar (first letter uppercase, empty for WordPress)`

**Flag rendering**
Uses `flag-icons` CSS library (SVG backgrounds) instead of Unicode emoji — required for Windows 10 compatibility which does not render regional indicator emoji.

### Deployment & mobile testing

**Option 1 — Vercel (recommended, permanent)**
1. Go to vercel.com → sign in with GitHub
2. `Add New Project` → import `Alexsky00/Horus`
3. Next.js detected automatically
4. Add environment variables (same as `.env.local`)
5. Click `Deploy` → generates a public URL

**Live URL:** https://horus-kvvgf4ubm-horus-6a1fbd1d.vercel.app/

Every `git push` triggers an automatic redeploy.

**Option 2 — ngrok (quick, temporary)**
```bash
# Terminal 1
npm run dev

# Terminal 2
npx ngrok http 3000
```
Generates a temporary public URL valid while the PC is running. URL changes on each restart.

| | Vercel | ngrok |
|---|---|---|
| Permanent URL | ✅ | ❌ |
| PC must be on | ❌ | ✅ |
| Auto-deploy on push | ✅ | ❌ |
| Best for | Remote testers | Quick local tests |

### Environment variables required
```
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_MAILTO=
```
