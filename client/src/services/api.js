import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    // Only inject user token if the request hasn't set its own Authorization header
    if (!config.headers.Authorization) {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  signup: (data) => apiClient.post('/auth/signup', data),
  login: (data) => apiClient.post('/auth/login', data),
  googleAuth: (data) => apiClient.post('/auth/google', data),
  verify: () => apiClient.get('/auth/verify'),
};

// User API calls
export const userAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data) => apiClient.put('/users/profile', data),
  getSettings: () => apiClient.get('/users/settings'),
  updateSettings: (data) => apiClient.put('/users/settings', data),
  changePassword: (data) => apiClient.post('/users/change-password', data),
  deleteAccount: () => apiClient.delete('/users/account'),
  addCaregiver: (data) => apiClient.post('/users/caregivers', data),
  getCaregivers: () => apiClient.get('/users/caregivers'),
  deleteCaregiver: (id) => apiClient.delete(`/users/caregivers/${id}`),
};

// Calm Score API calls
export const calmScoreAPI = {
  record: (data) => apiClient.post('/calm-scores', data),
  getHistory: (limit = 10, skip = 0) =>
    apiClient.get(`/calm-scores?limit=${limit}&skip=${skip}`),
  getStats: (days = 7) => apiClient.get(`/calm-scores/stats?days=${days}`),
};

// Panic Event API calls
export const panicEventAPI = {
  trigger: (data) => apiClient.post('/panic-events/trigger', data),
  getHistory: (limit = 20, skip = 0) =>
    apiClient.get(`/panic-events?limit=${limit}&skip=${skip}`),
  getStats: (days = 30) =>
    apiClient.get(`/panic-events/stats/summary?days=${days}`),
  updateEvent: (id, data) => apiClient.put(`/panic-events/${id}`, data),
};

// Route API calls
export const routeAPI = {
  create: (data) => apiClient.post('/routes', data),
  getRoutes: (limit = 20, skip = 0, completed) => {
    let url = `/routes?limit=${limit}&skip=${skip}`;
    if (completed !== undefined) url += `&completed=${completed}`;
    return apiClient.get(url);
  },
  completeRoute: (id, data) =>
    apiClient.put(`/routes/${id}/complete`, data),
  selectRoute: (id, data) =>
    apiClient.put(`/routes/${id}/select-route`, data),
  getAnalytics: (days = 30) =>
    apiClient.get(`/routes/analytics/summary?days=${days}`),
};

// Safe Haven API calls
export const safeHavenAPI = {
  create: (data) => apiClient.post('/safe-havens', data),
  getNearby: (longitude, latitude, distance = 5000) =>
    apiClient.get(
      `/safe-havens/nearby?longitude=${longitude}&latitude=${latitude}&distance=${distance}`
    ),
  getAll: (type, city, limit = 50, skip = 0) => {
    let url = `/safe-havens?limit=${limit}&skip=${skip}`;
    if (type) url += `&type=${type}`;
    if (city) url += `&city=${city}`;
    return apiClient.get(url);
  },
  getById: (id) => apiClient.get(`/safe-havens/${id}`),
  addReview: (id, data) =>
    apiClient.post(`/safe-havens/${id}/review`, data),
  recordVisit: (id) => apiClient.post(`/safe-havens/${id}/visit`),
};

// Community Report API calls
export const communityReportAPI = {
  create: (data) => apiClient.post('/community-reports', data),
  getReports: (params = {}) => {
    const { reportType, status, district, latitude, longitude, radius, limit = 20, skip = 0 } = params;
    let url = `/community-reports?limit=${limit}&skip=${skip}`;
    if (reportType) url += `&reportType=${reportType}`;
    if (status)     url += `&status=${status}`;
    if (district)   url += `&district=${encodeURIComponent(district)}`;
    if (latitude)   url += `&latitude=${latitude}&longitude=${longitude}`;
    if (radius)     url += `&radius=${radius}`;
    return apiClient.get(url);
  },
  getNearby: (longitude, latitude, distance = 5000) =>
    apiClient.get(`/community-reports/nearby?longitude=${longitude}&latitude=${latitude}&distance=${distance}`),
  getTrending: (limit = 10) =>
    apiClient.get(`/community-reports/trending?limit=${limit}`),
  getById: (id) => apiClient.get(`/community-reports/${id}`),
  vote: (id, data) => apiClient.post(`/community-reports/${id}/vote`, data),
  addComment: (id, data) => apiClient.post(`/community-reports/${id}/comment`, data),
  flag: (id) => apiClient.post(`/community-reports/${id}/flag`),
  moderate: (id, data) => apiClient.post(`/community-reports/${id}/moderate`, data),
};

// Disaster Mode API
export const disasterAPI = {
  activate:       (data)  => apiClient.post('/disaster/activate', data),
  updateLocation: (data)  => apiClient.patch('/disaster/location', data),
  deactivate:     ()      => apiClient.delete('/disaster/deactivate'),
  getSession:     ()      => apiClient.get('/disaster/session'),
  getBroadcasts:  ()      => apiClient.get('/disaster/broadcasts'),
  track:          (id)    => apiClient.get(`/disaster/track/${id}`),
  helpdesk: {
    login:     (creds)        => apiClient.post('/disaster/helpdesk/login', creds),
    sessions:  (token, region) => apiClient.get(`/disaster/helpdesk/sessions${region ? `?region=${encodeURIComponent(region)}` : ''}`, { headers: { Authorization: `Bearer ${token}` } }),
    regions:   (token)        => apiClient.get('/disaster/helpdesk/regions',   { headers: { Authorization: `Bearer ${token}` } }),
    broadcasts:(token)        => apiClient.get('/disaster/helpdesk/broadcasts', { headers: { Authorization: `Bearer ${token}` } }),
    broadcast: (token, data)  => apiClient.post('/disaster/helpdesk/broadcast', data, { headers: { Authorization: `Bearer ${token}` } }),
  },
};

// Music Therapy API calls
export const musicTherapyAPI = {
  record: (data) => apiClient.post('/music-therapy', data),
  getHistory: (limit = 20, skip = 0) =>
    apiClient.get(`/music-therapy?limit=${limit}&skip=${skip}`),
  getStats: (days = 30) =>
    apiClient.get(`/music-therapy/stats/summary?days=${days}`),
  getRecommendations: (mood) =>
    apiClient.get(`/music-therapy/recommendations/${mood}`),
};

// History API calls
export const historyAPI = {
  getHistory: (type, limit = 50, skip = 0, days = 90) => {
    let url = `/history?limit=${limit}&skip=${skip}&days=${days}`;
    if (type) url += `&type=${type}`;
    return apiClient.get(url);
  },
  getAnalytics: (days = 30) =>
    apiClient.get(`/history/analytics/summary?days=${days}`),
  getTimeline: (days = 7) =>
    apiClient.get(`/history/timeline?days=${days}`),
};

// Export API calls
export const exportAPI = {
  getPDF: (startDate, endDate) => {
    let url = '/export/pdf';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    return apiClient.get(url, { responseType: 'blob' });
  },
  getExcel: (startDate, endDate) => {
    let url = '/export/excel';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    return apiClient.get(url, { responseType: 'blob' });
  },
  getStats: (startDate, endDate) => {
    let url = '/export/stats';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    return apiClient.get(url);
  },
};

export default apiClient;
