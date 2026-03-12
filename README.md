# psychologists.services

**Live demo:** [psychologists-services-98v1.vercel.app](https://psychologists-services-98v1.vercel.app)

A full-stack web application to browse and book sessions with licensed psychologists. Built with React + Vite on the frontend and Strapi v5 on the backend, deployed on Vercel and Strapi Cloud.

---

## Features

- **Browse Psychologists** — View all available professionals with ratings, pricing, specialization, and reviews
- **Search & Filter** — Filter by name, surname, or specialization in real time
- **Favorites** — Save preferred psychologists (requires login)
- **Book Appointments** — Pick a date with the built-in calendar, select an available time slot, and submit a booking
- **Slot Availability** — Already-booked time slots appear as disabled for the selected date
- **Authentication** — Register and log in via Strapi Users & Permissions (JWT)
- **Notification Bell** — View upcoming appointments directly in the header
- **Apply as Psychologist** — Submit a professional application via modal form (saved as draft for admin review)
- **404 Page** — Custom not-found page

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

---

## Project Structure

```
psychologists_services/
├── backend/                    # Strapi CMS
│   ├── src/
│   │   ├── api/
│   │   │   ├── appointment/    # Appointment content type
│   │   │   └── psychologist/   # Psychologist content type + custom routes
│   │   └── extensions/         # Users & Permissions extension
│   ├── config/                 # Strapi configuration
│   └── .env.example
├── src/                        # React frontend
│   ├── components/
│   │   ├── AppointmentModal/   # Booking modal with calendar
│   │   ├── ApplyModal/         # Psychologist application form
│   │   ├── AuthModal/          # Login / Register modal
│   │   ├── Header/             # Header + NotificationBell
│   │   ├── Modal/              # Base modal wrapper
│   │   └── PsychologistCard/   # Card with expand/book/favorite
│   ├── context/
│   │   └── AuthContext.jsx     # Auth state (user, token, login, logout)
│   ├── hooks/
│   │   └── useFavorites.js     # Favorites logic
│   ├── pages/
│   │   ├── HomePage/
│   │   ├── PsychologistsPage/
│   │   ├── FavoritesPage/
│   │   └── NotFoundPage/
│   ├── strapi/
│   │   └── strapi.js           # All API calls
│   └── data/
│       └── psychologists.json  # Seed data
├── seed.js                     # Data seeding script
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

For production (Vercel), add this in **Settings → Environment Variables**.

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
| `togglePsychologistFavorite(id, jwt)` | POST | `/api/psychologists/:id/toggle-favorite` |
| `getUserFavorites(jwt)` | GET | `/api/users/me` |
| `getBookedSlots(psychId, date, jwt)` | GET | `/api/appointments?filters...` |
| `createAppointment(data, jwt)` | POST | `/api/appointments` |
| `getUserAppointments(email, jwt)` | GET | `/api/appointments?filters...` |
| `submitPsychologistApplication(data, jwt)` | POST | `/api/psychologists?status=draft` |

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
| image | Media | Profile photo |
| popular | Boolean | |
| isAvailable | Boolean | |

Draft & Publish enabled — new applications via the form are saved as **drafts** until an admin reviews and publishes them.

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

> **Note:** The `time_slot` field stores both date and time as a single string (`"2025-06-15 14:00"`). This design was chosen because Strapi Cloud does not allow schema changes in production. Date filtering uses the `$contains` operator.

---

## Deployment

### Frontend — Vercel

1. Push to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Set the environment variable: `VITE_STRAPI_URL=https://your-strapi-app.strapiapp.com`
4. Deploy

### Backend — Strapi Cloud

1. Connect your GitHub repository to [Strapi Cloud](https://cloud.strapi.io)
2. Set the root directory to `backend`
3. Configure environment variables (database, secrets)
4. Deploy

---

## Authentication

Authentication is handled by the **Strapi Users & Permissions** plugin.

- Register: `POST /api/auth/local/register`
- Login: `POST /api/auth/local`
- Returns a JWT token stored in React context (in-memory, not persisted to localStorage)
- Protected routes (Favorites) redirect unauthenticated users to the home page

---

## License

MIT
