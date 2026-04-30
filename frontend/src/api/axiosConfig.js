import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/',
});

console.log(`[Axios Config] API Base: ${api.defaults.baseURL}`);

api.interceptors.request.use(
  (config) => {
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
