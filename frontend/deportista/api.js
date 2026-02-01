// ===================================
// API DEPORTISTA - TITANES EVOLUTION
// ===================================

console.log('📦 Cargando DeportistaAPI...');

window.DeportistaAPI = {
    baseURL: 'http://localhost:5000/api',

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
    // VERIFICACIÓN DE AUTENTICACIÓN CON PAGO
    // ==========================================
    async checkAuth() {
        console.log('🔐 Verificando autenticación del deportista...');
        
        if (!this.token) {
            console.log('❌ No hay token de autenticación');
            return false;
        }

        // Verificar rol
        const user = this.user;
        if (user && user.role !== 'deportista') {
            console.warn('⚠️ Acceso restringido a deportistas. Rol:', user.role);
            this.showNotification('Acceso restringido', 'error');
            setTimeout(() => {
                window.location.href = '../auth/login-deportista.html';
            }, 2000);
            return false;
        }

        // VERIFICAR ESTADO DE PAGO
        try {
            const estadoPago = await this.verificarEstadoPago();
            console.log('💰 Estado de pago:', estadoPago);
            
            if (estadoPago.estado === 'pendiente_de_pago') {
                console.log('❌ Deportista con pago pendiente. Mostrando modal...');
                this.mostrarModalPagoPendiente(estadoPago);
                return false; // Bloquear acceso
            }
            
            console.log('✅ Autenticación válida y pagos al día');
            return true;
            
        } catch (error) {
            console.error('❌ Error verificando estado de pago:', error);
            // En caso de error, permitir acceso
            return true;
        }
    },

    // ==========================================
    // ✅✅✅ MÉTODO NUEVO: VERIFICAR ESTADO DE PAGO
    // ==========================================
    async verificarEstadoPago() {
        try {
            console.log('💰 Verificando estado de pago del deportista...');
            
            const response = await fetch(`${this.baseURL}/deportistas/estado-pago`, {
                method: 'GET',
                headers: this.getHeaders()
            });

        if (!response.ok) {
                console.warn('⚠️ No se pudo verificar estado de pago. Status:', response.status);
                
                // Si no hay endpoint específico, intentar obtener perfil para ver estado
                const perfil = await this.getMe();
                if (perfil && perfil.estado === 'pendiente_de_pago') {
                    return {
                        estado: 'pendiente_de_pago',
                        mensaje: 'Tienes un pago pendiente. Por favor, regulariza tu situación para acceder al sistema.',
                        puedeAcceder: false
                    };
                }
                
                return {
                    estado: 'activo',
                    mensaje: null,
                    puedeAcceder: true
                };
            }

            const data = await response.json();
            console.log('📊 Datos de estado de pago:', data);
            
            if (data.estado === 'pendiente_de_pago') {
                return {
                    estado: data.estado,
                    mensaje: data.mensaje || 'Tienes un pago pendiente. Por favor, contacta con la administración para regularizar tu situación.',
                    fecha_vencimiento: data.fecha_vencimiento,
                    monto_pendiente: data.monto_pendiente,
                    contacto_admin: data.contacto_admin || 'admin@titanesevolution.com',
                    telefono_admin: data.telefono_admin || '300 123 4567',
                    puedeAcceder: false
                };
            }
            
            return {
                estado: data.estado || 'activo',
                mensaje: null,
                puedeAcceder: true
            };
            
        } catch (error) {
            console.error('❌ Error verificando estado de pago:', error);
            
            // En caso de error, intentar obtener estado del perfil
            try {
                const perfil = await this.getMe();
                if (perfil && perfil.estado === 'pendiente_de_pago') {
                    return {
                        estado: 'pendiente_de_pago',
                        mensaje: 'Tienes un pago pendiente. Por favor, regulariza tu situación.',
                        puedeAcceder: false
                    };
                }
            } catch (perfilError) {
                console.error('❌ Error obteniendo perfil:', perfilError);
            }
            
            return {
                estado: 'error',
                mensaje: 'Error al verificar estado. Contacta con soporte.',
                puedeAcceder: true // Permitir acceso en caso de error
            };
        }
    },

    // ==========================================
    // ✅✅✅ MÉTODO NUEVO: MOSTRAR MODAL DE PAGO PENDIENTE
    // ==========================================
    mostrarModalPagoPendiente(datosPago) {
        // Evitar múltiples modales
        if (document.getElementById('modalPagoPendiente')) {
            return;
        }
        
        const modal = document.createElement('div');
        modal.id = 'modalPagoPendiente';
        modal.className = 'fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 animate-fadeIn';
        
        // Preparar información de pago
        const monto = datosPago.monto_pendiente ? 
            `$${datosPago.monto_pendiente.toLocaleString('es-ES')}` : 
            'un monto pendiente';
        
        const fechaVencimiento = datosPago.fecha_vencimiento ? 
            new Date(datosPago.fecha_vencimiento).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : 
            'próximamente';
        
        const contactoAdmin = datosPago.contacto_admin || 'admin@titanesevolution.com';
        const telefonoAdmin = datosPago.telefono_admin || '300 123 4567';
        
        modal.innerHTML = `
        <div class="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp max-h-[90vh] overflow-y-auto">
            <!-- Header -->
            <div class="bg-gradient-to-r from-yellow-500 to-orange-500 p-8 text-center relative">
                <div class="absolute top-4 right-4">
                    <button onclick="DeportistaAPI.cerrarModalPagoPendiente()" 
                            class="text-white hover:text-gray-200 transition-colors">
                        <span class="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>
                
                <div class="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="material-symbols-outlined text-5xl text-white">warning</span>
                </div>
                <h2 class="text-3xl font-bold text-white mb-2">⚠️ Pago Pendiente</h2>
                <p class="text-white/90 text-lg">Tu acceso está temporalmente restringido</p>
            </div>
            
            <!-- Contenido -->
            <div class="p-8">
                <div class="space-y-6">
                    <!-- Mensaje principal -->
                    <div class="text-center">
                        <p class="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                            ${datosPago.mensaje || 'Tienes un pago pendiente que debe ser regularizado para continuar utilizando el sistema.'}
                        </p>
                    </div>
                    
                    <!-- Información del pago -->
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                        <h3 class="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-4 flex items-center gap-2">
                            <span class="material-symbols-outlined">info</span>
                            Detalles del Pago
                        </h3>
                        <div class="space-y-3">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 dark:text-gray-400">Monto Pendiente:</span>
                                <span class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">${monto}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 dark:text-gray-400">Fecha Límite:</span>
                                <span class="font-medium text-gray-800 dark:text-gray-200">${fechaVencimiento}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Contacto de administración -->
                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                        <h3 class="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
                            <span class="material-symbols-outlined">contact_support</span>
                            Contactar con Administración
                        </h3>
                        <div class="space-y-4">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">mail</span>
                                <div>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Correo Electrónico</p>
                                    <a href="mailto:${contactoAdmin}" class="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                        ${contactoAdmin}
                                    </a>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">phone</span>
                                <div>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Teléfono</p>
                                    <a href="tel:${telefonoAdmin.replace(/\s/g, '')}" class="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                        ${telefonoAdmin}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Pasos a seguir -->
                    <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                        <h3 class="text-lg font-semibold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2">
                            <span class="material-symbols-outlined">checklist</span>
                            ¿Cómo Regularizar?
                        </h3>
                        <ol class="space-y-3 list-decimal list-inside">
                            <li class="text-gray-700 dark:text-gray-300">Contacta con administración</li>
                            <li class="text-gray-700 dark:text-gray-300">Realiza el pago correspondiente</li>
                            <li class="text-gray-700 dark:text-gray-300">Envía el comprobante de pago</li>
                            <li class="text-gray-700 dark:text-gray-300">Espera la confirmación del administrador</li>
                            <li class="text-gray-700 dark:text-gray-300">Tu acceso se habilitará automáticamente</li>
                        </ol>
                    </div>
                </div>
                
                <!-- Footer del modal -->
                <div class="mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
                    <div class="flex flex-col sm:flex-row gap-4">
                        <button onclick="DeportistaAPI.cerrarModalPagoPendiente()" 
                                class="flex-1 px-6 py-3 bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors">
                            Entendido
                        </button>
                        <button onclick="DeportistaAPI.cerrarSesionConPagoPendiente()" 
                                class="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined">logout</span>
                            Cerrar Sesión
                        </button>
                    </div>
                    
                    <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                        ⚠️ No podrás acceder al sistema hasta regularizar tu pago
                    </p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
    
    // Bloquear clics fuera del modal
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            // No permitir cerrar haciendo clic fuera
            return;
        }
    });
},

    // ==========================================
    // ✅✅✅ MÉTODO NUEVO: CERRAR MODAL DE PAGO
    // ==========================================
    cerrarModalPagoPendiente() {
        const modal = document.getElementById('modalPagoPendiente');
        if (modal) {
            modal.remove();
        }
        
        // Restaurar scroll
        document.body.style.overflow = '';
        
        // Redirigir a login después de cerrar
        setTimeout(() => {
            window.location.href = '../auth/login-deportista.html';
        }, 300);
    },

    // ==========================================
    // ✅✅✅ MÉTODO NUEVO: CERRAR SESIÓN CON PAGO PENDIENTE
    // ==========================================
    cerrarSesionConPagoPendiente() {
        console.log('👋 Cerrando sesión por pago pendiente...');
        
        // Limpiar storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirigir a login
        setTimeout(() => {
            window.location.href = '../auth/login-deportista.html';
        }, 500);
    },

    logout() {
        localStorage.clear();
        sessionStorage.clear();
        this.showNotification('Sesión cerrada exitosamente', 'info');
        setTimeout(() => {
            const currentPath = window.location.pathname;
            if (currentPath.includes('/deportista/')) {
                window.location.href = '../../auth/login-deportista.html';
            } else {
                window.location.href = '../auth/login-deportista.html';
            }
        }, 1500);
    },

    // ==========================================
    // PERFIL DEL DEPORTISTA
    // ==========================================
    async getMe() {
        try {
            console.log('👤 Obteniendo perfil del deportista...');
            
            const response = await fetch(`${this.baseURL}/deportistas/me`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Perfil obtenido:', data.deportista);
            return data.deportista;
        } catch (error) {
            console.error('❌ Error obteniendo perfil:', error);
            this.showNotification('Error al cargar tu perfil', 'error');
            return null;
        }
    },

    // ==========================================
    // ACTUALIZAR PERFIL
    // ==========================================
    async updatePerfil(datos) {
        try {
            console.log('🔄 Actualizando perfil...', datos);
            
            const response = await fetch(`${this.baseURL}/deportistas/me`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(datos)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Perfil actualizado:', data);
            return data;
        } catch (error) {
            console.error('❌ Error actualizando perfil:', error);
            this.showNotification(error.message || 'Error al actualizar el perfil', 'error');
            throw error;
        }
    },

    async updateContactoEmergencia(datos) {
        try {
            console.log('🔄 Actualizando contacto de emergencia...', datos);
            
            const response = await fetch(`${this.baseURL}/deportistas/me/emergency-contact`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(datos)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Contacto de emergencia actualizado:', data);
            return data;
        } catch (error) {
            console.error('❌ Error actualizando contacto:', error);
            this.showNotification(error.message || 'Error al actualizar el contacto', 'error');
            throw error;
        }
    },

    async uploadFoto(file) {
        try {
            console.log('🔄 Subiendo foto...');
            
            const formData = new FormData();
            formData.append('foto_perfil', file);

            const headers = {};
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const response = await fetch(`${this.baseURL}/deportistas/me/photo`, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Foto subida:', data);
            return data;
        } catch (error) {
            console.error('❌ Error subiendo foto:', error);
            this.showNotification(error.message || 'Error al subir la foto', 'error');
            throw error;
        }
    },

    async cambiarPassword(passwordActual, passwordNueva) {
        try {
            console.log('🔄 Cambiando contraseña...');
            
            const response = await fetch(`${this.baseURL}/deportistas/me/password`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    password_actual: passwordActual,
                    password_nueva: passwordNueva
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Contraseña cambiada');
            return data;
        } catch (error) {
            console.error('❌ Error cambiando contraseña:', error);
            this.showNotification(error.message || 'Error al cambiar la contraseña', 'error');
            throw error;
        }
    },

    // ==========================================
    // EVALUACIONES
    // ==========================================
    async getEvaluaciones() {
        try {
            console.log('📋 Obteniendo evaluaciones...');
            
            // Primero obtener el perfil para sacar el deportista_id
            const perfil = await this.getMe();
            if (!perfil || !perfil.id) {
                throw new Error('No se pudo obtener el ID del deportista');
            }

            const response = await fetch(`${this.baseURL}/evaluaciones/deportista/${perfil.id}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                console.warn('⚠️ No se pudieron obtener evaluaciones');
                return [];
            }

            const data = await response.json();
            const evaluaciones = data.evaluaciones || data || [];
            console.log(`✅ ${evaluaciones.length} evaluaciones obtenidas`);
            return evaluaciones;
        } catch (error) {
            console.error('❌ Error obteniendo evaluaciones:', error);
            return [];
        }
    },

    async getEvaluacionesPendientes() {
        try {
            console.log('🔄 Obteniendo evaluaciones pendientes...');
            
            const evaluaciones = await this.getEvaluaciones();
            const pendientes = evaluaciones.filter(e => !e.completado);
            
            console.log(`✅ ${pendientes.length} evaluaciones pendientes`);
            return pendientes;
        } catch (error) {
            console.error('❌ Error obteniendo evaluaciones pendientes:', error);
            return [];
        }
    },

    async getProgreso() {
        try {
            console.log('📊 Calculando progreso...');
            
            const perfil = await this.getMe();
            if (!perfil || !perfil.id) {
                throw new Error('No se pudo obtener el ID del deportista');
            }

            const response = await fetch(`${this.baseURL}/evaluaciones/progreso/${perfil.id}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                console.warn('⚠️ No se pudo obtener progreso');
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

    // ==========================================
    // HABILIDADES
    // ==========================================
    async getHabilidades(nivel = null) {
        try {
            console.log('🎯 Obteniendo habilidades...');
            
            const perfil = await this.getMe();
            const nivelActual = nivel || perfil?.nivel_actual;
            
            if (!nivelActual || nivelActual === 'pendiente') {
                console.warn('⚠️ Sin nivel asignado aún');
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

            const response = await fetch(`${this.baseURL}/habilidades/nivel/${nivelActual}?deportista_id=${perfil.id}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ ${data.habilidades?.length || 0} habilidades obtenidas`);
            
            return {
                habilidades: data.habilidades || [],
                por_categoria: data.por_categoria || {
                    habilidad: [],
                    ejercicio_accesorio: [],
                    postura: []
                },
                total: data.total || data.habilidades?.length || 0
            };
        } catch (error) {
            console.error('❌ Error obteniendo habilidades:', error);
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

    async getHabilidadesFaltantes() {
        try {
            console.log('📝 Obteniendo habilidades faltantes...');
            
            const perfil = await this.getMe();
            if (!perfil || !perfil.id) {
                throw new Error('No se pudo obtener el ID del deportista');
            }

            const response = await fetch(`${this.baseURL}/habilidades/faltantes/${perfil.id}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                console.warn('⚠️ No se pudieron obtener habilidades faltantes');
                return [];
            }

            const data = await response.json();
            const faltantes = data.habilidades || data || [];
            console.log(`✅ ${faltantes.length} habilidades faltantes`);
            return faltantes;
        } catch (error) {
            console.error('❌ Error obteniendo habilidades faltantes:', error);
            return [];
        }
    },

    // ==========================================
    // CALENDARIO
    // ==========================================
    async getEventos(filtros = {}) {
        try {
            console.log('📅 Obteniendo eventos del calendario...');
            
            const params = new URLSearchParams();
            
            // Si vienen filtros con fecha_inicio, convertir a mes/año
            if (filtros.fecha_inicio) {
                const fecha = new Date(filtros.fecha_inicio);
                params.append('mes', fecha.getMonth() + 1);
                params.append('año', fecha.getFullYear());
            } else if (filtros.mes && filtros.año) {
                params.append('mes', filtros.mes);
                params.append('año', filtros.año);
            }

            const url = params.toString() ? 
                `${this.baseURL}/calendario/filtros?${params.toString()}` : 
                `${this.baseURL}/calendario`;

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                console.warn('⚠️ No se pudieron obtener eventos');
                return [];
            }

            const data = await response.json();
            const eventos = data.eventos || data || [];
            console.log(`✅ ${eventos.length} eventos obtenidos`);
            return eventos;
        } catch (error) {
            console.error('❌ Error obteniendo eventos:', error);
            return [];
        }
    },

    async getEventosHoy() {
        try {
            const hoy = new Date();
            const eventos = await this.getEventos({
                mes: hoy.getMonth() + 1,
                año: hoy.getFullYear()
            });
            
            const hoyStr = hoy.toISOString().split('T')[0];
            const eventosHoy = eventos.filter(e => {
                const fechaEvento = new Date(e.fecha_evento).toISOString().split('T')[0];
                return fechaEvento === hoyStr;
            });
            
            console.log(`✅ ${eventosHoy.length} eventos para hoy`);
            return eventosHoy;
        } catch (error) {
            console.error('❌ Error obteniendo eventos de hoy:', error);
            return [];
        }
    },

    // ==========================================
    // ESTADÍSTICAS
    // ==========================================
    async getEstadisticas() {
        try {
            console.log('📊 Obteniendo estadísticas...');
            
            const perfil = await this.getMe();
            if (!perfil || !perfil.id) {
                throw new Error('No se pudo obtener el ID del deportista');
            }

            const response = await fetch(`${this.baseURL}/deportistas/${perfil.id}/stats`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                console.warn('⚠️ No se pudieron obtener estadísticas');
                return null;
            }

            const data = await response.json();
            console.log('✅ Estadísticas obtenidas:', data.stats);
            return data.stats;
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return null;
        }
    },

    // ==========================================
    // UTILIDADES
    // ==========================================
    formatNivel(nivel) {
        const niveles = {
            'pendiente': '⏳ Pendiente',
            'baby_titans': '👶 Baby Titans',
            '1_basico': 'Nivel 1 Básico',
            '1_medio': 'Nivel 1 Medio',
            '1_avanzado': 'Nivel 1 Avanzado',
            '2': 'Nivel 2',
            '3': 'Nivel 3',
            '4': 'Nivel 4'
        };
        return niveles[nivel] || nivel;
    },

    formatEquipo(equipo) {
        const equipos = {
            'sin_equipo': 'Sin equipo',
            'rocks_titans': '🪨 Rocks Titans',
            'lightning_titans': '⚡ Lightning Titans',
            'storm_titans': '🌪️ Storm Titans',
            'fire_titans': '🔥 Fire Titans',
            'electric_titans': '⚡ Electric Titans'
        };
        return equipos[equipo] || equipo;
    },

    formatEstado(estado) {
        const estados = {
            'activo': '✅ Activo',
            'lesionado': '🤕 Lesionado',
            'descanso': '🏝️ Descanso',
            'inactivo': '❌ Inactivo',
            'pendiente': '⏳ Pendiente',
            'pendiente_de_pago': '💰 Pendiente de Pago'
        };
        return estados[estado] || estado;
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

    calcularIMC(peso, altura) {
        if (!peso || !altura || altura <= 0) return null;
        return (peso / (altura * altura)).toFixed(1);
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
// ESTILOS PARA NOTIFICACIONES Y ANIMACIONES
// ==========================================
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { 
                opacity: 0;
                transform: translateY(30px);
            }
            to { 
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
            animation: slideUp 0.4s ease-out;
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ DeportistaAPI inicializado correctamente con sistema de verificación de pagos');