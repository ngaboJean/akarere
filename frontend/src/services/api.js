// ============================================================
// API Service - Axios Configuration
// ============================================================
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor - Gushyiraho Token
api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('system-yibanze-auth');
    if (stored) {
      const { state } = JSON.parse(stored);
      if (state?.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - Gukora Refresh Token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const stored = localStorage.getItem('system-yibanze-auth');
        if (stored) {
          const { state } = JSON.parse(stored);
          if (state?.refreshToken) {
            const res = await axios.post(
              `${api.defaults.baseURL}/auth/refresh`,
              { refreshToken: state.refreshToken }
            );
            const { accessToken } = res.data.data;
            original.headers.Authorization = `Bearer ${accessToken}`;
            return api(original);
          }
        }
      } catch {
        localStorage.removeItem('system-yibanze-auth');
        window.location.href = '/injira';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
