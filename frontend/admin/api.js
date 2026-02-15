// frontend/api.js - VERSIÓN DEFINITIVA Y COMPLETA
window.AdminAPI = {
    baseURL: (() => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return (() => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return (() => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return (() => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return (() => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    return 'https://gestiondeportistas-production.up.railway.app/api';
})();
    }
    return 'https://gestiondeportistas-production.up.railway.app/api';
})();
    }
    return 'https://gestiondeportistas-production.up.railway.app/api';
})();
    }
    return 'https://gestiondeportistas-production.up.railway.app/api';
})();
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
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    },

    // ==========================================
    // AUTENTICACIÓN - VERSIÓN DEFINITIVA
    // ==========================================

    async login(email, password) {
        try {
            console.log('🔐 Iniciando sesión...', { email });

            const payload = {
                email: email.trim(),
                password: password
            };

            console.log('📤 Enviando login a:', `${this.baseURL}/auth/login`);

            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            console.log('📥 Respuesta HTTP:', response.status, response.statusText);

            const data = await response.json();
            console.log('📥 Respuesta del servidor:', data);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('CREDENCIALES INVÁLIDAS: Email o contraseña incorrectos');
                }
                throw new Error(data.error || data.message || `Error ${response.status}: ${response.statusText}`);
            }

            console.log('✅ Login exitoso:', data);

            // Extraer token y usuario
            const token = data.token || data.access_token;
            const user = data.user || data;

            if (!token) {
                throw new Error('No se recibió token de autenticación');
            }

            // Guardar token y usuario
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            console.log('✅ Token guardado:', token.substring(0, 20) + '...');
            console.log('✅ Usuario:', user);

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
            console.log('👑 Intentando login como administrador...', { email });

            // Usar el login normal
            const result = await this.login(email, password);

            // Verificar que el usuario sea admin
            const userRole = result.user?.role || result.user?.tipo || result.user?.rol;
            console.log('🎭 Role del usuario:', userRole);

            if (userRole === 'admin') {
                console.log('✅ Usuario ES administrador');
                this.showNotification('✅ Admin autenticado correctamente', 'success');
                return result;
            } else {
                console.warn('❌ Usuario NO es administrador. Role:', userRole);

                // Cerrar sesión ya que no es admin
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
            setTimeout(() => {
                window.location.href = '../auth/login-admin.html';
            }, 1500);
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
        console.log('👋 CERRANDO SESIÓN MANUALMENTE (solicitado por usuario)...');

        // Mostrar notificación
        this.showNotification('Sesión cerrada exitosamente', 'info');

        // Limpiar storage
        localStorage.clear();
        sessionStorage.clear();

        // Redirigir después de un delay
        setTimeout(() => {
            const currentPath = window.location.pathname;
            if (currentPath.includes('/admin/')) {
                window.location.href = '../../auth/login-admin.html';
            } else {
                window.location.href = '../auth/login-admin.html';
            }
        }, 1500);
    },
    updateUserInfo() {
        const userEmail = document.getElementById('userEmail');
        if (userEmail && this.user) {
            userEmail.textContent = this.user.email || this.user.correo || 'admin@titanes.com';
        }

        const userName = document.getElementById('userName');
        if (userName && this.user) {
            userName.textContent = this.user.nombre || this.user.name || 'Administrador';
        }
    },

    // ==========================================
    // CRUD DE ADMINISTRADORES - DEFINITIVO
    // ==========================================

    async getAllAdministradores() {
        try {
            console.log('📥 Obteniendo todos los administradores...');

            if (!this.checkAuth()) return { success: false, administradores: [] };

            const response = await fetch(`${this.baseURL}/admin/administradores`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ ${data.administradores?.length || 0} administradores obtenidos`);

            return data;
        } catch (error) {
            console.error('❌ Error obteniendo administradores:', error);
            this.showNotification('Error al cargar administradores: ' + error.message, 'error');
            return { success: false, administradores: [] };
        }
    },

    async createAdministrador(adminData) {
        try {
            console.log('➕ Creando nuevo administrador...', adminData);

            if (!this.checkAuth()) return null;

            if (!adminData.nombre || !adminData.email || !adminData.password) {
                throw new Error('Nombre, email y contraseña son requeridos');
            }

            if (adminData.password.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }

            const payload = {
                nombre: adminData.nombre.trim(),
                email: adminData.email.trim(),
                password: adminData.password,
                telefono: adminData.telefono || null
            };

            console.log('📤 Enviando datos al backend:', {
                ...payload,
                password: '******' // Ocultar contraseña en logs
            });

            const response = await fetch(`${this.baseURL}/admin/administradores`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            console.log('📥 Respuesta del backend:', data);

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al crear administrador');
            }

            console.log('✅ Administrador creado exitosamente:', data);

            // 🎯 MOSTRAR MENSAJE DE ÉXITO CON LA INFORMACIÓN
            this.showNotification(
                `✅ Administrador "${adminData.nombre}" creado exitosamente y listo para usar`,
                'success',
                7000 // Mostrar por 7 segundos
            );

            // 🎯 MOSTRAR ALERTA CON LOS DATOS DE ACCESO
            setTimeout(() => {
                alert(
                    `✅ ADMINISTRADOR CREADO EXITOSAMENTE\n\n` +
                    `👤 Nombre: ${adminData.nombre}\n` +
                    `📧 Email: ${adminData.email}\n` +
                    `🔐 Contraseña: ${adminData.password}\n\n` +
                    `El administrador ya puede iniciar sesión con estas credenciales.`
                );
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
            console.log(`✏️ Actualizando administrador ${id}:`, adminData);

            if (!this.checkAuth()) return null;

            const payload = {
                nombre: adminData.nombre.trim(),
                email: adminData.email.trim(),
                telefono: adminData.telefono || null
            };

            // Solo incluir contraseña si se proporciona una nueva
            if (adminData.password && adminData.password.trim() !== '') {
                if (adminData.password.length < 6) {
                    throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
                }
                payload.password = adminData.password;
                console.log('🔄 Incluyendo nueva contraseña en la actualización');
            }

            console.log('📤 Enviando actualización:', payload);

            const response = await fetch(`${this.baseURL}/admin/administradores/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al actualizar administrador');
            }

            console.log('✅ Administrador actualizado:', data);

            // Si se cambió la contraseña, probarla
            if (adminData.password) {
                setTimeout(async () => {
                    try {
                        console.log('🧪 Probando nueva contraseña...');
                        await this.login(adminData.email, adminData.password);
                        console.log('🎉 ¡Nueva contraseña funciona!');
                        this.showNotification('✅ Nueva contraseña funciona correctamente', 'success');
                    } catch (error) {
                        console.error('❌ Nueva contraseña no funciona:', error);
                    }
                }, 1000);
            }

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
            console.log(`🗑️ Eliminando administrador ${id}...`);

            if (!this.checkAuth()) return null;

            const response = await fetch(`${this.baseURL}/admin/administradores/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al eliminar administrador');
            }

            console.log('✅ Administrador eliminado:', data);
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
            console.log(`🔄 Cambiando estado del administrador ${id}...`);

            if (!this.checkAuth()) return null;

            const response = await fetch(`${this.baseURL}/admin/administradores/${id}/toggle-status`, {
                method: 'PATCH',
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cambiar estado');
            }

            console.log('✅ Estado cambiado:', data);
            this.showNotification('✅ Estado del administrador actualizado', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error cambiando estado:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    // ==========================================
    // FUNCIONES ESPECIALES PARA ADMIN
    // ==========================================

    async testAdminLogin(email, password) {
        try {
            console.log('🧪 Probando login del administrador...', { email });

            console.log('🔍 PRUEBA DE LOGIN INICIADA');
            console.log('📧 Email:', email);
            console.log('🔐 Contraseña:', password ? '******' : 'NO PROPORCIONADA');

            const result = await this.loginAdmin(email, password);

            if (result) {
                console.log('✅ ¡EXCELENTE! El admin puede iniciar sesión');
                console.log('👤 Usuario:', result.user);

                // Cerrar sesión después de probar
                setTimeout(() => {
                    this.logout();
                    console.log('🔓 Sesión de prueba cerrada');
                }, 2000);

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
            const adminEmail = 'xxedechicoxx@gmail.com';
            const newPassword = 'Admin123!';

            console.log('🛠️ Arreglando credenciales del admin...');
            console.log('📧 Email:', adminEmail);
            console.log('🔐 Nueva contraseña:', newPassword);

            // 1. Obtener el ID del admin
            const adminsResponse = await this.getAllAdministradores();
            const admins = adminsResponse.administradores || [];
            const admin = admins.find(a => a.email === adminEmail);

            if (!admin) {
                throw new Error(`Admin no encontrado: ${adminEmail}`);
            }

            // 2. Actualizar con nueva contraseña
            const updateData = {
                nombre: admin.nombre,
                email: admin.email,
                telefono: admin.telefono,
                password: newPassword
            };

            const result = await this.updateAdministrador(admin.id, updateData);

            // 3. Probar login
            setTimeout(async () => {
                try {
                    console.log('🔐 Probando login con nueva contraseña...');
                    await this.login(adminEmail, newPassword);
                    console.log('🎉 ¡Contraseña reseteada exitosamente!');

                    // Crear mensaje de éxito
                    const mensaje = `✅ Contraseña reseteada\n\n📧 Email: ${adminEmail}\n🔐 Nueva contraseña: ${newPassword}\n\n¡Ahora puedes iniciar sesión!`;

                    // Mostrar en alerta y notificación
                    alert(mensaje);
                    this.showNotification('✅ Contraseña reseteada exitosamente', 'success');
                } catch (error) {
                    console.error('❌ Error probando nueva contraseña:', error);
                }
            }, 1000);

            return result;
        } catch (error) {
            console.error('❌ Error arreglando admin:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    // ==========================================
    // EVALUACIONES - COMPLETO
    // ==========================================

    async getAllEvaluaciones() {
        try {
            console.log('📋 Obteniendo todas las evaluaciones...');
            const response = await fetch(`${this.baseURL}/evaluaciones`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ ${data.evaluaciones?.length || 0} evaluaciones obtenidas`);
            return data.evaluaciones || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo evaluaciones:', error);
            this.showNotification('Error al cargar evaluaciones', 'error');
            return [];
        }
    },

    async getEvaluacionesDeportista(deportistaId) {
        try {
            console.log(`📋 Obteniendo evaluaciones del deportista ${deportistaId}...`);
            const response = await fetch(`${this.baseURL}/evaluaciones/deportista/${deportistaId}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                console.warn(`⚠️ No se pudieron obtener evaluaciones para ${deportistaId}: HTTP ${response.status}`);
                return [];
            }

            const data = await response.json();
            console.log(`✅ ${data.evaluaciones?.length || 0} evaluaciones obtenidas`);
            return data.evaluaciones || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo evaluaciones:', error);
            return [];
        }
    },

    async getEvaluacionById(id) {
        try {
            console.log(`📋 Obteniendo evaluación ${id}...`);
            const response = await fetch(`${this.baseURL}/evaluaciones/${id}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Evaluación obtenida:', data);
            return data.evaluacion || data;
        } catch (error) {
            console.error(`❌ Error obteniendo evaluación ${id}:`, error);
            this.showNotification('Error al cargar evaluación', 'error');
            return null;
        }
    },

    async createEvaluacion(evaluacionData) {
        try {
            console.log('➕ Creando nueva evaluación...', evaluacionData);

            const payload = {
                deportista_id: evaluacionData.deportista_id,
                habilidad_id: evaluacionData.habilidad_id,
                puntuacion: evaluacionData.puntuacion || 0,
                observaciones: evaluacionData.observaciones || '',
                fecha_evaluacion: evaluacionData.fecha_evaluacion || new Date().toISOString().split('T')[0],
                entrenador_id: evaluacionData.entrenador_id || this.user?.id
            };

            const response = await fetch(`${this.baseURL}/evaluaciones`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al crear evaluación');
            }

            console.log('✅ Evaluación creada:', data);
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
            console.log(`✏️ Actualizando evaluación ${id}:`, evaluacionData);

            const payload = {
                puntuacion: evaluacionData.puntuacion,
                observaciones: evaluacionData.observaciones || '',
                fecha_evaluacion: evaluacionData.fecha_evaluacion
            };

            const response = await fetch(`${this.baseURL}/evaluaciones/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al actualizar evaluación');
            }

            console.log('✅ Evaluación actualizada:', data);
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
            console.log(`🗑️ Eliminando evaluación ${id}...`);

            const response = await fetch(`${this.baseURL}/evaluaciones/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al eliminar evaluación');
            }

            console.log('✅ Evaluación eliminada:', data);
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
            console.log(`📊 Obteniendo progreso del deportista ${deportistaId}...`);
            const response = await fetch(`${this.baseURL}/evaluaciones/progreso/${deportistaId}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                console.warn(`⚠️ No se pudo obtener progreso para ${deportistaId}: HTTP ${response.status}`);
                return null;
            }

            const data = await response.json();
            console.log('✅ Progreso obtenido:', data);
            return data;
        } catch (error) {
            console.error('❌ Error obteniendo progreso:', error);
            return null;
        }
    },

    async getEvaluacionesPorNivel(nivel) {
        try {
            console.log(`📋 Obteniendo evaluaciones para nivel ${nivel}...`);
            const response = await fetch(`${this.baseURL}/evaluaciones/nivel/${nivel}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                console.warn(`⚠️ No se pudieron obtener evaluaciones para nivel ${nivel}: HTTP ${response.status}`);
                return [];
            }

            const data = await response.json();
            console.log(`✅ ${data.evaluaciones?.length || 0} evaluaciones obtenidas para nivel ${nivel}`);
            return data.evaluaciones || data || [];
        } catch (error) {
            console.error(`❌ Error obteniendo evaluaciones para nivel ${nivel}:`, error);
            return [];
        }
    },

    async getEvaluacionesRecientes(limit = 10) {
        try {
            console.log(`📅 Obteniendo ${limit} evaluaciones recientes...`);

            const response = await fetch(`${this.baseURL}/evaluaciones/recientes?limit=${limit}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                console.warn('⚠️ No se pudieron obtener evaluaciones recientes');
                return await this.getActividadReciente();
            }

            const data = await response.json();
            console.log(`✅ ${data.evaluaciones?.length || 0} evaluaciones recientes obtenidas`);
            return data.evaluaciones || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo evaluaciones recientes:', error);
            return [];
        }
    },

    async getHabilidadesDeportista(deportistaId) {
        try {
            console.log(`🏆 Obteniendo habilidades del deportista ${deportistaId}...`);

            const deportista = await this.getDeportistaById(deportistaId);
            if (!deportista) {
                console.warn('⚠️ No se pudo obtener deportista');
                return [];
            }

            const nivel = deportista.nivel_actual || deportista.deportista?.nivel_actual || '1_basico';

            const response = await fetch(`${this.baseURL}/habilidades/nivel/${nivel}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                console.log('⚠️ No se pudieron obtener habilidades por nivel');
                return [];
            }

            const data = await response.json();
            console.log(`✅ ${data.habilidades?.length || 0} habilidades obtenidas`);
            return data.habilidades || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo habilidades:', error);
            return [];
        }
    },

    // ==========================================
    // HABILIDADES - COMPLETO
    // ==========================================

    async getAllHabilidades() {
        try {
            console.log('📋 Obteniendo todas las habilidades...');
            const response = await fetch(`${this.baseURL}/habilidades`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ ${data.habilidades?.length || data.length || 0} habilidades obtenidas`);
            return data.habilidades || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo habilidades:', error);
            this.showNotification('Error al cargar habilidades', 'error');
            return [];
        }
    },

    async getHabilidadesPorNivel(nivel) {
        try {
            console.log(`📋 Obteniendo habilidades para nivel ${nivel}...`);
            const response = await fetch(`${this.baseURL}/habilidades/nivel/${nivel}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                console.log(`⚠️ Ruta /habilidades/nivel/${nivel} no encontrada, intentando alternativa...`);
                const allHabilidades = await this.getAllHabilidades();
                const filtradas = allHabilidades.filter(h => h.nivel === nivel);

                const porCategoria = {
                    habilidad: filtradas.filter(h => h.categoria === 'habilidad'),
                    ejercicio_accesorio: filtradas.filter(h => h.categoria === 'ejercicio_accesorio'),
                    postura: filtradas.filter(h => h.categoria === 'postura')
                };

                console.log(`✅ ${filtradas.length} habilidades obtenidas para nivel ${nivel} (modo alternativo)`);
                return {
                    habilidades: filtradas,
                    por_categoria: porCategoria,
                    total: filtradas.length
                };
            }

            const data = await response.json();
            console.log(`✅ ${data.habilidades?.length || 0} habilidades obtenidas para nivel ${nivel}`);

            return data;
        } catch (error) {
            console.error(`❌ Error obteniendo habilidades para nivel ${nivel}:`, error);
            return {
                habilidades: [],
                por_categoria: {
                    habilidad: [],
                    ejercicio_accesorio: [],
                    postura: []
                },
                total: 0
            };
        }
    },

    async getHabilidadById(id) {
        try {
            console.log(`📋 Obteniendo habilidad ${id}...`);
            const response = await fetch(`${this.baseURL}/habilidades/${id}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Habilidad obtenida:', data);
            return data.habilidad || data;
        } catch (error) {
            console.error(`❌ Error obteniendo habilidad ${id}:`, error);
            this.showNotification('Error al cargar habilidad', 'error');
            return null;
        }
    },

    // ==========================================
    // DEPORTISTAS - COMPLETO
    // ==========================================

    async getDeportistas() {
        try {
            console.log('📥 Obteniendo todos los deportistas...');
            const response = await fetch(`${this.baseURL}/admin/deportistas`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ ${data.deportistas?.length || data.length || 0} deportistas obtenidos`);
            return data.deportistas || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo deportistas:', error);
            this.showNotification('Error al cargar deportistas', 'error');
            return [];
        }
    },

    async getDeportistaById(id) {
        try {
            console.log(`📋 Obteniendo deportista ${id}...`);
            const response = await fetch(`${this.baseURL}/deportistas/${id}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Deportista obtenido:', data);
            return data.deportista || data;
        } catch (error) {
            console.error(`❌ Error obteniendo deportista ${id}:`, error);
            this.showNotification('Error al cargar información del deportista', 'error');
            return null;
        }
    },
    async updateDeportista(id, deportistaData) {
    try {
        console.log(`✏️ Actualizando deportista ${id}:`, deportistaData);

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

        console.log('📤 Enviando payload al backend:', payload);

        const response = await fetch(`${this.baseURL}/admin/deportistas/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || 'Error al actualizar deportista');
        }

        console.log('✅ Deportista actualizado:', data);
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
            console.log(`🗑️ Eliminando deportista ${id}...`);

            const response = await fetch(`${this.baseURL}/admin/deportistas/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al eliminar deportista');
            }

            console.log('✅ Deportista eliminado:', data);
            this.showNotification('✅ Deportista eliminado exitosamente', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error eliminando deportista:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    updateDeportistaCampo: async function (deportistaId, datos) {
        try {
            console.log('📤 Actualizando campo deportista:', deportistaId, datos);

            const response = await fetch(`${this.baseURL}/admin/deportistas/${deportistaId}/campo`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify(datos)
            });

            // Verificar si la respuesta está vacía
            const text = await response.text();
            if (!text) {
                console.warn('⚠️ Respuesta vacía del servidor');
                return { success: true, message: 'Campo actualizado' };
            }

            try {
                const data = JSON.parse(text);

                if (!response.ok) {
                    throw new Error(data.message || 'Error actualizando campo');
                }

                return data;
            } catch (parseError) {
                console.error('❌ Error parseando JSON:', parseError);
                console.log('📥 Respuesta del servidor (texto):', text);

                if (response.ok) {
                    return { success: true, message: 'Campo actualizado' };
                }

                throw new Error('Respuesta inválida del servidor');
            }
        } catch (error) {
            console.error('❌ Error en updateDeportistaCampo:', error);
            throw error;
        }
    },


    async updateDeportistaInfo(deportistaId, campo, valor) {
        try {
            console.log(`✏️ Actualizando ${campo} del deportista ${deportistaId} a:`, valor);

            const response = await fetch(`${this.baseURL}/admin/deportistas/${deportistaId}/info`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({ campo, valor })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al actualizar campo');
            }

            console.log(`✅ Campo ${campo} actualizado:`, data);
            this.showNotification(`✅ ${campo} actualizado exitosamente`, 'success');
            return data;
        } catch (error) {
            console.error(`❌ Error actualizando ${campo}:`, error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    async toggleDeportistaStatus(id) {
        try {
            console.log(`🔄 Cambiando estado del deportista ${id}...`);

            const response = await fetch(`${this.baseURL}/admin/deportistas/${id}/toggle-status`, {
                method: 'PATCH',
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cambiar estado');
            }

            console.log('✅ Estado cambiado:', data);
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
            console.log('🔍 Buscando deportistas...', { query, filtros });

            const params = new URLSearchParams();
            if (query) params.append('q', query);
            if (filtros.nivel) params.append('nivel', filtros.nivel);
            if (filtros.estado) params.append('estado', filtros.estado);
            if (filtros.equipo) params.append('equipo', filtros.equipo);

            const url = `${this.baseURL}/admin/deportistas/search?${params.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ ${data.deportistas?.length || 0} deportistas encontrados`);
            return data.deportistas || [];
        } catch (error) {
            console.error('❌ Error buscando deportistas:', error);
            return [];
        }
    },
    
    // ==========================================
    // ENTRENADORES - COMPLETO
    // ==========================================

    async getAllEntrenadores() {
        try {
            console.log('📥 Obteniendo todos los entrenadores...');
            const response = await fetch(`${this.baseURL}/admin/entrenadores`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ ${data.entrenadores?.length || 0} entrenadores obtenidos`);
            return data;
        } catch (error) {
            console.error('❌ Error obteniendo entrenadores:', error);
            this.showNotification('Error al cargar entrenadores', 'error');
            return { success: false, entrenadores: [] };
        }
    },

    async createEntrenador(entrenadorData) {
        try {
            console.log('➕ Creando nuevo entrenador...', entrenadorData);

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

            console.log('📤 Payload enviado:', payload);

            const response = await fetch(`${this.baseURL}/admin/entrenadores`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al crear entrenador');
            }

            console.log('✅ Entrenador creado:', data);
            this.showNotification('✅ Entrenador creado exitosamente. Se enviará un correo para completar el registro.', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error creando entrenador:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    async updateEntrenador(id, entrenadorData) {
        try {
            console.log(`✏️ Actualizando entrenador ${id}:`, entrenadorData);

            const payload = {
                nombre: entrenadorData.nombre,
                fecha_nacimiento: entrenadorData.fecha_nacimiento,
                telefono: entrenadorData.telefono || null,
                niveles_asignados: entrenadorData.niveles_asignados || [],
                grupos_competitivos: entrenadorData.grupos_competitivos || []
            };

            const response = await fetch(`${this.baseURL}/admin/entrenadores/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al actualizar entrenador');
            }

            console.log('✅ Entrenador actualizado:', data);
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
            console.log(`🗑️ Eliminando entrenador ${id}...`);

            const response = await fetch(`${this.baseURL}/admin/entrenadores/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al eliminar entrenador');
            }

            console.log('✅ Entrenador eliminado:', data);
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
            console.log(`🔄 Cambiando estado del entrenador ${id}...`);

            const response = await fetch(`${this.baseURL}/admin/entrenadores/${id}/toggle-status`, {
                method: 'PATCH',
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cambiar estado');
            }

            console.log('✅ Estado cambiado:', data);
            this.showNotification('✅ Estado del entrenador actualizado', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error cambiando estado:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    // ==========================================
    // ESTADÍSTICAS - COMPLETO
    // ==========================================

    async getStats() {
        try {
            console.log('📊 Obteniendo estadísticas...');
            const response = await fetch(`${this.baseURL}/admin/stats`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Estadísticas obtenidas:', data);
            return data;
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            this.showNotification('Error al cargar estadísticas', 'error');
            return null;
        }
    },

    async getDeportistasStats() {
        try {
            console.log('📊 Obteniendo estadísticas de deportistas...');

            const deportistas = await this.getDeportistas();

            if (!deportistas || deportistas.length === 0) {
                console.warn('⚠️ No hay deportistas en la base de datos');
                return {
                    por_nivel: [
                        { nivel_actual: 'baby_titans', cantidad: 0 },
                        { nivel_actual: '1_basico', cantidad: 0 },
                        { nivel_actual: '1_medio', cantidad: 0 },
                        { nivel_actual: '1_avanzado', cantidad: 0 },
                        { nivel_actual: '2', cantidad: 0 },
                        { nivel_actual: '3', cantidad: 0 },
                        { nivel_actual: '4', cantidad: 0 }
                    ],
                    por_estado: [
                        { estado: 'activo', cantidad: 0 },
                        { estado: 'lesionado', cantidad: 0 },
                        { estado: 'inactivo', cantidad: 0 },
                        { estado: 'descanso', cantidad: 0 },
                        { estado: 'pendiente', cantidad: 0 }
                    ]
                };
            }

            console.log(`📊 ${deportistas.length} deportistas encontrados para estadísticas`);

            const porNivel = {};
            const porEstado = {};

            deportistas.forEach(deportista => {
                const nivel = deportista.nivel_actual || deportista.deportista?.nivel_actual || 'pendiente';
                porNivel[nivel] = (porNivel[nivel] || 0) + 1;

                const estado = deportista.estado || deportista.deportista?.estado || 'activo';
                porEstado[estado] = (porEstado[estado] || 0) + 1;
            });

            const porNivelArray = Object.keys(porNivel).map(nivel => ({
                nivel_actual: nivel,
                cantidad: porNivel[nivel]
            }));

            const porEstadoArray = Object.keys(porEstado).map(estado => ({
                estado: estado,
                cantidad: porEstado[estado]
            }));

            const result = {
                por_nivel: porNivelArray,
                por_estado: porEstadoArray
            };

            console.log('✅ Estadísticas de deportistas calculadas:', result);
            return result;

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas de deportistas:', error);
            return { por_nivel: [], por_estado: [] };
        }
    },

    async getActividadReciente() {
        try {
            console.log('📅 Obteniendo actividad reciente...');

            const deportistas = await this.getDeportistas();

            if (!deportistas || deportistas.length === 0) {
                console.log('⚠️ No hay deportistas, no se puede obtener actividad');
                return [];
            }

            const deportistasParaBuscar = deportistas.slice(0, 3);
            let todasEvaluaciones = [];

            for (const deportista of deportistasParaBuscar) {
                try {
                    const evaluaciones = await this.getEvaluacionesDeportista(deportista.id || deportista.deportista_id);

                    if (evaluaciones && evaluaciones.length > 0) {
                        const evaluacionesConInfo = evaluaciones.map(e => ({
                            ...e,
                            deportista_nombre: deportista.nombre || deportista.User?.nombre || 'Deportista',
                            deportista_id: deportista.id || deportista.deportista_id,
                            nivel: deportista.nivel_actual || deportista.deportista?.nivel_actual
                        }));

                        todasEvaluaciones = todasEvaluaciones.concat(evaluacionesConInfo);
                    }
                } catch (error) {
                    console.log(`⚠️ No se pudieron obtener evaluaciones para deportista ${deportista.id}:`, error.message);
                }
            }

            if (todasEvaluaciones.length === 0) {
                console.log('⚠️ No hay evaluaciones, creando datos de ejemplo');

                todasEvaluaciones = deportistas.slice(0, 3).map((deportista, index) => ({
                    id: `ejemplo-${index + 1}`,
                    deportista_nombre: deportista.nombre || 'Deportista Ejemplo',
                    deportista_id: deportista.id,
                    habilidad_nombre: ['Rollo adelante', 'Parada de manos', 'Flick en tumbl track'][index % 3],
                    puntuacion: Math.floor(Math.random() * 5) + 6,
                    observaciones: 'Evaluación de prueba',
                    fecha_evaluacion: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(),
                    nivel: deportista.nivel_actual || '1_basico'
                }));
            }

            const evaluacionesRecientes = todasEvaluaciones
                .sort((a, b) => {
                    const fechaA = new Date(a.fecha_evaluacion || a.created_at || a.fecha || 0);
                    const fechaB = new Date(b.fecha_evaluacion || b.created_at || b.fecha || 0);
                    return fechaB - fechaA;
                })
                .slice(0, 5);

            console.log(`✅ ${evaluacionesRecientes.length} evaluaciones recientes obtenidas`);
            return evaluacionesRecientes;

        } catch (error) {
            console.error('❌ Error obteniendo actividad reciente:', error);
            return [];
        }
    },

     // ==========================================
    // CALENDARIO - COMPLETO PARA ADMIN
    // ==========================================

    async getEventosCalendario(filtros = {}) {
        try {
            console.log('📅 Obteniendo eventos del calendario (ADMIN)...', filtros);

            // Extraer mes y año
            const hoy = new Date();
            const mes = filtros.mes || hoy.getMonth() + 1;
            const año = filtros.año || hoy.getFullYear();

            // Para admin, usar ruta que devuelva TODOS los eventos
            const response = await fetch(`${this.baseURL}/calendario?mes=${mes}&año=${año}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                console.warn('⚠️ Error obteniendo eventos, intentando ruta alternativa...');
                // Intentar ruta alternativa
                const responseAlt = await fetch(`${this.baseURL}/calendario/filtros?mes=${mes}&año=${año}`, {
                    method: 'GET',
                    headers: this.getHeaders()
                });
                
                if (!responseAlt.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const dataAlt = await responseAlt.json();
                const eventos = dataAlt.eventos || dataAlt || [];
                console.log(`✅ ${eventos.length} eventos obtenidos para admin (ruta alternativa)`);
                return eventos;
            }

            const data = await response.json();
            const eventos = data.eventos || data || [];

            console.log(`✅ ${eventos.length} eventos obtenidos para admin`);
            return eventos;

        } catch (error) {
            console.error('❌ Error obteniendo eventos:', error);
            this.showNotification('Error al cargar calendario: ' + error.message, 'error');
            return [];
        }
    },

    async createEvento(eventoData) {
    try {
        console.log('➕ Creando nuevo evento...', eventoData);
        console.log('📊 Tipo de datos recibidos:', typeof eventoData);
        console.log('📋 Estructura completa:', JSON.stringify(eventoData, null, 2));

        // 🔥 VALIDACIÓN CRÍTICA
        if (!eventoData.titulo || eventoData.titulo.trim() === '') {
            throw new Error('El título del evento es obligatorio');
        }

        if (!eventoData.fecha) {
            throw new Error('La fecha del evento es obligatoria');
        }

        // 🔥 VALIDAR NIVELES
        let niveles = [];
        if (eventoData.niveles && Array.isArray(eventoData.niveles)) {
            niveles = eventoData.niveles;
        } else if (eventoData.nivel) {
            niveles = [eventoData.nivel];
        } else {
            console.warn('⚠️ No se proporcionaron niveles, usando "baby_titans" por defecto');
            niveles = ['baby_titans'];
        }

        console.log('🎯 Niveles procesados:', niveles);

        // 🔥 VALIDAR GRUPOS
        let grupos = [];
        if (eventoData.grupos_competitivos && Array.isArray(eventoData.grupos_competitivos)) {
            grupos = eventoData.grupos_competitivos;
        } else if (eventoData.grupo_competitivo) {
            grupos = [eventoData.grupo_competitivo];
        }

        console.log('🏆 Grupos procesados:', grupos);

        // 🔥 CONSTRUIR PAYLOAD CORRECTO
        const payload = {
            titulo: eventoData.titulo.trim(),
            descripcion: eventoData.descripcion && eventoData.descripcion.trim() !== '' 
                ? eventoData.descripcion.trim() 
                : null,
            fecha: eventoData.fecha,
            hora: eventoData.hora && eventoData.hora.trim() !== '' 
                ? eventoData.hora.trim() 
                : null,
            ubicacion: eventoData.ubicacion && eventoData.ubicacion.trim() !== '' 
                ? eventoData.ubicacion.trim() 
                : null,
            niveles: niveles, // SIEMPRE array
            grupos_competitivos: grupos, // Puede ser array vacío
            tipo: eventoData.tipo || 'general',
            tipo_personalizado: eventoData.tipo === 'otro' && eventoData.tipo_personalizado 
                ? eventoData.tipo_personalizado.trim() 
                : null,
            entrenador_id: eventoData.entrenador_id || this.user?.id || null
        };

        console.log('📤 PAYLOAD FINAL A ENVIAR:', JSON.stringify(payload, null, 2));

        // 🔥 VALIDAR QUE NIVELES NO ESTÉ VACÍO
        if (!payload.niveles || payload.niveles.length === 0) {
            throw new Error('Debe seleccionar al menos un nivel para el evento');
        }

        // 🔥 HACER LA PETICIÓN
        console.log('🌐 Enviando POST a:', `${this.baseURL}/calendario`);
        
        const response = await fetch(`${this.baseURL}/calendario`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(payload)
        });

        console.log('📥 Respuesta HTTP:', response.status, response.statusText);

        // 🔥 INTENTAR LEER LA RESPUESTA
        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.log('📄 Respuesta del servidor (texto):', text);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
            }
            
            // Intentar parsear como JSON
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error('Respuesta del servidor no es JSON válido');
            }
        }

        console.log('📥 Datos de respuesta:', data);

        if (!response.ok) {
            const errorMsg = data.error || data.message || data.msg || `Error ${response.status}`;
            console.error('❌ Error del servidor:', errorMsg);
            console.error('📋 Detalles completos:', data);
            throw new Error(errorMsg);
        }

        console.log('✅ Evento creado exitosamente:', data);
        this.showNotification('✅ Evento creado exitosamente', 'success');
        
        return data;

    } catch (error) {
        console.error('❌ ERROR COMPLETO EN createEvento:', error);
        console.error('📋 Stack trace:', error.stack);
        
        let errorMessage = 'Error desconocido al crear evento';
        
        if (error.message) {
            errorMessage = error.message;
        }
        
        // Mensajes de error más específicos
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en http://localhost:5000';
        } else if (error.message.includes('404')) {
            errorMessage = 'Ruta del API no encontrada. Verifica que el endpoint /api/calendario exista en el backend';
        } else if (error.message.includes('500')) {
            errorMessage = 'Error interno del servidor. Revisa los logs del backend';
        }
        
        this.showNotification(`❌ ${errorMessage}`, 'error');
        throw error;
    }
},
     async updateEvento(id, eventoData) {
        try {
            console.log(`✏️ Actualizando evento ${id}...`, eventoData);

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

            console.log('📤 Enviando payload para actualizar:', payload);

            const response = await fetch(`${this.baseURL}/calendario/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al actualizar evento');
            }

            console.log('✅ Evento actualizado');
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
            console.log(`🗑️ Eliminando evento ${id}...`);

            const response = await fetch(`${this.baseURL}/calendario/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al eliminar evento');
            }

            console.log('✅ Evento eliminado');
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
        } catch (error) {
            return false;
        }
    },

    // ==========================================
    // NOTIFICACIONES
    // ==========================================

    showNotification(message, type = 'info', duration = 5000) {
        console.log(`💬 Notificación [${type}]: ${message}`);

        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        const bgColor = type === 'error' ? '#EF4444' :
            type === 'success' ? '#10B981' :
                type === 'warning' ? '#F59E0B' : '#3B82F6';

        notification.style.cssText = `
            background: ${bgColor};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideIn 0.3s ease-out;
            font-family: 'Montserrat', sans-serif;
            font-weight: 500;
            min-width: 300px;
        `;

        const icon = type === 'success' ? 'check_circle' :
            type === 'error' ? 'error' :
                type === 'warning' ? 'warning' : 'info';

        notification.innerHTML = `
            <span class="material-symbols-outlined" style="font-size: 20px;">
                ${icon}
            </span>
            <span style="flex: 1;">${message}</span>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer;">
                <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
            </button>
        `;

        container.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
};

// Agregar estilos CSS para las animaciones
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ AdminAPI DEFINITIVO inicializado correctamente');
console.log('🎯 Funciones clave disponibles:');
console.log('   1. AdminAPI.loginAdmin(email, password) - Login como admin');
console.log('   2. AdminAPI.createAdministrador(data) - Crear admin con contraseña visible');
console.log('   3. AdminAPI.fixAdminCredentials() - Arreglar admin existente');
console.log('   4. AdminAPI.testAdminLogin(email, password) - Probar login');
console.log('   📍 El admin xxedechicoxx@gmail.com ya existe, usa fixAdminCredentials()');