import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into all requests
API.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('bgv_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auto-handle 401/403 errors (token expired)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bgv_token');
        localStorage.removeItem('bgv_user');
        // We can redirect to login if we are not already there
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const downloadReport = async (candidateId: string) => {
  const response = await API.get(`/reports/${candidateId}`, {
    responseType: 'blob',
  });
  return response.data as Blob;
};
