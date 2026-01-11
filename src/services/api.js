const API_BASE_URL = 'https://novalanddemo.onrender.com/api/v1';

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const tourAPI = {
  getAll: (page = 1, pageSize = 20) => 
    fetchAPI(`/tours?page=${page}&page_size=${pageSize}`),

  getById: (tourId) => 
    fetchAPI(`/tours/${tourId}`),

  getFull: (tourId) => 
    fetchAPI(`/tours/${tourId}/full`),

  export: (tourId) => 
    fetchAPI(`/tours/${tourId}/export`),

  create: (data) => 
    fetchAPI('/tours', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (tourId, data) => 
    fetchAPI(`/tours/${tourId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (tourId) => 
    fetchAPI(`/tours/${tourId}`, {
      method: 'DELETE',
    }),
};

export const sceneAPI = {
  getAll: (tourId = null, page = 1, pageSize = 20) => {
    const params = new URLSearchParams({ page, page_size: pageSize });
    if (tourId) params.append('tour_id', tourId);
    return fetchAPI(`/scenes?${params}`);
  },

  getByTour: (tourId) => 
    fetchAPI(`/scenes/by-tour/${tourId}`),

  getById: (sceneId) => 
    fetchAPI(`/scenes/${sceneId}`),

  getFull: (sceneId) => 
    fetchAPI(`/scenes/${sceneId}/full`),

  create: async (formData) => {
    const url = `${API_BASE_URL}/scenes`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json();
  },

  update: async (sceneId, formData) => {
    const url = `${API_BASE_URL}/scenes/${sceneId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json();
  },

  delete: (sceneId) => 
    fetchAPI(`/scenes/${sceneId}`, {
      method: 'DELETE',
    }),
};

export const hotspotAPI = {
  getAll: (sceneId = null, page = 1, pageSize = 50) => {
    const params = new URLSearchParams({ page, page_size: pageSize });
    if (sceneId) params.append('scene_id', sceneId);
    return fetchAPI(`/hotspots?${params}`);
  },

  getByScene: (sceneId) => 
    fetchAPI(`/hotspots/by-scene/${sceneId}`),
  
  getById: (hotspotId) => 
    fetchAPI(`/hotspots/${hotspotId}`),

  create: (data) => 
    fetchAPI('/hotspots', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  createBulk: (hotspots) => 
    fetchAPI('/hotspots/bulk', {
      method: 'POST',
      body: JSON.stringify(hotspots),
    }),
  
  update: (hotspotId, data) => 
    fetchAPI(`/hotspots/${hotspotId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updatePosition: (hotspotId, position) => 
    fetchAPI(`/hotspots/${hotspotId}/position`, {
      method: 'PATCH',
      body: JSON.stringify(position),
    }),

  delete: (hotspotId) => 
    fetchAPI(`/hotspots/${hotspotId}`, {
      method: 'DELETE',
    }),

  deleteByScene: (sceneId) => 
    fetchAPI(`/hotspots/by-scene/${sceneId}`, {
      method: 'DELETE',
    }),
};

export default {
  tour: tourAPI,
  scene: sceneAPI,
  hotspot: hotspotAPI,
};
