# API Reference

The backend is now a set of **Next.js 14 (App Router) route handlers** living under
`src/app/api/` inside the same project as the React UI. Frontend, API and authentication
ship as a single Vercel deployment. Data is stored in **Neon PostgreSQL** accessed through
**Prisma 5** (`prisma/schema.prisma`, models `User`, `Psychologist`, `Appointment`).

Base URL: **same origin** — endpoints are simply `/api/...`. The frontend data layer
`src/lib/api.js` calls them with `fetch(url, { credentials: 'same-origin' })`.

Authentication uses **Auth.js v5 (NextAuth)** with a Credentials provider and a JWT
session strategy (`src/lib/auth.js`). The session lives in a secure cookie that the
browser sends automatically, so authenticated requests need **no header** — the route
handler reads the session with `auth()`. Login persists across page reloads.

> **Before (Strapi).** The base URL was `VITE_STRAPI_URL/api` (a separate Strapi service),
> and every authenticated request had to carry a header:
> ```
> Authorization: Bearer <jwt>
> ```
> The JWT came from Strapi's Users & Permissions plugin. There is **no Bearer token anymore**.
> For backward compatibility the functions in `src/lib/api.js` keep their old signatures
> (the `jwt` / `token` / `email` arguments are accepted but ignored).

In the tables below, 🔒 marks endpoints that require a logged-in session.

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| GET    | `/api/psychologists` | — | Published psychologists list |
| POST   | `/api/psychologists` | 🔒 | Psychologist application (created unpublished) |
| GET    | `/api/psychologists/:id` | — | Single psychologist |
| POST   | `/api/psychologists/:id/toggle-favorite` | 🔒 | Add/remove favorite |
| POST   | `/api/psychologists/:id/reviews` | 🔒 | Append review, recompute average rating |
| GET    | `/api/appointments?psychologist_id=&date=` | — | Booked `HH:MM` slots for a day |
| POST   | `/api/appointments` | 🔒 | Create a booking |
| GET    | `/api/appointments/mine` | 🔒 | Current user's appointments |
| DELETE | `/api/appointments/:id` | 🔒 | Cancel own appointment |
| GET    | `/api/me` | 🔒 | Current user profile |
| DELETE | `/api/me` | 🔒 | Delete account + appointments + psychologist profile |
| POST   | `/api/reviews/dismiss` | 🔒 | Dismiss a review prompt |
| POST   | `/api/register` | — | Create an account |
| GET/POST | `/api/auth/[...nextauth]` | — | Auth.js login/session |

---

## Authentication

Auth.js v5 with the **Credentials** provider, JWT session strategy, and `bcryptjs` for
password hashing (`src/lib/auth.js`). Registration is a plain route handler; login goes
through Auth.js.

### Register

```
POST /api/register
```

**Body**
```json
{
  "username": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret"
}
```

Validates the input (username ≥ 3 chars, valid email, password ≥ 6 chars), hashes the
password with bcrypt and creates a `User` row.

**Response**
```json
{
  "user": { "id": 1, "email": "jane@example.com", "username": "Jane Doe" }
}
```

> Unlike Strapi, registering does **not** return a JWT. The client logs in separately
> (see below) to obtain a session cookie.

> **Before (Strapi).** `POST /api/auth/local/register` against Strapi's Users & Permissions
> plugin, which returned `{ "jwt": "<token>", "user": {...} }`.

---

### Login

Handled by Auth.js at `/api/auth/[...nextauth]`. The frontend calls
`signIn('credentials', { email, password })`; on success Auth.js sets the session cookie.

```
POST /api/auth/callback/credentials
```

On success a JWT session cookie is set and persists across reloads. The session is read
server-side with `auth()` and exposed to the UI via the NextAuth session.

> **Before (Strapi).** `POST /api/auth/local` with body
> `{ "identifier": "jane@example.com", "password": "secret" }`, returning a `jwt` the
> client stored and sent as a Bearer header on every request.

---

## Psychologists

### List all

```
GET /api/psychologists
```

Returns the full array of **published** psychologists, ordered by `id`. Each object is the
Prisma row spread through `src/lib/serialize.js`, which adds `id`, `documentId` and
`strapiId` (all derived from the numeric primary key) so existing call sites keep working.

**Response shape** (a plain array — no `data` / `meta` envelope)
```json
[
  {
    "id": 1,
    "documentId": "1",
    "strapiId": "1",
    "name": "John",
    "surname": "Smith",
    "specialization": "Anxiety",
    "experience": 8,
    "license": "LIC-0042",
    "rating": 4.8,
    "price_per_hour": 120,
    "initial_consultation": "Free",
    "about": "...",
    "avatar": "👨‍⚕️",
    "popular": true,
    "isAvailable": true,
    "reviews": [],
    "availability": { "...": "..." },
    "published": true
  }
]
```

Filtering, sorting and search are still done **client-side**, so the endpoint deliberately
returns the complete list in one response.

> **Before (Strapi).** `GET /api/psychologists?populate=*&pagination[page]=<n>&pagination[pageSize]=100`,
> which returned a `{ data: [...], meta: { pagination } }` envelope. Strapi capped a single
> response at its default page size (25), so `getPsychologists()` had to loop over
> `meta.pagination.pageCount` (with `pageSize=100`) and concatenate every page — otherwise
> any psychologist beyond the first 25 would silently never reach the UI. Media lived in a
> populated `image` relation. Now Prisma returns every row directly and there is no media
> relation to populate.

---

### Get one

```
GET /api/psychologists/:id
```

`:id` is the numeric primary key (the `documentId`/`strapiId` strings are the same value).
Returns the serialized psychologist, or `404` with body `null` if not found.

> **Before (Strapi).** `GET /api/psychologists/:documentId?populate=*` — lookups used
> Strapi's opaque `documentId` string and required `populate` to include media.

---

### Toggle favorite 🔒

```
POST /api/psychologists/:id/toggle-favorite
```

No body required. Toggles `:id` in the logged-in user's `psy_favorites` array.

**Response**
```json
{
  "isFavorite": true,
  "favorites": ["42", "17", "8"],
  "message": "Added to favorites"
}
```

> **Before (Strapi).** A custom controller action at the same path, but authorization came
> from the Bearer JWT and the action had to be enabled for the **Authenticated** role in the
> Strapi admin. Now the handler reads the session via `auth()`; no admin role setup is needed.

---

### Add review

```
POST /api/psychologists/:id/reviews
```

🔒 **Requires a logged-in session.** `:id` is the numeric primary key.

**Body**
```json
{
  "reviewer": "Jane Doe",
  "rating": 5,
  "comment": "Excellent therapist, highly recommend."
}
```

All three fields are required. `rating` is clamped to 1–5. The handler appends the review
to the psychologist's `reviews` JSON array, recomputes the average `rating`
(rounded to one decimal) and persists both.

**Response**
```json
{
  "success": true,
  "review": {
    "reviewer": "Jane Doe",
    "rating": 5,
    "comment": "Excellent therapist, highly recommend.",
    "date": "2026-06-06"
  }
}
```

> **Before (Strapi).** `POST /api/psychologists/:strapiId/add-review` (note the different
> path segment `add-review`). It required the `addReview` action to be enabled for the
> **Authenticated** role in Strapi admin → Settings → Users & Permissions → Roles.

---

### Submit application (unpublished)

```
POST /api/psychologists
```

🔒 **Requires a logged-in session** (the apply form registers/logs the applicant in first).
Creates a new `Psychologist` row with `published: false`, so the profile is **not** visible
in the public list until it is published. `user_email` is taken from the session — any value
sent in the body is ignored.

**Body**
```json
{
  "name": "Dr. Jane Smith",
  "surname": "Smith",
  "specialization": "Cognitive Behavioral Therapy",
  "experience": 10,
  "license": "Licensed Psychologist (LIC-1234)",
  "price_per_hour": 150,
  "initial_consultation": "Free",
  "about": "...",
  "avatar": "👩‍⚕️",
  "availability": {
    "monday":    { "enabled": true,  "start": "09:00", "end": "17:00" },
    "tuesday":   { "enabled": true,  "start": "09:00", "end": "17:00" },
    "wednesday": { "enabled": true,  "start": "09:00", "end": "17:00" },
    "thursday":  { "enabled": true,  "start": "09:00", "end": "17:00" },
    "friday":    { "enabled": true,  "start": "09:00", "end": "17:00" },
    "saturday":  { "enabled": false, "start": "10:00", "end": "14:00" },
    "sunday":    { "enabled": false, "start": "10:00", "end": "14:00" },
    "slot_duration": 60
  },
  "rating": 0,
  "popular": false,
  "isAvailable": true
}
```

`name` is required. Numeric fields are coerced (empty/invalid → `null`), `rating` defaults
to `0`, and `published` is forced to `false`. The body is now a **flat object** (no `data`
wrapper). The created profile becomes public once an admin flips `published` to `true` in
the database.

> **Before (Strapi).** `POST /api/psychologists?status=draft` with a `{ "data": { ... } }`
> envelope created a **draft** entry. The `?status=draft` query param was required in
> Strapi v5 (passing `status` in the body caused a 400). An admin then reviewed the draft in
> `Content Manager → Psychologist` and clicked **Publish** to make it visible. The new
> `published` boolean replaces Strapi's draft/publish mechanism.

---

## Appointments

Appointment `time_slot` is stored as the string `"YYYY-MM-DD HH:MM"` (e.g. `"2026-06-15 10:00"`).

### Get booked slots for a date

```
GET /api/appointments?psychologist_id=<id>&date=<YYYY-MM-DD>
```

Returns a plain **array of booked `"HH:MM"` strings** for that psychologist on that day, so
the UI can mark those times unavailable. If either query param is missing, returns `[]`.

**Response**
```json
["10:00", "14:00"]
```

> **Before (Strapi).** `GET /api/appointments?filters[psychologist_id][$eq]=<documentId>&filters[time_slot][$contains]=<YYYY-MM-DD>&fields[0]=time_slot&pagination[pageSize]=100`
> returned a `{ data: [{ id, time_slot }] }` envelope, and the frontend itself extracted the
> `HH:MM` portion. Now the handler does that extraction server-side and returns just the slots.

---

### Get the user's appointments 🔒

```
GET /api/appointments/mine
```

Returns **all** appointments whose `email` matches the session user, ordered by `time_slot`,
each augmented with `documentId` (the stringified id). The frontend splits them into upcoming
vs. past:

- `getUserAppointments()` keeps appointments dated **today or later** (upcoming list).
- `getPastAppointmentsForReview()` keeps appointments in the **last 60 days** that are in the
  past, used by the notification bell to offer review prompts (already-dismissed ones are
  filtered via `psy_dismissed_reviews`, see below).

> **Before (Strapi).** There was no `mine` endpoint. The frontend made filtered Strapi queries
> like `GET /api/appointments?filters[email][$eq]=<user_email>&fields[...]&pagination[pageSize]=50`
> — one variant for upcoming appointments and another (with extra fields) for review prompts —
> and split past/upcoming client-side. Now a single authenticated endpoint scopes results to
> the session user, instead of trusting an email passed in the query string.

---

### Create appointment 🔒

```
POST /api/appointments
```

**Body** (flat object)
```json
{
  "patient_name": "Jane Doe",
  "phone": "+39 333 1234567",
  "email": "jane@example.com",
  "time_slot": "2026-06-15 10:00",
  "comment": "First visit",
  "psychologist_id": "1",
  "psychologist_name": "John Smith"
}
```

All fields except `comment` are required. Returns the created appointment plus a
`documentId`. Requires a logged-in session.

> **Before (Strapi).** Same path but the body was wrapped in `{ "data": { ... } }`, and the
> endpoint was open according to the Strapi role configuration rather than gated on a session.

---

### Cancel appointment 🔒

```
DELETE /api/appointments/:id
```

`:id` is the numeric appointment id. The handler verifies the appointment belongs to the
session user (returns `403` otherwise) before deleting it. The UI only shows the Cancel
button when the appointment is more than **24 hours** in the future. Cancellation is permanent.

**Response**
```json
{ "ok": true }
```

> **Before (Strapi).** `DELETE /api/appointments/:documentId`, which required the `delete`
> action to be enabled for the **Authenticated** role in Strapi admin → Roles → Appointment.
> Strapi did not, by itself, verify ownership the way the new handler does.

---

### Dismiss review prompt 🔒

```
POST /api/reviews/dismiss
```

**Body**
```json
{ "appointmentId": "42" }
```

Appends the appointment id to the session user's `psy_dismissed_reviews` JSON array
(no-op if already present). The review prompt for that appointment then stops appearing in
the notification bell.

**Response**
```json
{ "dismissed": ["42"] }
```

> **Before (Strapi).** `POST /api/users/dismiss-review` — a custom controller on the user
> resource. Note also that dismissals are now sourced from the server (`/api/me`) rather than
> only `localStorage`.

---

## User account

### Get current user 🔒

```
GET /api/me
```

Returns the session user's profile, including the favorites and dismissed-review arrays and
a computed `isPsychologist` flag (true when a `Psychologist` row exists with a matching
`user_email`).

**Response**
```json
{
  "id": 1,
  "email": "jane@example.com",
  "username": "Jane Doe",
  "psy_favorites": ["42", "17", "8"],
  "psy_dismissed_reviews": ["7"],
  "isPsychologist": false
}
```

> **Before (Strapi).** `GET /api/users/me` returned the Strapi user record. It exposed
> `psy_favorites` but not the `isPsychologist` flag (which the new handler derives by counting
> matching psychologist profiles) and did not bundle `psy_dismissed_reviews` in the same call.

---

### Delete account 🔒

```
DELETE /api/me
```

Deletes the session user **and all their appointments** (matched by email) **and any
psychologist profile they created** (matched by `user_email`), then removes the user row.
This implements the GDPR right to erasure with no leftover personal data.

**Response**
```json
{ "message": "Account deleted successfully" }
```

> **Before (Strapi).** `DELETE /api/users/me/delete-account`, a custom controller action.

---

## Data model & field names

Prisma field names are intentionally **snake_case to match the UI** (and the shape inherited
from Strapi), so responses are a direct spread with no remapping:
`price_per_hour`, `initial_consultation`, `time_slot`, `patient_name`, `psychologist_id`,
`psy_favorites`, `psy_dismissed_reviews`, `isAvailable`, `user_email`.

`src/lib/serialize.js` augments psychologist rows with `id`, `documentId` and `strapiId`
(all derived from the numeric primary key) so existing front-end call sites that expected
Strapi's identifiers keep working. It also **strips `user_email`** from every psychologist
response, so the profile owner's email (personal data) is never exposed publicly.

The `published` boolean replaces Strapi's draft/publish workflow: regular records are
`published: true`, while psychologist applications are created `published: false` and only
appear in the public list once published.

> **Before (Strapi).** Identifiers were Strapi's numeric `id` and opaque `documentId`;
> visibility was governed by Strapi's draft/publish state (`?status=draft`) instead of a
> `published` column.

---

## Error format

Route handlers return JSON errors as:

```json
{ "error": { "message": "..." } }
```

with an appropriate HTTP status (`400` invalid body / validation, `401` not logged in,
`403` not the owner, `404` not found, `409` email already registered). The client
(`src/lib/api.js`) surfaces `error.message` when a request fails.

> **Before (Strapi).** Errors followed Strapi's envelope:
> ```json
> {
>   "data": null,
>   "error": { "status": 400, "name": "ValidationError", "message": "...", "details": {} }
> }
> ```
