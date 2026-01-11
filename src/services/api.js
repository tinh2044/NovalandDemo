/**
 * API Service - Gọi Backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Fetch wrapper với error handling
 */
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

// ============== TOUR API ==============

export const tourAPI = {
  /**
   * Lấy danh sách tours
   */
  getAll: (page = 1, pageSize = 20) => 
    fetchAPI(`/tours?page=${page}&page_size=${pageSize}`),

  /**
   * Lấy tour theo ID
   */
  getById: (tourId) => 
    fetchAPI(`/tours/${tourId}`),

  /**
   * Lấy tour đầy đủ với scenes và hotspots (format cho frontend)
   */
  getFull: (tourId) => 
    fetchAPI(`/tours/${tourId}/full`),

  /**
   * Export tour sang JSON format
   */
  export: (tourId) => 
    fetchAPI(`/tours/${tourId}/export`),

  /**
   * Tạo tour mới
   */
  create: (data) => 
    fetchAPI('/tours', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Cập nhật tour
   */
  update: (tourId, data) => 
    fetchAPI(`/tours/${tourId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * Xóa tour
   */
  delete: (tourId) => 
    fetchAPI(`/tours/${tourId}`, {
      method: 'DELETE',
    }),
};

// ============== SCENE API ==============

export const sceneAPI = {
  /**
   * Lấy danh sách scenes
   */
  getAll: (tourId = null, page = 1, pageSize = 20) => {
    const params = new URLSearchParams({ page, page_size: pageSize });
    if (tourId) params.append('tour_id', tourId);
    return fetchAPI(`/scenes?${params}`);
  },

  /**
   * Lấy scenes theo tour
   */
  getByTour: (tourId) => 
    fetchAPI(`/scenes/by-tour/${tourId}`),

  /**
   * Lấy scene theo ID
   */
  getById: (sceneId) => 
    fetchAPI(`/scenes/${sceneId}`),

  /**
   * Lấy scene đầy đủ với hotspots
   */
  getFull: (sceneId) => 
    fetchAPI(`/scenes/${sceneId}/full`),

  /**
   * Tạo scene mới (với file upload)
   */
  create: async (formData) => {
    const url = `${API_BASE_URL}/scenes`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData, // FormData, không set Content-Type
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json();
  },

  /**
   * Cập nhật scene (với file upload)
   */
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

  /**
   * Xóa scene
   */
  delete: (sceneId) => 
    fetchAPI(`/scenes/${sceneId}`, {
      method: 'DELETE',
    }),
};

// ============== HOTSPOT API ==============

export const hotspotAPI = {
  /**
   * Lấy danh sách hotspots
   */
  getAll: (sceneId = null, page = 1, pageSize = 50) => {
    const params = new URLSearchParams({ page, page_size: pageSize });
    if (sceneId) params.append('scene_id', sceneId);
    return fetchAPI(`/hotspots?${params}`);
  },

  /**
   * Lấy hotspots theo scene
   */
  getByScene: (sceneId) => 
    fetchAPI(`/hotspots/by-scene/${sceneId}`),

  /**
   * Lấy hotspot theo ID
   */
  getById: (hotspotId) => 
    fetchAPI(`/hotspots/${hotspotId}`),

  /**
   * Tạo hotspot mới
   */
  create: (data) => 
    fetchAPI('/hotspots', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Tạo nhiều hotspots
   */
  createBulk: (hotspots) => 
    fetchAPI('/hotspots/bulk', {
      method: 'POST',
      body: JSON.stringify(hotspots),
    }),

  /**
   * Cập nhật hotspot
   */
  update: (hotspotId, data) => 
    fetchAPI(`/hotspots/${hotspotId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * Cập nhật vị trí hotspot
   */
  updatePosition: (hotspotId, position) => 
    fetchAPI(`/hotspots/${hotspotId}/position`, {
      method: 'PATCH',
      body: JSON.stringify(position),
    }),

  /**
   * Xóa hotspot
   */
  delete: (hotspotId) => 
    fetchAPI(`/hotspots/${hotspotId}`, {
      method: 'DELETE',
    }),

  /**
   * Xóa tất cả hotspots của scene
   */
  deleteByScene: (sceneId) => 
    fetchAPI(`/hotspots/by-scene/${sceneId}`, {
      method: 'DELETE',
    }),
};

// Default export
export default {
  tour: tourAPI,
  scene: sceneAPI,
  hotspot: hotspotAPI,
};
