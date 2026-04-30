import axios from 'axios';
import { enqueueOfflineRequest } from '../utils/offlineQueue';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/',
});

console.log(`[Axios Config] API Base: ${api.defaults.baseURL}`);

api.interceptors.request.use(
  (config) => {
    const method = (config.method || 'get').toLowerCase();
    const isWrite = ['post', 'put', 'patch', 'delete'].includes(method);
    if (isWrite && navigator && navigator.onLine === false) {
      enqueueOfflineRequest(config);
      return Promise.reject({
        isOfflineQueued: true,
        response: {
          status: 202,
          data: {
            success: true,
            queued: true,
            message: 'Accion guardada. Se enviara automaticamente al volver internet.',
          },
        },
      });
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.isOfflineQueued && error?.response) {
      return Promise.resolve(error.response);
    }

    const { response } = error;

    if (response && response.status === 401) {
      console.warn('[Auth] SesiÃ³n expirada o invÃ¡lida. Limpiando y redirigiendo...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    if (response) {
      console.error(`[API Error] ${response.status}: ${response.data?.message || error.message}`);
    } else if (error.request) {
      console.error('[API Error] No se pudo contactar al servidor. Verifica que el backend estÃ© en ' + api.defaults.baseURL);
    }

    return Promise.reject(error);
  }
);

export default api;
