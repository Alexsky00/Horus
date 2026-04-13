# Horus — Technical Notes

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
2. `Add New Project` → import `arrondiko/Horus`
3. Next.js detected automatically
4. Add environment variables (same as `.env.local`)
5. Click `Deploy` → generates a public URL (e.g. `horus-xxx.vercel.app`)

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
