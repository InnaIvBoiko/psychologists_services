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
├── hooks/__tests__/
│   └── useFavorites.test.js      # useFavorites custom hook
├── context/__tests__/
│   └── AuthContext.test.jsx      # AuthContext provider
└── components/
    ├── AppointmentModal/__tests__/
    │   └── MiniCalendar.test.jsx  # Calendar component
    └── Header/__tests__/
        └── NotificationBell.test.jsx  # Notification bell component
```

---

## What is tested

### `strapi.test.js` — API client (16 tests)

Tests for all functions in `src/strapi/strapi.js`. Axios is mocked — no real HTTP calls are made.

| Function | Cases covered |
|---|---|
| `getPsychologists` | Maps Strapi v5 response (documentId, strapiId), empty array on error |
| `getPsychologistById` | Maps single item, returns null on error |
| `getUserFavorites` | Returns array, handles missing field, parses JSON string, skips call when no JWT |
| `getBookedSlots` | Extracts HH:MM from time_slot, guards against missing date, filters empty entries, empty array on error |
| `getUserAppointments` | Filters out past dates, sorts by time_slot, guards against missing email/token |
| `createAppointment` | Wraps payload in `data`, passes JWT header, throws readable error message on failure |

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

### `MiniCalendar.test.jsx` — Calendar component (9 tests)

`vi.useFakeTimers()` pins "today" to `2025-06-15` for deterministic results.

| Scenario | What is verified |
|---|---|
| Initial render | Shows correct month/year label |
| Day headers | All 7 short day names rendered |
| Past days | Days before today are `disabled` |
| Today / future days | Not disabled |
| Day click | `onChange` called with `"YYYY-MM-DD"` ISO string |
| Selected day | Button has `selected` CSS class |
| Next month | Label updates to next month |
| Prev month | Label updates to previous month |
| Year wrap backward | January → December of previous year |
| Year wrap forward | December → January of next year |

---

### `NotificationBell.test.jsx` — Notification bell (8 tests)

`useAuth` and `getUserAppointments` are mocked.

| Scenario | What is verified |
|---|---|
| Bell renders | Button with accessible label is present |
| No badge | No number shown when appointments list is empty |
| Badge count | Shows correct count (e.g. `2`) |
| Badge overflow | Shows `9+` when more than 9 appointments |
| Opens dropdown | Dropdown header visible after click |
| Appointment list | Doctor names shown in dropdown |
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
