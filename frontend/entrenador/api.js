// ===================================
// API ENTRENADOR - TITANES EVOLUTION
// ===================================

window.EntrenadorAPI = {
    baseURL: (() => {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        return 'https://gestiondeportistas-production.up.railway.app/api';
    })(),
    // ==========================================
    // CONFIGURACIÓN Y AUTENTICACIÓN
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
    // ✅✅✅ VERIFICACIÓN DE AUTENTICACIÓN - VERSIÓN SEGURA
    // ==========================================
    checkAuth() {
        console.log('🔐 Verificando autenticación (sin cierre automático)...');

        const token = this.token;
        const user = this.user;

        console.log('📊 Estado de autenticación:', {
            tieneToken: !!token,
            tieneUser: !!user,
            tokenLength: token ? token.length : 0,
            userRole: user?.role
        });

        // ✅✅✅ SOLO VERIFICAR, NO CERRAR SESIÓN AUTOMÁTICAMENTE

        // Si no hay token o usuario, simplemente devolver false
        if (!token || !user) {
            console.warn('⚠️  Usuario no autenticado o datos incompletos');
            // NO mostrar notificación para no molestar
            return false;
        }

        // Verificar rol (pero no cerrar sesión si no es entrenador)
        const userRole = user.role || user.tipo || user.rol;
        if (userRole !== 'entrenador' && userRole !== 'admin') {
            console.warn('⚠️  Usuario con rol incorrecto:', userRole);
            // NO cerrar sesión, solo devolver false
            return false;
        }

        console.log('✅ Autenticación válida para:', user.nombre || user.email);
        return true;
    },

    // ==========================================
    // ✅✅✅ LOGOUT - SOLO MANUAL (POR BOTÓN)
    // ==========================================
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
            if (currentPath.includes('/entrenador/')) {
                window.location.href = '../../auth/login-entrenador.html';
            } else {
                window.location.href = '../auth/login-entrenador.html';
            }
        }, 1500);
    },

    // ==========================================
    // ✅✅✅ MÉTODO NUEVO: OBTENER PERFIL COMPLETO
    // ==========================================
    async getMe() {
        try {
            console.log('👤 Obteniendo perfil del entrenador...');

            // Primero intentar endpoint específico
            let response = await fetch(`${this.baseURL}/entrenador/perfil`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            let data;

            if (response.ok) {
                data = await response.json();
                console.log('✅ Datos obtenidos de /entrenador/perfil');

                const entrenador = data.entrenador || data;

                // ✅✅✅ IMPORTANTE: Guardar la foto en localStorage
                if (entrenador.foto_perfil) {
                    const userLocal = this.user;
                    if (userLocal) {
                        userLocal.foto_perfil = entrenador.foto_perfil;
                        localStorage.setItem('user', JSON.stringify(userLocal));
                        console.log('💾 Foto guardada en localStorage');
                    }
                }

                return entrenador;
            } else {
                console.warn(`⚠️ Endpoint entrenador falló (${response.status}), intentando /auth/me...`);

                // Intentar endpoint genérico
                response = await fetch(`${this.baseURL}/auth/me`, {
                    method: 'GET',
                    headers: this.getHeaders()
                });

                if (response.ok) {
                    data = await response.json();
                    console.log('✅ Datos obtenidos de /auth/me');

                    const usuario = data.user || data.usuario || data;

                    // Asegurar arrays
                    if (!usuario.niveles_asignados || !Array.isArray(usuario.niveles_asignados)) {
                        usuario.niveles_asignados = [];
                    }

                    if (!usuario.grupos_competitivos || !Array.isArray(usuario.grupos_competitivos)) {
                        usuario.grupos_competitivos = [
                            'rocks_titans',
                            'electric_titans',
                            'lightning_titans',
                            'storm_titans',
                            'fire_titans'
                        ];
                    }

                    return usuario;
                } else {
                    // Usar datos del localStorage como último recurso
                    console.log('🔄 Usando datos del localStorage');
                    const usuarioLocal = this.user;

                    if (!usuarioLocal) {
                        throw new Error('No se encontraron datos del usuario');
                    }

                    console.log('✅ Usando datos locales:', usuarioLocal.email);
                    return usuarioLocal;
                }
            }

        } catch (error) {
            console.error('❌ Error obteniendo datos del usuario:', error);

            // Si todo falla, usar datos del localStorage
            const usuarioLocal = this.user;

            if (!usuarioLocal) {
                this.showNotification('No se pudieron cargar los datos del perfil', 'warning');
                return null;
            }

            console.log('✅ Recuperando datos locales como fallback');
            return usuarioLocal;
        }
    },

    // ==========================================
    // ✅✅✅ MÉTODO NUEVO: CARGAR DATOS PARA SIDEBAR EN TODAS LAS PÁGINAS
    // ==========================================
    async loadUserDataForPages() {
        try {
            console.log('🔄 Cargando datos para sidebar/navbar...');

            // Intentar obtener datos actualizados
            let userData = null;
            try {
                userData = await this.getMe();
            } catch (error) {
                console.warn('⚠️ No se pudo obtener datos actualizados, usando locales');
                userData = this.user;
            }

            if (!userData) {
                console.warn('⚠️ No hay datos de usuario disponibles');
                return;
            }

            // Actualizar sidebar en TODAS las páginas
            this.updateSidebar(userData);

            return userData;

        } catch (error) {
            console.error('❌ Error cargando datos para páginas:', error);
        }
    },

    // ==========================================
    // ✅✅✅ MÉTODO NUEVO: ACTUALIZAR SIDEBAR (para todas las páginas)
    // ==========================================
    updateSidebar(userData) {
        console.log('🎨 Actualizando sidebar con datos:', userData.nombre);

        // Nombre en sidebar
        const sidebarName = document.getElementById('sidebarName');
        if (sidebarName && userData.nombre) {
            sidebarName.textContent = userData.nombre;
        }

        // Avatar en sidebar
        const sidebarAvatar = document.getElementById('sidebarAvatar');
        if (sidebarAvatar) {
            if (userData.foto_perfil) {
                sidebarAvatar.src = userData.foto_perfil;
                console.log('📸 Foto actualizada en sidebar:', userData.foto_perfil);
            } else {
                sidebarAvatar.src = 'https://via.placeholder.com/100';
            }
        }

        // Avatar en navbar (si existe)
        const navAvatar = document.querySelector('.nav-avatar, .navbar-avatar, .user-avatar');
        if (navAvatar && userData.foto_perfil) {
            navAvatar.src = userData.foto_perfil;
        }
    },

    // ==========================================
    // ✅✅✅ MÉTODO NUEVO: OBTENER ESTADÍSTICAS
    // ==========================================
    async getEstadisticas() {
        try {
            console.log('📊 Obteniendo estadísticas...');

            const response = await fetch(`${this.baseURL}/entrenador/mis-estadisticas`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Estadísticas obtenidas:', data.estadisticas);
            return data.estadisticas;

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);

            // Si falla, calcular estadísticas manualmente
            console.log('🔄 Calculando estadísticas manualmente...');

            let deportistas = [];
            let evaluaciones = [];
            let eventos = [];

            try {
                deportistas = await this.getDeportistas();
            } catch (e) {
                console.warn('⚠️ No se pudieron obtener deportistas');
            }

            try {
                evaluaciones = await this.getEvaluaciones();
            } catch (e) {
                console.warn('⚠️ No se pudieron obtener evaluaciones');
            }

            try {
                eventos = await this.getEventosCalendario();
            } catch (e) {
                console.warn('⚠️ No se pudieron obtener eventos');
            }

            // Calcular próximos eventos
            const ahora = new Date();
            const eventosProximos = eventos.filter(e => {
                try {
                    const fechaEvento = new Date(e.fecha || e.fecha_evento);
                    return fechaEvento > ahora;
                } catch (error) {
                    return false;
                }
            }).length;

            return {
                total_deportistas: deportistas.length,
                total_evaluaciones: evaluaciones.length,
                eventos_proximos: eventosProximos
            };
        }
    },

    // ==========================================
    // ✅✅✅ MÉTODO NUEVO: SUBIR FOTO SIMPLIFICADO
    // ==========================================
    async uploadFotoPerfil(file) {
        try {
            console.log('📤 Subiendo foto de perfil...');

            const formData = new FormData();
            formData.append('foto', file);

            const headers = {};
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            // Usar la ruta directa
            const response = await fetch(`${this.baseURL}/entrenador/subir-foto-perfil`, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al subir foto');
            }

            console.log('✅ Foto subida exitosamente:', data);

            // ✅✅✅ ACTUALIZAR LOCALSTORAGE INMEDIATAMENTE
            if (data.foto_url || data.user?.foto_perfil) {
                const fotoUrl = data.foto_url || data.user.foto_perfil;
                const userLocal = this.user;

                if (userLocal) {
                    userLocal.foto_perfil = fotoUrl;
                    localStorage.setItem('user', JSON.stringify(userLocal));
                    console.log('💾 Foto actualizada en localStorage');

                    // Actualizar sidebar inmediatamente
                    this.updateSidebar(userLocal);
                }
            }

            this.showNotification('✅ Foto actualizada exitosamente', 'success');
            return data;

        } catch (error) {
            console.error('❌ Error subiendo foto:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    // ==========================================
    // ✅✅✅ MÉTODO NUEVO: CAMBIAR CONTRASEÑA SIMPLIFICADO
    // ==========================================
    async cambiarPassword(passwordActual, passwordNueva) {
        try {
            console.log('🔐 Cambiando contraseña...');

            const response = await fetch(`${this.baseURL}/entrenador/cambiar-password`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    password_actual: passwordActual,
                    password_nueva: passwordNueva
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cambiar contraseña');
            }

            console.log('✅ Contraseña cambiada exitosamente');
            this.showNotification('✅ Contraseña cambiada exitosamente', 'success');
            return data;

        } catch (error) {
            console.error('❌ Error cambiando contraseña:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    // ==========================================
    // ✅✅✅ INICIALIZACIÓN PARA TODAS LAS PÁGINAS
    // ==========================================
    initForAllPages() {
        console.log('🚀 Inicializando EntrenadorAPI para todas las páginas...');

        // Verificar autenticación (pero no cerrar sesión si falla)
        const isAuthenticated = this.checkAuth();
        console.log('🔐 Autenticación:', isAuthenticated ? '✅ Válida' : '⚠️  No válida (pero continuando)');

        // Cargar datos del usuario para sidebar
        setTimeout(() => {
            this.loadUserDataForPages();
        }, 100);

        // Configurar logout manual
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                    this.logout();
                }
            });
        }

        // Configurar tema
        const toggleTheme = document.getElementById('toggleTheme');
        if (toggleTheme) {
            toggleTheme.addEventListener('click', () => {
                document.documentElement.classList.toggle('dark');
                document.body.classList.toggle('dark');
                const isDark = document.body.classList.contains('dark');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
            });

            // Cargar tema guardado
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark');
                document.body.classList.add('dark');
            }
        }

        console.log('✅ EntrenadorAPI inicializado para todas las páginas');
    },

    // ==========================================
    // DEPORTISTAS - COMPLETO (CON PERMISOS DE EDICIÓN)
    // ==========================================
    async getDeportistas(filtros = {}) {
        try {
            console.log('📥 Obteniendo deportistas del entrenador...');

            const params = new URLSearchParams();
            if (filtros.nivel) params.append('nivel', filtros.nivel);
            if (filtros.estado) params.append('estado', filtros.estado);
            if (filtros.equipo) params.append('equipo', filtros.equipo);

            const url = params.toString() ?
                `${this.baseURL}/deportistas?${params.toString()}` :
                `${this.baseURL}/deportistas`;

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const deportistas = data.deportistas || data || [];

            // Filtrar por niveles asignados al entrenador
            const nivelesAsignados = this.user?.niveles_asignados || [];
            let deportistasFiltrados = deportistas;

            if (this.user.role === 'entrenador' && nivelesAsignados.length > 0) {
                deportistasFiltrados = deportistas.filter(d => {
                    if (d.nivel_actual === 'pendiente') return true;
                    return nivelesAsignados.includes(d.nivel_actual);
                });
            }

            console.log(`✅ ${deportistasFiltrados.length} deportistas obtenidos`);
            return deportistasFiltrados;
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

    // MÉTODO: Actualizar deportista (para entrenadores)
    async updateDeportista(id, datos) {
        try {
            console.log(`✏️ Actualizando deportista ${id}...`, datos);

            // Añadir información de quién actualiza
            const payload = {
                ...datos,
                actualizado_por: this.user?.id,
                fecha_actualizacion: new Date().toISOString()
            };

            console.log('📤 Enviando payload:', payload);

            const response = await fetch(`${this.baseURL}/deportistas/${id}`, {
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
            return data.deportista || data;
        } catch (error) {
            console.error(`❌ Error actualizando deportista ${id}:`, error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    // MÉTODO: Actualizar campo específico (nivel, estado, equipo) - Usa el endpoint general
    async updateDeportistaCampo(id, campo, valor) {
        try {
            console.log(`✏️ Actualizando ${campo} del deportista ${id} a ${valor}...`);

            // Usar el endpoint general de actualización con solo el campo a cambiar
            const payload = {
                [campo]: valor,
                actualizado_por: this.user?.id,
                fecha_actualizacion: new Date().toISOString()
            };

            console.log('📤 Enviando payload para campo específico:', payload);

            const response = await fetch(`${this.baseURL}/deportistas/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || `Error al actualizar ${campo}`);
            }

            console.log(`✅ ${campo} actualizado:`, data);

            // Obtener nombre legible del campo
            const nombreCampo = this.getNombreCampo(campo);
            this.showNotification(`✅ ${nombreCampo} actualizado`, 'success');

            return data;
        } catch (error) {
            console.error(`❌ Error actualizando ${campo}:`, error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
        }
    },

    async getDeportistaStats(id) {
        try {
            console.log(`📊 Obteniendo estadísticas del deportista ${id}...`);
            const response = await fetch(`${this.baseURL}/deportistas/${id}/stats`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                console.warn(`⚠️ No se pudieron obtener estadísticas para ${id}`);
                return null;
            }

            const data = await response.json();
            console.log('✅ Estadísticas obtenidas');
            return data;
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return null;
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

            const url = `${this.baseURL}/deportistas/search?${params.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const resultados = data.deportistas || [];

            // Filtrar por niveles asignados
            const nivelesAsignados = this.user?.niveles_asignados || [];
            let resultadosFiltrados = resultados;

            if (this.user.role === 'entrenador' && nivelesAsignados.length > 0) {
                resultadosFiltrados = resultados.filter(d => {
                    if (d.nivel_actual === 'pendiente') return true;
                    return nivelesAsignados.includes(d.nivel_actual);
                });
            }

            console.log(`✅ ${resultadosFiltrados.length} deportistas encontrados`);
            return resultadosFiltrados;
        } catch (error) {
            console.error('❌ Error buscando deportistas:', error);
            return [];
        }
    },

    // ==========================================
    // EVALUACIONES
    // ==========================================
    async getEvaluaciones() {
        try {
            console.log('📋 Obteniendo evaluaciones...');

            const response = await fetch(`${this.baseURL}/entrenador/mis-evaluaciones`, {
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

    async createEvaluacion(evaluacionData) {
        try {
            console.log('➕ Creando nueva evaluación...', evaluacionData);

            const payload = {
                deportista_id: evaluacionData.deportista_id,
                habilidad_id: evaluacionData.habilidad_id,
                entrenador_id: this.user.id,
                fecha_evaluacion: evaluacionData.fecha_evaluacion || new Date().toISOString(),
                puntuacion: evaluacionData.puntuacion,
                completado: evaluacionData.completado || false,
                observaciones: evaluacionData.observaciones || '',
                video_url: evaluacionData.video_url || null,
                intentos: evaluacionData.intentos || 1
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
            this.showNotification('✅ Evaluación registrada exitosamente', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error creando evaluación:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
            throw error;
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
                console.warn(`⚠️ No se pudieron obtener evaluaciones para ${deportistaId}`);
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

    async getProgresoDeportista(deportistaId) {
        try {
            console.log(`📊 Obteniendo progreso del deportista ${deportistaId}...`);
            const response = await fetch(`${this.baseURL}/evaluaciones/progreso/${deportistaId}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                console.warn(`⚠️ No se pudo obtener progreso para ${deportistaId}`);
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

    async getHistorialEvaluacion(deportistaId, habilidadId) {
        try {
            console.log(`📜 Obteniendo historial de evaluaciones...`);
            const response = await fetch(
                `${this.baseURL}/evaluaciones/historial/${deportistaId}/${habilidadId}`,
                {
                    method: 'GET',
                    headers: this.getHeaders()
                }
            );

            if (!response.ok) {
                console.warn('⚠️ No se pudo obtener historial');
                return [];
            }

            const data = await response.json();
            console.log('✅ Historial obtenido');
            return data.evaluaciones || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo historial:', error);
            return [];
        }
    },

    async getEvaluacionesPendientes() {
        try {
            console.log('📋 Obteniendo evaluaciones pendientes...');
            const response = await fetch(`${this.baseURL}/evaluaciones/pendientes`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                console.warn('⚠️ No se pudieron obtener evaluaciones pendientes');
                return [];
            }

            const data = await response.json();
            console.log(`✅ ${data.evaluaciones?.length || 0} evaluaciones pendientes`);
            return data.evaluaciones || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo evaluaciones pendientes:', error);
            return [];
        }
    },

    async getDeportistasConCambioPendiente() {
        try {
            console.log('🎯 Obteniendo deportistas con cambio de nivel pendiente...');
            const response = await fetch(
                `${this.baseURL}/evaluaciones/deportistas-cambio-pendiente`,
                {
                    method: 'GET',
                    headers: this.getHeaders()
                }
            );

            if (!response.ok) {
                console.warn('⚠️ No se pudieron obtener deportistas con cambio pendiente');
                return [];
            }

            const data = await response.json();
            console.log(`✅ ${data.deportistas?.length || 0} deportistas con cambio pendiente`);
            return data.deportistas || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo deportistas con cambio pendiente:', error);
            return [];
        }
    },

    // ==========================================
    // HABILIDADES
    // ==========================================
    async getHabilidadesPorNivel(nivel, deportistaId = null) {
        try {
            console.log(`📋 Obteniendo habilidades para nivel ${nivel}...`);

            const params = deportistaId ? `?deportista_id=${deportistaId}` : '';
            const response = await fetch(
                `${this.baseURL}/habilidades/nivel/${nivel}${params}`,
                {
                    method: 'GET',
                    headers: this.getHeaders()
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ ${data.habilidades?.length || 0} habilidades obtenidas`);

            // Asegurar estructura correcta
            return {
                habilidades: data.habilidades || data || [],
                por_categoria: data.por_categoria || {
                    habilidad: [],
                    ejercicio_accesorio: [],
                    postura: []
                },
                total: data.total || data.habilidades?.length || 0
            };
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
            console.log(`✅ ${data.habilidades?.length || 0} habilidades obtenidas`);
            return data.habilidades || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo habilidades:', error);
            return [];
        }
    },

    async getHabilidadesFaltantes(deportistaId, nivel = null) {
        try {
            console.log(`🎯 Obteniendo habilidades faltantes del deportista ${deportistaId}...`);

            const params = nivel ? `?nivel=${nivel}` : '';
            const response = await fetch(
                `${this.baseURL}/habilidades/faltantes/${deportistaId}${params}`,
                {
                    method: 'GET',
                    headers: this.getHeaders()
                }
            );

            if (!response.ok) {
                console.warn('⚠️ No se pudieron obtener habilidades faltantes');
                return [];
            }

            const data = await response.json();
            console.log(`✅ ${data.habilidades?.length || 0} habilidades faltantes`);
            return data.habilidades || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo habilidades faltantes:', error);
            return [];
        }
    },

    // ==========================================
    // CALENDARIO
    // ==========================================
    async getEventosCalendario(filtros = {}) {
        try {
            console.log('📅 Obteniendo eventos del calendario (ENTRENADOR)...', filtros);

            // Extraer mes y año
            const hoy = new Date();
            const mes = filtros.mes || hoy.getMonth() + 1;
            const año = filtros.año || hoy.getFullYear();

            const params = new URLSearchParams();
            params.append('mes', mes);
            params.append('año', año);

            const url = `${this.baseURL}/calendario/filtros?${params.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const eventos = data.eventos || data || [];

            console.log(`✅ ${eventos.length} eventos obtenidos para entrenador`);
            return eventos;

        } catch (error) {
            console.error('❌ Error obteniendo eventos:', error);
            this.showNotification('Error al cargar calendario', 'error');
            return [];
        }
    },

    async createEvento(eventoData) {
        try {
            console.log('➕ Creando nuevo evento (ENTRENADOR)...', eventoData);

            const payload = {
                titulo: eventoData.titulo || '',
                descripcion: eventoData.descripcion || '',
                fecha: eventoData.fecha,
                hora: eventoData.hora || null,
                ubicacion: eventoData.ubicacion || '',
                niveles: eventoData.niveles || [], // ← ARRAY DE NIVELES
                grupos_competitivos: eventoData.grupos_competitivos || [],
                tipo: eventoData.tipo || 'general',
                tipo_personalizado: eventoData.tipo_personalizado || null,
                entrenador_id: this.user.id
            };

            console.log('📤 Enviando payload:', payload);

            const response = await fetch(`${this.baseURL}/calendario`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al crear evento');
            }

            console.log('✅ Evento creado:', data);
            this.showNotification('✅ Evento creado exitosamente', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error creando evento:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
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
                nivel: eventoData.nivel || 'todos',
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
    // NOTIFICACIONES
    // ==========================================
    async getNotificaciones(params = {}) {
        try {
            console.log('🔔 Obteniendo notificaciones...');

            const urlParams = new URLSearchParams();
            if (params.leidas !== undefined) urlParams.append('leidas', params.leidas);
            if (params.limite) urlParams.append('limite', params.limite);

            const url = urlParams.toString() ?
                `${this.baseURL}/notificaciones?${urlParams.toString()}` :
                `${this.baseURL}/notificaciones`;

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                console.warn('⚠️ No se pudieron obtener notificaciones');
                return [];
            }

            const data = await response.json();
            console.log(`✅ ${data.notificaciones?.length || 0} notificaciones obtenidas`);
            return data.notificaciones || data || [];
        } catch (error) {
            console.error('❌ Error obteniendo notificaciones:', error);
            return [];
        }
    },

    async marcarNotificacionLeida(id) {
        try {
            console.log(`✔️ Marcando notificación ${id} como leída...`);

            const response = await fetch(`${this.baseURL}/notificaciones/${id}/leer`, {
                method: 'PUT',
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al marcar notificación');
            }

            console.log('✅ Notificación marcada como leída');
            return data;
        } catch (error) {
            console.error('❌ Error marcando notificación:', error);
            return null;
        }
    },

    async marcarTodasLeidas() {
        try {
            console.log('✔️ Marcando todas las notificaciones como leídas...');

            const response = await fetch(`${this.baseURL}/notificaciones/leer-todas`, {
                method: 'PUT',
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al marcar notificaciones');
            }

            console.log('✅ Todas las notificaciones marcadas como leídas');
            this.showNotification('✅ Notificaciones actualizadas', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error marcando notificaciones:', error);
            return null;
        }
    },

    // ==========================================
    // REPORTES
    // ==========================================
    async getReporteProgreso(deportistaId) {
        try {
            console.log(`📊 Generando reporte de progreso para ${deportistaId}...`);

            const response = await fetch(
                `${this.baseURL}/reportes/progreso/${deportistaId}`,
                {
                    method: 'GET',
                    headers: this.getHeaders()
                }
            );

            if (!response.ok) {
                throw new Error('Error al generar reporte');
            }

            const blob = await response.blob();
            console.log('✅ Reporte generado');
            return blob;
        } catch (error) {
            console.error('❌ Error generando reporte:', error);
            this.showNotification('Error al generar reporte', 'error');
            return null;
        }
    },

    async getReporteEvaluaciones(filtros = {}) {
        try {
            console.log('📊 Generando reporte de evaluaciones...');

            const params = new URLSearchParams();
            if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
            if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
            if (filtros.nivel) params.append('nivel', filtros.nivel);
            if (filtros.deportista_id) params.append('deportista_id', filtros.deportista_id);

            const url = `${this.baseURL}/reportes/evaluaciones?${params.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error('Error al generar reporte');
            }

            const blob = await response.blob();
            console.log('✅ Reporte generado');
            return blob;
        } catch (error) {
            console.error('❌ Error generando reporte:', error);
            this.showNotification('Error al generar reporte', 'error');
            return null;
        }
    },

    // ==========================================
    // UPLOAD
    // ==========================================
    async uploadDeportistaFoto(deportistaId, file) {
        try {
            console.log(`📤 Subiendo foto del deportista ${deportistaId}...`);

            const formData = new FormData();
            formData.append('foto', file);

            const headers = {};
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const response = await fetch(
                `${this.baseURL}/upload/deportista/${deportistaId}/foto`,
                {
                    method: 'POST',
                    headers: headers,
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al subir foto');
            }

            console.log('✅ Foto subida exitosamente');
            this.showNotification('✅ Foto actualizada', 'success');
            return data;
        } catch (error) {
            console.error('❌ Error subiendo foto:', error);
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

    formatNivel(nivel) {
        const niveles = {
            '1_basico': 'Nivel 1 Básico',
            '1_medio': 'Nivel 1 Medio',
            '1_avanzado': 'Nivel 1 Avanzado',
            '2': 'Nivel 2',
            '3': 'Nivel 3',
            '4': 'Nivel 4',
            'pendiente': 'Pendiente'
        };
        return niveles[nivel] || nivel;
    },

    // Función para obtener nombre legible del campo
    getNombreCampo(campo) {
        const nombres = {
            'nivel_actual': 'Nivel',
            'estado': 'Estado',
            'equipo_competitivo': 'Equipo',
            'peso': 'Peso',
            'altura': 'Altura',
            'talla': 'Talla',
            'foto_perfil': 'Foto de perfil'
        };
        return nombres[campo] || campo;
    },

    formatFecha(fecha) {
        if (!fecha) return '--';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    },

    formatHora(fecha) {
        if (!fecha) return '--';
        const date = new Date(fecha);
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // ==========================================
    // SISTEMA DE NOTIFICACIONES UI
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

// ==========================================
// ✅✅✅ INICIALIZAR AUTOMÁTICAMENTE EN TODAS LAS PÁGINAS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM cargado, inicializando EntrenadorAPI...');

    // Inicializar después de un pequeño delay
    setTimeout(() => {
        if (window.EntrenadorAPI) {
            window.EntrenadorAPI.initForAllPages();
        }
    }, 100);
});

// ==========================================
// ESTILOS PARA NOTIFICACIONES
// ==========================================
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

console.log('✅✅✅ EntrenadorAPI COMPLETO inicializado correctamente');