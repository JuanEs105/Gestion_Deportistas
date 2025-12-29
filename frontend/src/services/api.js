import axios from 'axios';

// Configurar axios base
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token automáticamente
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

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const deportistasAPI = {
  getAll: () => api.get('/deportistas'),
  getById: (id) => api.get(`/deportistas/${id}`),
  create: (data) => api.post('/deportistas', data),
  update: (id, data) => api.put(`/deportistas/${id}`, data),
  delete: (id) => api.delete(`/deportistas/${id}`)
};

export const evaluacionesAPI = {
  getAll: () => api.get('/evaluaciones'),
  getByDeportista: (deportistaId) => api.get(`/evaluaciones/deportista/${deportistaId}`),
  create: (data) => api.post('/evaluaciones', data)
};

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  profile: () => api.get('/auth/profile')
};

export default api;