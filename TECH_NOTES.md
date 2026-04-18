# Horus — Technical Notes

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
