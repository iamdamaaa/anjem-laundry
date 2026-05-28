import axios from 'axios';

// Create an Axios instance with base URL and default configurations
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : 'http://localhost/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to dynamically inject the Bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle specific error codes globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if the response returned a 401 Unauthorized error
    if (error.response && error.response.status === 401) {
      // Clear token from localStorage
      localStorage.removeItem('auth_token');
      
      // Prevent redirection loops if already on login/register/invoice pages
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register' && !path.startsWith('/invoice/')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
