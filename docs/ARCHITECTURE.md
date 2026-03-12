# Architecture

## Overview

```
Browser
  │
  ├── React SPA (Vercel)
  │     ├── AuthContext  ──────────────────┐
  │     ├── useFavorites hook              │
  │     └── strapi.js (API client)         │
  │                │                       │
  │                ▼                       │
  └── Strapi v5 REST API (Strapi Cloud)    │
        ├── /api/psychologists             │
        ├── /api/appointments              │
        └── /api/users/me  ◄──────────────┘
```

## Frontend

**Framework:** React 18 + Vite 5
**Routing:** React Router v6
**Styling:** CSS Modules + global CSS custom properties
**HTTP client:** Axios

### State management

No external state library. State is split across:

| Layer | What it holds |
|---|---|
| `AuthContext` | `user`, `token` (JWT), `favorites[]`, login/logout/register |
| `useFavorites` hook | Reads/writes favorites via context + Strapi API |
| Local component state | UI state (modals, filters, loading, selected date/time) |

> **Auth is in-memory only.** The JWT token is never written to `localStorage`. On page refresh the user is logged out. Any existing `localStorage` keys are actively cleared on app mount.

### Folder structure

```
src/
├── components/         # Reusable UI pieces (each with its own CSS module)
├── context/            # React context providers
├── hooks/              # Custom hooks
├── pages/              # Route-level page components
├── utils/
│   └── availability.js # Slot generation and working-hours logic
└── strapi/strapi.js    # All Strapi API calls in one place
```

### Routing

| Path | Component | Auth required |
|---|---|---|
| `/` | `HomePage` | No |
| `/psychologists` | `PsychologistsPage` | No |
| `/favorites` | `FavoritesPage` | Yes → redirects to `/` |
| `*` | `NotFoundPage` | No |

`ProtectedRoute` wraps private routes and redirects unauthenticated users to home.

---

## Backend

**Framework:** Strapi v5
**Database:** SQLite (local dev) / PostgreSQL (production on Strapi Cloud)

### Content types

#### Psychologist
- Collection type with **Draft & Publish** enabled
- Core fields: `name`, `surname`, `specialization`, `experience`, `license`, `rating`, `price_per_hour`, `about`, `avatar`, `reviews` (JSON), `image` (media), `popular`, `isAvailable`
- `availability` (JSON) — working hours schedule (see [Availability system](#availability-system) below)
- New psychologist applications are created as **drafts** via `POST /api/psychologists?status=draft`
- **Admin must manually review and publish each draft** before the profile becomes publicly visible

#### Appointment
- Collection type, **no Draft & Publish**
- Fields: `patient_name`, `email`, `phone`, `time_slot`, `psychologist_id`, `psychologist_name`, `comment`
- `time_slot` stores date + time as a single string: `"YYYY-MM-DD HH:MM"`

#### User (extended)
- Strapi built-in Users & Permissions user
- Extended with `psy_favorites` (JSON field) — stores an array of psychologist `strapiId` strings

### Custom route

```
POST /api/psychologists/:id/toggle-favorite
```

Handled by a custom controller method `toggleFavorite` in
`backend/src/api/psychologist/controllers/psychologist.ts`.

Logic:
1. Reads authenticated user's `psy_favorites` array
2. Adds or removes the psychologist `id`
3. Saves updated array back to `psy_favorites`
4. Returns `{ isFavorite: boolean }`

---

## Key design decisions

### `time_slot` as a combined string

Strapi Cloud does not allow schema changes in production. Because a separate `date` field could not be added, both date and time are stored together in the existing `time_slot` field (`"YYYY-MM-DD HH:MM"`).

Slot availability is checked using Strapi's `$contains` filter:
```
GET /api/appointments?filters[psychologist_id][$eq]=xxx&filters[time_slot][$contains]=2025-06-15
```

The response is then mapped to extract just the `HH:MM` portion to mark slots as booked.

### Favorites stored as JSON on the User

Strapi v5 does not easily support many-to-many relations between content types and Users without custom plugin work. Favorites are stored as a plain JSON array of `strapiId` strings on the user record (`psy_favorites`). Reads and writes go through the custom `toggle-favorite` endpoint.

### Availability system

Each psychologist has an `availability` JSON field that defines their weekly working hours and session duration:

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

The utility functions in `src/utils/availability.js` handle:

| Function | Purpose |
|---|---|
| `parseAvailability(raw)` | Parses the JSON field, merges with defaults |
| `isWorkingDay(isoDate, availability)` | Returns `true` if that date is a working day |
| `generateSlots(isoDate, availability)` | Returns `["09:00", "10:00", ...]` for that date |
| `generateTimeOptions()` | Returns all 30-min options from 06:00–22:00 for the editor |

If a psychologist has no `availability` set, the default schedule is used (Mon–Fri 09:00–17:00, 60 min slots).

The `AppointmentModal` uses these functions to:
1. Disable non-working days in the `MiniCalendar`
2. Show only the slots within the psychologist's working hours for the selected date

The `AvailabilityEditor` component lets psychologists set their schedule when applying via `ApplyModal`. The schedule is stored alongside the draft application and becomes active once the profile is published by an admin.

### Draft & publish workflow for psychologists

```
Psychologist fills ApplyModal
        │
        ▼
POST /api/psychologists?status=draft
        │
        ▼
Entry created as DRAFT (not visible to public)
        │
        ▼
Admin reviews in Strapi admin panel
        │
   ┌────┴────┐
Approve     Reject
   │           │
Publish     Delete
   │
   ▼
Profile visible on /psychologists
```

### `documentId` vs numeric `id`

Strapi v5 uses a UUID-based `documentId` as the primary identifier for REST API calls (`GET /api/psychologists/:documentId`). The legacy numeric `id` is still used internally. The frontend keeps both:

```js
{
  id: item.documentId,    // used for API calls (routes)
  strapiId: String(item.id), // used for favorites matching
  ...item
}
```
