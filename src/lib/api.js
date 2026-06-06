// Data layer for the Next.js backend (replaces the old Strapi client).
// Same-origin fetch — the Auth.js session cookie is sent automatically, so the
// legacy `jwt`/`token`/`email` parameters are kept for call-site compatibility but ignored.

async function getJson(url) {
  const res = await fetch(url, { credentials: 'same-origin' })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

async function sendJson(url, method, body) {
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.error?.message || `Request failed: ${res.status}`)
  }
  return data
}

// --- PSYCHOLOGISTS ---
export const getPsychologists = async () => {
  try {
    return await getJson('/api/psychologists')
  } catch (error) {
    console.error('Error fetching psychologists:', error)
    return []
  }
}

export const getPsychologistById = async (documentId) => {
  try {
    return await getJson(`/api/psychologists/${documentId}`)
  } catch (error) {
    console.error('Error fetching single psychologist:', error)
    return null
  }
}

// --- FAVORITES ---
export const getUserFavorites = async () => {
  try {
    const me = await getJson('/api/me')
    return Array.isArray(me?.psy_favorites) ? me.psy_favorites : []
  } catch (error) {
    console.error('Error fetching user favorites:', error)
    return []
  }
}

export const togglePsychologistFavorite = async (documentId) => {
  try {
    return await sendJson(`/api/psychologists/${documentId}/toggle-favorite`, 'POST', {})
  } catch (error) {
    console.error('Error toggling favorite:', error.message)
    return null
  }
}

// --- USER APPOINTMENTS ---
export const getUserAppointments = async () => {
  try {
    const list = await getJson('/api/appointments/mine')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return list
      .map((item) => ({
        id: item.id,
        documentId: item.documentId,
        time_slot: item.time_slot,
        psychologist_name: item.psychologist_name,
      }))
      .filter((a) => {
        if (!a.time_slot) return false
        const [datePart] = a.time_slot.split(' ')
        return new Date(datePart) >= today
      })
      .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
  } catch (error) {
    console.error('Error fetching user appointments:', error.message)
    return []
  }
}

// Past appointments (last 60 days) used for review prompts.
export const getPastAppointmentsForReview = async () => {
  try {
    const list = await getJson('/api/appointments/mine')
    const now = new Date()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 60)
    return list
      .map((item) => ({
        id: item.id,
        time_slot: item.time_slot,
        psychologist_name: item.psychologist_name,
        psychologist_id: item.psychologist_id,
        patient_name: item.patient_name,
      }))
      .filter((a) => {
        if (!a.time_slot) return false
        const dt = new Date(a.time_slot.replace(' ', 'T'))
        return dt < now && dt >= cutoff
      })
      .sort((a, b) => b.time_slot.localeCompare(a.time_slot)) // most recent first
  } catch (error) {
    console.error('Error fetching past appointments:', error.message)
    return []
  }
}

// --- REVIEWS ---
export const addReview = async (psychologistId, review) => {
  try {
    return await sendJson(`/api/psychologists/${psychologistId}/reviews`, 'POST', review)
  } catch (error) {
    console.error('Error adding review:', error.message)
    throw new Error(error.message || 'Failed to submit review')
  }
}

export const getDismissedReviews = async () => {
  try {
    const me = await getJson('/api/me')
    return Array.isArray(me?.psy_dismissed_reviews) ? me.psy_dismissed_reviews : []
  } catch (error) {
    console.error('Error fetching dismissed reviews:', error)
    return []
  }
}

export const dismissAppointmentReview = async (appointmentId) => {
  try {
    await sendJson('/api/reviews/dismiss', 'POST', { appointmentId: String(appointmentId) })
  } catch (error) {
    console.error('Error dismissing review:', error.message)
  }
}

// Returns true if a psychologist profile is linked to the current user's email.
export const checkIsUserPsychologist = async () => {
  try {
    const me = await getJson('/api/me')
    return Boolean(me?.isPsychologist)
  } catch {
    return false
  }
}

// --- ACCOUNT ---
export const deleteAccount = async () => {
  return sendJson('/api/me', 'DELETE')
}

// --- PSYCHOLOGIST APPLICATION ---
export const submitPsychologistApplication = async (data) => {
  try {
    return await sendJson('/api/psychologists', 'POST', data)
  } catch (error) {
    console.error('Error submitting application:', error.message)
    throw new Error(error.message || 'Failed to submit application')
  }
}

// --- BOOKING ---
export const getBookedSlots = async (psychologistId, date) => {
  if (!date) return []
  try {
    const params = new URLSearchParams({ psychologist_id: String(psychologistId), date })
    return await getJson(`/api/appointments?${params.toString()}`)
  } catch (error) {
    console.error('Error fetching booked slots:', error.message)
    return []
  }
}

export const cancelAppointment = async (documentId) => {
  await sendJson(`/api/appointments/${documentId}`, 'DELETE')
}

export const createAppointment = async (appointmentData) => {
  try {
    return await sendJson('/api/appointments', 'POST', appointmentData)
  } catch (error) {
    console.error('Error creating appointment:', error.message)
    throw new Error(error.message || 'Failed to create appointment')
  }
}
