// ==========================================
// API SERVICE - TITANES EVOLUTION
// ==========================================

const APIService = {
    baseURL: (() => {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        return 'https://gestiondeportistas-production.up.railway.app/api';
    })(),
    getHeaders: function (isFormData = false) {
        const headers = {};
        const token = AuthAPI?.getToken();

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        return headers;
    },

    // Método genérico para peticiones
    async request(endpoint, method = 'GET', data = null, isFormData = false) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = this.getHeaders(isFormData);

        const options = {
            method,
            headers,
            credentials: 'include'
        };

        if (data) {
            options.body = isFormData ? data : JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // DEPORTISTAS API
    deportistas: {
        getAll: async function () {
            return APIService.request('/deportistas', 'GET');
        },

        getById: async function (id) {
            return APIService.request(`/deportistas/${id}`, 'GET');
        },

        create: async function (data) {
            return APIService.request('/deportistas', 'POST', data);
        },

        update: async function (id, data) {
            return APIService.request(`/deportistas/${id}`, 'PUT', data);
        },

        delete: async function (id) {
            return APIService.request(`/deportistas/${id}`, 'DELETE');
        },

        updateFoto: async function (id, formData) {
            return APIService.request(`/deportistas/${id}/foto`, 'PUT', formData, true);
        }
    },

    // EVALUACIONES API
    evaluaciones: {
        getByDeportista: async function (deportistaId) {
            return APIService.request(`/evaluaciones/deportista/${deportistaId}`, 'GET');
        },

        create: async function (data) {
            return APIService.request('/evaluaciones', 'POST', data);
        }
    },

    // HABILIDADES API
    habilidades: {
        getAll: async function () {
            return APIService.request('/habilidades', 'GET');
        },

        getByNivel: async function (nivel) {
            return APIService.request(`/habilidades/nivel/${nivel}`, 'GET');
        }
    },

    // ADMIN API
    admin: {
        getDeportistas: async function () {
            return APIService.request('/admin/deportistas', 'GET');
        },

        getEntrenadores: async function () {
            return APIService.request('/admin/entrenadores', 'GET');
        },

        getAdministradores: async function () {
            return APIService.request('/admin/administradores', 'GET');
        }
    }
};

// Hacer disponible globalmente
window.APIService = APIService;