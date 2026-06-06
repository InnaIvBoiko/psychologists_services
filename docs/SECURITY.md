# Security

> **Note:** The backend was migrated from **Strapi** to a single **Next.js** app.
> This document describes the **current** Auth.js-based security model. The
> historical Strapi model is preserved at the end under
> [History: the old Strapi model](#history-the-old-strapi-model).

## Authentication & Authorization

### Auth.js (NextAuth v5) with Credentials

- Authentication is handled by **Auth.js v5 (NextAuth)** using a **Credentials provider**. Config lives in `src/lib/auth.js`.
- Passwords are hashed with **`bcryptjs` (10 rounds)** and stored as `passwordHash` on the Prisma `User` model. The field is marked private and is never returned to the client.
- On login, `authorize()` looks the user up by (lowercased, trimmed) email and verifies the password with `bcrypt.compare` — plaintext passwords are never stored or compared.

### Sessions

- The session uses the **JWT session strategy** (`session: { strategy: 'jwt' }`).
- The session token is stored in a **secure, HttpOnly cookie** set and signed by Auth.js using `AUTH_SECRET`.
- Because it is **HttpOnly**, the session token is **not readable by JavaScript**, which reduces the XSS token-theft surface.
- **Login now persists across page reloads.** This is an improvement over the old Strapi model, where the JWT was held in-memory only and the user was logged out on every refresh.

### Authorization model

- Protected API route handlers call **`auth()`** (from `src/lib/auth.js`) to read the session **server-side**.
- **No `Authorization: Bearer` header from the client is trusted** — the server derives identity from the signed session cookie, not from anything the client claims.

Endpoints that require a valid session:

| Endpoint | Notes |
|---|---|
| `POST /api/psychologists/:id/toggle-favorite` | Toggles a favorite for the logged-in user |
| `POST /api/psychologists/:id/reviews` | Adding a review requires login (prevents anonymous rating manipulation) |
| `POST /api/psychologists` (apply) | Application requires login; `user_email` is taken from the session, not the request body |
| `POST /api/appointments` | Booking requires login |
| `GET /api/appointments/mine` | Returns the user's own appointments |
| `DELETE /api/appointments/:id` (cancel) | Also checks `appt.email === session.user.email` (returns `403` otherwise) |
| `GET /api/me` | Current user profile |
| `DELETE /api/me` | Account deletion (cascade — see below) |
| `POST /api/reviews/dismiss` | Dismisses a review for the logged-in user |

- **Ownership check:** cancelling an appointment verifies the appointment's `email` matches the session user's email before deleting, so a logged-in user cannot cancel someone else's appointment.
- **No email spoofing:** the apply endpoint derives `user_email` from the session, so a client cannot bind a profile to someone else's address.
- **Data minimisation:** `src/lib/serialize.js` strips `user_email` from every public psychologist response, so profile owners' emails are never exposed.
- **Cascade delete:** `DELETE /api/me` deletes all of the user's appointments (`deleteMany` by email) **and any psychologist profile they created** (`deleteMany` by `user_email`), then deletes the user record — full GDPR erasure.

### Route protection (frontend)

| Route | Access |
|---|---|
| `/` | Public |
| `/psychologists` | Public |
| `/favorites` | Authenticated users only |

Booking an appointment requires login. Unauthenticated users hitting protected routes are redirected to the home page.

---

## Sensitive data

### Environment variables

| Variable | Where stored | Notes |
|---|---|---|
| `DATABASE_URL` | Vercel env vars | **Server-side only**, never shipped to the browser |
| `AUTH_SECRET` | Vercel env vars | **Server-side only** — signs/verifies the session cookie |

`.env` files are listed in `.gitignore` and are never committed.

> **Improvement:** unlike the old Vite frontend, where `VITE_STRAPI_URL` was baked into the client bundle, no environment value is now exposed to the browser. (That URL was not a secret, but the new model has no env surface in the client at all.)

### No secrets in the frontend

The frontend holds no API tokens, secrets, or admin credentials. All privileged operations are authorized server-side from the session cookie.

---

## Input handling

### Frontend

- Form inputs are controlled React state — no `dangerouslySetInnerHTML`.
- No raw HTML from the API is rendered without sanitization.
- Appointment and application forms validate required fields before submission.

### Backend (route handlers)

Validation happens in the Next.js route handlers, for example:

- **Register** (`src/app/api/register/route.js`): required fields, `username` length ≥ 3, email must contain `@`, `password` length ≥ 6, and a duplicate-email check returning `409`.
- **Reviews:** rating is clamped to the **1–5** range.
- Emails are normalized (lowercased, trimmed) before lookup/storage to avoid duplicate or mismatched accounts.
- Numeric path params (e.g. appointment `id`) are validated with `Number.isFinite` before use.

---

## CORS

There is **no cross-origin surface**. The frontend and the API are the **same Next.js app served from the same origin**, so there is no cross-origin token exposure and no CORS allowlist to maintain. (Under Strapi, a CORS allowlist had to be configured explicitly — see history below.)

---

## GDPR / privacy

These protections are **unchanged** from the previous model:

- **Cookie consent banner** shown on first visit.
- **`/privacy`** page describing data handling.
- **Consent checkboxes** on forms that collect personal data.
- **Right to erasure:** users can delete their account, now via **`DELETE /api/me`**, which cascades to remove their appointments **and any psychologist profile they created**, leaving no personal data behind.
- **`/privacy`** lists the actual data processors (**Neon** — EU/Frankfurt — and **Vercel**) and clarifies that only strictly-necessary session/CSRF cookies are used (no consent legally required).

---

## Dependency security

Keep dependencies up to date:

```bash
npm audit
npm update
```

Watch security advisories for the key auth/data dependencies: **Auth.js / NextAuth**, **bcryptjs**, **Prisma**, and **Next.js**.

---

## Known limitations

| Issue | Impact | Mitigation |
|---|---|---|
| No rate limiting on auth endpoints | Brute-force login attempts possible | Add rate limiting (middleware) or a WAF in front |
| `psy_favorites` / `psy_dismissed_reviews` stored as plain JSON on the user | No integrity check | Acceptable for this use case; validated by the toggle/dismiss endpoints |

---

## History: the old Strapi model

> The section below documents how authentication and security worked **before**
> the migration to Next.js + Auth.js. It is retained for reference only and no
> longer reflects the running system.

### JWT tokens (Strapi Users & Permissions)

- Authentication was handled by Strapi's **Users & Permissions** plugin.
- On login/register, Strapi returned a short-lived **JWT** token.
- The React app stored the token **in-memory only** (React context) — never in `localStorage` or cookies — and sent it as an `Authorization: Bearer <jwt>` header.
- On page refresh the session was cleared (the user had to log in again).
- A custom `delete-account` route verified the JWT to allow account deletion (the predecessor of today's `DELETE /api/me`).

### API endpoint permissions

Configured in Strapi → **Settings → Users & Permissions → Roles**:

| Role | Allowed actions |
|---|---|
| Public | `psychologist.find`, `psychologist.findOne`, `appointment.create` |
| Authenticated | All public actions + `toggleFavorite`, `appointment.find` (own), `users/me` |

### CORS (Strapi)

CORS was explicitly configured in `backend/config/middlewares.ts` with an allowlist of origins:

```typescript
{
  name: 'strapi::cors',
  config: {
    origin: [
      'http://localhost:5173',
      'https://psychologists-services-98v1.vercel.app',
      /^https:\/\/psychologists-services-.*\.vercel\.app$/,
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    keepHeaderOnError: true,
  },
}
```

### Environment variables (Strapi)

| Variable | Where stored | Notes |
|---|---|---|
| `VITE_STRAPI_URL` | Vercel env vars | Public — baked into the Vite client bundle (a URL, not a secret) |
| `APP_KEYS`, `JWT_SECRET`, etc. | Strapi Cloud env vars | Server-side only |
| `DATABASE_*` | Strapi Cloud env vars | Server-side only |

### What improved with the migration

- **Persistent sessions:** Auth.js stores the session in a signed, HttpOnly cookie, so login survives page reloads (the old in-memory JWT did not).
- **HttpOnly session token:** not readable by JavaScript, unlike a token held in app state.
- **No trusted client header:** the server reads identity from the session via `auth()` rather than trusting a client-supplied `Bearer` token.
- **No CORS surface:** same-origin frontend + API removes the need for a CORS allowlist and any cross-origin token exposure.
- **No env values in the browser:** the client bundle no longer carries even a backend URL.
