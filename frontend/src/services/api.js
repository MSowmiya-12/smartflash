import axios from 'axios';

// Get API base URL from env or fallback to local port 8000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to dynamically inject the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect if session expires
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const flashcardAPI = {
  generate: (title, notes) => api.post('/flashcards/generate', { title, notes }),
  getSets: () => api.get('/flashcards'),
  getCards: (setId, prioritized = false) => api.get('/flashcards', { params: { setId, prioritized } }),
  review: (cardId, isKnown) => api.post('/flashcards/review', { card_id: cardId, is_known: isKnown }),
  deleteSet: (setId) => api.delete(`/flashcards/${setId}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
};

export default api;
