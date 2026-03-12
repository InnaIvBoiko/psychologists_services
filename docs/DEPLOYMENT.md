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

> Without this variable, all API calls will fail with `undefined` in the URL.

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
