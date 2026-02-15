// frontend/api.js - VERSIÓN DEFINITIVA Y COMPLETA
window.AdminAPI = {

    baseURL: (() => {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        return 'https://gestiondeportistas-production.up.railway.app/api';
    })(),

    // ==========================================
    // CONFIGURACIÓN
    // ==========================================
    get token() {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    },

    get user() {
        try {
            const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            console.error('❌ Error parseando usuario:', e);
            return null;
        }
    },

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
        return headers;
    },

    // ==========================================
    // AUTENTICACIÓN
    // ==========================================
    async login(email, password) {
        try {
            console.log('🔐 Iniciando sesión...', { email });
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password })
            });

            const data = await response.json();
            console.log('📥 Respuesta del servidor:', data);

            if (!response.ok) {
                if (response.status === 401) throw new Error('CREDENCIALES INVÁLIDAS: Email o contraseña incorrectos');
                throw new Error(data.error || data.message || `Error ${response.status}`);
            }

            const token = data.token || data.access_token;
            const user  = data.user  || data;

            if (!token) throw new Error('No se recibió token de autenticación');

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            console.log('✅ Login exitoso:', user);
            this.showNotification('✅ Login exitoso', 'success');
            return { token, user };

        } catch (error) {
            console.error('❌ Error en login:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    async loginAdmin(email, password) {
        try {
            console.log('👑 Login como administrador...', { email });
            const result = await this.login(email, password);
            const userRole = result.user?.role || result.user?.tipo || result.user?.rol;
            console.log('🎭 Role del usuario:', userRole);

            if (userRole === 'admin') {
                console.log('✅ Usuario ES administrador');
                this.showNotification('✅ Admin autenticado correctamente', 'success');
                return result;
            } else {
                this.logout();
                throw new Error('Acceso restringido a administradores. Role: ' + userRole);
            }
        } catch (error) {
            console.error('❌ Error en loginAdmin:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    checkAuth() {
        if (!this.token) {
            console.warn('⚠️ No hay token de autenticación');
            this.showNotification('Sesión expirada. Redirigiendo al login...', 'warning');
            setTimeout(() => this.logout(), 1500);
            return false;
        }
        if (this.user) {
            const userRole = this.user.role || this.user.tipo || this.user.rol;
            if (userRole !== 'admin') {
                this.showNotification('Acceso restringido a administradores', 'error');
                setTimeout(() => this.logout(), 2000);
                return false;
            }
        }
        return true;
    },

    logout() {
        console.log('👋 Cerrando sesión...');
        this.showNotification('Sesión cerrada exitosamente', 'info');
        localStorage.clear();
        sessionStorage.clear();
        setTimeout(() => {
            const path = window.location.pathname;
            if (path.includes('/admin/')) {
                window.location.href = '../../auth/login-admin.html';
            } else {
                window.location.href = '../auth/login-admin.html';
            }
        }, 1500);
    },

    updateUserInfo() {
        const userEmail = document.getElementById('userEmail');
        if (userEmail && this.user) userEmail.textContent = this.user.email || 'admin@titanes.com';
        const userName = document.getElementById('userName');
        if (userName && this.user) userName.textContent = this.user.nombre || this.user.name || 'Administrador';
    },

    // ==========================================
    // ADMINISTRADORES
    // ==========================================
    async getAllAdministradores() {
        try {
            if (!this.checkAuth()) return { success: false, administradores: [] };
            const response = await fetch(`${this.baseURL}/admin/administradores`, { headers: this.getHeaders() });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            console.log(`✅ ${data.administradores?.length || 0} administradores`);
            return data;
        } catch (error) {
            console.error('❌ Error obteniendo administradores:', error);
            this.showNotification('Error al cargar administradores: ' + error.message, 'error');
            return { success: false, administradores: [] };
        }
    },

    async createAdministrador(adminData) {
        try {
            if (!this.checkAuth()) return null;
            if (!adminData.nombre || !adminData.email || !adminData.password) throw new Error('Nombre, email y contraseña son requeridos');
            if (adminData.password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');

            const payload = {
                nombre: adminData.nombre.trim(),
                email: adminData.email.trim(),
                password: adminData.password,
                telefono: adminData.telefono || null
            };

            const response = await fetch(`${this.baseURL}/admin/administradores`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Error al crear administrador');

            this.showNotification(`✅ Administrador "${adminData.nombre}" creado exitosamente`, 'success', 7000);
            setTimeout(() => {
                alert(`✅ ADMINISTRADOR CREADO\n\n👤 Nombre: ${adminData.nombre}\n📧 Email: ${adminData.email}\n🔐 Contraseña: ${adminData.password}`);
            }, 500);
            return data;
        } catch (error) {
            console.error('❌ Error creando administrador:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    async updateAdministrador(id, adminData) {
        try {
            if (!this.checkAuth()) return null;
            const payload = {
                nombre: adminData.nombre.trim(),
                email: adminData.email.trim(),
                telefono: adminData.telefono || null
            };
            if (adminData.password && adminData.password.trim() !== '') {
                if (adminData.password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
                payload.password = adminData.password;
            }
            const response = await fetch(`${this.baseURL}/admin/administradores/${id}`, {
                method: 'PUT', headers: this.getHeaders(), body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Error al actualizar administrador');
            this.showNotification('✅ Administrador actualizado exitosamente', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error actualizando administrador:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    async deleteAdministrador(id) {
        try {
            if (!this.checkAuth()) return null;
            const response = await fetch(`${this.baseURL}/admin/administradores/${id}`, {
                method: 'DELETE', headers: this.getHeaders()
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Error al eliminar administrador');
            this.showNotification('✅ Administrador eliminado exitosamente', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error eliminando administrador:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    async toggleAdministradorStatus(id) {
        try {
            if (!this.checkAuth()) return null;
            const response = await fetch(`${this.baseURL}/admin/administradores/${id}/toggle-status`, {
                method: 'PATCH', headers: this.getHeaders()
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Error al cambiar estado');
            this.showNotification('✅ Estado del administrador actualizado', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error cambiando estado:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    async testAdminLogin(email, password) {
        try {
            const result = await this.loginAdmin(email, password);
            if (result) {
                setTimeout(() => { this.logout(); }, 2000);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Test de login FALLIDO:', error.message);
            return false;
        }
    },

    async fixAdminCredentials() {
        try {
            const adminEmail  = 'xxedechicoxx@gmail.com';
            const newPassword = 'Admin123!';
            const adminsResponse = await this.getAllAdministradores();
            const admin = (adminsResponse.administradores || []).find(a => a.email === adminEmail);
            if (!admin) throw new Error(`Admin no encontrado: ${adminEmail}`);
            const result = await this.updateAdministrador(admin.id, {
                nombre: admin.nombre, email: admin.email, telefono: admin.telefono, password: newPassword
            });
            setTimeout(async () => {
                try {
                    await this.login(adminEmail, newPassword);
                    alert(`✅ Contraseña reseteada\n\n📧 Email: ${adminEmail}\n🔐 Nueva contraseña: ${newPassword}`);
                    this.showNotification('✅ Contraseña reseteada exitosamente', 'success');
                } catch (e) { console.error('❌ Error probando nueva contraseña:', e); }
            }, 1000);
            return result;
        } catch (error) {
            console.error('❌ Error arreglando admin:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    // ==========================================
    // EVALUACIONES
    // ==========================================
    async getAllEvaluaciones() {
        try {
            const response = await fetch(`${this.baseURL}/evaluaciones`, { headers: this.getHeaders() });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data.evaluaciones || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo evaluaciones:', error);
            this.showNotification('Error al cargar evaluaciones', 'error');
            return [];
        }
    },

    async getEvaluacionesDeportista(deportistaId) {
        try {
            const response = await fetch(`${this.baseURL}/evaluaciones/deportista/${deportistaId}`, { headers: this.getHeaders() });
            if (!response.ok) return [];
            const data = await response.json();
            return data.evaluaciones || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo evaluaciones:', error);
            return [];
        }
    },

    async getEvaluacionById(id) {
        try {
            const response = await fetch(`${this.baseURL}/evaluaciones/${id}`, { headers: this.getHeaders() });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data.evaluacion || data;
        } catch (error) {
            console.error('❌ Error obteniendo evaluación:', error);
            this.showNotification('Error al cargar evaluación', 'error');
            return null;
        }
    },

    async createEvaluacion(evaluacionData) {
        try {
            const payload = {
                deportista_id: evaluacionData.deportista_id,
                habilidad_id: evaluacionData.habilidad_id,
                puntuacion: evaluacionData.puntuacion || 0,
                observaciones: evaluacionData.observaciones || '',
                fecha_evaluacion: evaluacionData.fecha_evaluacion || new Date().toISOString().split('T')[0],
                entrenador_id: evaluacionData.entrenador_id || this.user?.id
            };
            const response = await fetch(`${this.baseURL}/evaluaciones`, {
                method: 'POST', headers: this.getHeaders(), body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Error al crear evaluación');
            this.showNotification('✅ Evaluación creada exitosamente', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error creando evaluación:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    async updateEvaluacion(id, evaluacionData) {
        try {
            const payload = {
                puntuacion: evaluacionData.puntuacion,
                observaciones: evaluacionData.observaciones || '',
                fecha_evaluacion: evaluacionData.fecha_evaluacion
            };
            const response = await fetch(`${this.baseURL}/evaluaciones/${id}`, {
                method: 'PUT', headers: this.getHeaders(), body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Error al actualizar evaluación');
            this.showNotification('✅ Evaluación actualizada exitosamente', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error actualizando evaluación:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    async deleteEvaluacion(id) {
        try {
            const response = await fetch(`${this.baseURL}/evaluaciones/${id}`, {
                method: 'DELETE', headers: this.getHeaders()
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Error al eliminar evaluación');
            this.showNotification('✅ Evaluación eliminada exitosamente', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error eliminando evaluación:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    async getProgresoDeportista(deportistaId) {
        try {
            const response = await fetch(`${this.baseURL}/evaluaciones/progreso/${deportistaId}`, { headers: this.getHeaders() });
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('❌ Error obteniendo progreso:', error);
            return null;
        }
    },

    async getEvaluacionesPorNivel(nivel) {
        try {
            const response = await fetch(`${this.baseURL}/evaluaciones/nivel/${nivel}`, { headers: this.getHeaders() });
            if (!response.ok) return [];
            const data = await response.json();
            return data.evaluaciones || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo evaluaciones por nivel:', error);
            return [];
        }
    },

    async getEvaluacionesRecientes(limit = 10) {
        try {
            const response = await fetch(`${this.baseURL}/evaluaciones/recientes?limit=${limit}`, { headers: this.getHeaders() });
            if (!response.ok) return await this.getActividadReciente();
            const data = await response.json();
            return data.evaluaciones || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo evaluaciones recientes:', error);
            return [];
        }
    },

    async getHabilidadesDeportista(deportistaId) {
        try {
            const deportista = await this.getDeportistaById(deportistaId);
            if (!deportista) return [];
            const nivel = deportista.nivel_actual || deportista.deportista?.nivel_actual || '1_basico';
            const response = await fetch(`${this.baseURL}/habilidades/nivel/${nivel}`, { headers: this.getHeaders() });
            if (!response.ok) return [];
            const data = await response.json();
            return data.habilidades || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo habilidades:', error);
            return [];
        }
    },

    // ==========================================
    // HABILIDADES
    // ==========================================
    async getAllHabilidades() {
        try {
            const response = await fetch(`${this.baseURL}/habilidades`, { headers: this.getHeaders() });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data.habilidades || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo habilidades:', error);
            this.showNotification('Error al cargar habilidades', 'error');
            return [];
        }
    },

    async getHabilidadesPorNivel(nivel) {
        try {
            const response = await fetch(`${this.baseURL}/habilidades/nivel/${nivel}`, { headers: this.getHeaders() });
            if (!response.ok) {
                const all = await this.getAllHabilidades();
                const filtradas = all.filter(h => h.nivel === nivel);
                return {
                    habilidades: filtradas,
                    por_categoria: {
                        habilidad: filtradas.filter(h => h.categoria === 'habilidad'),
                        ejercicio_accesorio: filtradas.filter(h => h.categoria === 'ejercicio_accesorio'),
                        postura: filtradas.filter(h => h.categoria === 'postura')
                    },
                    total: filtradas.length
                };
            }
            return await response.json();
        } catch (error) {
            console.error('❌ Error obteniendo habilidades por nivel:', error);
            return { habilidades: [], por_categoria: { habilidad: [], ejercicio_accesorio: [], postura: [] }, total: 0 };
        }
    },

    async getHabilidadById(id) {
        try {
            const response = await fetch(`${this.baseURL}/habilidades/${id}`, { headers: this.getHeaders() });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data.habilidad || data;
        } catch (error) {
            console.error('❌ Error obteniendo habilidad:', error);
            this.showNotification('Error al cargar habilidad', 'error');
            return null;
        }
    },

    // ==========================================
    // DEPORTISTAS
    // ==========================================
    async getDeportistas() {
        try {
            const response = await fetch(`${this.baseURL}/admin/deportistas`, { headers: this.getHeaders() });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data.deportistas || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo deportistas:', error);
            this.showNotification('Error al cargar deportistas', 'error');
            return [];
        }
    },

    async getDeportistaById(id) {
        try {
            const response = await fetch(`${this.baseURL}/deportistas/${id}`, { headers: this.getHeaders() });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data.deportista || data;
        } catch (error) {
            console.error('❌ Error obteniendo deportista:', error);
            this.showNotification('Error al cargar información del deportista', 'error');
            return null;
        }
    },

    async updateDeportista(id, deportistaData) {
        try {
            const payload = {
                nombre: deportistaData.nombre,
                telefono: deportistaData.telefono,
                fecha_nacimiento: deportistaData.fecha_nacimiento,
                peso: deportistaData.peso,
                altura: deportistaData.altura,
                talla_camiseta: deportistaData.talla_camiseta || deportistaData.talla,
                nivel_actual: deportistaData.nivel_actual,
                estado: deportistaData.estado,
                equipo_competitivo: deportistaData.equipo_competitivo,
                contacto_emergencia_nombre: deportistaData.contacto_emergencia_nombre,
                contacto_emergencia_telefono: deportistaData.contacto_emergencia_telefono,
                contacto_emergencia_parentesco: deportistaData.contacto_emergencia_parentesco
            };
            const response = await fetch(`${this.baseURL}/admin/deportistas/${id}`, {
                method: 'PUT', headers: this.getHeaders(), body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Error al actualizar deportista');
            this.showNotification('✅ Deportista actualizado exitosamente', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error actualizando deportista:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    async deleteDeportista(id) {
        try {
            const response = await fetch(`${this.baseURL}/admin/deportistas/${id}`, {
                method: 'DELETE', headers: this.getHeaders()
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Error al eliminar deportista');
            this.showNotification('✅ Deportista eliminado exitosamente', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error eliminando deportista:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    updateDeportistaCampo: async function(deportistaId, datos) {
        try {
            const response = await fetch(`${this.baseURL}/admin/deportistas/${deportistaId}/campo`, {
                method: 'PATCH', headers: this.getHeaders(), body: JSON.stringify(datos)
            });
            const text = await response.text();
            if (!text) return { success: true, message: 'Campo actualizado' };
            try {
                const data = JSON.parse(text);
                if (!response.ok) throw new Error(data.message || 'Error actualizando campo');
                return data;
            } catch (parseError) {
                if (response.ok) return { success: true, message: 'Campo actualizado' };
                throw new Error('Respuesta inválida del servidor');
            }
        } catch (error) {
            console.error('❌ Error en updateDeportistaCampo:', error);
            throw error;
        }
    },

    async updateDeportistaInfo(deportistaId, campo, valor) {
        try {
            const response = await fetch(`${this.baseURL}/admin/deportistas/${deportistaId}/info`, {
                method: 'PATCH', headers: this.getHeaders(), body: JSON.stringify({ campo, valor })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Error al actualizar campo');
            this.showNotification(`✅ ${campo} actualizado exitosamente`, 'success');
            return data;
        } catch (error) {
            console.error('❌ Error actualizando campo:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    async toggleDeportistaStatus(id) {
        try {
            const response = await fetch(`${this.baseURL}/admin/deportistas/${id}/toggle-status`, {
                method: 'PATCH', headers: this.getHeaders()
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Error al cambiar estado');
            this.showNotification('✅ Estado del deportista actualizado', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error cambiando estado:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    async searchDeportistas(query, filtros = {}) {
        try {
            const params = new URLSearchParams();
            if (query) params.append('q', query);
            if (filtros.nivel) params.append('nivel', filtros.nivel);
            if (filtros.estado) params.append('estado', filtros.estado);
            if (filtros.equipo) params.append('equipo', filtros.equipo);
            const response = await fetch(`${this.baseURL}/admin/deportistas/search?${params}`, { headers: this.getHeaders() });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data.deportistas || [];
        } catch (error) {
            console.error('❌ Error buscando deportistas:', error);
            return [];
        }
    },

    // ==========================================
    // ENTRENADORES
    // ==========================================
    async getAllEntrenadores() {
        try {
            const response = await fetch(`${this.baseURL}/admin/entrenadores`, { headers: this.getHeaders() });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            console.log(`✅ ${data.entrenadores?.length || 0} entrenadores`);
            return data;
        } catch (error) {
            console.error('❌ Error obteniendo entrenadores:', error);
            this.showNotification('Error al cargar entrenadores', 'error');
            return { success: false, entrenadores: [] };
        }
    },

    async createEntrenador(entrenadorData) {
        try {
            const payload = {
                nombre: entrenadorData.nombre,
                email: entrenadorData.email,
                fecha_nacimiento: entrenadorData.fecha_nacimiento,
                telefono: entrenadorData.telefono || null,
                niveles_asignados: entrenadorData.niveles_asignados || [],
                grupos_competitivos: entrenadorData.grupos_competitivos || [],
                role: 'entrenador',
                requiere_registro: true,
                password: ''
            };
            const response = await fetch(`${this.baseURL}/admin/entrenadores`, {
                method: 'POST', headers: this.getHeaders(), body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Error al crear entrenador');
            this.showNotification('✅ Entrenador creado. Se enviará correo para completar registro.', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error creando entrenador:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    async updateEntrenador(id, entrenadorData) {
        try {
            const payload = {
                nombre: entrenadorData.nombre,
                fecha_nacimiento: entrenadorData.fecha_nacimiento,
                telefono: entrenadorData.telefono || null,
                niveles_asignados: entrenadorData.niveles_asignados || [],
                grupos_competitivos: entrenadorData.grupos_competitivos || []
            };
            const response = await fetch(`${this.baseURL}/admin/entrenadores/${id}`, {
                method: 'PUT', headers: this.getHeaders(), body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Error al actualizar entrenador');
            this.showNotification('✅ Entrenador actualizado exitosamente', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error actualizando entrenador:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    async deleteEntrenador(id) {
        try {
            const response = await fetch(`${this.baseURL}/admin/entrenadores/${id}`, {
                method: 'DELETE', headers: this.getHeaders()
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Error al eliminar entrenador');
            this.showNotification('✅ Entrenador eliminado exitosamente', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error eliminando entrenador:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    async toggleEntrenadorStatus(id) {
        try {
            const response = await fetch(`${this.baseURL}/admin/entrenadores/${id}/toggle-status`, {
                method: 'PATCH', headers: this.getHeaders()
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Error al cambiar estado');
            this.showNotification('✅ Estado del entrenador actualizado', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error cambiando estado:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    // ==========================================
    // ESTADÍSTICAS
    // ==========================================
    async getStats() {
        try {
            const response = await fetch(`${this.baseURL}/admin/stats`, { headers: this.getHeaders() });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            this.showNotification('Error al cargar estadísticas', 'error');
            return null;
        }
    },

    async getDeportistasStats() {
        try {
            const deportistas = await this.getDeportistas();
            if (!deportistas || deportistas.length === 0) {
                return {
                    por_nivel: ['baby_titans','1_basico','1_medio','1_avanzado','2','3','4'].map(n => ({ nivel_actual: n, cantidad: 0 })),
                    por_estado: ['activo','lesionado','inactivo','descanso','pendiente'].map(e => ({ estado: e, cantidad: 0 }))
                };
            }
            const porNivel = {}, porEstado = {};
            deportistas.forEach(d => {
                const nivel  = d.nivel_actual  || d.deportista?.nivel_actual  || 'pendiente';
                const estado = d.estado        || d.deportista?.estado        || 'activo';
                porNivel[nivel]   = (porNivel[nivel]   || 0) + 1;
                porEstado[estado] = (porEstado[estado] || 0) + 1;
            });
            return {
                por_nivel:  Object.keys(porNivel).map(n => ({ nivel_actual: n, cantidad: porNivel[n] })),
                por_estado: Object.keys(porEstado).map(e => ({ estado: e,        cantidad: porEstado[e] }))
            };
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas de deportistas:', error);
            return { por_nivel: [], por_estado: [] };
        }
    },

    async getActividadReciente() {
        try {
            const deportistas = await this.getDeportistas();
            if (!deportistas || deportistas.length === 0) return [];

            let todasEvaluaciones = [];
            for (const dep of deportistas.slice(0, 3)) {
                try {
                    const evals = await this.getEvaluacionesDeportista(dep.id || dep.deportista_id);
                    if (evals && evals.length > 0) {
                        todasEvaluaciones = todasEvaluaciones.concat(evals.map(e => ({
                            ...e,
                            deportista_nombre: dep.nombre || dep.User?.nombre || 'Deportista',
                            deportista_id: dep.id || dep.deportista_id,
                            nivel: dep.nivel_actual || dep.deportista?.nivel_actual
                        })));
                    }
                } catch (e) { /* silencioso */ }
            }

            if (todasEvaluaciones.length === 0) {
                todasEvaluaciones = deportistas.slice(0, 3).map((d, i) => ({
                    id: `ejemplo-${i + 1}`,
                    deportista_nombre: d.nombre || 'Deportista Ejemplo',
                    deportista_id: d.id,
                    habilidad_nombre: ['Rollo adelante', 'Parada de manos', 'Flick en tumbl track'][i % 3],
                    puntuacion: Math.floor(Math.random() * 5) + 6,
                    observaciones: 'Evaluación de prueba',
                    fecha_evaluacion: new Date(Date.now() - (i * 86400000)).toISOString(),
                    nivel: d.nivel_actual || '1_basico'
                }));
            }

            return todasEvaluaciones
                .sort((a, b) => new Date(b.fecha_evaluacion || b.created_at || 0) - new Date(a.fecha_evaluacion || a.created_at || 0))
                .slice(0, 5);
        } catch (error) {
            console.error('❌ Error obteniendo actividad reciente:', error);
            return [];
        }
    },

    // ==========================================
    // CALENDARIO
    // ==========================================
    async getEventosCalendario(filtros = {}) {
        try {
            const hoy = new Date();
            const mes = filtros.mes || hoy.getMonth() + 1;
            const año = filtros.año || hoy.getFullYear();

            let response = await fetch(`${this.baseURL}/calendario?mes=${mes}&año=${año}`, { headers: this.getHeaders() });
            if (!response.ok) {
                response = await fetch(`${this.baseURL}/calendario/filtros?mes=${mes}&año=${año}`, { headers: this.getHeaders() });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            return data.eventos || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo eventos:', error);
            this.showNotification('Error al cargar calendario: ' + error.message, 'error');
            return [];
        }
    },

    async createEvento(eventoData) {
        try {
            if (!eventoData.titulo?.trim()) throw new Error('El título del evento es obligatorio');
            if (!eventoData.fecha) throw new Error('La fecha del evento es obligatoria');

            let niveles = eventoData.niveles && Array.isArray(eventoData.niveles)
                ? eventoData.niveles
                : eventoData.nivel ? [eventoData.nivel] : ['baby_titans'];

            let grupos = eventoData.grupos_competitivos && Array.isArray(eventoData.grupos_competitivos)
                ? eventoData.grupos_competitivos
                : eventoData.grupo_competitivo ? [eventoData.grupo_competitivo] : [];

            if (!niveles.length) throw new Error('Debe seleccionar al menos un nivel');

            const payload = {
                titulo: eventoData.titulo.trim(),
                descripcion: eventoData.descripcion?.trim() || null,
                fecha: eventoData.fecha,
                hora: eventoData.hora?.trim() || null,
                ubicacion: eventoData.ubicacion?.trim() || null,
                niveles,
                grupos_competitivos: grupos,
                tipo: eventoData.tipo || 'general',
                tipo_personalizado: eventoData.tipo === 'otro' ? eventoData.tipo_personalizado?.trim() || null : null,
                entrenador_id: eventoData.entrenador_id || this.user?.id || null
            };

            const response = await fetch(`${this.baseURL}/calendario`, {
                method: 'POST', headers: this.getHeaders(), body: JSON.stringify(payload)
            });

            const contentType = response.headers.get('content-type');
            const data = contentType?.includes('application/json')
                ? await response.json()
                : JSON.parse(await response.text());

            if (!response.ok) throw new Error(data.error || data.message || `Error ${response.status}`);
            this.showNotification('✅ Evento creado exitosamente', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error creando evento:', error);
            let msg = error.message;
            if (msg.includes('Failed to fetch')) msg = 'No se pudo conectar con el servidor';
            else if (msg.includes('404')) msg = 'Ruta del API no encontrada';
            else if (msg.includes('500')) msg = 'Error interno del servidor. Revisa los logs del backend';
            this.showNotification(`❌ ${msg}`, 'error');
            throw error;
        }
    },

    async updateEvento(id, eventoData) {
        try {
            const payload = {
                titulo: eventoData.titulo || '',
                descripcion: eventoData.descripcion || '',
                fecha: eventoData.fecha,
                hora: eventoData.hora || null,
                ubicacion: eventoData.ubicacion || '',
                nivel: eventoData.nivel || null,
                grupo_competitivo: eventoData.grupo_competitivo || null,
                tipo: eventoData.tipo || 'general',
                tipo_personalizado: eventoData.tipo_personalizado || null
            };
            const response = await fetch(`${this.baseURL}/calendario/${id}`, {
                method: 'PUT', headers: this.getHeaders(), body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Error al actualizar evento');
            this.showNotification('✅ Evento actualizado exitosamente', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error actualizando evento:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    async deleteEvento(id) {
        try {
            const response = await fetch(`${this.baseURL}/calendario/${id}`, {
                method: 'DELETE', headers: this.getHeaders()
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Error al eliminar evento');
            this.showNotification('✅ Evento eliminado exitosamente', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error eliminando evento:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    // ==========================================
    // UTILIDADES
    // ==========================================
    async checkServerStatus() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            return response.ok;
        } catch (error) { return false; }
    },

    // ==========================================
    // NOTIFICACIONES
    // ==========================================
    showNotification(message, type = 'info', duration = 5000) {
        console.log(`💬 [${type}]: ${message}`);
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;max-width:400px;';
            document.body.appendChild(container);
        }
        const colors = { error:'#EF4444', success:'#10B981', warning:'#F59E0B', info:'#3B82F6' };
        const icons  = { error:'error', success:'check_circle', warning:'warning', info:'info' };
        const n = document.createElement('div');
        n.style.cssText = `background:${colors[type]||colors.info};color:white;padding:16px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;align-items:center;gap:12px;animation:slideIn 0.3s ease-out;font-family:'Montserrat',sans-serif;font-weight:500;min-width:300px;`;
        n.innerHTML = `
            <span class="material-symbols-outlined" style="font-size:20px;">${icons[type]||'info'}</span>
            <span style="flex:1;">${message}</span>
            <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;cursor:pointer;">
                <span class="material-symbols-outlined" style="font-size:16px;">close</span>
            </button>`;
        container.appendChild(n);
        setTimeout(() => {
            n.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => n.parentNode && n.parentNode.removeChild(n), 300);
        }, duration);
    }
};

// Estilos de animación
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn  { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes slideOut { from{transform:translateX(0);opacity:1} to{transform:translateX(100%);opacity:0} }
    `;
    document.head.appendChild(style);
}

console.log('✅ AdminAPI inicializado correctamente');