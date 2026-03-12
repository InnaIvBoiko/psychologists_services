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

// --- APPOINTMENTS ---
export const getBookedSlots = async (psychologistId, jwt) => {
  try {
    const headers = jwt ? { Authorization: `Bearer ${jwt}` } : {};
    const response = await strapiApi.get(
      `/appointments?filters[psychologist_id][$eq]=${psychologistId}&fields[0]=time_slot&pagination[pageSize]=100`,
      { headers }
    );
    console.log('[getBookedSlots] response:', response.data);
    return response.data.data.map((item) => item.time_slot);
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
