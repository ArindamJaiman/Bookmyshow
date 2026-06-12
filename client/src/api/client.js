import axios from 'axios';
import { API_ENDPOINTS } from '../utils/constants';

const api = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // Don't redirect on auth endpoints
      if (!err.config.url.includes('/auth/')) {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }
    return Promise.reject(err);
  }
);

// --- Auth ---
export const authAPI = {
  signup: (data) => api.post(API_ENDPOINTS.AUTH.SIGNUP, data),
  login: (data) => api.post(API_ENDPOINTS.AUTH.LOGIN, data),
  logout: () => api.post(API_ENDPOINTS.AUTH.LOGOUT),
  me: () => api.get(API_ENDPOINTS.AUTH.ME),
};

// --- Shows ---
export const showsAPI = {
  parse: (url) => api.post(API_ENDPOINTS.SHOWS.PARSE, { url }),
  getSeats: (url) => api.get(API_ENDPOINTS.SHOWS.SEATS, { params: { url } }),
};

// --- Holds ---
export const holdsAPI = {
  create: (data) => api.post(API_ENDPOINTS.HOLDS.BASE, data),
  list: () => api.get(API_ENDPOINTS.HOLDS.BASE),
  get: (id) => api.get(API_ENDPOINTS.HOLDS.BY_ID(id)),
  cancel: (id) => api.delete(API_ENDPOINTS.HOLDS.BY_ID(id)),
  confirm: (id) => api.post(API_ENDPOINTS.HOLDS.CONFIRM(id)),
  extend: (id) => api.post(API_ENDPOINTS.HOLDS.EXTEND(id)),
};

export default api;
