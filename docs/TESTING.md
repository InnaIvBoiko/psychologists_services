# Testing

Testing happens at two levels:

- **Component / unit** — [Vitest](https://vitest.dev) + Testing Library, in `src/**`. Fast, isolated, fully mocked (no DB, no network). Covered in the bulk of this document.
- **End-to-end** — [Playwright](https://playwright.dev) drives the real app (App Router + Auth.js + Prisma/Neon) in a browser, in `e2e/**`. See [End-to-end (Playwright)](#end-to-end-playwright).

Both run in CI on every pull request (`.github/workflows/ci.yml` and `e2e.yml`).

## Stack

| Tool | Level | Purpose |
|---|---|---|
| [Vitest](https://vitest.dev) | unit | Test runner (native Vite integration) |
| [@testing-library/react](https://testing-library.com/react) | unit | Render and query React components |
| [@testing-library/jest-dom](https://testing-library.com/jest-dom) | unit | Custom DOM matchers (`toBeInTheDocument`, `toBeDisabled`, etc.) |
| [@testing-library/user-event](https://testing-library.com/user-event) | unit | Simulate real user interactions |
| jsdom | unit | Browser-like DOM environment for Node |
| [@playwright/test](https://playwright.dev) | e2e | Browser automation + assertions against the running app |

---

## Running tests

```bash
# --- Component / unit (Vitest) ---
npm test               # watch mode (re-runs on file change)
npm run test:run       # single run
npm run test:coverage  # single run with coverage report

# --- End-to-end (Playwright) ---
npm run test:e2e         # run the suite (auto-starts the app)
npm run test:e2e:ui      # interactive UI mode
npm run test:e2e:report  # open the last HTML report
```

Coverage report is written to `coverage/` and opened via `coverage/index.html`.

---

## Test files

```
src/
├── lib/
│   ├── admin.test.js             # isAdminEmail allowlist
│   └── email.test.js             # Resend confirmation email (no-op, POST, HTML-escape, no-throw)
├── hooks/__tests__/
│   └── useFavorites.test.js      # useFavorites custom hook
├── context/__tests__/
│   └── AuthContext.test.jsx      # AuthContext provider (Auth.js)
├── test/
│   └── intl.jsx                  # Helper: render() wrapped in NextIntlClientProvider (en)
└── components/
    ├── AppointmentModal/__tests__/
    │   ├── AppointmentModal.test.jsx  # Booking modal — auth notice, guest flow
    │   └── MiniCalendar.test.jsx      # Calendar component
    └── Header/__tests__/
        └── NotificationBell.test.jsx  # Notification bell + review prompt
```

> **Migration note (Strapi → Next.js):** the data layer now lives in `src/lib/api.js` and is mocked as `@/lib/api`. The old `src/strapi/` directory — including `src/strapi/__tests__/strapi.test.js` — was removed. Page bodies have moved to `src/views/`; component tests remain under `src/components/**/__tests__`.

> **i18n note:** components that call `useTranslations`/`useLocale` are rendered via `src/test/intl.jsx`, whose `render()` wraps them in a `NextIntlClientProvider` with the English catalog — so assertions match the real English copy. Locale-dependent expectations (e.g. `Intl` weekday names "Mon"/"Tue") were updated accordingly.

**Current status:** the full suite passes — **7 test files, 58 tests green** (component/unit). The Playwright e2e suite adds **18 tests** across 6 spec files — see [End-to-end (Playwright)](#end-to-end-playwright).

---

## What is tested

### `availability.test.js` — Slot generation utility

Pure functions in `src/utils/availability.js` — no mocks needed.

| Function | Cases to cover |
|---|---|
| `parseAvailability` | Returns defaults when `null`; parses JSON string; merges with defaults |
| `isWorkingDay` | Returns `true` for enabled days, `false` for disabled days, `false` for Sundays (disabled by default) |
| `generateSlots` | Correct slot list for Mon–Fri; empty array for disabled day; respects custom start/end/duration; returns `[]` when no date given |
| `generateTimeOptions` | Returns options starting at `06:00`, ending at `22:00`, step 30 min |

> This file is listed in the test tree but not yet created — it is a pure utility with no dependencies and is a good candidate for the next round of tests.

> **Removed in the migration:** the dedicated `src/strapi/__tests__/strapi.test.js` (16 tests for the Strapi axios client) was deleted together with `src/strapi/`. Data-layer functions now live in `src/lib/api.js` and are exercised indirectly through the component and context tests that mock `@/lib/api`.

---

### `useFavorites.test.js` — Custom hook (8 tests)

`useAuth` context and `togglePsychologistFavorite` are mocked.

| Method | Cases covered |
|---|---|
| `getFavorites()` | Returns favorites array, returns `[]` when no user |
| `isFavorite(psy)` | True when in favorites, false when not, false when no user, fallback to `id` when `strapiId` absent |
| `toggleFavorite(psy)` | Optimistic add, optimistic remove, no-op when no user |

---

### `AuthContext.test.jsx` — Auth provider (6 tests)

> **Rewritten in the migration.** Authentication now goes through Auth.js (NextAuth) instead of a direct Strapi login. This file no longer mocks `axios` + `strapi.js`; it mocks `next-auth/react` (`useSession`, `signIn`, `signOut`, `SessionProvider`) and `@/lib/api` (`getUserFavorites`, `deleteAccount`). The `token` value is always `null` now — the session is managed by Auth.js rather than a stored JWT.

| Scenario | What is verified |
|---|---|
| Initial state | Starts logged-out: `user` is null, `token` is null, `favorites` is empty |
| Authenticated session | When `useSession` reports an authenticated user, the provider exposes that user and loads their favorites via `getUserFavorites` (`token` stays `null`) |
| `login` | Calls `signIn('credentials', { email, password, redirect: false })` |
| Login error | Rejects with `Invalid email or password` when `signIn` returns an error |
| `register` | POSTs to `/api/register`, then calls `signIn('credentials', …)` |
| `logout` | Calls `signOut` |

---

### `AppointmentModal.test.jsx` — Booking modal (9 tests)

`useAuth`, `getBookedSlots`, `createAppointment`, `MiniCalendar`, and `AuthModal` are mocked.

| Scenario | What is verified |
|---|---|
| Auth notice visible | Banner shown when user is not logged in |
| Auth notice hidden | Banner not rendered when user is logged in |
| Log In button | Opens `AuthModal` in `login` mode |
| Register button | Opens `AuthModal` in `register` mode |
| AuthModal closes | Banner returns after `onClose` is called on `AuthModal` |
| "Send as a guest" | Submit button label when not logged in |
| "Send" | Submit button label when logged in |
| `getBookedSlots` with `documentId` | When date selected, first arg is `psychologist.documentId` (not numeric `id`) |
| `createAppointment` with `documentId` | On submit, `psychologist_id` in payload equals `psychologist.documentId` |

**Mocking strategy:**
- `MiniCalendar` is replaced by a single button that fires `onChange('2025-06-16')` — removes calendar layout complexity from these tests
- `AuthModal` is stubbed with a `data-testid` and `data-mode` attribute so mode can be asserted without rendering the real form

---

### `MiniCalendar.test.jsx` — Calendar component (9 tests)

`vi.useFakeTimers()` pins "today" to `2025-06-15` for deterministic results.

| Scenario | What is verified |
|---|---|
| Initial render | Shows correct month/year label |
| Day headers | All 7 short day names rendered |
| Past days | Days before today are `disabled` |
| Today / future days | Not disabled |
| Non-working days | `isDisabledDay` prop disables specific dates (strikethrough style) |
| Day click | `onChange` called with `"YYYY-MM-DD"` ISO string |
| Selected day | Button has `selected` CSS class |
| Next month | Label updates to next month |
| Prev month | Label updates to previous month |
| Year wrap backward | January → December of previous year |
| Year wrap forward | December → January of next year |

---

### `NotificationBell.test.jsx` — Notification bell + review prompt + cancel (16 tests)

`useAuth`, `getUserAppointments`, `getPastAppointmentsForReview`, `getDismissedReviews`, `dismissAppointmentReview`, `cancelAppointment` are mocked. `ReviewModal` and `CancelModal` are stubbed with minimal test elements.

| Scenario | What is verified |
|---|---|
| Bell renders | Button with accessible label is present |
| No badge | No number shown when no appointments and no pending reviews |
| Badge count (upcoming) | Shows correct count from upcoming appointments |
| Badge count (combined) | Badge = upcoming + pending reviews |
| Badge overflow | Shows `9+` when total count exceeds 9 |
| Opens dropdown | Dropdown header visible after click |
| Appointment list | Doctor names shown in upcoming section |
| Cancel button visible | Shown for appointments > 24h away |
| Cancel button hidden | NOT shown for appointments within 24h |
| Cancel opens modal | Clicking Cancel button renders `CancelModal` |
| Cancel confirmed | Calls `cancelAppointment(documentId, token)` and removes from list |
| Rate your sessions | Section shown when there are pending reviews |
| Dismiss | Removes review from list |
| Review button | Opens `ReviewModal` |
| Empty state | "No upcoming appointments" message shown |
| Toggle close | Second click hides the dropdown |
| No user | Component returns null |

---

## Mocking strategy

### Auth.js (AuthContext.test.jsx)

```js
vi.mock('next-auth/react', () => ({
  useSession: () => sessionValue,
  signIn: (...args) => mockSignIn(...args),
  signOut: (...args) => mockSignOut(...args),
  SessionProvider: ({ children }) => children,
}))
```

A mutable `sessionValue` object simulates logged-out vs authenticated states, and the `signIn` / `signOut` spies let tests assert how the provider drives Auth.js.

### Context mocks (hooks / components)

```js
vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => mockAuth,
}))
```

A plain object (`mockAuth`) is mutated between tests to simulate different auth states (logged in, logged out).

### Data-layer mocks (components)

The data layer is now mocked via its `@` alias (`@/lib/api`) instead of the old `../../strapi/strapi.js` path. For example, `NotificationBell.test.jsx`:

```js
vi.mock('@/lib/api', () => ({
  getUserAppointments: (...args) => mockGetUserAppointments(...args),
  getPastAppointmentsForReview: (...args) => mockGetPastAppointmentsForReview(...args),
  getDismissedReviews: (...args) => mockGetDismissedReviews(...args),
  dismissAppointmentReview: (...args) => mockDismissAppointmentReview(...args),
  cancelAppointment: (...args) => mockCancelAppointment(...args),
}))
```

`AppointmentModal.test.jsx` likewise mocks `@/lib/api` (for `getBookedSlots` and `createAppointment`). Each test controls the resolved value with `mockGetUserAppointments.mockResolvedValue(...)`.

---

## Configuration

The test runner config moved from `vite.config.js` to **`vitest.config.js`**. The app itself now builds with Next.js — Vitest continues to run on Vite, but only for the test suite. The config also defines an `@` → `./src` alias so tests can import (and mock) modules such as `@/lib/api`.

**`vitest.config.js`**
```js
import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    // Playwright e2e specs live in /e2e and run via `npm run test:e2e`, not Vitest.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
```

> The Playwright specs are named `*.spec.js`, which Vitest's default glob would otherwise pick up. The `exclude` line keeps the two runners from colliding — Vitest owns `src/**`, Playwright owns `e2e/**`.

**`src/test/setup.js`** (unchanged)
```js
import '@testing-library/jest-dom'
```

Imports jest-dom matchers globally so every test file can use `.toBeInTheDocument()`, `.toBeDisabled()`, etc. without importing them manually.

---

## End-to-end (Playwright)

E2E tests exercise the application as a user does: a real browser, the real Next.js server, the real database. They complement — not replace — the mocked component tests above.

### Running

```bash
npm run test:e2e         # headless run (auto-starts the app)
npm run test:e2e:ui      # interactive UI mode (watch, time-travel)
npm run test:e2e:report  # open the last HTML report
```

First run only, install the browser binary:

```bash
npx playwright install chromium
```

The app is started automatically by Playwright's `webServer` (`playwright.config.js`). Locally an already-running dev server on `:3000` is **reused**, so the suite starts instantly; otherwise `npm run dev` is launched. The suite expects the database to be **migrated and seeded** (`npx prisma migrate deploy && npm run db:seed`).

### Layout

```
e2e/
├── helpers.js            # uniqueEmail(), openAuthModal(), registerNewUser() + constants
├── global-teardown.js    # Prisma sweep of leftover test users (e2e- email prefix)
├── home.spec.js          # hero, CTAs, bare-root → locale redirect
├── navigation.spec.js    # header links, member-only links hidden, unknown route → 404
├── psychologists.spec.js # server-rendered list, search, "Load more", A→Z sort
├── i18n.spec.js          # en ↔ it language switch, cookie persistence, IT deep links
├── auth.spec.js          # modal UI + validation, self-cleaning register→delete lifecycle
└── protected-routes.spec.js  # /favorites guest redirect, /admin hidden for non-admins
```

### What is tested (18 tests)

| Spec | Scenarios |
|---|---|
| `home` | Hero headline/CTAs/stats render · "Get started" routes to the list · `/` redirects to a locale-prefixed URL |
| `navigation` | Public nav links shown, Favorites/Admin hidden when logged out · Psychologists link routes to the list · unknown route renders the not-found page (404) |
| `psychologists` | Server-renders the first page (3 of the seeded set) with "Load more" · "Load more" reveals the next page · search filters and clears (incl. empty state) · filter dropdown sorts A→Z |
| `i18n` | Language switcher moves en ↔ it and translates nav/content · choice persists across reload (cookie) · Italian deep links render directly |
| `auth` | Login modal opens, switches to register, validates empty submit · demo-admin "Fill in" prefills the form · **lifecycle:** register a fresh account → session survives reload → delete account via the UI → confirm login then fails |
| `protected-routes` | `/favorites` redirects guests home · `/admin` renders the not-found page for non-admins |

### Database hygiene

There is no separate test database — e2e runs against the same Postgres the app uses. Two safeguards keep it clean:

1. **Self-cleaning lifecycle.** The auth test registers a throwaway account with a unique, prefixed email (`e2e-…@playwright.test`) and deletes it through the UI at the end of the test.
2. **Global teardown.** `e2e/global-teardown.js` runs after the suite and removes (via Prisma) any user whose email still carries the `e2e-` prefix — a safety net for a test that failed mid-flow. Cleanup failures are logged, not fatal.

### Two gotchas worth knowing

- **`notFound()` on a `force-dynamic` route streams HTTP 200.** The `/admin` page calls `notFound()` for non-admins, but because the route is dynamic the document status is 200, not 404. The test asserts on the rendered not-found **content** ("Page not found") rather than the status code. (A genuinely unknown route — handled by the router, not streamed — does return 404, and `navigation.spec.js` asserts that.)
- **Role-name matching is a substring.** `getByRole('link', { name: 'Psychologists' })` also matches the `psychologists.services` logo link, so the nav assertions pass `{ exact: true }`.

### CI

`.github/workflows/e2e.yml` runs the suite on every PR and on push to `main`:

- Spins up a disposable **`postgres:16` service container** (no production secrets — `DATABASE_URL`, `AUTH_SECRET`, etc. are throwaway CI values; Upstash/Resend are left unset and degrade to no-ops).
- `prisma migrate deploy` → `npm run db:seed` → `npx playwright install --with-deps chromium` → `npm run build`.
- Runs against the **production server** (`PLAYWRIGHT_WEB_SERVER=npm run start`) instead of `next dev`, avoiding slow first-request compilation.
- Uploads `playwright-report/` as a build artifact (kept 7 days), even on failure.
