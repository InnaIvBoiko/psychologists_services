import axios from 'axios';

// The default base URL where Strapi runs locally or in production
const STRAPI_URL = import.meta.env.VITE_STRAPI_URL;

const strapiApi = axios.create({
  baseURL: `${STRAPI_URL}/api`,
});

export const getPsychologists = async () => {
  try {
    // The `populate=*` parameter tells Strapi to return attached media/images as well
    const response = await strapiApi.get('/psychologists?populate=*');

    // Strapi v5 returns formatted data inside a `data` object
    // We map the response to have a simpler array for React to handle
    return response.data.data.map((item) => {
      // Strapi v5 uses `documentId` (string) as the primary identifier for APIs,
      // but the old numeric `id` is often still used in relations/internal JSON.
      return {
        id: item.documentId,
        strapiId: String(item.id),
        ...item
      };
    });
  } catch (error) {
    console.error("Error fetching psychologists from Strapi:", error);
    return [];
  }
};

export const getPsychologistById = async (documentId) => {
  try {
    const response = await strapiApi.get(`/psychologists/${documentId}?populate=*`);

    const item = response.data.data;
    return {
      id: item.documentId,
      strapiId: String(item.id),
      ...item
    }
  } catch (error) {
    console.error("Error fetching single psychologist from Strapi:", error);
    return null;
  }
};

export const getUserFavorites = async (jwt) => {
  if (!jwt) return [];
  try {
    const response = await strapiApi.get('/users/me', {
      headers: { Authorization: `Bearer ${jwt}` }
    });
    // Favorites are saved in psy_favorites as a JSON array
    let favs = response.data.psy_favorites || [];

    // In case the JSON field is fetched as a string, attempt to parse it
    if (typeof favs === 'string') {
      try {
        favs = JSON.parse(favs)
      } catch (e) { favs = [] }
    }

    return Array.isArray(favs) ? favs : [];
  } catch (error) {
    console.error("Error fetching user favorites:", error);
    return [];
  }
};

export const togglePsychologistFavorite = async (documentId, jwt) => {
  if (!jwt) return false;
  try {
    const response = await strapiApi.post(
      `/psychologists/${documentId}/toggle-favorite`,
      {},
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Error toggling favorite:", error.response?.data || error.message);
    return null;
  }
};

// --- USER APPOINTMENTS ---
export const getUserAppointments = async (email, jwt) => {
  if (!email || !jwt) return [];
  try {
    const response = await strapiApi.get(
      `/appointments?filters[email][$eq]=${encodeURIComponent(email)}&fields[0]=time_slot&fields[1]=psychologist_name&pagination[pageSize]=50`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return response.data.data
      .map((item) => ({
        id: item.id,
        time_slot: item.time_slot,
        psychologist_name: item.psychologist_name,
      }))
      .filter((a) => {
        if (!a.time_slot) return false;
        const [datePart] = a.time_slot.split(' ');
        return new Date(datePart) >= today;
      })
      .sort((a, b) => a.time_slot.localeCompare(b.time_slot));
  } catch (error) {
    console.error("Error fetching user appointments:", error.response?.data || error.message);
    return [];
  }
};

// Fetch past appointments (last 60 days) for review prompts
export const getPastAppointmentsForReview = async (email, jwt) => {
  if (!email || !jwt) return [];
  try {
    const response = await strapiApi.get(
      `/appointments?filters[email][$eq]=${encodeURIComponent(email)}&fields[0]=time_slot&fields[1]=psychologist_name&fields[2]=psychologist_id&fields[3]=patient_name&pagination[pageSize]=50`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);
    return response.data.data
      .map((item) => ({
        id: item.id,
        time_slot: item.time_slot,
        psychologist_name: item.psychologist_name,
        psychologist_id: item.psychologist_id,
        patient_name: item.patient_name,
      }))
      .filter((a) => {
        if (!a.time_slot) return false;
        const dt = new Date(a.time_slot.replace(' ', 'T'));
        return dt < now && dt >= cutoff;
      })
      .sort((a, b) => b.time_slot.localeCompare(a.time_slot)); // most recent first
  } catch (error) {
    console.error("Error fetching past appointments:", error.response?.data || error.message);
    return [];
  }
};

// --- REVIEWS ---
export const addReview = async (psychologistId, review, jwt) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (jwt) headers.Authorization = `Bearer ${jwt}`;
    const response = await strapiApi.post(
      `/psychologists/${psychologistId}/add-review`,
      review,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding review:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to submit review");
  }
};

// --- PSYCHOLOGIST APPLICATION ---
export const submitPsychologistApplication = async (data, jwt) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (jwt) headers.Authorization = `Bearer ${jwt}`;
    const response = await strapiApi.post('/psychologists?status=draft', {
      data
    }, { headers });
    return response.data;
  } catch (error) {
    console.error("Error submitting application:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to submit application");
  }
};

// --- APPOINTMENTS ---
// time_slot is stored as "YYYY-MM-DD HH:MM" — no extra date field needed in Strapi
export const getBookedSlots = async (psychologistId, date, jwt) => {
  if (!date) return [];
  try {
    const headers = jwt ? { Authorization: `Bearer ${jwt}` } : {};
    const response = await strapiApi.get(
      `/appointments?filters[psychologist_id][$eq]=${psychologistId}&filters[time_slot][$contains]=${date}&fields[0]=time_slot&pagination[pageSize]=100`,
      { headers }
    );
    // Extract just the "HH:MM" part from "YYYY-MM-DD HH:MM"
    return response.data.data
      .map((item) => (item.time_slot || '').split(' ')[1])
      .filter(Boolean);
  } catch (error) {
    console.error("Error fetching booked slots:", error.response?.data || error.message);
    return [];
  }
};

export const createAppointment = async (appointmentData, jwt) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (jwt) headers.Authorization = `Bearer ${jwt}`;
    
    // Strapi v5 expects data to be wrapped in a "data" object for POST requests
    const response = await strapiApi.post('/appointments', {
      data: appointmentData
    }, { headers });
    return response.data;
  } catch (error) {
    console.error("Error creating appointment:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to create appointment");
  }
};
