// ==========================================
// GESTIÓN DE ADMINISTRADORES - CON API REAL
// ==========================================
console.log('🔧 Inicializando Gestión de Administradores');

const AdminManager = {
    // Estado de la aplicación
    state: {
        administradores: [],
        administradoresFiltrados: [],
        adminEditando: null,
        modoEdicion: false,
        currentPage: 1,
        itemsPerPage: 10
    },

    // ==========================================
    // INICIALIZACIÓN
    // ==========================================
    init() {
        console.log('🚀 Iniciando sección de Administradores');
        
        try {
            // Verificar que AdminAPI esté disponible
            if (!window.AdminAPI) {
                console.error('❌ AdminAPI no está disponible');
                this.showError('Error: API no disponible');
                return;
            }
            
            // Verificar autenticación
            if (!AdminAPI.checkAuth()) {
                console.warn('⚠️ Usuario no autenticado');
                return;
            }
            
            // Actualizar información del usuario
            AdminAPI.updateUserInfo();
            
            // Cargar tema
            this.loadTheme();
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Cargar administradores
            this.loadAdministradores();
            
            console.log('✅ Administradores inicializado correctamente');
            
        } catch (error) {
            console.error('💥 Error inicializando:', error);
            this.showError('Error al inicializar: ' + error.message);
        }
    },

    // ==========================================
    // CONFIGURACIÓN
    // ==========================================
    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        }
    },

    setupEventListeners() {
        console.log('🔗 Configurando event listeners...');
        
        // Botón nuevo administrador
        document.getElementById('newAdminBtn').addEventListener('click', () => {
            this.mostrarFormularioNuevo();
        });
        
        // Buscador
        document.getElementById('searchInput').addEventListener('input', () => {
            this.buscarAdministradores();
        });
        
        // Botones de paginación
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.cambiarPagina(-1);
        });
        
        document.getElementById('nextBtn').addEventListener('click', () => {
            this.cambiarPagina(1);
        });
        
        // Modal
        document.getElementById('closeModal').addEventListener('click', () => {
            this.cerrarModal();
        });
        
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.cerrarModal();
        });
        
        document.getElementById('adminModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('adminModal')) {
                this.cerrarModal();
            }
        });
        
        // Formulario
        document.getElementById('adminForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit(e);
        });
        
        // Botón de ayuda
        const helpBtn = document.querySelector('.floating-help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                AdminAPI.showNotification('Para ayuda contacta al soporte técnico', 'info');
            });
        }
        
        console.log('✅ Event listeners configurados');
    },

    // ==========================================
    // CARGAR DATOS
    // ==========================================
    async loadAdministradores() {
        try {
            this.setLoading(true);
            console.log('📥 Cargando administradores desde API...');
            
            // Llamar a la API real
            const response = await AdminAPI.getAllAdministradores();
            
            if (!response) {
                throw new Error('No se pudo obtener respuesta del servidor');
            }
            
            console.log('✅ Respuesta de API:', response);
            
            // Asegurarnos de tener un array de administradores
            let admins = response.administradores || response.data || response || [];
            
            // Filtrar solo administradores
            if (Array.isArray(admins)) {
                this.state.administradores = admins.filter(user => {
                    const role = user.role || user.tipo || user.rol;
                    return role === 'admin' || user.isAdmin === true;
                });
            } else {
                this.state.administradores = [];
            }
            
            console.log(`✅ ${this.state.administradores.length} administradores cargados`);
            
            this.actualizarEstadisticas();
            this.buscarAdministradores();
            await this.updateServerStatus();
            
        } catch (error) {
            console.error('❌ Error cargando administradores:', error);
            AdminAPI.showNotification('Error al cargar administradores: ' + error.message, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    // ==========================================
    // FUNCIONES DE UI
    // ==========================================
    setLoading(loading) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('hidden', !loading);
        }
    },

    actualizarEstadisticas() {
        const activos = this.state.administradores.filter(a => {
            if (a.activo !== undefined) return a.activo;
            if (a.estado !== undefined) return a.estado === 'activo';
            if (a.status !== undefined) return a.status === 'active';
            if (a.isActive !== undefined) return a.isActive;
            return true;
        }).length;
        
        document.getElementById('totalAdmins').textContent = this.state.administradores.length;
        document.getElementById('activeAdmins').textContent = activos;
        document.getElementById('filteredAdmins').textContent = this.state.administradoresFiltrados.length;
    },

    buscarAdministradores() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        
        if (searchTerm === '') {
            this.state.administradoresFiltrados = [...this.state.administradores];
        } else {
            this.state.administradoresFiltrados = this.state.administradores.filter(admin => {
                const nombre = (admin.nombre || admin.name || '').toLowerCase();
                const email = (admin.email || admin.correo || '').toLowerCase();
                return nombre.includes(searchTerm) || email.includes(searchTerm);
            });
        }
        
        this.state.currentPage = 1;
        this.actualizarEstadisticas();
        this.renderizarTabla();
        this.actualizarPaginacion();
    },

    renderizarTabla() {
        const tbody = document.getElementById('adminsTableBody');
        if (!tbody) return;
        
        // Remover fila de carga
        const loadingRow = document.getElementById('loadingRow');
        if (loadingRow) loadingRow.remove();
        
        if (this.state.administradoresFiltrados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center p-12">
                        <div class="flex flex-col items-center justify-center gap-4">
                            <span class="material-symbols-outlined text-6xl text-gray-400">admin_panel_settings</span>
                            <div>
                                <p class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No hay administradores registrados</p>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Usa el botón "Nuevo Administrador" para agregar uno</p>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        const startIndex = (this.state.currentPage - 1) * this.state.itemsPerPage;
        const endIndex = startIndex + this.state.itemsPerPage;
        const adminsPagina = this.state.administradoresFiltrados.slice(startIndex, endIndex);
        
        tbody.innerHTML = adminsPagina.map(admin => {
            const adminId = admin.id || admin.ID || admin._id || admin.userId || 'N/A';
            const adminNombre = admin.nombre || admin.name || 'Sin nombre';
            const adminEmail = admin.email || admin.correo || 'Sin email';
            const adminTelefono = admin.telefono || admin.phone || 'No tiene';
            
            // Determinar estado
            let estado = 'Activo';
            let estadoClase = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
            let estadoIcon = '✅';
            
            if (admin.activo === false || admin.estado === 'inactivo' || admin.status === 'inactive' || admin.isActive === false) {
                estado = 'Inactivo';
                estadoClase = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
                estadoIcon = '❌';
            }
            
            // Fecha de creación
            let fechaCreacion = '-';
            if (admin.created_at) {
                fechaCreacion = new Date(admin.created_at).toLocaleDateString('es-ES');
            } else if (admin.fecha_creacion) {
                fechaCreacion = new Date(admin.fecha_creacion).toLocaleDateString('es-ES');
            } else if (admin.createdAt) {
                fechaCreacion = new Date(admin.createdAt).toLocaleDateString('es-ES');
            }
            
            // Escape de datos
            const idSeguro = this.escapeForJavaScript(String(adminId));
            const nombreSeguro = this.escapeForJavaScript(adminNombre);
            
            return `
                <tr class="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td class="p-6 text-sm text-gray-600 dark:text-gray-400 font-mono">
                        #${this.escapeHTML(String(adminId).substring(0, 8))}...
                    </td>
                    <td class="p-6">
                        <div class="font-semibold text-gray-900 dark:text-white">
                            ${this.escapeHTML(adminNombre)}
                        </div>
                    </td>
                    <td class="p-6 text-sm text-gray-600 dark:text-gray-400">
                        ${this.escapeHTML(adminEmail)}
                    </td>
                    <td class="p-6 text-sm text-gray-600 dark:text-gray-400">
                        ${this.escapeHTML(adminTelefono)}
                    </td>
                    <td class="p-6">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${estadoClase}">
                            ${estadoIcon} ${estado}
                        </span>
                    </td>
                    <td class="p-6 text-sm text-gray-600 dark:text-gray-400">
                        ${this.escapeHTML(fechaCreacion)}
                    </td>
                    <td class="p-6">
                        <div class="flex items-center gap-2">
                            <button onclick="AdminManager.editarAdministrador('${idSeguro}')" 
                                    class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Editar">
                                <span class="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button onclick="AdminManager.toggleEstado('${idSeguro}', '${nombreSeguro}')" 
                                    class="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                                    title="${estado === 'Activo' ? 'Desactivar' : 'Activar'}">
                                <span class="material-symbols-outlined text-sm">${estado === 'Activo' ? 'toggle_on' : 'toggle_off'}</span>
                            </button>
                            <button onclick="AdminManager.eliminarAdministrador('${idSeguro}', '${nombreSeguro}')" 
                                    class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Eliminar">
                                <span class="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    // ==========================================
    // FUNCIONALIDADES DEL MODAL
    // ==========================================
    mostrarFormularioNuevo() {
        this.state.modoEdicion = false;
        this.state.adminEditando = null;
        
        document.getElementById('modalTitle').textContent = '➕ Nuevo Administrador';
        document.getElementById('nombre').value = '';
        document.getElementById('email').value = '';
        document.getElementById('email').disabled = false;
        document.getElementById('password').value = '';
        document.getElementById('password').required = true;
        document.getElementById('telefono').value = '';
        document.getElementById('newPassword').value = '';
        
        document.getElementById('passwordField').classList.remove('hidden');
        document.getElementById('newPasswordField').classList.add('hidden');
        document.getElementById('submitBtn').textContent = '✅ Crear Administrador';
        document.getElementById('adminModal').classList.remove('hidden');
        
        document.getElementById('nombre').focus();
    },

    async editarAdministrador(id) {
        console.log('✏️ Editando administrador:', id);
        
        const admin = this.state.administradores.find(a => {
            const adminId = a.id || a.ID || a._id || a.userId;
            return String(adminId) === String(id);
        });
        
        if (!admin) {
            AdminAPI.showNotification('Administrador no encontrado', 'error');
            return;
        }
        
        this.state.modoEdicion = true;
        this.state.adminEditando = admin;
        
        document.getElementById('modalTitle').textContent = '✏️ Editar Administrador';
        document.getElementById('nombre').value = admin.nombre || admin.name || '';
        document.getElementById('email').value = admin.email || admin.correo || '';
        document.getElementById('email').disabled = true;
        document.getElementById('password').value = '';
        document.getElementById('password').required = false;
        document.getElementById('telefono').value = admin.telefono || admin.phone || '';
        document.getElementById('newPassword').value = '';
        
        document.getElementById('passwordField').classList.add('hidden');
        document.getElementById('newPasswordField').classList.remove('hidden');
        document.getElementById('submitBtn').textContent = '✅ Actualizar';
        document.getElementById('adminModal').classList.remove('hidden');
        
        document.getElementById('nombre').focus();
    },

    // ==========================================
    // FUNCIONES CRUD
    // ==========================================
    async toggleEstado(id, nombre) {
        console.log('🔄 Cambiando estado del administrador:', id);
        
        if (!confirm(`¿Estás seguro de cambiar el estado del administrador "${nombre}"?`)) {
            return;
        }
        
        try {
            this.setLoading(true);
            
            const response = await AdminAPI.toggleAdministradorStatus(id);
            
            if (response) {
                // Actualizar estado localmente
                const index = this.state.administradores.findIndex(a => {
                    const adminId = a.id || a.ID || a._id || a.userId;
                    return String(adminId) === String(id);
                });
                
                if (index !== -1) {
                    // Alternar el estado
                    if (this.state.administradores[index].activo !== undefined) {
                        this.state.administradores[index].activo = !this.state.administradores[index].activo;
                    } else if (this.state.administradores[index].estado !== undefined) {
                        this.state.administradores[index].estado = this.state.administradores[index].estado === 'activo' ? 'inactivo' : 'activo';
                    } else if (this.state.administradores[index].status !== undefined) {
                        this.state.administradores[index].status = this.state.administradores[index].status === 'active' ? 'inactive' : 'active';
                    } else if (this.state.administradores[index].isActive !== undefined) {
                        this.state.administradores[index].isActive = !this.state.administradores[index].isActive;
                    }
                }
                
                this.actualizarEstadisticas();
                this.buscarAdministradores();
                
                AdminAPI.showNotification(`Estado del administrador actualizado exitosamente`, 'success');
            }
            
        } catch (error) {
            console.error('❌ Error cambiando estado:', error);
            AdminAPI.showNotification('Error al cambiar estado: ' + error.message, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    async eliminarAdministrador(id, nombre) {
        console.log('🗑️ Eliminando administrador:', id);
        
        if (!confirm(`¿Estás seguro de eliminar al administrador "${nombre}"? Esta acción no se puede deshacer.`)) {
            return;
        }
        
        try {
            this.setLoading(true);
            
            const response = await AdminAPI.deleteAdministrador(id);
            
            if (response) {
                // Eliminar localmente
                this.state.administradores = this.state.administradores.filter(a => {
                    const adminId = a.id || a.ID || a._id || a.userId;
                    return String(adminId) !== String(id);
                });
                
                this.actualizarEstadisticas();
                this.buscarAdministradores();
                
                AdminAPI.showNotification('Administrador eliminado exitosamente', 'success');
            }
            
        } catch (error) {
            console.error('❌ Error eliminando:', error);
            AdminAPI.showNotification('Error al eliminar administrador: ' + error.message, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = {
            nombre: document.getElementById('nombre').value.trim(),
            email: document.getElementById('email').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            role: 'admin'
        };
        
        // Agregar contraseña según el modo
        if (!this.state.modoEdicion) {
            const password = document.getElementById('password').value.trim();
            if (!password) {
                AdminAPI.showNotification('La contraseña es requerida para nuevos administradores', 'error');
                return;
            }
            if (password.length < 6) {
                AdminAPI.showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }
            formData.password = password;
        } else {
            const newPassword = document.getElementById('newPassword').value.trim();
            if (newPassword) {
                if (newPassword.length < 6) {
                    AdminAPI.showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
                    return;
                }
                formData.password = newPassword;
            }
        }
        
        // Validaciones básicas
        if (!formData.nombre) {
            AdminAPI.showNotification('El nombre es requerido', 'error');
            return;
        }
        
        if (!formData.email) {
            AdminAPI.showNotification('El email es requerido', 'error');
            return;
        }
        
        try {
            this.setLoading(true);
            
            if (this.state.modoEdicion && this.state.adminEditando) {
                // Obtener ID del admin a editar
                const adminId = this.state.adminEditando.id || this.state.adminEditando.ID || 
                              this.state.adminEditando._id || this.state.adminEditando.userId;
                
                if (!adminId) {
                    throw new Error('ID del administrador no encontrado');
                }
                
                console.log('🔄 Actualizando administrador:', adminId);
                await AdminAPI.updateAdministrador(adminId, formData);
                
                AdminAPI.showNotification('Administrador actualizado exitosamente', 'success');
                
                // Recargar la lista
                await this.loadAdministradores();
                
            } else {
                // Crear nuevo administrador
                console.log('➕ Creando nuevo administrador');
                await AdminAPI.createAdministrador(formData);
                
                AdminAPI.showNotification('Administrador creado exitosamente', 'success');
                
                // Recargar la lista
                await this.loadAdministradores();
            }
            
            this.cerrarModal();
            
        } catch (error) {
            console.error('❌ Error guardando:', error);
            AdminAPI.showNotification('Error al guardar administrador: ' + error.message, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    cerrarModal() {
        document.getElementById('adminModal').classList.add('hidden');
        document.getElementById('adminForm').reset();
    },

    // ==========================================
    // PAGINACIÓN
    // ==========================================
    cambiarPagina(direction) {
        const totalPages = Math.ceil(this.state.administradoresFiltrados.length / this.state.itemsPerPage);
        const newPage = this.state.currentPage + direction;
        
        if (newPage < 1 || newPage > totalPages) return;
        
        this.state.currentPage = newPage;
        this.renderizarTabla();
        this.actualizarPaginacion();
    },

    actualizarPaginacion() {
        const totalPages = Math.ceil(this.state.administradoresFiltrados.length / this.state.itemsPerPage);
        const startIndex = (this.state.currentPage - 1) * this.state.itemsPerPage + 1;
        const endIndex = Math.min(this.state.currentPage * this.state.itemsPerPage, this.state.administradoresFiltrados.length);
        
        document.getElementById('prevBtn').disabled = this.state.currentPage === 1;
        document.getElementById('nextBtn').disabled = this.state.currentPage === totalPages || totalPages === 0;
        document.getElementById('showingText').textContent = `Mostrando ${startIndex}-${endIndex} de ${this.state.administradoresFiltrados.length} administradores`;
    },

    // ==========================================
    // UTILIDADES
    // ==========================================
    async updateServerStatus() {
        try {
            const isOnline = await AdminAPI.checkServerStatus();
            
            document.getElementById('serverStatus').textContent = isOnline ? 'ONLINE' : 'OFFLINE';
            
            const dot = document.getElementById('statusDot');
            if (dot) {
                dot.className = isOnline ? 
                    'w-2 h-2 rounded-full bg-green-500' : 
                    'w-2 h-2 rounded-full bg-red-500';
            }
            
        } catch (error) {
            console.error('❌ Error verificando estado del servidor:', error);
        }
    },

    escapeHTML(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    escapeForJavaScript(text) {
        if (!text) return '';
        return text.toString()
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    },

    showError(message) {
        AdminAPI.showNotification(message, 'error');
    }
};

// ==========================================
// FUNCIONES GLOBALES
// ==========================================

function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    AdminAPI.showNotification(`Modo ${isDark ? 'oscuro' : 'claro'} activado`, 'info');
}

function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            AdminAPI.logout();
        }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    AdminManager.init();
});

// Hacer funciones disponibles globalmente
window.AdminManager = AdminManager;
window.loadAdministradores = () => AdminManager.loadAdministradores();
window.toggleTheme = toggleTheme;
window.logout = logout;

console.log('✅ Script de administradores cargado correctamente');