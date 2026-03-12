# Component Reference

All components use CSS Modules for scoped styling. Each component lives in its own folder with a `.jsx` and `.module.css` file.

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
- Dismissed reviews are saved to Strapi (`psy_dismissed_reviews` on user) and filtered on load
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
- Avatar (image from Strapi or emoji fallback)
- Name, specialization, experience, rating (stars), price, initial consultation type
- Heart button → toggles favorite (requires login)
- "Read more" toggle → shows full `about` text + reviews
- "Make an appointment" button → opens `AppointmentModal`

**Props:**

| Prop | Type | Description |
|---|---|---|
| `psychologist` | `object` | Psychologist data from Strapi |
| `onToast` | `(msg: string) => void` | Show a toast notification |

---

## AppointmentModal

**Path:** `src/components/AppointmentModal/AppointmentModal.jsx`

Full booking flow: date selection → time slot → patient details → submit.

**Features:**
- `MiniCalendar` for date selection — past days and non-working days are disabled
- Time slot grid — slots generated from the psychologist's `availability` schedule; already-booked slots shown as disabled with strikethrough
- "No available slots on this day" message when the selected day has no slots
- Form fields: name, phone, email, comment
- On submit: calls `createAppointment()` and closes the modal

**Props:**

| Prop | Type | Description |
|---|---|---|
| `psychologist` | `object` | Psychologist being booked (must include `availability`) |
| `onClose` | `() => void` | Close the modal |
| `onSuccess` | `() => void` | Optional callback after successful booking |

**Slot logic:**
1. `isWorkingDay(date, availability)` → disables non-working days in the calendar
2. `generateSlots(date, availability)` → produces the list of time buttons for the selected date
3. `getBookedSlots(psychologistId, date, jwt)` → fetches already-booked times and marks them disabled

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
2. Professional details (specialization, experience, license, price, consultation type)
3. Availability (AvailabilityEditor — sets working hours and session duration)
4. About you (free text, min 50 characters)

**On submit:**
- Calls `submitPsychologistApplication()` which POSTs to `/api/psychologists?status=draft`
- Entry is created as a **draft — not publicly visible**
- Admin must review and **Publish** it in the Strapi admin panel
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

## Pages

### HomePage (`src/pages/HomePage/`)
- Hero section with CTA buttons
- "Are you a licensed psychologist?" CTA section → opens `ApplyModal`

### PsychologistsPage (`src/pages/PsychologistsPage/`)
- Fetches all psychologists from Strapi
- Search bar filters by name, surname, or specialization (client-side)
- Spinner while loading
- Renders a list of `PsychologistCard` components

### FavoritesPage (`src/pages/FavoritesPage/`)
- Protected route (login required)
- Fetches all psychologists, then filters to only show favorites
- Empty state with link to `/psychologists`

### NotFoundPage (`src/pages/NotFoundPage/`)
- Custom 404 page
- "Go to Home" button
