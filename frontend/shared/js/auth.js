// ==========================================
// MÓDULO DE AUTENTICACIÓN - TITANES EVOLUTION
// ==========================================

const AuthAPI = {
    apiBaseUrl: (() => {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        return 'https://gestiondeportistas-production.up.railway.app/api';
    })(),

    // Inicializar
    init: function () {
        this.checkTokenExpiry();
        this.setupAxiosInterceptors();
        console.log('✅ Auth module initialized');
        return this;
    },

    // Setup interceptors for axios
    setupAxiosInterceptors: function () {
        if (typeof axios !== 'undefined') {
            // Request interceptor
            axios.interceptors.request.use(
                config => {
                    const token = this.getToken();
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                    return config;
                },
                error => {
                    return Promise.reject(error);
                }
            );

            // Response interceptor
            axios.interceptors.response.use(
                response => response,
                error => {
                    if (error.response?.status === 401) {
                        this.handleUnauthorized();
                    }
                    return Promise.reject(error);
                }
            );
        }
    },

    // Login
    login: async function (credentials) {
        try {
            console.log('🔐 Attempting login...');

            const response = await axios.post(
                `${this.config.apiBaseUrl}/auth/login`,
                credentials
            );

            if (response.data.success && response.data.token) {
                this.setToken(response.data.token);
                this.setUser(response.data.user);
                this.setTokenExpiry(response.data.expires_in || 3600);

                console.log('✅ Login successful');
                return response.data;
            } else {
                throw new Error(response.data.error || 'Login failed');
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            throw error;
        }
    },

    // Logout
    logout: function () {
        localStorage.removeItem(this.config.tokenKey);
        localStorage.removeItem(this.config.userKey);
        localStorage.removeItem(this.config.tokenExpiryKey);

        // Limpiar cualquier otro dato de sesión
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('titanes_')) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Redirigir al login
        window.location.href = '/auth/login.html';
    },

    // Register (deportista)
    registerDeportista: async function (formData) {
        try {
            console.log('📝 Registering deportista...');

            const response = await axios.post(
                `${this.config.apiBaseUrl}/auth/registro-deportista`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success) {
                console.log('✅ Registration successful');
                return response.data;
            } else {
                throw new Error(response.data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            throw error;
        }
    },

    // Get current user
    getCurrentUser: function () {
        const userStr = localStorage.getItem(this.config.userKey);
        if (!userStr) return null;

        try {
            return JSON.parse(userStr);
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    },

    // Check if user is authenticated
    isAuthenticated: function () {
        const token = this.getToken();
        const user = this.getCurrentUser();

        if (!token || !user) {
            return false;
        }

        // Verificar expiración del token
        if (this.isTokenExpired()) {
            this.logout();
            return false;
        }

        return true;
    },

    // Check user role
    hasRole: function (role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    },

    // Token management
    setToken: function (token) {
        localStorage.setItem(this.config.tokenKey, token);
    },

    getToken: function () {
        return localStorage.getItem(this.config.tokenKey);
    },

    setUser: function (user) {
        localStorage.setItem(this.config.userKey, JSON.stringify(user));
    },

    setTokenExpiry: function (seconds) {
        const expiryTime = Date.now() + (seconds * 1000);
        localStorage.setItem(this.config.tokenExpiryKey, expiryTime.toString());
    },

    isTokenExpired: function () {
        const expiryTime = localStorage.getItem(this.config.tokenExpiryKey);
        if (!expiryTime) return true;

        return Date.now() > parseInt(expiryTime);
    },

    checkTokenExpiry: function () {
        if (this.isTokenExpired() && this.getToken()) {
            console.log('⚠️ Token expired, logging out...');
            this.logout();
        }
    },

    // Handle unauthorized access
    handleUnauthorized: function () {
        console.log('🚫 Unauthorized access detected');

        // Mostrar mensaje al usuario
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification('Sesión expirada. Por favor, inicia sesión nuevamente.', 'error', 5000);
        }

        // Esperar un momento antes de redirigir
        setTimeout(() => {
            this.logout();
        }, 2000);
    },

    // Redirect based on role
    redirectByRole: function () {
        const user = this.getCurrentUser();
        if (!user) return;

        const currentPath = window.location.pathname;

        // Definir rutas por rol
        const roleRoutes = {
            'admin': '/admin/dashboard.html',
            'entrenador': '/entrenador/dashboard.html',
            'deportista': '/deportista/dashboard.html'
        };

        const targetRoute = roleRoutes[user.role];

        // Redirigir solo si no está ya en la ruta correcta
        if (targetRoute && !currentPath.includes(targetRoute)) {
            window.location.href = targetRoute;
        }
    },

    // Check and redirect if not authenticated
    requireAuth: function (requiredRole = null) {
        if (!this.isAuthenticated()) {
            // Guardar la página actual para redirigir después del login
            const currentPath = window.location.pathname + window.location.search;
            sessionStorage.setItem('redirect_after_login', currentPath);

            // Redirigir al login
            window.location.href = '/auth/login.html';
            return false;
        }

        if (requiredRole && !this.hasRole(requiredRole)) {
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification('No tienes permisos para acceder a esta página.', 'error');
            }
            this.redirectByRole();
            return false;
        }

        return true;
    }
};

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function () {
    AuthAPI.init();

    // Configurar heartbeat cada 5 minutos
    setInterval(() => {
        if (AuthAPI.isAuthenticated()) {
            // Extender la vida del token
            const currentExpiry = localStorage.getItem(AuthAPI.config.tokenExpiryKey);
            if (currentExpiry) {
                const newExpiry = Date.now() + (3600 * 1000);
                localStorage.setItem(AuthAPI.config.tokenExpiryKey, newExpiry.toString());
            }
        }
    }, 5 * 60 * 1000);
});

// Hacer disponible globalmente
window.AuthAPI = AuthAPI;