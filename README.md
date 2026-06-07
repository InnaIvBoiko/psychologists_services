# psychologists.services

**Live demo:** [psychologists-services-98v1.vercel.app](https://psychologists-services-98v1.vercel.app)

> **Demo admin login** — to try the moderation tools (publish / edit / delete applications), log in with:
> **`admin@example.com`** · **`Password123!`** — then open the **Admin** link in the header.
> The login window also has a one-click **Fill in** button for these credentials.

A full-stack web application to browse and book sessions with licensed psychologists. Built as a **single Next.js app** (React UI + API routes + Auth.js) with **Prisma** over a **Neon PostgreSQL** database, deployed on **Vercel**.

> **Note (June 2026):** the backend was migrated **from Strapi v5 to Next.js + Prisma + Neon + Auth.js**. The user-facing app is unchanged. See [Migration: from Strapi to Next.js](#migration-from-strapi-to-nextjs) for what changed and why.

---

## Features

- **Browse Psychologists** — View all available professionals with ratings, pricing, specialization, and reviews
- **Search & Filter** — Filter by name, surname, or specialization in real time
- **Favorites** — Save preferred psychologists (requires login)
- **Book Appointments** — Pick a date with the built-in calendar, select an available time slot, and submit a booking
- **Slot Availability** — Already-booked time slots are disabled; non-working days are greyed out in the calendar
- **Psychologist Working Hours** — Each psychologist defines their own schedule (days, hours, session duration); slots are generated dynamically from that schedule
- **Authentication** — Register and log in with email/password via **Auth.js** (cookie session, login persists across reloads)
- **Notification Bell** — View upcoming appointments directly in the header
- **Apply as Psychologist** — Submit a professional application including availability schedule; saved **unpublished** (hidden from the list) pending approval. If not logged in, the login window opens **inline** without losing the form
- **Admin Approval** — An admin (email allowlist via `ADMIN_EMAILS`) can review applications on `/admin`: **publish/unpublish**, edit any field, or delete a profile
- **Confirmation Emails** — A booking confirmation email is sent via **Resend** (optional; no-op without an API key, so bookings always succeed)
- **Internationalization (IT/EN)** — Full UI translation with **next-intl**, locale-prefixed routes (`/en`, `/it`), and a language switcher; dates/months are localized via `Intl`
- **Accessibility** — Skip-to-content link, dynamic `<html lang>`, ARIA labels/states on interactive controls, keyboard-friendly dropdowns, `prefers-reduced-motion` support
- **Loading & Error UX** — Skeleton placeholders while data loads, route-level error boundaries with retry, and a debounced search
- **404 Page** — Custom not-found page
- **Privacy & GDPR** — Cookie consent banner, Privacy Policy page (`/privacy`), consent checkboxes on registration and application forms
- **Right to Erasure** — Logged-in users can permanently delete their account and all associated data via the user menu

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 14** (App Router) — UI **and** API in one project |
| UI | React 18, CSS Modules |
| i18n | **next-intl v4** — locale-prefixed routing (`/en`, `/it`), middleware, message catalogs |
| Auth | **Auth.js v5** (NextAuth) — Credentials provider, JWT session, `bcryptjs` |
| ORM | **Prisma 5** |
| Database | **Neon** (serverless PostgreSQL) |
| Email | **Resend** (free tier) — transactional booking confirmations (optional) |
| Rate limiting | **Upstash Redis** (free tier) — login/registration/booking caps (optional) |
| Hosting | **Vercel** (single deployment) |
| Tests | Vitest + Testing Library |

### Previous stack (before migration)

| Layer | Technology |
|---|---|
| Frontend | React 18 + **Vite 5** + React Router 6 + Axios |
| Backend | **Strapi v5** (Users & Permissions, custom controllers) |
| Database | PostgreSQL (Strapi Cloud) / SQLite (local) |
| Hosting | Vercel (frontend) + **Strapi Cloud** (backend) |
| Keep-alive | **UptimeRobot** ping every 5 min to fight cold starts |

---

## Migration: from Strapi to Next.js

### Why
The app is a portfolio/CV project with no revenue, but the Strapi Cloud backend was the **only paid/maintenance burden**: the free tier **slept after inactivity** (~20–30s cold start) and needed an external UptimeRobot ping to stay awake. The goal was: **€0, no maintenance, no slow wake-ups**, while keeping the exact same UI.

### Before → After

| Concern | Before (Strapi) | After (Next.js + Neon) |
|---|---|---|
| Deployments | 2 (Vercel + Strapi Cloud) | **1** (Vercel only) |
| Cold start | ~20–30s, needed UptimeRobot | **~0.5s** Neon resume, no pinger |
| CORS | Cross-domain frontend↔backend | **None** (same origin) |
| Auth | Strapi JWT, in-memory (logout on reload) | **Auth.js cookie session** (login persists) |
| Backend code | Strapi controllers/routes/schemas | Next.js **Route Handlers** + Prisma |
| Cost / upkeep | Backend hosting + keep-alive | **€0**, zero maintenance |

### What stayed the same
- All React components and CSS Modules (`src/components`, `src/views`)
- The booking/calendar/availability logic (`src/utils/availability.js`)
- The data **shapes** the UI consumes (snake_case fields, `documentId`, favorites/reviews as JSON arrays) — so the UI barely changed.

### What changed under the hood
- `src/strapi/strapi.js` (Axios → Strapi) → **`src/lib/api.js`** (same-origin `fetch`, identical function signatures).
- React Router → Next.js App Router, via a tiny compatibility shim (`src/lib/router.jsx`) so existing `<Link>`/`useNavigate` call sites only changed their import path.
- `src/pages/` → **`src/views/`** (the name `pages/` collides with Next.js routing).
- Strapi content types → **Prisma models** (`prisma/schema.prisma`).
- Strapi custom controllers → **API route handlers** under `src/app/api/`.

---

## Project Structure

```
psychologists_services/
├── prisma/
│   ├── schema.prisma          # User, Psychologist, Appointment models
│   └── seed.js                # Seeds Neon from src/data/psychologists.json
├── messages/                  # Translation catalogs (one namespace per view/component)
│   ├── en.json
│   └── it.json
├── src/
│   ├── middleware.js          # next-intl locale detection / redirect (skips /api & static)
│   ├── i18n/                  # next-intl config
│   │   ├── routing.js         # Locales (en/it) + default
│   │   ├── navigation.js      # Locale-aware Link/useRouter/usePathname
│   │   ├── request.js         # Loads per-locale messages
│   │   └── format.js          # locale → BCP-47 tag for Intl date formatting
│   ├── app/                   # Next.js App Router
│   │   ├── [locale]/          # All pages are locale-prefixed (/en/…, /it/…)
│   │   │   ├── layout.jsx     # <html lang>, fonts, localized metadata, NextIntlClientProvider
│   │   │   ├── providers.jsx  # Skip link + SessionProvider + AuthProvider + Header/Footer/CookieBanner
│   │   │   ├── page.jsx       # Home  ("/")
│   │   │   ├── psychologists/ # "/psychologists" (+ loading.jsx skeleton)
│   │   │   ├── favorites/     # "/favorites" (protected: redirects if logged out)
│   │   │   ├── privacy/       # "/privacy"
│   │   │   ├── admin/         # "/admin" (+ loading.jsx skeleton)
│   │   │   ├── error.jsx      # Segment error boundary
│   │   │   └── not-found.jsx  # 404
│   │   ├── global-error.jsx   # Last-resort boundary (renders own <html>)
│   │   ├── icon.svg           # Favicon (App Router file convention)
│   │   └── api/               # Backend (Route Handlers) — NOT locale-prefixed; see API Overview
│   │       ├── auth/[...nextauth]/   # Auth.js login/session
│   │       ├── register/             # Email/password sign-up
│   │       ├── me/                   # Profile (favorites, dismissed, isPsychologist) + delete account
│   │       ├── psychologists/        # List, application, detail, toggle-favorite, reviews
│   │       ├── appointments/         # Booked slots, create (+ confirmation email), mine, cancel
│   │       └── reviews/dismiss/      # Dismiss a review prompt
│   ├── lib/
│   │   ├── api.js             # Frontend data layer (same-origin fetch)
│   │   ├── auth.js            # Auth.js config (Credentials + JWT session)
│   │   ├── email.js          # Resend confirmation email (optional, best-effort)
│   │   ├── rateLimit.js      # Upstash Redis rate limiting (optional)
│   │   ├── prisma.js          # PrismaClient singleton
│   │   ├── router.jsx         # react-router shim → next-intl locale-aware navigation
│   │   └── serialize.js       # Adds id/documentId/strapiId to psychologist responses
│   ├── components/           # UI components (Header has LanguageSwitcher; Skeleton/* placeholders)
│   ├── views/                # Page bodies (formerly src/pages/); includes ErrorState
│   ├── context/AuthContext.jsx  # Same context shape, now backed by Auth.js
│   ├── hooks/                # useFavorites, useDebounce
│   ├── utils/availability.js # Slot/working-hours logic (unchanged)
│   ├── test/intl.jsx         # Test helper: render wrapped in NextIntlClientProvider
│   └── data/psychologists.json  # Seed data
├── next.config.js            # Wraps config with the next-intl plugin
├── jsconfig.json             # "@/*" → ./src/*
├── vitest.config.js          # Vitest runs the test suite (app builds with Next)
└── .env.example
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- A free [Neon](https://neon.tech) account (PostgreSQL)

### 1. Clone & install
```bash
git clone https://github.com/your-username/psychologists_services.git
cd psychologists_services
npm install            # also runs `prisma generate`
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in `.env` (see [Environment Variables](#environment-variables)):
- `DATABASE_URL` — your Neon **pooled** connection string
- `AUTH_SECRET` — generate with `npx auth secret`
- `ADMIN_EMAILS` — comma-separated emails allowed into `/admin` (must match a registered account)

### 3. Create the database schema & seed data
```bash
npm run db:push      # create tables in Neon from prisma/schema.prisma
npm run db:seed      # import the 15 psychologists from src/data/psychologists.json
```

### 4. Run
```bash
npm run dev          # http://localhost:3000  → redirects to /en (or /it)
```

> Tip: after switching branches or changing `next.config.js`, clear the Next cache if the dev server misbehaves: `rm -rf .next && npm run dev`.

---

## Environment Variables

```env
# Neon — use the POOLED connection string from the Neon dashboard
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
# Direct (non-pooled) connection — same host WITHOUT `-pooler`; used only by `prisma migrate`
DIRECT_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Auth.js — generate with: npx auth secret
AUTH_SECRET="a-long-random-string"

# AUTH_URL is set automatically by Vercel; only needed for some custom hosts
# AUTH_URL="https://your-app.vercel.app"

# Admin allowlist — comma-separated emails that may access /admin (publish/edit/delete applications)
ADMIN_EMAILS="admin@example.com"

# --- Optional services (the app works without them) ---

# Resend (free tier) — booking confirmation emails. If unset, emails are disabled.
RESEND_API_KEY=""
# Sender address. Empty → sandbox sender (delivers only to your own Resend account email).
# Verify a domain in Resend to send to any recipient: "Name <no-reply@yourdomain.com>".
EMAIL_FROM=""

# Upstash Redis (free tier) — anti brute-force rate limiting. If unset, limiting is disabled.
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

> Unlike the old Vite setup (which baked `VITE_*` vars at build time), these are read **at runtime** on the server, so the database URL and secret never reach the browser.
>
> The three optional services (**Resend**, **Upstash**) **degrade gracefully**: when their env vars are missing the related feature becomes a no-op (emails are skipped, rate limiting is off) and the rest of the app keeps working — ideal for local dev and preview deploys.

---

## API Overview

All endpoints live under `src/app/api/` and are called from `src/lib/api.js` (same-origin `fetch`; the Auth.js session cookie is sent automatically). Endpoints marked 🔒 require a logged-in session.

| Function (`src/lib/api.js`) | Method | Endpoint |
|---|---|---|
| `getPsychologists()` | GET | `/api/psychologists` |
| `getPsychologistById(id)` | GET | `/api/psychologists/:id` |
| `submitPsychologistApplication(data)` 🔒 | POST | `/api/psychologists` (created unpublished) |
| `togglePsychologistFavorite(id)` 🔒 | POST | `/api/psychologists/:id/toggle-favorite` |
| `addReview(id, review)` 🔒 | POST | `/api/psychologists/:id/reviews` |
| `getBookedSlots(psychId, date)` | GET | `/api/appointments?psychologist_id=&date=` |
| `createAppointment(data)` | POST | `/api/appointments` (guests allowed; rate-limited; sends a confirmation email) |
| `getUserAppointments()` 🔒 | GET | `/api/appointments/mine` |
| `getPastAppointmentsForReview()` 🔒 | GET | `/api/appointments/mine` |
| `cancelAppointment(id)` 🔒 | DELETE | `/api/appointments/:id` |
| `getUserFavorites()` 🔒 | GET | `/api/me` |
| `getDismissedReviews()` 🔒 | GET | `/api/me` |
| `checkIsUserPsychologist()` 🔒 | GET | `/api/me` |
| `dismissAppointmentReview(id)` 🔒 | POST | `/api/reviews/dismiss` |
| `deleteAccount()` 🔒 | DELETE | `/api/me` |
| Login | POST | `/api/auth/callback/credentials` (via Auth.js `signIn`) |
| Register | POST | `/api/register` |

---

## Data Models

Prisma models (`prisma/schema.prisma`) intentionally keep the **snake_case field names** the UI already used (inherited from Strapi), so API responses are a direct spread.

### Psychologist
| Field | Type | Notes |
|---|---|---|
| id | Int | Primary key; exposed also as `documentId`/`strapiId` strings |
| name, surname, avatar | String | `avatar` is a plain remote URL |
| specialization, license | String | |
| experience | Int | Years |
| price_per_hour, rating | Float | |
| initial_consultation, about | String | |
| reviews | Json | Array of `{ reviewer, rating, comment, date }` |
| popular, isAvailable | Boolean | |
| availability | Json | Weekly schedule per day |
| user_email | String | Links profile to the account that created it (stripped from public API responses) |
| published | Boolean | Applications start `false` (hidden); replaces Strapi draft/publish |

### Appointment
| Field | Type | Notes |
|---|---|---|
| patient_name, email, phone | String | |
| time_slot | String | Format `"YYYY-MM-DD HH:MM"` (date filtering uses `contains`) |
| psychologist_id | String | The psychologist's `documentId` |
| psychologist_name | String | Denormalized |
| comment | String | Optional |

### User
| Field | Type | Notes |
|---|---|---|
| email | String | Unique |
| username | String | Display name |
| passwordHash | String | bcrypt hash (private) |
| psy_favorites | Json | Array of psychologist ids |
| psy_dismissed_reviews | Json | Array of appointment ids with dismissed review prompts |

---

## Authentication

Handled by **Auth.js v5** (`src/lib/auth.js`):
- **Register:** `POST /api/register` → hashes the password (`bcryptjs`) and creates the user.
- **Login:** Credentials provider verifies the bcrypt hash and issues a **JWT session cookie**.
- The session **persists across reloads** (improvement over the old in-memory Strapi JWT, which logged the user out on refresh).
- Protected route (`/favorites`) redirects unauthenticated users to the home page.
- `AuthContext` keeps the same public shape (`user`, `favorites`, `login`, `register`, `logout`, `deleteAccount`); `token` is retained as `null` for backward compatibility (auth is now cookie-based).

---

## Internationalization (i18n)

Powered by **next-intl v4** with locale-prefixed routing.

- **Locales:** `en` (default) and `it`, configured in `src/i18n/routing.js`.
- **Routing:** every page lives under `src/app/[locale]/`, so URLs are `/en/…` and `/it/…`. `src/middleware.js` detects the locale (URL → cookie → `Accept-Language`) and redirects when it's missing; it **skips `/api` and static files**.
- **Messages:** one JSON file per locale in `messages/`, organized into a namespace per view/component (`Home`, `Card`, `Admin`, …). Rich text (links, `<b>`) uses `t.rich`.
- **Language switcher:** an IT/EN toggle in the home hero; the choice is persisted in a cookie by next-intl.
- **Locale-aware navigation:** the legacy router shim (`src/lib/router.jsx`) delegates to next-intl, so existing `<Link to="/x">` / `useNavigate` call sites automatically keep the active locale — no call-site changes were needed.
- **Dates:** weekday/month names and date formatting are localized via the `Intl` API (`src/i18n/format.js` maps `en`→`en-GB`, `it`→`it-IT`), not translation strings.
- **Stored data stays canonical:** specialization category values remain in English (shared with the admin editor and the database); only their labels are translated.

To add a locale: add it to `routing.js` and create `messages/<locale>.json`.

## Accessibility

- **Skip link** — a keyboard-only "skip to main content" link jumps past the nav.
- **`<html lang>`** — set dynamically per locale in the layout.
- **ARIA** — `aria-label`/`aria-expanded`/`aria-pressed`/`aria-current` on menus, toggles, the favorite button, and the language switcher; decorative emoji are `aria-hidden`; every form input has an accessible label.
- **Keyboard** — dropdowns and modals close on `Escape` and outside-click; visible `:focus-visible` rings.
- **Motion** — skeleton shimmer respects `prefers-reduced-motion`.

---

## Deployment — Vercel (single project)

1. Push to GitHub.
2. Import the repository in [Vercel](https://vercel.com) (Next.js is auto-detected).
3. Add environment variables: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `ADMIN_EMAILS` (and optionally `RESEND_API_KEY` / `EMAIL_FROM`, `UPSTASH_REDIS_REST_URL` / `_TOKEN`).
4. Deploy. The build runs `prisma generate && prisma migrate deploy && next build`.
5. First time only: run `npm run db:push` and `npm run db:seed` against the Neon database (locally with the production `DATABASE_URL`, or via the Neon SQL editor).

> No second backend deployment, no CORS config, and **no UptimeRobot** — Neon resumes from idle in ~0.5s, so cold starts are no longer noticeable.

---

## Privacy & GDPR

| Feature | Implementation |
|---|---|
| Cookie consent | Banner on first visit; choice stored in `localStorage` as `cookie_consent` |
| Privacy Policy | Localized page at `/privacy` — lists data collected, uses, and processors (Neon, Vercel, Resend) |
| Consent on registration | Required checkbox linking to `/privacy` |
| Consent on psychologist application | Required checkbox with explicit data-processing notice |
| Confirmation email | On booking, name + email + appointment details are sent to **Resend** solely to deliver the confirmation message |
| Right to erasure | User menu → Delete account → `DELETE /api/me` removes all appointments, any psychologist profile the user created, and the user record |

---

## Running Tests

```bash
npm run test          # watch mode
npm run test:run      # single run
npm run test:coverage # coverage report
```

The suite (Vitest + Testing Library) runs against the React components, hooks, and library helpers (`AuthContext`, `useFavorites`, `email`, `admin`), mocking `@/lib/api` and `next-auth/react`. Components that use translations are rendered through `src/test/intl.jsx`, which wraps them in a `NextIntlClientProvider` with the English catalog.

---

## License

MIT
