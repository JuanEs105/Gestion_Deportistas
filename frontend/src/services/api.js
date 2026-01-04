// frontend/src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Configuración base de axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token a todas las peticiones
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

// ==========================================
// AUTH API
// ==========================================
export const authAPI = {
  login: async (credentials) => {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    return response.data;
  },
  
  register: async (userData) => {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};

// ==========================================
// DEPORTISTAS API
// ==========================================
export const deportistasAPI = {
  getAll: async () => {
    try {
      console.log('📡 Llamando a:', `${API_URL}/deportistas`);
      const response = await api.get('/deportistas');
      console.log('✅ Respuesta deportistas:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error en getAll deportistas:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    const response = await api.get(`/deportistas/${id}`);
    return response.data;
  },
  
  create: async (deportistaData) => {
    const response = await api.post('/deportistas', deportistaData);
    return response.data;
  },
  
  update: async (id, deportistaData) => {
    const response = await api.put(`/deportistas/${id}`, deportistaData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/deportistas/${id}`);
    return response.data;
  },
  
  getStats: async (id) => {
    const response = await api.get(`/deportistas/${id}/stats`);
    return response.data;
  }
};

// ==========================================
// EVALUACIONES API
// ==========================================
export const evaluacionesAPI = {
  create: async (evaluacionData) => {
    const response = await api.post('/evaluaciones', evaluacionData);
    return response.data;
  },
  
  getByDeportista: async (deportistaId) => {
    const response = await api.get(`/evaluaciones/deportista/${deportistaId}`);
    return response.data;
  },
  
  getProgreso: async (deportistaId) => {
    const response = await api.get(`/evaluaciones/progreso/${deportistaId}`);
    return response.data;
  },
  
  getHistorial: async (deportistaId, habilidadId) => {
    const response = await api.get(`/evaluaciones/historial/${deportistaId}/${habilidadId}`);
    return response.data;
  },
  
  aprobarCambioNivel: async (deportistaId, observaciones) => {
    const response = await api.post(`/evaluaciones/aprobar-cambio/${deportistaId}`, {
      observaciones
    });
    return response.data;
  },
  
  getPendientes: async () => {
    const response = await api.get('/evaluaciones/pendientes');
    return response.data;
  }
};

// ==========================================
// HABILIDADES API
// ==========================================
export const habilidadesAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/habilidades', { params });
    return response.data;
  },
  
  getByNivel: async (nivel, deportistaId = null) => {
    const params = deportistaId ? { deportista_id: deportistaId } : {};
    const response = await api.get(`/habilidades/nivel/${nivel}`, { params });
    return response.data;
  },
  
  create: async (habilidadData) => {
    const response = await api.post('/habilidades', habilidadData);
    return response.data;
  },
  
  getFaltantes: async (deportistaId, nivel = null) => {
    const params = nivel ? { nivel } : {};
    const response = await api.get(`/habilidades/faltantes/${deportistaId}`, { params });
    return response.data;
  }
};

// ==========================================
// UPLOAD API
// ==========================================
export const uploadAPI = {
  uploadDeportistaFoto: async (deportistaId, file) => {
    const formData = new FormData();
    formData.append('foto', file);
    
    const response = await api.post(`/upload/deportista/${deportistaId}/foto`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  deleteDeportistaFoto: async (deportistaId) => {
    const response = await api.delete(`/upload/deportista/${deportistaId}/foto`);
    return response.data;
  },
  
  uploadMultiple: async (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('fotos', file);
    });
    
    const response = await api.post('/upload/galeria', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

// ==========================================
// ADMIN API
// ==========================================
export const adminAPI = {
  getAllAdministradores: async () => {
    const response = await api.get('/admin/administradores');
    return response.data;
  },
  
  createAdministrador: async (adminData) => {
    const response = await api.post('/admin/administradores', adminData);
    return response.data;
  },
  
  updateAdministrador: async (id, adminData) => {
    const response = await api.put(`/admin/administradores/${id}`, adminData);
    return response.data;
  },
  
  deleteAdministrador: async (id) => {
    const response = await api.delete(`/admin/administradores/${id}`);
    return response.data;
  },
  
  toggleAdministradorStatus: async (id) => {
    const response = await api.patch(`/admin/administradores/${id}/toggle-status`);
    return response.data;
  },
  
  // Estadísticas
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
  
  getDeportistasStats: async () => {
    const response = await api.get('/admin/stats/deportistas');
    return response.data;
  },
  
  getEvaluacionesStats: async () => {
    const response = await api.get('/admin/stats/evaluaciones');
    return response.data;
  },
  
  // Entrenadores
  getAllEntrenadores: async () => {
    const response = await api.get('/admin/entrenadores');
    return response.data;
  },
  
  getEntrenadorById: async (id) => {
    const response = await api.get(`/admin/entrenadores/${id}`);
    return response.data;
  },
  
  createEntrenador: async (entrenadorData) => {
    const response = await api.post('/admin/entrenadores', entrenadorData);
    return response.data;
  },
  
  updateEntrenador: async (id, entrenadorData) => {
    const response = await api.put(`/admin/entrenadores/${id}`, entrenadorData);
    return response.data;
  },
  
  deleteEntrenador: async (id) => {
    const response = await api.delete(`/admin/entrenadores/${id}`);
    return response.data;
  },
  
  toggleEntrenadorStatus: async (id) => {
    const response = await api.patch(`/admin/entrenadores/${id}/toggle-status`);
    return response.data;
  },
  
  // Deportistas globales
  getAllDeportistasGlobal: async () => {
    const response = await api.get('/admin/deportistas/all');
    return response.data;
  },
  
  // Reportes
  getReporteResumen: async () => {
    const response = await api.get('/admin/reportes/resumen');
    return response.data;
  },
  
  getReporteActividad: async () => {
    const response = await api.get('/admin/reportes/actividad');
    return response.data;
  }
};

export default api;