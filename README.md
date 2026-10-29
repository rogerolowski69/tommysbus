# Tommy's Bus — regional shuttle & charter website (demo MVP)

**Your Ride Across Central Florida.** A locally runnable demonstration of a booking website for a
regional shuttle and charter company serving Palatka, Ocala, Orlando and Central/Northeast Florida
(`tommysbus.com`).

> **Everything here is demonstration data.** Schedules, stops, fares, vehicle capacities, contact
> details, testimonials and reservations are placeholders pending operator validation. No payments
> are taken, and bookings are always marked **DEMO / NOT PAID**. No airport pickup authorization is
> implied (MCO is drop-off only).

## What's included

| Area | Highlights |
|---|---|
| **Pages** | Home (hero search, featured routes, local trips, charter promo, labelled-fictional testimonials, FAQ), Routes & Schedules (searchable cards + timetables), Fares, Pickup Locations, **Local Trips** (medical-appointment rides to Gainesville/Jacksonville, grocery & pharmacy runs to Crescent City/Palatka, Walmart/shopping trips, hire by the hour), Private Charters, About, Contact, FAQ |
| **Booking wizard** (`/book`) | 1 Trip → 2 Departure (live seats, durations, fares) → 3 Passenger → 4 Review (server-computed price, terms) → 5 Confirmation (reference, DEMO/NOT PAID, print, cancel) |
| **Django API** | Versioned REST endpoints, OpenAPI schema + Swagger UI, admin for every model |
| **Safety** | Row-locked seat allocation (no overselling under concurrency), idempotent booking creation, booking state machine, token-protected booking lookup, rate limits, PII-redacting logs |

## Stack

- **Frontend** — Next.js 16 App Router (TypeScript strict, Cache Components / partial prerendering), Tailwind CSS v4, shadcn/ui + Radix, Lucide, React Hook Form + Zod, Zustand (wizard state, memory only), TanStack Query, typed client generated from OpenAPI (`openapi-typescript` + `openapi-fetch`), Playwright.
- **Backend** — Python 3.12, Django 5.2 LTS, Django REST Framework, django-filter, drf-spectacular, django-environ, WhiteNoise, PostgreSQL 17, pytest + pytest-django, uv.

```
tommysbus/
  apps/
    api/                      Django project
      config/settings/        base · dev · test · prod
      apps/{core,locations,routes,schedules,pricing,bookings,charters,customers}
      tests/                  pytest (incl. real-Postgres concurrency tests)
      schema.yaml             generated OpenAPI schema
    web/                      Next.js app
      src/app/                pages (RSC by default)
      src/components/{booking,layout,routes,home,charters,shared,ui}
      src/features/           TanStack Query hooks + booking helpers
      src/lib/{api,validation} typed API clients, Zod schemas
      src/stores/             Zustand booking store
      e2e/                    Playwright specs
  infra/compose.yaml          Postgres (+ optional api/web containers)
  justfile                    common tasks (`just` lists them)
  .env.example
```

## Quick start (local development)

Prerequisites: [`just`](https://github.com/casey/just), `uv`, Node 22+ with `pnpm`, and Docker or Podman with compose.
Recipes default to `podman compose`; for Docker run `COMPOSE="docker compose -f infra/compose.yaml --env-file .env" just db`.

```bash
just setup        # installs deps; creates .env with a random DJANGO_SECRET_KEY
just db           # PostgreSQL on 127.0.0.1:5442
just migrate
just seed         # fictional demo data (`just seed --reset` to wipe and reseed)
just api          # terminal 1 → http://127.0.0.1:8000
just web          # terminal 2 → http://localhost:3000
```

Create an admin login (no default credentials are shipped):

```bash
just superuser
```

| URL | What |
|---|---|
| http://localhost:3000 | Website |
| http://127.0.0.1:8000/admin/ | Django admin (path set by `DJANGO_ADMIN_URL`) |
| http://127.0.0.1:8000/api/docs/ | Swagger UI |
| http://127.0.0.1:8000/api/schema/ | OpenAPI schema |
| `/healthz` (both apps), `/readyz` (API, checks DB) | Health checks |

### Everything in containers

```bash
just up      # builds api + web images, starts db/api/web; the API migrates and seeds on start
just down
```

### Public test URL (Cloudflare quick tunnel)

Share the containerised stack on a temporary `https://<random>.trycloudflare.com` URL. You don't need a
Cloudflare account or a domain:

```bash
just up                                            # production containers on :3000 / :8000
cloudflared tunnel --url http://localhost:3000     # prints the public URL (host cloudflared)
# or, without installing cloudflared:
just tunnel                                        # runs cloudflared as a container, then prints the URL
```

Only the website is exposed. Django's admin and API docs are not reachable through the tunnel. The
URL changes on every restart, quick tunnels have no uptime guarantee, and this machine must stay on.
For a stable URL, use a named tunnel on a domain you own.

## Testing & checks

```bash
just test    # 43 pytest tests: pricing, booking lifecycle, API, security, concurrency
just check   # ruff + pyright (backend), eslint + tsc (frontend)
just e2e     # Playwright (desktop + mobile): booking end-to-end, cancel, token protection,
             # validation, hourly-hire request, route search
```

Backend tests need the database running (`just db`). The concurrency tests use real threads
against PostgreSQL to show that concurrent bookings never oversell a departure and that
retries with the same idempotency key create exactly one booking. E2E tests need the API running with seed data;
the Next.js dev server starts automatically. First-time Playwright setup: `cd apps/web && pnpm exec playwright install chromium`, or use an installed
Google Chrome with `E2E_CHANNEL=chrome just e2e`.

## API

| Method & path | Notes |
|---|---|
| `GET /api/v1/locations/` | Active stops (`?city=`, `?allows_pickup=`) |
| `GET /api/v1/routes/` | Routes with fares and typical departure times (`?search=`, `?origin__slug=`) |
| `GET /api/v1/trips/?origin=&destination=&date=` | Bookable departures with live `seats_remaining` |
| `GET /api/v1/fares/` | Per-route fares incl. server-computed round-trip price |
| `GET /api/v1/pricing-policy/` | Discounts, baggage rules, hourly rate |
| `POST /api/v1/quotes/` | Server-side price breakdown for a selection |
| `POST /api/v1/bookings/` | Requires `Idempotency-Key: <uuid>`; returns the booking + one-time `access_token` |
| `GET /api/v1/bookings/{reference}/` | Requires `X-Booking-Token` header |
| `POST /api/v1/bookings/{reference}/cancel/` | Requires `X-Booking-Token` header |
| `POST /api/v1/charter-inquiries/` | Charter, medical ride, grocery/pharmacy, shopping or hourly-hire request (`service_type`) |

The frontend's typed client is generated from the schema: `just schema`.

## How the important parts work

- **Business logic lives in services** (`apps/*/services.py`), not in views or React components.
- **Seat inventory** — `create_booking` locks the trip rows (`SELECT … FOR UPDATE`, in stable id order
  so round trips can't deadlock), re-counts occupied seats (CONFIRMED + unexpired HELD), then writes.
  A database `CHECK` guarantees `passenger_count = adults + children`.
- **State machine** — `DRAFT → HELD → CONFIRMED → CANCELLED`, plus `HELD → EXPIRED/CANCELLED`. Online
  bookings are created **HELD** for `BOOKING_HOLD_MINUTES` (default 60). Lapsed holds stop counting
  against capacity immediately, and `manage.py expire_holds` (run from cron) marks them EXPIRED. Staff confirm
  bookings in the admin ("Confirm — demo, no payment collected"). `is_paid` is always false.
- **Pricing** is calculated only on the server (`apps/pricing/services.py`). Any totals sent by a client are
  ignored. Fares, round-trip/group discounts, baggage allowance and the hourly rate are editable in the admin.
- **Booking privacy** — references (`TB-XXXXXX`) are not secrets. Reading or cancelling a booking needs a
  64-hex access token, and only its SHA-256 hash is stored. The confirmation URL carries the token in the
  `#fragment`, which browsers never send to servers. Unknown references and wrong tokens return the
  same 404.
- **Idempotency** — the client sends a UUID `Idempotency-Key`. A replay with the same body returns the original
  booking and token (HTTP 200). The same key with a different body returns 409.
- **No CORS needed** — the browser only talks to Next.js, which proxies `/api/v1/*` to Django. Without
  `django-cors-headers`, cross-origin browser calls to the API are refused by default.

## Security notes

- Secrets come from the environment (`.env`, git-ignored). `config.settings.prod` refuses weak or default secret keys and enables
  HTTPS redirect, HSTS, and secure, HttpOnly cookies.
- DRF throttles: anonymous 300/min, booking creation 20/hour, booking lookup/cancel 60/min, charter
  requests 10/hour, quotes 120/min. Behind a proxy, set `DJANGO_NUM_PROXIES` correctly; `1` is right for the Next.js rewrite.
  The default cache is per-process LocMem; use Redis for multiple workers in production.
- Session-authenticated (staff) API use is CSRF-protected. Public endpoints are read-only or create-only
  and need no session.
- Log records pass through a filter that redacts emails and phone numbers. Services log only booking
  references and counts.
- No card data is collected or stored. No payment provider is integrated.
- Demo pages send `noindex` until `ALLOW_INDEXING=true`, so placeholder content isn't indexed as a real service.

## Deployment notes

- API: `config.settings.prod` with gunicorn (see `apps/api/Dockerfile`; the entrypoint runs migrations).
  Set `DJANGO_SECRET_KEY`, `DATABASE_URL`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CSRF_TRUSTED_ORIGINS`, and a
  non-default `DJANGO_ADMIN_URL`. Leave `SEED_DEMO_DATA` unset outside demos.
- Web: `apps/web/Dockerfile` builds a standalone server. `API_INTERNAL_URL` is baked into the rewrites at
  build time.
- Schedule `python manage.py expire_holds` every few minutes.
- Before going live: replace placeholder stops, schedules, fares and contact details. Confirm permits,
  insurance and accessibility before advertising medical-appointment rides. Add a payment provider and
  customer notifications.
