# API Reference

Base URL: `VITE_STRAPI_URL/api`

All authenticated endpoints require the header:
```
Authorization: Bearer <jwt>
```

---

## Authentication

### Register

```
POST /api/auth/local/register
```

**Body**
```json
{
  "username": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret"
}
```

**Response**
```json
{
  "jwt": "<token>",
  "user": { "id": 1, "username": "Jane Doe", "email": "jane@example.com" }
}
```

---

### Login

```
POST /api/auth/local
```

**Body**
```json
{
  "identifier": "jane@example.com",
  "password": "secret"
}
```

**Response** — same shape as register.

---

## Psychologists

### List all

```
GET /api/psychologists?populate=*
```

Returns all **published** psychologists with media populated.

**Response shape**
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "abc123",
      "name": "John",
      "surname": "Smith",
      "specialization": "Anxiety",
      "experience": 8,
      "license": "LIC-0042",
      "rating": 4.8,
      "price_per_hour": 120,
      "initial_consultation": "Free",
      "about": "...",
      "avatar": "👨‍⚕️",
      "popular": true,
      "isAvailable": true,
      "reviews": [...],
      "image": { "url": "/uploads/photo.jpg" }
    }
  ],
  "meta": { "pagination": { ... } }
}
```

---

### Get one

```
GET /api/psychologists/:documentId?populate=*
```

---

### Toggle favorite *(auth required)*

```
POST /api/psychologists/:documentId/toggle-favorite
```

No body required.

**Response**
```json
{
  "isFavorite": true,
  "message": "Aggiunto ai preferiti"
}
```

---

### Submit application (draft)

```
POST /api/psychologists?status=draft
```

Creates a new psychologist entry as a **draft** (not publicly visible until approved by admin).

> The `?status=draft` query parameter is required in Strapi v5. Passing `status` in the request body will cause a 400 error.

**Body**
```json
{
  "data": {
    "name": "Dr. Jane Smith",
    "surname": "Smith",
    "specialization": "Cognitive Behavioral Therapy",
    "experience": 10,
    "license": "Licensed Psychologist (LIC-1234)",
    "price_per_hour": 150,
    "initial_consultation": "Free",
    "about": "...",
    "avatar": "👩‍⚕️",
    "rating": 0,
    "popular": false,
    "isAvailable": true
  }
}
```

---

## Appointments

### Get booked slots for a date

```
GET /api/appointments
  ?filters[psychologist_id][$eq]=<documentId>
  &filters[time_slot][$contains]=<YYYY-MM-DD>
  &fields[0]=time_slot
  &pagination[pageSize]=100
```

**Response**
```json
{
  "data": [
    { "id": 1, "time_slot": "2025-06-15 10:00" },
    { "id": 2, "time_slot": "2025-06-15 14:00" }
  ]
}
```

The frontend extracts just the `HH:MM` portion to mark those slots as unavailable.

---

### Get user's upcoming appointments *(auth required)*

```
GET /api/appointments
  ?filters[email][$eq]=<user_email>
  &fields[0]=time_slot
  &fields[1]=psychologist_name
  &pagination[pageSize]=50
```

The frontend filters out past appointments client-side.

---

### Create appointment

```
POST /api/appointments
```

**Body**
```json
{
  "data": {
    "patient_name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+39 333 1234567",
    "time_slot": "2025-06-15 10:00",
    "psychologist_id": "<documentId>",
    "psychologist_name": "John Smith",
    "comment": "First visit"
  }
}
```

---

## User

### Get current user *(auth required)*

```
GET /api/users/me
```

Returns the authenticated user including the `psy_favorites` field (array of psychologist `strapiId` strings).

**Response**
```json
{
  "id": 1,
  "username": "Jane Doe",
  "email": "jane@example.com",
  "psy_favorites": ["42", "17", "8"]
}
```

---

## Error format

All Strapi errors follow this structure:

```json
{
  "data": null,
  "error": {
    "status": 400,
    "name": "ValidationError",
    "message": "...",
    "details": {}
  }
}
```
