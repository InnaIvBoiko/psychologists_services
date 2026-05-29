# Deployment Guide

The project is split into two independent deployments:

| Part | Platform | Trigger |
|---|---|---|
| Frontend (React) | Vercel | Push to `main` |
| Backend (Strapi) | Strapi Cloud | Push to `main` |

---

## Frontend — Vercel

### First deploy

1. Push the repository to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import the repository
4. Leave the root directory as `/` (Vite is detected automatically)
5. Under **Environment Variables**, add:
   ```
   VITE_STRAPI_URL = https://your-strapi-app.strapiapp.com
   ```
6. Click **Deploy**

### Subsequent deploys

Every push to `main` triggers an automatic redeploy.

### Environment variables

| Variable | Description |
|---|---|
| `VITE_STRAPI_URL` | Full URL of the Strapi instance (no trailing slash) |

> `VITE_*` variables are baked in at **build time**, not runtime. After adding or changing the value, you must **redeploy** (a redeploy without build cache is safest) — existing builds keep the old value.

> If the variable is missing, the app now **throws a clear error at startup** (`VITE_STRAPI_URL is not defined…`) instead of silently building `undefined/api/...` URLs that return a misleading 404.

---

## Backend — Strapi Cloud

### First deploy

1. Go to [cloud.strapi.io](https://cloud.strapi.io) → **Create project**
2. Connect your GitHub repository
3. Set the **root directory** to `backend`
4. Configure environment variables (see below)
5. Deploy

### Environment variables (Strapi Cloud)

| Variable | Description |
|---|---|
| `APP_KEYS` | Comma-separated random keys (e.g. `openssl rand -base64 32`) |
| `API_TOKEN_SALT` | Random salt |
| `ADMIN_JWT_SECRET` | Secret for admin panel JWT |
| `TRANSFER_TOKEN_SALT` | Random salt |
| `ENCRYPTION_KEY` | Random key |
| `JWT_SECRET` | Secret for user JWT tokens |
| `DATABASE_CLIENT` | `postgres` |
| `DATABASE_HOST` | Provided by Strapi Cloud |
| `DATABASE_PORT` | `5432` |
| `DATABASE_NAME` | Provided by Strapi Cloud |
| `DATABASE_USERNAME` | Provided by Strapi Cloud |
| `DATABASE_PASSWORD` | Provided by Strapi Cloud |
| `DATABASE_SSL` | `true` |

> Strapi Cloud provisions PostgreSQL automatically. The connection details are available in the project dashboard.

### Subsequent deploys

Every push to `main` triggers an automatic redeploy of the backend.

### Cold starts (free tier sleeps)

Strapi Cloud's free tier puts the instance to **sleep after inactivity**. The first request after sleep is a **cold start** (~20–30s measured) and can otherwise surface as a slow load, a timeout, or a `503`.

- **Mitigation (frontend):** the API client tolerates cold starts with a 45s timeout + GET retry (see [ARCHITECTURE — Strapi API client](ARCHITECTURE.md#strapi-api-client-strapistrapijs)), so a sleeping backend no longer breaks the first page load.
- **Mitigation (keep-alive):** an UptimeRobot monitor pings the instance to reduce sleeping. The free interval is 5 min, which is not always enough — verify the monitor is active and points at a real endpoint (e.g. `/api/psychologists`).
- **Definitive fix:** a paid Strapi Cloud plan that does not sleep.

---

## Strapi admin: after first deploy

1. Open `https://your-strapi-app.strapiapp.com/admin`
2. Create the admin account
3. Go to **Settings → Users & Permissions → Roles → Public** and enable:
   - `psychologist`: `find`, `findOne`
   - `appointment`: `create`
4. Go to **Roles → Authenticated** and enable:
   - `psychologist`: `find`, `findOne`, `create`, `toggleFavorite`
   - `appointment`: `find`, `create`
   - `users-permissions/user`: `me`
5. Run the seed script locally pointing to the production URL to populate initial data:
   ```bash
   VITE_STRAPI_URL=https://your-strapi-app.strapiapp.com node seed.js
   ```
   > The seed script requires an API token. Create one in **Settings → API Tokens**.

---

## CORS

Strapi's default CORS config (`backend/config/middlewares.ts`) allows all origins in development. For production, you may want to restrict it to your Vercel domain:

```typescript
// backend/config/middlewares.ts
{
  name: 'strapi::cors',
  config: {
    origin: ['https://your-app.vercel.app'],
  },
}
```
