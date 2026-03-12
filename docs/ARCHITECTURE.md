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
- New psychologist applications are created as **drafts** via `POST /api/psychologists?status=draft`

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

### `documentId` vs numeric `id`

Strapi v5 uses a UUID-based `documentId` as the primary identifier for REST API calls (`GET /api/psychologists/:documentId`). The legacy numeric `id` is still used internally. The frontend keeps both:

```js
{
  id: item.documentId,    // used for API calls (routes)
  strapiId: String(item.id), // used for favorites matching
  ...item
}
```
