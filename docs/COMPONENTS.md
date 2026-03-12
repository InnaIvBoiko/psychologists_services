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
- Badge with count of upcoming appointments (max display: `9+`)
- Dropdown panel listing appointments (doctor name, date, time)
- Closes on outside click
- Fetches via `getUserAppointments(user.email, token)` on mount

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
- `MiniCalendar` for date selection (past days disabled)
- Time slot grid — booked slots shown as disabled
- Form fields: name, phone, email, comment
- On submit: calls `createAppointment()` and shows success message

**Props:**

| Prop | Type | Description |
|---|---|---|
| `psychologist` | `object` | Psychologist being booked |
| `onClose` | `() => void` | Close the modal |

**Slot availability:** On date change, fetches booked slots via `getBookedSlots(psychologistId, date, jwt)` and disables matching time buttons.

---

## MiniCalendar

**Path:** `src/components/AppointmentModal/MiniCalendar.jsx`

Custom calendar component used inside `AppointmentModal`.

**Features:**
- Monday-first week layout
- Past days are disabled and greyed out
- Selected day highlighted in orange (primary color)
- Month navigation (prev/next)

**Props:**

| Prop | Type | Description |
|---|---|---|
| `value` | `string \| null` | Selected date as `"YYYY-MM-DD"` |
| `onChange` | `(date: string) => void` | Called when a day is clicked |

---

## ApplyModal

**Path:** `src/components/ApplyModal/ApplyModal.jsx`

Application form for psychologists who want to join the platform.

**Features:**
- Multi-field form (name, surname, specialization, license number, experience, price, consultation type, about, avatar)
- On submit: calls `submitPsychologistApplication()` which creates a Strapi draft
- Shows a success screen on completion

**Props:**

| Prop | Type | Description |
|---|---|---|
| `onClose` | `() => void` | Close the modal |

**Note:** The form transforms the data before sending:
- `name` → `"Dr. {firstName} {lastName}"`
- `license` → `"Licensed Psychologist ({number})"`

---

## Modal (base wrapper)

**Path:** `src/components/Modal/Modal.jsx`

Base modal overlay used by `AuthModal`, `AppointmentModal`, and `ApplyModal`.

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
