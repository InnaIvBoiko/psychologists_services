# psychologists.services

**Live demo:** [psychologists-services-98v1.vercel.app](https://psychologists-services-98v1.vercel.app)

A full-stack web application to browse and book sessions with licensed psychologists. Built with React + Vite on the frontend and Strapi v5 on the backend, deployed on Vercel and Strapi Cloud.

---

## Features

- **Browse Psychologists** — View all available professionals with ratings, pricing, specialization, and reviews
- **Search & Filter** — Filter by name, surname, or specialization in real time
- **Favorites** — Save preferred psychologists (requires login)
- **Book Appointments** — Pick a date with the built-in calendar, select an available time slot, and submit a booking
- **Slot Availability** — Already-booked time slots are disabled; non-working days are greyed out in the calendar
- **Psychologist Working Hours** — Each psychologist defines their own schedule (days, hours, session duration); slots are generated dynamically from that schedule
- **Authentication** — Register and log in via Strapi Users & Permissions (JWT)
- **Notification Bell** — View upcoming appointments directly in the header
- **Apply as Psychologist** — Submit a professional application including availability schedule; an account is created automatically if the applicant is not yet registered; saved as **draft** pending admin approval
- **404 Page** — Custom not-found page
- **Privacy & GDPR** — Cookie consent banner, Privacy Policy page (`/privacy`), consent checkboxes on registration and application forms
- **Right to Erasure** — Logged-in users can permanently delete their account and all associated data via the user menu

---

## Tech Stack

### Frontend
| Technology | Version |
|---|---|
| React | 18 |
| React Router | 6 |
| Vite | 5 |
| Axios | 1.x |
| CSS Modules | — |

### Backend
| Technology | Version |
|---|---|
| Strapi | 5.39.0 |
| PostgreSQL | (production) |
| SQLite | (local dev) |
| Node.js | ≥20 ≤24 |

### Infrastructure
| Service | Purpose |
|---|---|
| Vercel | Frontend hosting + SPA routing |
| Strapi Cloud | Backend hosting + managed PostgreSQL |
| UptimeRobot | Uptime monitoring — keeps Strapi Cloud awake on the free tier |

---

## Project Structure

```
psychologists_services/
├── backend/                    # Strapi CMS
│   ├── src/
│   │   ├── index.ts            # Custom routes (delete-account endpoint)
│   │   ├── api/
│   │   │   ├── appointment/    # Appointment content type
│   │   │   └── psychologist/   # Psychologist content type + custom routes
│   │   └── extensions/         # Users & Permissions extension (psy_favorites, psy_dismissed_reviews)
│   ├── config/
│   │   ├── middlewares.ts      # CORS configuration
│   │   └── server.ts           # Host/port config
│   └── .env.example
├── src/                        # React frontend
│   ├── components/
│   │   ├── AppointmentModal/   # Booking modal with calendar
│   │   ├── ApplyModal/         # Psychologist application form (auto-creates user account)
│   │   ├── AuthModal/          # Login / Register modal
│   │   ├── CookieBanner/       # GDPR cookie consent banner
│   │   ├── DeleteAccountModal/ # Account deletion confirmation modal
│   │   ├── Header/             # Header + NotificationBell + user dropdown
│   │   ├── Modal/              # Base modal wrapper
│   │   └── PsychologistCard/   # Card with expand/book/favorite
│   ├── context/
│   │   └── AuthContext.jsx     # Auth state (user, token, login, logout, deleteAccount)
│   ├── hooks/
│   │   └── useFavorites.js     # Favorites logic
│   ├── pages/
│   │   ├── HomePage/
│   │   ├── PsychologistsPage/
│   │   ├── FavoritesPage/
│   │   ├── PrivacyPage/        # Privacy Policy (/privacy)
│   │   └── NotFoundPage/
│   ├── strapi/
│   │   └── strapi.js           # All API calls
│   └── data/
│       └── psychologists.json  # Seed data
├── seed.js                     # Data seeding script
├── vercel.json                 # Build config + SPA rewrite
├── .env.example
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js ≥20
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/your-username/psychologists_services.git
cd psychologists_services
```

### 2. Set up the backend

```bash
cd backend
cp .env.example .env
# Fill in the values in .env (see Environment Variables section)
npm install
npm run dev
```

The Strapi admin panel will be available at `http://localhost:1337/admin`.

### 3. Set up the frontend

```bash
# In the root directory
cp .env.example .env
# Set VITE_STRAPI_URL=http://localhost:1337
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### 4. Seed the database (optional)

After Strapi is running:

```bash
node seed.js
```

This imports all psychologists from `src/data/psychologists.json` into Strapi.

---

## Environment Variables

### Frontend (`.env`)

```env
VITE_STRAPI_URL=http://localhost:1337
```

> On Vercel, add this in **Settings → Environment Variables** and redeploy. Vite bakes env vars at build time — the variable is not read at runtime.

### Backend (`backend/.env`)

```env
HOST=0.0.0.0
PORT=1337
APP_KEYS=
API_TOKEN_SALT=
ADMIN_JWT_SECRET=
TRANSFER_TOKEN_SALT=
ENCRYPTION_KEY=
JWT_SECRET=

# SQLite (local)
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# PostgreSQL (production)
# DATABASE_CLIENT=postgres
# DATABASE_HOST=
# DATABASE_PORT=5432
# DATABASE_NAME=
# DATABASE_USERNAME=
# DATABASE_PASSWORD=
# DATABASE_SSL=true
```

---

## API Overview

All requests go through `src/strapi/strapi.js`.

| Function | Method | Endpoint |
|---|---|---|
| `getPsychologists()` | GET | `/api/psychologists` |
| `getPsychologistById(id)` | GET | `/api/psychologists/:id` |
| `checkIsUserPsychologist(email)` | GET | `/api/psychologists?filters[user_email][$eq]=...` |
| `togglePsychologistFavorite(id, jwt)` | POST | `/api/psychologists/:id/toggle-favorite` |
| `addReview(id, review, jwt)` | POST | `/api/psychologists/:id/add-review` |
| `getUserFavorites(jwt)` | GET | `/api/users/me` |
| `getBookedSlots(psychId, date, jwt)` | GET | `/api/appointments?filters...` |
| `createAppointment(data, jwt)` | POST | `/api/appointments` |
| `getUserAppointments(email, jwt)` | GET | `/api/appointments?filters...` |
| `cancelAppointment(documentId, jwt)` | DELETE | `/api/appointments/:id` |
| `submitPsychologistApplication(data, jwt)` | POST | `/api/psychologists?status=draft` |
| `deleteAccount(jwt)` | DELETE | `/api/users/me/delete-account` |

---

## Data Models

### Psychologist

| Field | Type | Notes |
|---|---|---|
| name | String | |
| surname | String | |
| avatar | String | URL or emoji |
| specialization | String | |
| experience | Integer | Years |
| license | String | |
| price_per_hour | Decimal | |
| rating | Decimal | |
| initial_consultation | String | Free / paid |
| about | Text | |
| reviews | JSON | Array of review objects |
| popular | Boolean | |
| isAvailable | Boolean | |
| availability | JSON | Weekly schedule per day |
| user_email | Email | Links profile to the user account that created it |

> The `user_email` field is defined in `backend/src/api/psychologist/content-types/psychologist/schema.json` and is created automatically when the backend starts.

Draft & Publish enabled — new applications submitted via the form are saved as **drafts** until an admin publishes them.

### Appointment

| Field | Type | Notes |
|---|---|---|
| patient_name | String | |
| email | String | |
| phone | String | |
| time_slot | String | Format: `"YYYY-MM-DD HH:MM"` |
| psychologist_id | String | Strapi `documentId` |
| psychologist_name | String | Denormalized |
| comment | Text | Optional |

> **Note:** `time_slot` stores both date and time as a single string. Date filtering uses the `$contains` operator.

### User (extended)

Standard Strapi users-permissions user with two additional JSON fields:

| Field | Type | Notes |
|---|---|---|
| psy_favorites | JSON | Array of psychologist documentIds |
| psy_dismissed_reviews | JSON | Array of appointment ids the user dismissed review prompts for |

---

## Deployment

### Frontend — Vercel

1. Push to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variable: `VITE_STRAPI_URL=https://your-strapi-app.strapiapp.com`
4. Deploy — `vercel.json` handles SPA routing and build config automatically

### Backend — Strapi Cloud

1. Connect your GitHub repository to [Strapi Cloud](https://cloud.strapi.io)
2. Set the root directory to `backend`
3. Configure environment variables (database, secrets)
4. Deploy

### CORS

Allowed origins are configured in `backend/config/middlewares.ts`:
- `http://localhost:5173`
- `https://psychologists-services-98v1.vercel.app`
- All `https://psychologists-services-*.vercel.app` preview deployments

---

## Uptime Monitoring

Strapi Cloud free tier puts the instance to sleep after inactivity.
**UptimeRobot** (free plan) pings the health endpoint every 5 minutes to prevent cold starts:

```
Monitor URL:  https://thankful-moonlight-dc4a61a084.strapiapp.com/_health
Method:       GET
Interval:     every 5 minutes
Expected:     HTTP 204
```

---

## Authentication

Authentication is handled by the **Strapi Users & Permissions** plugin.

- Register: `POST /api/auth/local/register`
- Login: `POST /api/auth/local`
- Returns a JWT token stored in React context (in-memory, not persisted to localStorage)
- Protected routes (Favorites) redirect unauthenticated users to the home page

---

## Privacy & GDPR

| Feature | Implementation |
|---|---|
| Cookie consent | Banner shown on first visit; choice stored in `localStorage` as `cookie_consent` |
| Privacy Policy | Static page at `/privacy` |
| Consent on registration | Required checkbox linking to `/privacy` |
| Consent on psychologist application | Required checkbox with explicit data processing notice |
| Right to erasure | User menu → Delete account → deletes all appointments and user record via `DELETE /api/users/me/delete-account` |
| Psychologist offboarding | If the user has a linked psychologist profile, they are informed it will be removed within 2–3 business days |

---

## Running Tests

```bash
npm run test          # watch mode
npm run test:run      # single run
npm run test:coverage # coverage report
```

---

## License

MIT
