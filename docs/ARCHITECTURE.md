# Architecture

## Overview

The app is a **single Next.js 14 (App Router) project**: the React 18 UI, the
API route handlers, and authentication all live in one codebase and deploy once
to Vercel. There is no separate backend and no CORS — the browser, the API, and
auth are all served from the same origin.

```
Browser
  │
  ▼
Next.js 14 app (Vercel)  ── single deployment, same origin ──┐
  ├── UI pages (React 18, App Router)                        │
  │     ├── AuthContext (backed by Auth.js)                  │
  │     ├── useFavorites hook                                │
  │     └── lib/api.js (same-origin fetch client)            │
  │                │                                         │
  │                ▼                                         │
  ├── /api route handlers                                    │
  │     ├── /api/psychologists                               │
  │     ├── /api/appointments                                │
  │     ├── /api/me                                          │
  │     ├── /api/register                                    │
  │     └── /api/auth/[...nextauth]  (Auth.js)               │
  │                │                                         │
  │                ▼                                         │
  └── Prisma 5 ──────────────────────────────────────────────
                   │
                   ▼
          Neon (serverless PostgreSQL)
```

Request flow: **Browser → Next.js (UI pages + `/api` route handlers) on Vercel →
Prisma → Neon PostgreSQL.**

> ### Before (Strapi) — history
>
> The project originally ran as **two independent deployments**:
>
> ```
> Browser
>   │
>   ├── React SPA (Vite) on Vercel
>   │     ├── AuthContext
>   │     ├── useFavorites hook
>   │     └── strapi.js (Axios API client)
>   │                │
>   │                ▼  (cross-origin → CORS)
>   └── Strapi v5 REST API (Strapi Cloud)
>         ├── /api/psychologists
>         ├── /api/appointments
>         └── /api/users/me
>                 │
>                 ▼
>             PostgreSQL
> ```
>
> Flow: **Browser → React SPA (Vite) on Vercel → (CORS) → Strapi v5 on Strapi
> Cloud → PostgreSQL.** Auth used Strapi's Users & Permissions JWT (Bearer token).
> Because frontend and backend lived on different origins, **CORS** had to be
> configured in the Strapi `config/middlewares.ts`.
>
> **What changed and why:** the two deployments were merged into one Next.js app.
> This removed the cross-origin boundary (no CORS), collapsed the request path,
> and replaced Strapi Cloud + its managed database with Prisma talking directly
> to Neon. See [Migration: what changed and why](#migration-what-changed-and-why)
> for the full rationale.

---

## Frontend

**Framework:** React 18 on Next.js 14 (App Router)
**Routing:** Next.js App Router (with a thin compatibility shim — see below)
**Styling:** CSS Modules + global CSS custom properties
**HTTP client:** native `fetch` (same-origin)

### Data layer (`src/lib/api.js`)

`src/lib/api.js` **replaces the old `src/strapi/strapi.js`** and keeps the **same
function signatures**, so call sites were largely untouched. It uses same-origin
`fetch` with `credentials: 'same-origin'`, which means the **Auth.js session
cookie is sent automatically**. The legacy `jwt`/`token`/`email` parameters are
still accepted for compatibility but are ignored.

Because the API now lives in the same Next.js app (no sleeping external backend),
the old cold-start machinery is gone: there is no 45s timeout and no GET
auto-retry interceptor. Neon resumes from idle in roughly half a second.

> ### Before (Strapi) — history
>
> The old client `src/strapi/strapi.js` was a single Axios instance that wrapped
> all backend calls, with two notable behaviours:
>
> - **Cold-start tolerance.** Strapi Cloud (free tier) slept after inactivity;
>   the first request could take ~20–30s to wake up. The instance used a **45s
>   timeout** and a **response interceptor that auto-retried GET requests** (up to
>   3×, exponential backoff: 1.5s → 3s → 6s) on network errors, timeouts, or
>   `5xx` responses. Retries were limited to GET so `POST`/`DELETE` were never
>   repeated (e.g. no double-booked appointments).
> - **Fail-fast on misconfiguration.** If `VITE_STRAPI_URL` was missing, the
>   module threw at import time instead of silently building `undefined/api/...`
>   URLs.
>
> Both concerns disappear with the same-origin, single-deploy model.

### State management

No external state library. State is split across:

| Layer | What it holds |
|---|---|
| `AuthContext` | `user`, `token` (now always `null`), `favorites[]`, `setFavorites`, `login`, `register`, `logout`, `deleteAccount` |
| `useFavorites` hook | Reads/writes favorites via context + `lib/api.js` |
| Local component state | UI state (modals, filters, loading, selected date/time) |

`src/context/AuthContext.jsx` keeps the **same public shape** as before, so
consumers did not change. Internally it is now backed by **Auth.js**
(`useSession` / `signIn` / `signOut`) instead of manual JWT handling. The `token`
field is preserved in the shape but is always `null`, because the session now
lives in a cookie rather than in a JS variable.

> **Login now persists across reloads.** Because Auth.js stores the session in a
> secure cookie, refreshing the page keeps the user logged in.
>
> ### Before (Strapi) — history
>
> Auth was **in-memory only**. The Strapi JWT was never written to
> `localStorage`; on page refresh the user was logged out, and any existing
> `localStorage` keys were actively cleared on app mount. The persistent
> cookie-based session is one of the main improvements of the migration.

### Routing

`react-router` has been removed. To avoid rewriting every navigation call site, a
**tiny shim** at `src/lib/router.jsx` re-exports `Link`, `NavLink`, and
`useNavigate` on top of `next/navigation` / `next/link`. Existing components only
had to change their **import path** (from `react-router-dom` to `@/lib/router`);
the props (`to`, `end`, function `className`, `replace`) still behave the same.

App Router pages live under `src/app/`:

| Path | App Router file | Auth required |
|---|---|---|
| `/` | `src/app/page.jsx` | No |
| `/psychologists` | `src/app/psychologists/page.jsx` | No |
| `/favorites` | `src/app/favorites/page.jsx` | Yes → redirects to `/` |
| `/privacy` | `src/app/privacy/page.jsx` | No |
| `*` | `src/app/not-found.jsx` | No |

- `src/app/layout.jsx` is the **root layout** (HTML shell, fonts, metadata).
- `src/app/providers.jsx` is the client boundary that holds
  `SessionProvider` + `AuthProvider` and renders the shared chrome
  (`Header` / `Footer` / `CookieBanner`) around the routed page.

> **Note on `views/` vs `pages/`.** The former `src/pages/` directory was renamed
> to `src/views/`, because the name `pages/` collides with Next.js routing
> conventions. The route-level view components themselves are unchanged; the App
> Router pages above simply render them.

### Folder structure

```
src/
├── app/                # Next.js App Router (layout, pages, /api route handlers, providers)
│   ├── layout.jsx      # Root layout
│   ├── providers.jsx   # SessionProvider + AuthProvider + Header/Footer/CookieBanner
│   ├── page.jsx        # Home
│   ├── psychologists/  # /psychologists
│   ├── favorites/      # /favorites (protected)
│   ├── privacy/        # /privacy
│   ├── not-found.jsx   # 404
│   └── api/            # Route handlers (psychologists, appointments, me, register, auth)
├── components/         # Reusable UI pieces (each with its own CSS module)
├── context/            # React context providers (AuthContext)
├── hooks/              # Custom hooks
├── views/              # Route-level view components (formerly src/pages/)
├── data/
│   └── psychologists.json  # Seed source
├── lib/
│   ├── api.js          # Same-origin data layer (replaces strapi/strapi.js)
│   ├── auth.js         # Auth.js (NextAuth) config
│   ├── prisma.js       # PrismaClient singleton
│   ├── router.jsx      # react-router → next/navigation compatibility shim
│   ├── serialize.js    # Adds id / documentId / strapiId to records
│   └── availability.js # Slot generation and working-hours logic
└── utils/
```

> ### Before (Strapi) — history
>
> ```
> src/
> ├── components/
> ├── context/
> ├── hooks/
> ├── pages/              # Route-level page components (now src/views/)
> ├── utils/
> │   └── availability.js
> └── strapi/strapi.js    # All Strapi API calls (now src/lib/api.js)
> ```

---

## Backend

The backend is now a set of **Next.js API route handlers** under `src/app/api/`,
talking to **Neon PostgreSQL via Prisma 5**. There is no standalone server
process and no admin panel.

**Runtime:** Next.js route handlers (Vercel functions)
**ORM:** Prisma 5
**Database:** Neon (serverless PostgreSQL)

### Database & Prisma

- Models are defined in **`prisma/schema.prisma`**: `User`, `Psychologist`,
  `Appointment`.
- The DB is seeded by **`prisma/seed.js`** from **`src/data/psychologists.json`**.
- A **`PrismaClient` singleton** lives in **`src/lib/prisma.js`** — it reuses one
  client across hot reloads / serverless invocations to avoid exhausting
  database connections.

Prisma field names are **snake_case to match the UI** (a shape inherited from
Strapi), so most API responses are a direct spread with no remapping. Two notable
differences from the old schema:

- A `published` boolean **replaces Strapi's Draft & Publish** mechanism.
  Applications start with `published` controlling public visibility.
- `src/lib/serialize.js` adds `id`, `documentId`, and `strapiId` onto each record
  (all derived from the numeric primary key), so the frontend — which still reads
  all three — keeps working unchanged.

#### Models (`prisma/schema.prisma`)

**User** — `id`, `email` (unique), `username`, `passwordHash`, `psy_favorites`
(JSON), `psy_dismissed_reviews` (JSON), `createdAt`. The favorites/dismissed
fields are JSON arrays of psychologist ids — the same shape the Strapi user
fields used.

**Psychologist** — `id`, `name`, `surname`, `avatar`, `experience`, `license`,
`specialization`, `initial_consultation`, `about`, `rating`, `price_per_hour`,
`popular`, `reviews` (JSON), `isAvailable`, `availability` (JSON), `user_email`
(owner of the profile, for applications), `published`, `createdAt`.

**Appointment** — `id`, `patient_name`, `phone`, `email`, `time_slot`
(`"YYYY-MM-DD HH:MM"`), `comment`, `psychologist_id`, `psychologist_name`,
`createdAt`. Indexed on `email` and `psychologist_id`.

### Authentication (Auth.js v5)

Auth is handled by **Auth.js v5 (NextAuth)** using a **Credentials provider**
(email/password) with the **JWT session strategy** and **bcryptjs** for password
hashing. No adapter tables are needed.

| Concern | Location |
|---|---|
| Auth config (`handlers`, `signIn`, `signOut`, `auth`) | `src/lib/auth.js` |
| NextAuth route handler | `src/app/api/auth/[...nextauth]/route.js` |
| Sign-up endpoint | `src/app/api/register/route.js` |

The session is stored in a **secure cookie**, so the **login persists across page
reloads** — the key UX improvement over the old in-memory Strapi JWT.

> ### Before (Strapi) — history
>
> **Framework:** Strapi v5
> **Database:** SQLite (local dev) / PostgreSQL (production on Strapi Cloud)
>
> Content was modelled as Strapi content types:
>
> - **Psychologist** — collection type with **Draft & Publish** enabled. New
>   applications were created as **drafts** via `POST /api/psychologists?status=draft`,
>   and an **admin had to manually review and publish** each draft before the
>   profile became publicly visible.
> - **Appointment** — collection type, no Draft & Publish. `time_slot` stored
>   date + time as a single string `"YYYY-MM-DD HH:MM"`.
> - **User (extended)** — Strapi's built-in Users & Permissions user, extended
>   with a `psy_favorites` JSON field (array of psychologist `strapiId` strings).
>
> Auth used **Strapi Users & Permissions JWT** (Bearer token).
>
> There was also a **custom route** `POST /api/psychologists/:id/toggle-favorite`,
> handled by a custom controller method `toggleFavorite` in
> `backend/src/api/psychologist/controllers/psychologist.ts`, which added/removed
> the psychologist id in the user's `psy_favorites` array and returned
> `{ isFavorite: boolean }`. The equivalent behaviour now lives in the
> `/api/psychologists/:id/toggle-favorite` route handler.

---

## Migration: what changed and why

| Area | Before (Strapi) | Now (Next.js) |
|---|---|---|
| Deployments | Two (Vite SPA on Vercel + Strapi on Strapi Cloud) | One Next.js app on Vercel |
| Request path | Browser → SPA → (CORS) → Strapi → PostgreSQL | Browser → Next.js (UI + `/api`) → Prisma → Neon |
| CORS | Configured in Strapi `config/middlewares.ts` | None (same origin) |
| Database | Strapi-managed PostgreSQL | Neon serverless PostgreSQL via Prisma 5 |
| Auth | Strapi U&P JWT (Bearer, in-memory) | Auth.js v5 (Credentials + JWT cookie) |
| Login persistence | Lost on refresh (in-memory) | Persists (secure cookie) |
| Cold start | ~20–30s (Strapi Cloud free tier asleep), mitigated by UptimeRobot pings + GET retry | ~0.5s (Neon resume); no UptimeRobot, no retry logic |
| Visibility control | Draft & Publish workflow | `published` boolean |
| Data client | `src/strapi/strapi.js` (Axios) | `src/lib/api.js` (fetch) |
| Routing | React Router v6 | Next.js App Router (+ `src/lib/router.jsx` shim) |

**Benefits of the new architecture:**

- **€0 cost** — Vercel + Neon free tiers, no paid Strapi Cloud.
- **Single deploy** — one project, one build, one set of env vars.
- **No CORS** — frontend and API share an origin.
- **No cold-start workaround** — Neon resumes in ~0.5s, so UptimeRobot pings and
  the GET auto-retry interceptor are no longer needed.
- **Persistent login** — cookie-based Auth.js session survives reloads.
- **Zero maintenance** — no separate backend to patch, host, or keep awake.

---

## Key design decisions

### `time_slot` as a combined string

`time_slot` stores date + time together as a single string
(`"YYYY-MM-DD HH:MM"`). Slot availability is checked by passing
`psychologist_id` + `date` to `GET /api/appointments`, and the response is mapped
to extract the `HH:MM` portion to mark slots as booked.

> ### Before (Strapi) — history
>
> Strapi Cloud did not allow schema changes in production, so a separate `date`
> field could not be added — date and time were stored together in the existing
> `time_slot` field. Availability was checked with Strapi's `$contains` filter:
>
> ```
> GET /api/appointments?filters[psychologist_id][$eq]=xxx&filters[time_slot][$contains]=2025-06-15
> ```
>
> The combined-string format was kept after the migration so the frontend parsing
> logic did not have to change.

### Favorites stored as JSON on the User

Favorites are stored as a plain JSON array of ids on the user record
(`psy_favorites`). Reads and writes go through the
`/api/psychologists/:id/toggle-favorite` route handler.

> ### Before (Strapi) — history
>
> Strapi v5 did not easily support many-to-many relations between content types
> and Users without custom plugin work, so favorites were stored as a JSON array
> of `strapiId` strings on the user and toggled through the custom
> `toggle-favorite` controller. The JSON-on-user shape was preserved in the
> Prisma `User.psy_favorites` field so no data reshaping was needed.

### Availability system

Each psychologist has an `availability` JSON field that defines their weekly
working hours and session duration:

```json
{
  "monday":    { "enabled": true,  "start": "09:00", "end": "17:00" },
  "tuesday":   { "enabled": true,  "start": "09:00", "end": "17:00" },
  "wednesday": { "enabled": true,  "start": "09:00", "end": "17:00" },
  "thursday":  { "enabled": true,  "start": "09:00", "end": "17:00" },
  "friday":    { "enabled": true,  "start": "09:00", "end": "17:00" },
  "saturday":  { "enabled": false, "start": "10:00", "end": "14:00" },
  "sunday":    { "enabled": false, "start": "10:00", "end": "14:00" },
  "slot_duration": 60
}
```

The utility functions in `src/lib/availability.js` handle:

| Function | Purpose |
|---|---|
| `parseAvailability(raw)` | Parses the JSON field, merges with defaults |
| `isWorkingDay(isoDate, availability)` | Returns `true` if that date is a working day |
| `generateSlots(isoDate, availability)` | Returns `["09:00", "10:00", ...]` for that date |
| `generateTimeOptions()` | Returns all 30-min options from 06:00–22:00 for the editor |

If a psychologist has no `availability` set, the default schedule is used
(Mon–Fri 09:00–17:00, 60 min slots).

The `AppointmentModal` uses these functions to:
1. Disable non-working days in the `MiniCalendar`
2. Show only the slots within the psychologist's working hours for the selected date

The `AvailabilityEditor` component lets psychologists set their schedule when
applying via `ApplyModal`.

> Historically, `availability.js` lived in `src/utils/`; it now lives in
> `src/lib/`.

### Application visibility workflow for psychologists

```
Psychologist fills ApplyModal
        │
        ▼
POST /api/psychologists  (route handler → Prisma)
        │
        ▼
Psychologist row created with `published` controlling public visibility
        │
        ▼
Appears on /psychologists when published
```

> ### Before (Strapi) — history
>
> Visibility was driven by Strapi's **Draft & Publish**:
>
> ```
> Psychologist fills ApplyModal
>         │
>         ▼
> POST /api/psychologists?status=draft
>         │
>         ▼
> Entry created as DRAFT (not visible to public)
>         │
>         ▼
> Admin reviews in Strapi admin panel
>    ┌────┴────┐
> Approve     Reject
>    │           │
> Publish     Delete
>    │
>    ▼
> Profile visible on /psychologists
> ```
>
> The Prisma `published` boolean replaces this draft/publish state.

### Client-side filtering, sorting and "Load more"

Filtering, sorting, search, and the "Load more" button on `/psychologists` all
run **client-side** on the already-fetched list (the view slices the array;
`PAGE_SIZE = 3`). A single fetch up front keeps interactions instant.

`getPsychologists()` returns the **full** list. If the dataset ever grows into
the hundreds/thousands, move filtering/pagination server-side in the
`/api/psychologists` route handler.

> ### Before (Strapi) — history
>
> The same client-side approach was used, but it was also a deliberate fit for
> the **sleeping backend**: one fetch up front avoided hitting a cold-starting
> Strapi on every filter change, and `getPsychologists()` had to page through all
> results rather than relying on Strapi's default 25-record page. With Neon's fast
> resume this is now purely a UX/dataset-size choice rather than a cold-start
> workaround.

### `documentId` vs numeric `id`

The frontend still reads `id`, `documentId`, and `strapiId`. These are now all
derived from the numeric Prisma primary key in `src/lib/serialize.js`:

```js
// src/lib/serialize.js
{
  ...p,
  id: p.id,                 // numeric primary key
  documentId: String(p.id), // used for API calls (routes)
  strapiId: String(p.id),   // used for favorites matching
}
```

> ### Before (Strapi) — history
>
> Strapi v5 used a UUID-based `documentId` as the primary identifier for REST API
> calls (`GET /api/psychologists/:documentId`), while the legacy numeric `id` was
> used internally. The frontend kept both (`id: item.documentId`,
> `strapiId: String(item.id)`). After the migration these three identifiers are
> all backed by the single Prisma `id`, but the triple is preserved so call sites
> did not change.
