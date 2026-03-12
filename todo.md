# Psychologists.Services — Project TODO

Figma: https://www.figma.com/file/I5vjNb0NsJOpQRnRpMloSY/Psychologists.Services

---

## 1. Project Setup

- [ ] Initialize React app (Vite + React)
- [ ] Configure ESLint + Prettier
- [ ] Set up folder structure: `components/`, `pages/`, `hooks/`, `utils/`, `assets/`, `data/`
- [ ] Add Google Fonts (Inter)
- [ ] Configure CSS variables / design tokens (colors, spacing, typography)
- [ ] Add mock JSON data file for psychologists (15+ entries)

---

## 2. Design Tokens & Global Styles

- [ ] Define CSS custom properties:
  - Primary color: `#54BE96` (teal theme — chosen from Figma alternatives)
  - Background: `#F8F8F8`
  - Card background: `#FFFFFF`
  - Text primary: `#1A1A1A`
  - Text secondary: `#777`
  - Border radius: `12px` for cards, `8px` for inputs/buttons
- [ ] Global reset / base styles
- [ ] Typography scale (h1–h4, body, caption)
- [ ] Button variants: Primary (filled), Ghost (outlined), Disabled
- [ ] Input variants: Default, Focus, Error

---

## 3. Layout & Navigation

- [ ] `Header` component
  - [ ] Logo: `psychologists.services` with colored dot
  - [ ] Nav links: `Home`, `Psychologists`, `Favorites`
  - [ ] Active link state (colored underline)
  - [ ] Auth actions — logged-out: `Log In` + `Registration` buttons
  - [ ] Auth actions — logged-in: user avatar + name + `Log out` button
- [ ] React Router setup (3 routes: `/`, `/psychologists`, `/favorites`)
- [ ] Protected route for `/favorites` (requires login)

---

## 4. Home Page (`/`)

- [ ] Hero section with headline and brief platform description
- [ ] CTA button → navigates to `/psychologists`

---

## 5. Psychologists Page (`/psychologists`)

### 5.1 Filter / Sort Bar
- [ ] Dropdown component with sorting options:
  - `Show all`
  - `A to Z` / `Z to A`
  - `Less than 10$` / `Greater than 10$`
  - `Popular` / `Not popular`
- [ ] Wire dropdown to filter the visible list

### 5.2 Psychologist Card (collapsed state)
- [ ] Avatar image (rounded)
- [ ] Online status indicator (green dot on avatar)
- [ ] `Psychologist` label (category badge)
- [ ] Doctor name (`Dr. FirstName LastName`) — bold, large
- [ ] Info tags (pill badges):
  - Experience: `X years`
  - License: `Licensed Psychologist (License #XXXXX)`
  - Specialization: e.g., `Depression and Mood Disorders`
  - Initial consultation: e.g., `Free 45-minute initial consultation`
- [ ] Short bio text (truncated)
- [ ] `Read more` button → expands card
- [ ] Rating: ⭐ `4.75` (top-right)
- [ ] Price: `Price / 1 hour: 120$` (top-right)
- [ ] Favorite heart icon (outline / filled toggle)

### 5.3 Psychologist Card (expanded state)
- [ ] Full bio text
- [ ] Reviews section:
  - Reviewer name + avatar initial
  - Star rating
  - Review text
- [ ] `Make an appointment` button → opens appointment modal

### 5.4 Pagination
- [ ] Show 3 cards initially
- [ ] `Load more` button → loads 3 more
- [ ] Hide button when all cards are shown

---

## 6. Favorites Page (`/favorites`)

- [ ] Show only psychologists the user has hearted
- [ ] Same card component as Psychologists page
- [ ] Empty state: message + link to `/psychologists` if no favorites
- [ ] Persist favorites in `localStorage`

---

## 7. Authentication (Firebase)

- [ ] Set up Firebase project (Auth)
- [ ] `Registration` modal:
  - [ ] Fields: `Name`, `Email`, `Password` (with show/hide toggle)
  - [ ] Validation (required, email format, min password length 6)
  - [ ] On success: close modal, update header to logged-in state
- [ ] `Log In` modal:
  - [ ] Fields: `Email`, `Password` (with show/hide toggle)
  - [ ] Validation
  - [ ] On success: close modal, restore session
- [ ] `Log out` button → signs out user
- [ ] Persist auth state across page reloads (`onAuthStateChanged`)

---

## 8. Appointment Booking Modal

- [ ] Triggered by `Make an appointment` on expanded card
- [ ] Header: `Make an appointment with a psychologist`
- [ ] Sub-copy: brief description (confidentiality note)
- [ ] Display selected psychologist's name
- [ ] Fields:
  - `Name` (text input)
  - `Phone number` (text input)
  - `Email` (text input)
  - `Comment` (textarea)
- [ ] Time picker:
  - Time slots grid: `09:00`, `09:30`, `10:00`, `10:30`, …
  - Selected slot highlighted
- [ ] `Send` button → validates + submits (shows success toast / closes modal)
- [ ] Close (×) button

---

## 9. Modals — Shared Infrastructure

- [ ] Generic `Modal` wrapper component (overlay + close on backdrop click)
- [ ] Focus trap inside modal (accessibility)
- [ ] ESC key closes modal

---

## 10. State Management

- [ ] Auth context (`AuthContext` + `useAuth` hook)
- [ ] Favorites state (stored per user in `localStorage`, keyed by `uid`)
- [ ] Filter/sort state (local component state on Psychologists page)

---

## 11. Data

- [ ] Create `src/data/psychologists.json` with 15 entries, each containing:
  - `id`, `name`, `avatar`, `experience` (years), `license`, `specialization`
  - `initial_consultation`, `about`, `rating`, `price_per_hour`
  - `reviews` (array: `{ reviewer, rating, comment }`)
  - `popular` (boolean)

---

## 12. UI Polish

- [ ] Responsive layout (mobile breakpoint ≥ 320px, desktop ≥ 1280px)
- [ ] Hover states on cards, buttons, nav links
- [ ] Smooth card expand/collapse animation
- [ ] Modal open/close fade animation
- [ ] Heart icon toggle animation
- [ ] Toast notification on appointment submission
- [ ] Loading skeleton for card list (optional)

---

## 13. Testing & QA

- [ ] Manual test: Registration flow (valid + invalid inputs)
- [ ] Manual test: Log in / Log out flow
- [ ] Manual test: Filter & sort psychologists
- [ ] Manual test: Expand/collapse card, Read more
- [ ] Manual test: Add/remove favorites (logged in vs. logged out)
- [ ] Manual test: Appointment modal — all fields + time picker
- [ ] Manual test: Favorites page (empty state + filled state)
- [ ] Manual test: Protected route redirect when logged out
- [ ] Cross-browser check: Chrome, Safari, Firefox

---

## 14. Deployment

- [ ] Build production bundle (`npm run build`)
- [ ] Deploy to Firebase Hosting (or Vercel/Netlify)
- [ ] Test deployed version
