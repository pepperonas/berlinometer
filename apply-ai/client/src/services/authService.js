import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5077/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
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

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => {
    return api.post('/auth/login', { email, password });
  },

  register: (email, password) => {
    return api.post('/auth/register', { email, password });
  },

  getCurrentUser: () => {
    return api.get('/auth/me');
  },

  getAllUsers: () => {
    return api.get('/admin/users');
  },

  approveUser: (userId, isApproved) => {
    return api.patch(`/admin/users/${userId}/approve`, { is_approved: isApproved });
  },

  deleteUser: (userId) => {
    return api.delete(`/admin/users/${userId}`);
  },
};

export default authService;