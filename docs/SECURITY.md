# Security

## Authentication & Authorization

### JWT tokens

- Authentication is handled by Strapi's **Users & Permissions** plugin
- On login/register, Strapi returns a short-lived JWT token
- The token is stored **in-memory only** (React context) — never written to `localStorage` or cookies
- On page refresh the session is cleared (user must log in again)
- Any leftover `localStorage` keys (`user`, `jwt`, `psy_favorites`) are actively removed on app startup

### Route protection

| Route | Access |
|---|---|
| `/` | Public |
| `/psychologists` | Public |
| `/favorites` | Authenticated users only |

Unauthenticated users hitting `/favorites` are redirected to `/` by `ProtectedRoute`.

### API endpoint permissions

Configured in Strapi → **Settings → Users & Permissions → Roles**:

| Role | Allowed actions |
|---|---|
| Public | `psychologist.find`, `psychologist.findOne`, `appointment.create` |
| Authenticated | All public actions + `psychologist.create` (draft), `toggleFavorite`, `appointment.find` (own), `users/me` |

> Appointments are filtered by the user's email client-side. For stricter isolation, consider a custom policy that enforces `filters[email][$eq] = ctx.state.user.email` server-side.

---

## Sensitive data

### Environment variables

| Variable | Where stored | Notes |
|---|---|---|
| `VITE_STRAPI_URL` | Vercel env vars | Public (exposed to browser via Vite) |
| `APP_KEYS`, `JWT_SECRET`, etc. | Strapi Cloud env vars | Server-side only, never exposed |
| `DATABASE_*` | Strapi Cloud env vars | Server-side only |

`.env` files are listed in `.gitignore` and are never committed.

> `VITE_STRAPI_URL` is intentionally public — it is the API base URL, not a secret.

### No secrets in the frontend

The frontend does not hold any API tokens or admin credentials. All privileged operations require a valid user JWT obtained through login.

---

## Input handling

### Frontend

- Form inputs are controlled React state — no `dangerouslySetInnerHTML`
- No raw HTML from the API is rendered without sanitization
- Appointment and application forms validate required fields before submission

### Backend

- Strapi validates all incoming data against the content type schema
- Unknown or extra fields are stripped automatically
- The `status` field for draft creation is passed as a **query parameter** (`?status=draft`), not in the request body — Strapi v5 rejects `status` in the body with a 400 error

---

## CORS

CORS is explicitly configured in `backend/config/middlewares.ts`. Allowed origins:

- `http://localhost:5173` (local dev)
- `https://psychologists-services-98v1.vercel.app` (production)
- All `https://psychologists-services-*.vercel.app` preview deployments (regex match)

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

---

## Strapi admin panel

- Admin panel is available at `/admin` — accessible only with admin credentials
- New psychologist applications arrive as **drafts** and must be manually reviewed and published by an admin before becoming visible on the site
- Admin credentials are never stored in the codebase

---

## Dependency security

Keep dependencies up to date:

```bash
# Frontend
npm audit
npm update

# Backend
cd backend
npm audit
npm update
```

Strapi releases security patches regularly — follow the [Strapi changelog](https://github.com/strapi/strapi/releases).

---

## Known limitations

| Issue | Impact | Mitigation |
|---|---|---|
| Appointment filtering by email is client-side | A user could query another user's appointments by manipulating the API call | Add a server-side policy enforcing `email = authenticated user's email` |
| JWT in-memory only | Session lost on page refresh | By design — avoids XSS risk from localStorage |
| No rate limiting on `/api/auth` | Brute-force login attempts possible | Enable Strapi's rate-limit plugin or add a WAF in front |
| `psy_favorites` stored as plain JSON on user | No integrity check | Acceptable for this use case; validated by the toggle endpoint |
