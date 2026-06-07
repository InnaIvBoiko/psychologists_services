# Component Reference

All components use CSS Modules for scoped styling. Each component lives in its own folder with a `.jsx` and `.module.css` file.

> **Migration note (Strapi → Next.js).** The React components themselves are essentially unchanged, but a few shared dependencies moved:
> - **Data layer:** components now import from `@/lib/api` (was `src/strapi/strapi.js`, an Axios client talking to Strapi). The function names and behavior are the same.
> - **Routing:** components import `Link` / `NavLink` / `useNavigate` from `@/lib/router` (a thin shim over `next/navigation`) instead of `react-router-dom`. They are used exactly as before.
> - **Page bodies:** the page components moved from `src/pages/` to `src/views/` (the name `pages/` collides with Next.js). Paths below reflect the new location.
> - **Auth:** `AuthContext` keeps the same public API but is now backed by Auth.js (NextAuth) with cookie-based sessions. See the [AuthContext](#authcontext) note below.
> - **App shell:** Next.js files live under `src/app/[locale]/` — `layout.jsx` (root layout, `<html lang>`, `NextIntlClientProvider`) and `providers.jsx` (skip link + `SessionProvider` + `AuthProvider` + `Header` / `Footer` / `CookieBanner`).

> **i18n note.** UI strings come from `useTranslations('Namespace')` (next-intl), with catalogs in `messages/{en,it}.json`. Rich text uses `t.rich`; dates use the `Intl` API via `src/i18n/format.js`. Adding/renaming visible text means updating both catalogs.

---

## Internationalization & shared UI helpers

| Component | Path | Purpose |
|---|---|---|
| `LanguageSwitcher` | `components/Header/LanguageSwitcher.jsx` | IT/EN toggle (rendered in the **home hero**); switches locale via next-intl navigation, persisted in a cookie |
| `Skeleton` | `components/Skeleton/Skeleton.jsx` | Shimmer placeholder primitive (`prefers-reduced-motion` aware); `PsychologistCardSkeleton` builds card-shaped placeholders for `loading.jsx` |
| `ErrorState` | `views/ErrorState/ErrorState.jsx` | Shared UI for `app/[locale]/error.jsx` and `global-error.jsx` — friendly message, "Try again" (reset), collapsed technical details |

---

## Header

**Path:** `src/components/Header/Header.jsx`

Top-level navigation bar. Sticky, always visible.

**Features:**
- Logo linking to `/`
- Nav links: Home, Psychologists, Favorites (only when logged in)
- When logged out: Log In + Registration buttons → open `AuthModal`
- When logged in: `NotificationBell` + user avatar/name + Log out button

**Props:** none (reads auth state from `useAuth()`)

---

## NotificationBell

**Path:** `src/components/Header/NotificationBell.jsx`

Bell icon in the header showing upcoming appointments.

**Features:**
- Badge with total count of upcoming appointments + pending reviews (max display: `9+`)
- Dropdown has two sections:
  - **Upcoming appointments** — doctor name, date, time; **Cancel** button shown if appointment is more than 24h away → opens `CancelModal`
  - **Rate your sessions** — past appointments (last 60 days) not yet reviewed or dismissed
- Each pending review has a **★ Review** button (opens `ReviewModal`) and a **✕** dismiss button
- Dismissed reviews are saved on the user (`psy_dismissed_reviews`) and filtered on load
- Closes on outside click
- Fetches via `getUserAppointments` + `getPastAppointmentsForReview` + `getDismissedReviews` on mount

**Props:** none (reads from `useAuth()`)

**Visible only when user is logged in.**

---

## AuthModal

**Path:** `src/components/AuthModal/AuthModal.jsx`

Login / Registration modal.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `mode` | `'login' \| 'register'` | Which form to show |
| `onClose` | `() => void` | Called to close the modal |
| `onSwitchMode` | `(mode) => void` | Switch between login and register |

---

## PsychologistCard

**Path:** `src/components/PsychologistCard/PsychologistCard.jsx`

Card displaying a psychologist's information.

**Features:**
- Avatar — read from `psychologist.avatar` (a plain remote image URL)
- Name, specialization, experience, rating (stars), price, initial consultation type
- Heart button → toggles favorite (requires login)
- "Read more" toggle → shows full `about` text + reviews
- "Make an appointment" button → opens `AppointmentModal`

**Props:**

| Prop | Type | Description |
|---|---|---|
| `psychologist` | `object` | Psychologist data (includes `avatar` as a remote URL) |
| `onToast` | `(msg: string) => void` | Show a toast notification |

> **Migration note.** The avatar is now read directly from `psychologist.avatar`. The previous code that built a URL from Strapi media (`psychologist.image?.url` combined with `VITE_STRAPI_URL`) has been removed.

---

## AppointmentModal

**Path:** `src/components/AppointmentModal/AppointmentModal.jsx`

Full booking flow: date selection → time slot → patient details → submit.

**Features:**
- `MiniCalendar` for date selection — past days and non-working days are disabled
- Time slot grid — slots generated from the psychologist's `availability` schedule; already-booked slots shown as disabled with strikethrough
- "No available slots on this day" message when the selected day has no slots
- Form fields: name, phone, email, comment
- **Auth notice banner** (shown when not logged in) — prompts user to log in or register to be able to cancel appointments up to 24h before; clicking the buttons opens `AuthModal` inline without closing the booking form
- After login inside the modal, name and email fields are auto-filled from the user's account (only if the fields are still empty)
- Submit button label: **"Send"** when logged in, **"Send as a guest"** when not
- On submit: calls `createAppointment()` with `psychologist_id = psychologist.documentId` and closes the modal

**Props:**

| Prop | Type | Description |
|---|---|---|
| `psychologist` | `object` | Psychologist being booked (must include `availability` and `documentId`) |
| `onClose` | `() => void` | Close the modal |
| `onSuccess` | `() => void` | Optional callback after successful booking |

**Slot logic:**
1. `isWorkingDay(date, availability)` → disables non-working days in the calendar
2. `generateSlots(date, availability)` → produces the list of time buttons for the selected date
3. `getBookedSlots(psychologist.documentId, date, jwt)` → fetches already-booked times and marks them disabled; uses `documentId` (Strapi v5 stable identifier) so the filter matches what `createAppointment` stores

---

## MiniCalendar

**Path:** `src/components/AppointmentModal/MiniCalendar.jsx`

Custom calendar component used inside `AppointmentModal`.

**Features:**
- Monday-first week layout
- Past days are disabled and greyed out
- Non-working days (per psychologist schedule) are disabled and shown with strikethrough
- Selected day highlighted in orange (primary color)
- Month navigation (prev/next)

**Props:**

| Prop | Type | Description |
|---|---|---|
| `selected` | `string \| null` | Selected date as `"YYYY-MM-DD"` |
| `onChange` | `(date: string) => void` | Called when a day is clicked |
| `isDisabledDay` | `(iso: string) => boolean` | Optional — disables specific dates (used for non-working days) |

---

## AvailabilityEditor

**Path:** `src/components/AvailabilityEditor/AvailabilityEditor.jsx`

Google Business-style weekly schedule editor. Used inside `ApplyModal`.

**Features:**
- 7 rows — one per day of the week
- Toggle switch to enable/disable each day
- Start and end time selectors (30-min steps, 06:00–22:00)
- Session duration buttons: 30 min, 45 min, 1h, 1h30, 2h
- Disabled days show "Closed" instead of time pickers
- Changes are propagated immediately via `onChange`

**Props:**

| Prop | Type | Description |
|---|---|---|
| `value` | `object` | Current availability object (uses `DEFAULT_AVAILABILITY` if not set) |
| `onChange` | `(availability: object) => void` | Called on every change |

---

## ApplyModal

**Path:** `src/components/ApplyModal/ApplyModal.jsx`

Application form for psychologists who want to join the platform.

**Sections:**
1. Personal info (name, surname, photo URL)
2. Account — **only when logged out**: email + password (an account is created on submit). When logged in, this is replaced by an "applying as `<email>`" note and the name is pre-filled from the account.
3. Professional details (specialization, experience, license, price, consultation type)
4. Availability (AvailabilityEditor — sets working hours and session duration)
5. About you (free text, min 50 characters)

**Inline login:** the "Log in first" link opens an `AuthModal` **on top of** the apply form (instead of closing it), so logging in keeps the filled-in form. On success the account section disappears automatically.

**On submit:**
- If logged out, creates the account first (auto-login), then calls `submitPsychologistApplication()` → `POST /api/psychologists`
- Entry is created **unpublished** (hidden from the public list)
- An admin reviews and **Publishes** it from `/admin`
- Shows success screen after submission

**Props:**

| Prop | Type | Description |
|---|---|---|
| `onClose` | `() => void` | Close the modal |

**Data transformations before sending:**
- `name` → `"Dr. {firstName} {lastName}"`
- `license` → `"Licensed Psychologist ({number})"`
- `availability` → full schedule object from `AvailabilityEditor`

---

## CancelModal

**Path:** `src/components/CancelModal/CancelModal.jsx`

Confirmation modal for cancelling an upcoming appointment.

**Features:**
- Shows doctor name and formatted appointment date
- Two buttons: **Keep appointment** (close) and **Yes, cancel** (red, confirms cancellation)
- Disabled while `loading` is true

**Props:**

| Prop | Type | Description |
|---|---|---|
| `appointment` | `object` | Appointment to cancel (`psychologist_name`, `time_slot`, `documentId`) |
| `onClose` | `() => void` | Close without cancelling |
| `onConfirm` | `() => void` | Called on confirmation — parent calls `cancelAppointment` and removes from list |
| `loading` | `boolean` | Disables buttons while the DELETE request is in flight |

---

## ReviewModal

**Path:** `src/components/ReviewModal/ReviewModal.jsx`

Modal for leaving a review after a completed appointment.

**Features:**
- Pre-filled "Your name" field from `appointment.patient_name` (editable)
- Interactive 5-star rating with hover effect and label (Poor → Excellent)
- Comment textarea
- On submit: calls `addReview(psychologist_id, { reviewer, rating, comment }, token)`
- On success: calls `onSubmitted(appointment.id)` → removes item from notification bell

**Props:**

| Prop | Type | Description |
|---|---|---|
| `appointment` | `object` | Past appointment (`id`, `psychologist_id`, `psychologist_name`, `patient_name`) |
| `onClose` | `() => void` | Close the modal |
| `onSubmitted` | `(id) => void` | Called after successful submission |

---

## Modal (base wrapper)

**Path:** `src/components/Modal/Modal.jsx`

Base modal overlay used by `AuthModal`, `AppointmentModal`, `ApplyModal`, and `ReviewModal`.

**Features:**
- Dark overlay backdrop
- Closes on backdrop click
- Close button top-right
- `Escape` key closes

**Props:**

| Prop | Type | Description |
|---|---|---|
| `onClose` | `() => void` | Called when closing |
| `children` | `ReactNode` | Modal content |

---

## AuthContext

**Path:** `src/context/AuthContext.jsx`

Provides authentication state and actions to the whole app via `useAuth()`. Consumed by `Header`, `NotificationBell`, `PsychologistCard`, `AppointmentModal`, and the protected pages.

**Public API (unchanged):** `{ user, token, favorites, setFavorites, login, register, logout, deleteAccount }`.

> **Migration note.** `AuthContext` keeps the same public API but is now backed by **Auth.js (NextAuth)** with cookie-based sessions:
> - Login now **persists across reloads** (cookie session) instead of relying on a stored JWT.
> - `token` is always `null` now — auth is cookie-based. Call sites that still pass `token` to `@/lib/api` functions continue to work; the argument is simply ignored (e.g. the `jwt` arg in `getBookedSlots`, or `token` in `addReview`).

---

## Pages

> Page bodies live in `src/views/` (renamed from `src/pages/` to avoid colliding with Next.js). Each `src/app/[locale]/.../page.jsx` route is a thin wrapper that renders the matching view.

### HomePage (`src/views/HomePage/`)
- Hero section with CTA buttons; the **`LanguageSwitcher` (IT/EN)** sits in the hero top row next to the "Mental Health Support" badge
- "Are you a licensed psychologist?" CTA section → opens `ApplyModal`

### PsychologistsPage (`src/views/PsychologistsPage/`)
- Server-rendered list passed as `initialPsychologists`; refetches client-side after a review
- Search bar filters by name, surname, or specialization (client-side, **debounced** via `useDebounce`)
- Skeleton placeholders while the route loads (`loading.jsx`)
- Renders a list of `PsychologistCard` components

### FavoritesPage (`src/views/FavoritesPage/`)
- Protected route (login required)
- Fetches all psychologists, then filters to only show favorites
- Skeleton list while loading; empty state with link to `/psychologists`

### NotFoundPage (`src/views/NotFoundPage/`)
- Custom 404 page
- "Go to Home" button
