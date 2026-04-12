# Horus — Technical Notes

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

### Environment variables required
```
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_MAILTO=
```
