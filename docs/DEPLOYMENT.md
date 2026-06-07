# Deployment Guide

The app is now a **single Next.js project** (UI + API in one codebase) deployed to **one Vercel project**, backed by a serverless PostgreSQL database on **Neon**.

| Part | Platform | Trigger |
|---|---|---|
| Next.js app (UI + API routes) | Vercel | Push to `main` |
| PostgreSQL database | Neon (serverless) | n/a (managed) |

> **History note:** the project previously used a two-deployment architecture (React+Vite frontend on Vercel + Strapi backend on Strapi Cloud). That setup is preserved below under [Appendix — Previous architecture (Strapi)](#appendix--previous-architecture-strapi) for reference.

---

## Next.js app — Vercel

### First deploy

1. Push the repository to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project**.
3. Import the repository. Vercel auto-detects **Next.js** — leave the root directory as `/`.
4. The build command is `prisma generate && next build` (already the `build` script in `package.json`). Vercel runs it automatically; no override needed.
5. Under **Settings → Environment Variables**, add the variables below.
6. Click **Deploy**.

### Subsequent deploys

Every push to `main` triggers an automatic redeploy.

### Environment variables (Vercel → Settings → Environment Variables)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon **pooled** connection string (see below). |
| `DIRECT_URL` | ✅ | Neon **direct** (non-pooled) string — same host without `-pooler`; used by `prisma migrate deploy`. |
| `AUTH_SECRET` | ✅ | Auth.js secret. Generate with `npx auth secret`. |
| `ADMIN_EMAILS` | ✅ | Comma-separated emails allowed into `/admin`. |
| `AUTH_URL` | — | **Not required** — Vercel sets this automatically. |
| `RESEND_API_KEY` | optional | Enables booking confirmation emails. Unset → emails are a no-op. |
| `EMAIL_FROM` | optional | Sender address. Empty → Resend sandbox sender (delivers only to your own Resend account email). Set `"Name <no-reply@yourdomain.com>"` after verifying a domain. |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | optional | Enables rate limiting. Unset → limiting is off. |

> Use the **pooled** connection string from the Neon dashboard (the host ends in `-pooler`). Serverless functions open many short-lived connections, and the pooler is what keeps that within Neon's limits. `prisma migrate` needs the **direct** URL because the pooler can't hold migration advisory locks.
>
> The optional services **degrade gracefully**: with their vars unset, the feature is skipped and the app keeps working.

---

## Database — Neon

[Neon](https://neon.tech) provides serverless PostgreSQL on a **free tier** that is sufficient for this project.

### Create the database

1. Sign up at [neon.tech](https://neon.tech) and create a project.
2. Copy the **pooled** connection string from the dashboard.
3. Set it as `DATABASE_URL` in Vercel (and locally in `.env` for development).

### First-time database setup

Run these once against the production Neon database (locally, with `DATABASE_URL` pointing at the production Neon connection string):

```bash
# Create tables from prisma/schema.prisma in Neon
npm run db:push

# Import the 15 psychologists from src/data/psychologists.json
npm run db:seed
```

> `db:push` creates the schema; `db:seed` populates the initial psychologist data. After the first run, normal deploys do not need either step.

### Cold starts

Neon's free tier suspends idle compute, but it **resumes in ~0.5s** on the next query — fast enough that no keep-alive pinger is needed.

---

## npm scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Local development server. |
| `build` | `prisma generate && next build` | Production build (run by Vercel). |
| `start` | `next start` | Run the production build locally. |
| `db:push` | `prisma db push` | Sync schema to the database (creates tables). |
| `db:migrate` | `prisma migrate dev` | Create/apply a dev migration. |
| `db:seed` | `node prisma/seed.js` | Seed psychologists from `src/data/psychologists.json`. |
| `db:studio` | `prisma studio` | Browse the database in Prisma Studio. |
| `test` | `vitest` | Run tests in watch mode. |
| `test:run` | `vitest run` | Run tests once. |
| `test:coverage` | `vitest run --coverage` | Run tests with coverage. |

---

## Why the single deployment is better

Migrating from the old two-deployment Strapi setup to one Next.js + Neon deployment brings:

- **€0** — both Vercel and Neon free tiers cover this project.
- **One deploy** — UI and API ship together from a single project; no version skew between front and back.
- **No CORS** — UI and API share the same origin, so there is no allowlist to maintain.
- **No keep-alive pinger** — UptimeRobot is no longer needed.
- **~0.5s wake** — Neon resumes near-instantly instead of the old ~20–30s Strapi cold start.
- **Zero maintenance** — no separate backend instance, secrets, or monitor to babysit.

---

## Appendix — Previous architecture (Strapi)

> **Historical.** This section documents the **old** two-deployment setup (before the migration to Next.js + Neon). It is kept for reference only and no longer reflects how the app is deployed.

The project used to be split into two independent deployments:

| Part | Platform | Trigger |
|---|---|---|
| Frontend (React + Vite) | Vercel | Push to `main` |
| Backend (Strapi v5) | Strapi Cloud | Push to `main` |

### Frontend — Vercel (old)

1. Push the repository to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** and import the repository.
3. Leave the root directory as `/` (Vite was detected automatically).
4. A `vercel.json` SPA rewrite routed all paths to `index.html`.
5. Under **Environment Variables**, add:
   ```
   VITE_STRAPI_URL = https://your-strapi-app.strapiapp.com
   ```
6. Click **Deploy**. Every push to `main` triggered an automatic redeploy.

| Variable | Description |
|---|---|
| `VITE_STRAPI_URL` | Full URL of the Strapi instance (no trailing slash). |

> `VITE_*` variables are baked in at **build time**, not runtime. After changing the value you had to **redeploy** (a redeploy without build cache was safest) — existing builds kept the old value.

> If the variable was missing, the app threw a clear error at startup (`VITE_STRAPI_URL is not defined…`) instead of silently building `undefined/api/...` URLs that returned a misleading 404.

### Backend — Strapi Cloud (old)

1. Go to [cloud.strapi.io](https://cloud.strapi.io) → **Create project**.
2. Connect your GitHub repository.
3. Set the **root directory** to `backend`.
4. Configure environment variables (below).
5. Deploy. Every push to `main` triggered an automatic redeploy.

| Variable | Description |
|---|---|
| `APP_KEYS` | Comma-separated random keys (e.g. `openssl rand -base64 32`). |
| `API_TOKEN_SALT` | Random salt. |
| `ADMIN_JWT_SECRET` | Secret for admin panel JWT. |
| `TRANSFER_TOKEN_SALT` | Random salt. |
| `ENCRYPTION_KEY` | Random key. |
| `JWT_SECRET` | Secret for user JWT tokens. |
| `DATABASE_CLIENT` | `postgres` |
| `DATABASE_HOST` | Provided by Strapi Cloud. |
| `DATABASE_PORT` | `5432` |
| `DATABASE_NAME` | Provided by Strapi Cloud. |
| `DATABASE_USERNAME` | Provided by Strapi Cloud. |
| `DATABASE_PASSWORD` | Provided by Strapi Cloud. |
| `DATABASE_SSL` | `true` |

> Strapi Cloud provisioned PostgreSQL automatically; the connection details were available in the project dashboard.

### Cold starts (Strapi Cloud free tier slept)

Strapi Cloud's free tier put the instance to **sleep after inactivity**. The first request after sleep was a **cold start** (~20–30s measured) and could surface as a slow load, a timeout, or a `503`.

- **Mitigation (frontend):** the axios API client tolerated cold starts with a 45s timeout + GET retries, so a sleeping backend did not break the first page load.
- **Mitigation (keep-alive):** an **UptimeRobot** monitor pinged the instance (`/_health` every 5 min) to reduce sleeping. The free interval was not always enough to fully avoid cold starts.
- **Definitive fix:** a paid Strapi Cloud plan that did not sleep.

### Strapi admin: after first deploy (old)

1. Open `https://your-strapi-app.strapiapp.com/admin`.
2. Create the admin account.
3. **Settings → Users & Permissions → Roles → Public**, enable:
   - `psychologist`: `find`, `findOne`
   - `appointment`: `create`
4. **Roles → Authenticated**, enable:
   - `psychologist`: `find`, `findOne`, `create`, `toggleFavorite`
   - `appointment`: `find`, `create`
   - `users-permissions/user`: `me`
5. Run the seed script locally pointing to the production URL:
   ```bash
   VITE_STRAPI_URL=https://your-strapi-app.strapiapp.com node seed.js
   ```
   > The seed script required an API token. Create one in **Settings → API Tokens**.

### CORS (old)

Strapi's CORS allowlist lived in `backend/config/middlewares.ts` and permitted the local dev origin (`localhost:5173`), the production `*.vercel.app` domain, and preview deploys:

```typescript
// backend/config/middlewares.ts
{
  name: 'strapi::cors',
  config: {
    origin: ['http://localhost:5173', 'https://your-app.vercel.app'],
  },
}
```

> In the current Next.js setup this is unnecessary — UI and API share the same origin, so there is no CORS configuration at all.
