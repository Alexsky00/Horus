# Horus — Release Notes

---

## v1.0-Alpha
_Release date: 2026-04-12_
_Status: Internal alpha — manual testing in progress_

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
