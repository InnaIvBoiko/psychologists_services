# Testing

## Stack

| Tool | Purpose |
|---|---|
| [Vitest](https://vitest.dev) | Test runner (native Vite integration) |
| [@testing-library/react](https://testing-library.com/react) | Render and query React components |
| [@testing-library/jest-dom](https://testing-library.com/jest-dom) | Custom DOM matchers (`toBeInTheDocument`, `toBeDisabled`, etc.) |
| [@testing-library/user-event](https://testing-library.com/user-event) | Simulate real user interactions |
| jsdom | Browser-like DOM environment for Node |

---

## Running tests

```bash
# Watch mode (re-runs on file change)
npm test

# Single run
npm run test:run

# Single run with coverage report
npm run test:coverage
```

Coverage report is written to `coverage/` and opened via `coverage/index.html`.

---

## Test files

```
src/
├── strapi/__tests__/
│   └── strapi.test.js            # API client functions
├── utils/__tests__/
│   └── availability.test.js      # Slot generation logic (see below)
├── hooks/__tests__/
│   └── useFavorites.test.js      # useFavorites custom hook
├── context/__tests__/
│   └── AuthContext.test.jsx      # AuthContext provider
└── components/
    ├── AppointmentModal/__tests__/
    │   ├── AppointmentModal.test.jsx  # Booking modal — auth notice, guest flow
    │   └── MiniCalendar.test.jsx      # Calendar component
    └── Header/__tests__/
        └── NotificationBell.test.jsx  # Notification bell + review prompt
```

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

---

### `strapi.test.js` — API client (16 tests)

Tests for all functions in `src/strapi/strapi.js`. Axios is mocked — no real HTTP calls are made.

| Function | Cases covered |
|---|---|
| `getPsychologists` | Maps Strapi v5 response (documentId, strapiId), empty array on error |
| `getPsychologistById` | Maps single item, returns null on error |
| `getUserFavorites` | Returns array, handles missing field, parses JSON string, skips call when no JWT |
| `getBookedSlots` | Extracts HH:MM from time_slot, guards against missing date, filters empty entries, empty array on error |
| `getUserAppointments` | Filters out past dates, sorts by time_slot, guards against missing email/token |
| `getPastAppointmentsForReview` | Filters to last 60 days, includes patient_name, returns empty array on error |
| `createAppointment` | Wraps payload in `data`, passes JWT header, throws readable error message on failure |
| `addReview` | POSTs to `/psychologists/:id/add-review`, passes JWT header, throws on error |
| `getDismissedReviews` | Reads `psy_dismissed_reviews` from `/users/me`, parses JSON string, returns `[]` on error |
| `dismissAppointmentReview` | POSTs to `/users/dismiss-review`, no-op when no JWT |
| `cancelAppointment` | DELETEs `/appointments/:documentId` with JWT header |

> **Note on `id` vs `documentId`:** Strapi v5 returns both a numeric `id` and a string `documentId`. The mapping code does `{ id: item.documentId, strapiId: String(item.id), ...item }` — because `...item` is spread last, it overwrites the `id` shortcut with the numeric value. The `documentId` string is accessible via `result.documentId`. Tests reflect this actual behavior.

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

Axios `post` and `getUserFavorites` are mocked.

| Scenario | What is verified |
|---|---|
| Initial state | `user`, `token` are null, `favorites` is empty |
| Successful login | `user.displayName` and `token` are set from response |
| Login + favorites | Favorites are fetched and stored after login |
| Login error | Promise rejects with the Strapi error message |
| Successful register | `user` and `token` are set |
| Logout | `user`, `token`, `favorites` are all cleared |

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

### Axios (strapi.test.js)

```js
vi.mock('axios', () => {
  const instance = { get: vi.fn(), post: vi.fn() }
  return { default: { create: vi.fn(() => instance) } }
})
```

The same mock instance is shared between the test file and the module under test, so `strapiApi.get.mockResolvedValueOnce(...)` directly controls what `strapi.js` receives.

### Context mocks (hooks / components)

```js
vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => mockAuth,
}))
```

A plain object (`mockAuth`) is mutated between tests to simulate different auth states (logged in, logged out).

### Strapi API mocks (components)

```js
vi.mock('../../strapi/strapi.js', () => ({
  getUserAppointments: (...args) => mockGetUserAppointments(...args),
  getPastAppointmentsForReview: (...args) => mockGetPastAppointmentsForReview(...args),
  getDismissedReviews: (...args) => mockGetDismissedReviews(...args),
  dismissAppointmentReview: (...args) => mockDismissAppointmentReview(...args),
  cancelAppointment: (...args) => mockCancelAppointment(...args),
}))
```

Each test controls the resolved value with `mockGetUserAppointments.mockResolvedValue(...)`.

---

## Configuration

**`vite.config.js`**
```js
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/test/setup.js',
}
```

**`src/test/setup.js`**
```js
import '@testing-library/jest-dom'
```

Imports jest-dom matchers globally so every test file can use `.toBeInTheDocument()`, `.toBeDisabled()`, etc. without importing them manually.
