# Horus — OCTO Connectivity

Horus implements the **[OCTO](https://octo.travel) Core specification** (Open Connectivity for Tours, Activities & Attractions) as a **supplier**.

Resellers (Civitatis, Viator, GetYourGuide, Klook…) call Horus to read availability and create bookings. No manual data entry.

---

## Endpoint

```
Base URL:  https://<your-horus-domain>/api/octo
Auth:      Authorization: Bearer <api-key>
Headers:   Content-Type: application/json
           Octo-Capabilities: octo/pricing
```

API keys are generated in **Admin → Conexión OCTO → Claves de revendedor**. One key per reseller — revoking one does not affect the others.

## Implemented endpoints (OCTO Core, complete)

| Method | Path | Purpose |
|--------|------|---------|
| `GET`   | `/supplier` | Supplier identity and contact |
| `GET`   | `/products` | Bookable catalogue |
| `GET`   | `/products/{id}` | Single product |
| `POST`  | `/availability/calendar` | One object per day (date picker) |
| `POST`  | `/availability` | One object per departure — returns `availabilityId` |
| `POST`  | `/bookings` | Place a hold (`ON_HOLD`) |
| `POST`  | `/bookings/{uuid}/confirm` | Finalise the sale |
| `POST`  | `/bookings/{uuid}/cancel` | Cancel |
| `POST`  | `/bookings/{uuid}/extend` | Extend the hold |
| `PATCH` | `/bookings/{uuid}` | Modify (slot, units, contact) |
| `GET`   | `/bookings/{uuid}` | Read one |
| `GET`   | `/bookings` | List, filterable |

**Capabilities:** `octo/pricing`. Content, pickups, dropoffs and notifications are not implemented (optional in the spec).

---

## Availability model

Horus is the reservation system of a **single guide**. Two rules follow, and they are the whole design:

**1. One tour at a time.** A departure slot is unsellable if *any* booking overlaps it — whatever the tour. The guide cannot be in two places. Selling a 09:00–11:00 tour therefore closes every other tour overlapping that window, not just that one.

**2. A departure is shared.** Several customers can join the *same* departure (same tour, same start time) until `capacity` is reached. This is what makes a tour sellable more than once.

Also closed: manually blocked slots (holidays, vehicle servicing), all-day bookings, and anything past the booking cutoff.

A **hold** (`ON_HOLD`) occupies the slot exactly like a confirmed booking, so two resellers cannot sell the same seat concurrently. It is released automatically when it expires.

## Products, options, units

Each Horus tour maps to one OCTO product with a **single option** (`DEFAULT`).

Units depend on the tour's pricing mode:

| Horus `pricingMode` | OCTO unit | `paxCount` | Meaning |
|---------------------|-----------|-----------|---------|
| `person` | `ADULT` | 1 | Reseller books N units for N travellers |
| `group` | `OTHER` ("Grupo privado") | `capacity` | Whole tour sold once (`maxQuantity: 1`) |

The `group` mapping matters: without it, a €250 private tour would be billed €250 × number of travellers.

Prices follow OCTO convention — integers in minor units (€60.00 → `6000`, `currencyPrecision: 2`).

## Configuration

Per tour, in **Admin → Catálogo → ✎**:
- **Venta automática** — exposes the tour to resellers. Off by default; a tour is never sellable by accident.
- **Plazas por salida** — capacity of one departure.
- **Horas de salida** — e.g. `09:00, 15:00`.

Globally, in **Admin → Conexión OCTO**:
- Supplier identity (name, email, phone, website, address) — returned by `GET /supplier`.
- **Cierre de venta** — hours before departure after which the slot closes (default 2).
- **Límite de cancelación** — hours before departure after which cancellation is refused (default 24).
- **Duración del bloqueo** — default hold lifetime in minutes (default 30).

## Time zones

Availability is computed in the supplier's local time zone (`Europe/Madrid` by default) with **DST handled**: `09:00` is `+02:00` in July and `+01:00` in January. `availabilityId` carries the offset explicitly, e.g. `2026-07-21T09:00:00+02:00`.

## Errors

Per the spec, business errors return **HTTP 400** with `{ error, errorMessage }` plus the offending value:

```json
{ "error": "INVALID_PRODUCT_ID", "errorMessage": "The Product ID was invalid or missing", "productId": "abc" }
```

`UNAUTHORIZED` → 401 (no token). `FORBIDDEN` → 403 (unknown or revoked token).

---

## Booking flow

```
POST /availability          → availabilityId
POST /bookings              → ON_HOLD   (slot reserved, guide not notified)
POST /bookings/{uuid}/confirm → CONFIRMED (sale done, guide notified by push)
```

`POST /bookings` is **idempotent on `uuid`**: replaying the request returns the existing booking rather than creating a second one.

### Example

```bash
curl -X POST https://<host>/api/octo/availability \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -H "Octo-Capabilities: octo/pricing" \
  -d '{"productId":"<id>","optionId":"DEFAULT","localDateStart":"2026-08-14","localDateEnd":"2026-08-14"}'

curl -X POST https://<host>/api/octo/bookings \
  -H "Authorization: Bearer <key>" -H "Content-Type: application/json" \
  -d '{"productId":"<id>","optionId":"DEFAULT","availabilityId":"2026-08-14T09:00:00+02:00",
       "unitItems":[{"unitId":"<id>_ADULT"},{"unitId":"<id>_ADULT"}]}'

curl -X POST https://<host>/api/octo/bookings/<uuid>/confirm \
  -H "Authorization: Bearer <key>" -H "Content-Type: application/json" \
  -d '{"resellerReference":"CIV-12345",
       "contact":{"firstName":"Marta","lastName":"Gómez","emailAddress":"marta@example.com"}}'
```

---

## Consequences inside Horus

Connecting a platform changes how the guide works, and this is deliberate:

- A booking sold through OCTO is **not** submitted for approval. It is already paid on the platform. There is no Aceptar / Rechazar.
- Such a booking **cannot be refused or deleted** from Horus (both return `409`). Cancelling must originate from the reseller, otherwise Horus and the platform would silently diverge and the customer would still show up.
- Horus becomes the **source of truth** for availability. If a slot is wrong in Horus, it is wrong on every connected platform.

## Testing without touching production

Local development points at the **same Supabase database as production** — there is no second database. Testing "locally" therefore writes to real data.

To get real isolation at no cost, Horus ships a **sandbox**: a separate Postgres schema (`horus_sandbox`) inside the same Supabase database, with its own tables. Same server, zero infrastructure, no contact whatsoever with the `public` schema that holds production.

```bash
npm run sandbox:setup   # creates the schema, a 3-tour test catalogue and a reseller key
npm run sandbox:dev     # runs Horus against it on http://localhost:3100
npm run sandbox:check   # full OCTO diagnostic, booking cycle included
npm run sandbox:reset   # drops the sandbox entirely
```

The test catalogue is built to exercise the tricky rules: two tours whose departures **overlap on purpose** (09:00/2h vs 10:00/3h) so the "one tour at a time" rule can be verified, plus one group-priced private tour.

### Diagnosing a real instance

`octo-check` also runs against any deployed instance, read-only unless `--booking` is passed:

```bash
npm run octo:check -- --url https://<your-domain> --key hor_xxx
npm run octo:check -- --url https://<your-domain> --key hor_xxx --booking  # creates then cancels a test booking
```

It reports what a reseller would actually see: whether the key works, whether the supplier identity is complete, which tours are exposed, how many departures are sellable, and whether a booking can be held, confirmed and cancelled.

## Self-certification

The spec is open and free to implement, and OCTO provides a free automated compliance test at **[certify.octo.travel](https://certify.octo.travel)** — no reseller agreement required. Run it against a deployed Horus instance to obtain a public certificate, then approach the platform with it in hand.
