// ==========================================
// GESTIÓN DE ENTRENADORES - VERSIÓN CORREGIDA (SIN CONTRASEÑA)
// ==========================================
console.log('👨‍🏫 Inicializando Gestión de Entrenadores - SIN CONTRASEÑA');

const EntrenadoresManager = {
    // Estado de la aplicación
    state: {
        entrenadores: [],
        entrenadoresFiltrados: [],
        entrenadorEditando: null,
        modoEdicion: false,
        nivelesSeleccionados: [],
        equiposSeleccionados: [],
        entrenadorAEliminar: null,
        currentPage: 1,
        itemsPerPage: 10
    },

    // Datos de configuración
    config: {
        NIVELES_DISPONIBLES: [
            { value: 'baby_titans', label: 'Baby Titans', icon: 'child_care', color: '#FBBF24' },
            { value: '1_basico', label: 'N1 Básico', icon: 'looks_one', color: '#10B981' },
            { value: '1_medio', label: 'N1 Medio', icon: 'looks_two', color: '#3B82F6' },
            { value: '1_avanzado', label: 'N1 Avanzado', icon: 'star', color: '#8B5CF6' },
            { value: '2', label: 'Nivel 2', icon: 'looks_4', color: '#F59E0B' },
            { value: '3', label: 'Nivel 3', icon: 'looks_5', color: '#EF4444' },
            { value: '4', label: 'Nivel 4', icon: 'looks_6', color: '#EC4899' }
        ],

        EQUIPOS_DISPONIBLES: [
            { value: 'rocks_titans', label: 'Rocks Titans', icon: 'terrain', color: '#78716C' },
            { value: 'lightning_titans', label: 'Lightning Titans', icon: 'flash_on', color: '#FBBF24' },
            { value: 'storm_titans', label: 'Storm Titans', icon: 'thunderstorm', color: '#3B82F6' },
            { value: 'fire_titans', label: 'Fire Titans', icon: 'local_fire_department', color: '#EF4444' },
            { value: 'electric_titans', label: 'Electric Titans', icon: 'bolt', color: '#8B5CF6' }
        ]
    },

    // ==========================================
    // FUNCIÓN HELPER PARA EXTRAER EQUIPOS
    // ==========================================
    extraerEquipos(entrenador) {
        let equipos = [];

        // Intentar todos los posibles nombres de campos
        const posiblesCampos = [
            'grupos_competitivos',
            'equipos_competitivos',
            'equipos',
            'teams',
            'competitive_teams',
            'gruposCompetitivos',
            'equiposCompetitivos'
        ];

        for (const campo of posiblesCampos) {
            if (entrenador[campo]) {
                // Si es un array
                if (Array.isArray(entrenador[campo])) {
                    equipos = entrenador[campo];
                    break;
                }

                // Si es un string
                if (typeof entrenador[campo] === 'string') {
                    // Intentar parsear como JSON
                    try {
                        const parsed = JSON.parse(entrenador[campo]);
                        if (Array.isArray(parsed)) {
                            equipos = parsed;
                            break;
                        }
                    } catch (e) {
                        // No es JSON, intentar separar por comas
                        equipos = entrenador[campo].split(',').map(e => e.trim()).filter(Boolean);
                        if (equipos.length > 0) break;
                    }
                }
            }
        }

        return equipos;
    },

    // ==========================================
    // CARGAR DATOS
    // ==========================================
    async loadEntrenadores() {
        try {
            this.setLoading(true);
            console.log('📥 Cargando entrenadores desde API...');

            const response = await AdminAPI.getAllEntrenadores();

            if (!response) {
                throw new Error('No se pudo obtener respuesta del servidor');
            }

            let trainers = [];

            if (response.entrenadores && Array.isArray(response.entrenadores)) {
                trainers = response.entrenadores;
            } else if (response.success && response.entrenadores) {
                trainers = response.entrenadores;
            }

            this.state.entrenadores = trainers;
            console.log(`✅ ${this.state.entrenadores.length} entrenadores cargados`);

            this.actualizarEstadisticas();
            this.buscarEntrenadores();
            await this.updateServerStatus();

        } catch (error) {
            console.error('❌ Error cargando entrenadores:', error);
            AdminAPI.showNotification('Error al cargar entrenadores: ' + error.message, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    // ==========================================
    // RENDERIZAR TABLA
    // ==========================================
    renderizarTabla() {
        const tbody = document.getElementById('trainersTableBody');
        if (!tbody) {
            console.error('❌ No se encontró trainersTableBody');
            return;
        }

        const loadingRow = document.getElementById('loadingRow');
        if (loadingRow) {
            loadingRow.remove();
        }

        if (this.state.entrenadoresFiltrados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center p-12">
                        <div class="flex flex-col items-center justify-center gap-4">
                            <span class="material-symbols-outlined text-6xl text-gray-400">groups_3</span>
                            <div>
                                <p class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No hay entrenadores registrados</p>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Usa el botón "Nuevo Entrenador" para agregar uno</p>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const startIndex = (this.state.currentPage - 1) * this.state.itemsPerPage;
        const endIndex = startIndex + this.state.itemsPerPage;
        const entrenadoresPagina = this.state.entrenadoresFiltrados.slice(startIndex, endIndex);

        tbody.innerHTML = entrenadoresPagina.map(entrenador => {
            const entrenadorId = entrenador.id || entrenador.ID || entrenador._id || entrenador.userId || 'N/A';
            const entrenadorNombre = entrenador.nombre || entrenador.name || 'Sin nombre';
            const entrenadorEmail = entrenador.email || entrenador.correo || 'Sin email';
            const entrenadorTelefono = entrenador.telefono || entrenador.phone || 'No tiene';

            // NIVELES
            const niveles = Array.isArray(entrenador.niveles_asignados) ? entrenador.niveles_asignados : [];
            const nivelesHTML = niveles.length > 0
                ? niveles.map(nivel => {
                    const nivelInfo = this.config.NIVELES_DISPONIBLES.find(n => n.value === nivel);
                    return `<span class="nivel-badge">${this.escapeHTML(nivelInfo?.label || nivel)}</span>`;
                }).join('')
                : '<span class="text-gray-400 text-sm">Sin niveles asignados</span>';

            // EQUIPOS
            const equipos = this.extraerEquipos(entrenador);
            const equiposHTML = equipos.length > 0
                ? equipos.map(equipo => {
                    const equipoInfo = this.config.EQUIPOS_DISPONIBLES.find(e => e.value === equipo);
                    const equipoLabel = equipoInfo?.label || equipo;
                    const equipoColor = equipoInfo?.color || '#6B7280';

                    return `<span class="equipo-tag" style="border-left: 3px solid ${equipoColor}">${this.escapeHTML(equipoLabel)}</span>`;
                }).join(' ')
                : '<span class="text-gray-400 text-sm italic">Sin equipos</span>';

            // ESTADO
            let estado = 'Activo';
            let estadoClase = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
            let estadoIcon = '✅';

            // Verificar si está pendiente de registro
            if (entrenador.requiere_registro === true) {
                estado = 'Pendiente Registro';
                estadoClase = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
                estadoIcon = '⏳';
            }
            // Solo marcar como inactivo si activo === false
            else if (entrenador.activo === false || entrenador.estado === 'inactivo' || entrenador.status === 'inactive') {
                estado = 'Inactivo';
                estadoClase = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
                estadoIcon = '❌';
            }

            // FECHA
            let fechaCreacion = '-';
            if (entrenador.created_at) {
                fechaCreacion = new Date(entrenador.created_at).toLocaleDateString('es-ES');
            } else if (entrenador.fecha_creacion) {
                fechaCreacion = new Date(entrenador.fecha_creacion).toLocaleDateString('es-ES');
            } else if (entrenador.createdAt) {
                fechaCreacion = new Date(entrenador.createdAt).toLocaleDateString('es-ES');
            }

            const inicial = entrenadorNombre.charAt(0).toUpperCase();
            const avatarColor = this.getColorPorNombre(entrenadorNombre);

            const idSeguro = this.escapeForJavaScript(String(entrenadorId));
            const nombreSeguro = this.escapeForJavaScript(entrenadorNombre);
            const emailSeguro = this.escapeForJavaScript(entrenadorEmail);

            return `
                <tr class="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td class="p-6 text-sm text-gray-600 dark:text-gray-400 font-mono">
                        #${this.escapeHTML(String(entrenadorId).substring(0, 8))}...
                    </td>
                    <td class="p-6">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style="background: ${avatarColor}">
                                ${inicial}
                            </div>
                            <div>
                                <div class="font-semibold text-gray-900 dark:text-white">
                                    ${this.escapeHTML(entrenadorNombre)}
                                </div>
                                <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    ${this.escapeHTML(entrenadorEmail)}
                                </div>
                                <div class="text-xs text-gray-400 mt-1">
                                    📞 ${this.escapeHTML(entrenadorTelefono)}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td class="p-6">
                        <div class="flex flex-wrap gap-1">
                            ${nivelesHTML}
                        </div>
                    </td>
                    <td class="p-6">
                        <div class="flex flex-wrap gap-1">
                            ${equiposHTML}
                        </div>
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
                            <button onclick="window.EntrenadoresManager.editarEntrenador('${idSeguro}')" 
                                    class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Editar">
                                <span class="material-symbols-outlined text-sm">edit</span>
                            </button>
                            ${entrenador.requiere_registro ? `
                                <button onclick="window.EntrenadoresManager.enviarRecordatorio('${idSeguro}', '${emailSeguro}')" 
                                        class="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                                        title="Enviar recordatorio">
                                    <span class="material-symbols-outlined text-sm">mail</span>
                                </button>
                            ` : ''}
                            <button onclick="window.EntrenadoresManager.toggleEstadoEntrenador('${idSeguro}', '${nombreSeguro}')" 
                                    class="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                    title="${estado === 'Activo' || estado === 'Pendiente Registro' ? 'Desactivar' : 'Activar'}">
                                <span class="material-symbols-outlined text-sm">${estado === 'Activo' || estado === 'Pendiente Registro' ? 'toggle_on' : 'toggle_off'}</span>
                            </button>
                            <button onclick="window.EntrenadoresManager.mostrarConfirmacionEliminar('${idSeguro}', '${nombreSeguro}')" 
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
    // FUNCIONES PRINCIPALES
    // ==========================================

    async init() {
        console.log('🚀 Iniciando sección de Entrenadores');

        try {
            if (!window.AdminAPI) {
                console.error('❌ AdminAPI no está disponible');
                this.showError('Error: API no disponible');
                return;
            }

            if (!AdminAPI.checkAuth()) {
                console.warn('⚠️ Usuario no autenticado');
                return;
            }

            AdminAPI.updateUserInfo();
            this.loadTheme();
            this.setupEventListeners();
            await this.loadEntrenadores();

            console.log('✅ Entrenadores inicializado correctamente');

        } catch (error) {
            console.error('💥 Error crítico inicializando:', error);
            this.showError('Error al inicializar: ' + error.message);
        }
    },

    loadTheme() {
        try {
            const savedTheme = localStorage.getItem('theme') || 'light';
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark');
            }
        } catch (error) {
            console.error('❌ Error cargando tema:', error);
        }
    },

    setupEventListeners() {
        console.log('🔗 Configurando event listeners...');

        const newTrainerBtn = document.getElementById('newTrainerBtn');
        if (newTrainerBtn) {
            newTrainerBtn.addEventListener('click', () => {
                this.mostrarFormularioNuevo();
            });
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.buscarEntrenadores();
            });
        }

        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.cambiarPagina(-1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.cambiarPagina(1);
            });
        }

        const closeModal = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelBtn');
        const trainerModal = document.getElementById('trainerModal');

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.cerrarModal();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cerrarModal();
            });
        }

        if (trainerModal) {
            trainerModal.addEventListener('click', (e) => {
                if (e.target === trainerModal) {
                    this.cerrarModal();
                }
            });
        }

        const trainerForm = document.getElementById('trainerForm');
        if (trainerForm) {
            trainerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit(e);
            });
        }

        const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        const confirmModal = document.getElementById('confirmModal');

        if (cancelConfirmBtn) {
            cancelConfirmBtn.addEventListener('click', () => {
                this.cerrarConfirmacion();
            });
        }

        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                this.ejecutarAccionConfirmada();
            });
        }

        if (confirmModal) {
            confirmModal.addEventListener('click', (e) => {
                if (e.target === confirmModal) {
                    this.cerrarConfirmacion();
                }
            });
        }

        console.log('✅ Event listeners configurados');
    },

    setLoading(loading) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('hidden', !loading);
        }
    },

    actualizarEstadisticas() {
        const activos = this.state.entrenadores.filter(e => {
            if (e.activo !== undefined) return e.activo;
            if (e.estado !== undefined) return e.estado === 'activo';
            return true;
        }).length;

        const pendientes = this.state.entrenadores.filter(e => {
            return e.requiere_registro === true;
        }).length;

        const totalTrainers = document.getElementById('totalTrainers');
        const activeTrainers = document.getElementById('activeTrainers');
        const pendingTrainers = document.getElementById('pendingTrainers');
        const filteredTrainers = document.getElementById('filteredTrainers');

        if (totalTrainers) totalTrainers.textContent = this.state.entrenadores.length;
        if (activeTrainers) activeTrainers.textContent = activos;
        if (pendingTrainers) pendingTrainers.textContent = pendientes;
        if (filteredTrainers) filteredTrainers.textContent = this.state.entrenadoresFiltrados.length;
    },

    buscarEntrenadores() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase().trim();

        if (searchTerm === '') {
            this.state.entrenadoresFiltrados = [...this.state.entrenadores];
        } else {
            this.state.entrenadoresFiltrados = this.state.entrenadores.filter(entrenador => {
                const nombre = (entrenador.nombre || entrenador.name || '').toLowerCase();
                const email = (entrenador.email || entrenador.correo || '').toLowerCase();
                const telefono = (entrenador.telefono || entrenador.phone || '').toLowerCase();

                return nombre.includes(searchTerm) ||
                    email.includes(searchTerm) ||
                    telefono.includes(searchTerm);
            });
        }

        this.state.currentPage = 1;
        this.actualizarEstadisticas();
        this.renderizarTabla();
        this.actualizarPaginacion();
    },

    mostrarFormularioNuevo() {
        this.state.modoEdicion = false;
        this.state.entrenadorEditando = null;
        this.state.nivelesSeleccionados = ['1_basico'];
        this.state.equiposSeleccionados = ['rocks_titans'];

        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = '➕ Nuevo Entrenador';

        const nombreInput = document.getElementById('nombre');
        const emailInput = document.getElementById('email');
        const telefonoInput = document.getElementById('telefono');

        if (nombreInput) nombreInput.value = '';
        if (emailInput) {
            emailInput.value = '';
            emailInput.disabled = false;
        }
        if (telefonoInput) telefonoInput.value = '';

        // Ocultar campo de contraseña
        const passwordContainer = document.getElementById('passwordContainer');
        if (passwordContainer) passwordContainer.style.display = 'none';

        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) submitBtn.textContent = '✅ Crear Entrenador';

        this.renderizarSelectores();

        const trainerModal = document.getElementById('trainerModal');
        if (trainerModal) {
            trainerModal.classList.remove('hidden');
        }

        if (nombreInput) nombreInput.focus();
    },

    renderizarSelectores() {
        const nivelesGrid = document.getElementById('nivelesGrid');
        if (nivelesGrid) {
            nivelesGrid.innerHTML = this.config.NIVELES_DISPONIBLES.map(nivel => {
                const seleccionado = this.state.nivelesSeleccionados.includes(nivel.value);
                return `
                    <div class="relative">
                        <input type="checkbox" 
                               id="nivel-${nivel.value}" 
                               value="${nivel.value}" 
                               class="hidden" 
                               ${seleccionado ? 'checked' : ''}>
                        <label for="nivel-${nivel.value}" 
                               onclick="window.EntrenadoresManager.toggleNivel('${nivel.value}')"
                               class="flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${seleccionado ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-600 hover:border-primary'}">
                            <span class="material-symbols-outlined text-2xl mb-2" style="color: ${nivel.color}">
                                ${nivel.icon}
                            </span>
                            <span class="text-sm font-medium text-center">${nivel.label}</span>
                            ${seleccionado ? '<span class="absolute -top-1 -right-1 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</span>' : ''}
                        </label>
                    </div>
                `;
            }).join('');
        }

        const equiposGrid = document.getElementById('equiposGrid');
        if (equiposGrid) {
            equiposGrid.innerHTML = this.config.EQUIPOS_DISPONIBLES.map(equipo => {
                const seleccionado = this.state.equiposSeleccionados.includes(equipo.value);
                return `
                    <div class="relative">
                        <input type="checkbox" 
                               id="equipo-${equipo.value}" 
                               value="${equipo.value}" 
                               class="hidden" 
                               ${seleccionado ? 'checked' : ''}>
                        <label for="equipo-${equipo.value}" 
                               onclick="window.EntrenadoresManager.toggleEquipo('${equipo.value}')"
                               class="flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${seleccionado ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-600 hover:border-primary'}">
                            <span class="material-symbols-outlined text-2xl mb-2" style="color: ${equipo.color}">
                                ${equipo.icon}
                            </span>
                            <span class="text-sm font-medium text-center">${equipo.label}</span>
                            ${seleccionado ? '<span class="absolute -top-1 -right-1 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</span>' : ''}
                        </label>
                    </div>
                `;
            }).join('');
        }

        this.validarSelectores();
    },

    toggleNivel(nivel) {
        const index = this.state.nivelesSeleccionados.indexOf(nivel);

        if (index === -1) {
            this.state.nivelesSeleccionados.push(nivel);
        } else {
            this.state.nivelesSeleccionados.splice(index, 1);
        }

        this.renderizarSelectores();
    },

    toggleEquipo(equipo) {
        const index = this.state.equiposSeleccionados.indexOf(equipo);

        if (index === -1) {
            this.state.equiposSeleccionados.push(equipo);
        } else {
            this.state.equiposSeleccionados.splice(index, 1);
        }

        this.renderizarSelectores();
    },

    validarSelectores() {
        const nivelesValidos = this.state.nivelesSeleccionados.length > 0;
        const equiposValidos = this.state.equiposSeleccionados.length > 0;

        const nivelesError = document.getElementById('nivelesError');
        const equiposError = document.getElementById('equiposError');
        const submitBtn = document.getElementById('submitBtn');

        if (nivelesError) {
            nivelesError.classList.toggle('hidden', nivelesValidos);
        }

        if (equiposError) {
            equiposError.classList.toggle('hidden', equiposValidos);
        }

        if (submitBtn) {
            submitBtn.disabled = !(nivelesValidos && equiposValidos);
        }

        return nivelesValidos && equiposValidos;
    },

    async editarEntrenador(id) {
        console.log('✏️ Editando entrenador:', id);

        const entrenador = this.state.entrenadores.find(e => {
            const entrenadorId = e.id || e.ID || e._id || e.userId;
            return String(entrenadorId) === String(id);
        });

        if (!entrenador) {
            AdminAPI.showNotification('Entrenador no encontrado', 'error');
            return;
        }

        this.state.modoEdicion = true;
        this.state.entrenadorEditando = entrenador;

        this.state.nivelesSeleccionados = Array.isArray(entrenador.niveles_asignados)
            ? [...entrenador.niveles_asignados]
            : [];

        this.state.equiposSeleccionados = this.extraerEquipos(entrenador);

        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = '✏️ Editar Entrenador';

        const nombreInput = document.getElementById('nombre');
        const emailInput = document.getElementById('email');
        const telefonoInput = document.getElementById('telefono');

        if (nombreInput) nombreInput.value = entrenador.nombre || entrenador.name || '';
        if (emailInput) {
            emailInput.value = entrenador.email || entrenador.correo || '';
            emailInput.disabled = true;
        }
        if (telefonoInput) telefonoInput.value = entrenador.telefono || entrenador.phone || '';

        // Ocultar campo de contraseña en edición también
        const passwordContainer = document.getElementById('passwordContainer');
        if (passwordContainer) passwordContainer.style.display = 'none';

        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) submitBtn.textContent = '✅ Actualizar';

        this.renderizarSelectores();

        const trainerModal = document.getElementById('trainerModal');
        if (trainerModal) {
            trainerModal.classList.remove('hidden');
        }

        if (nombreInput) nombreInput.focus();
    },

    async handleSubmit(e) {
        e.preventDefault();

        const nombreInput = document.getElementById('nombre');
        const emailInput = document.getElementById('email');
        const telefonoInput = document.getElementById('telefono');

        const formData = {
            nombre: nombreInput.value.trim(),
            email: emailInput.value.trim(),
            telefono: telefonoInput?.value.trim() || '',
            niveles_asignados: this.state.nivelesSeleccionados,
            grupos_competitivos: this.state.equiposSeleccionados
        };

        console.log('📤 Enviando datos (CREACIÓN SIN CONTRASEÑA):', formData);

        if (!formData.nombre || !formData.email) {
            AdminAPI.showNotification('Completa todos los campos obligatorios', 'error');
            return;
        }

        if (!this.validarSelectores()) {
            AdminAPI.showNotification('Debes seleccionar al menos un nivel y un equipo', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            AdminAPI.showNotification('Ingresa un email válido', 'error');
            return;
        }

        try {
            this.setLoading(true);

            if (this.state.modoEdicion && this.state.entrenadorEditando) {
                const entrenadorId = this.state.entrenadorEditando.id || this.state.entrenadorEditando.ID ||
                    this.state.entrenadorEditando._id || this.state.entrenadorEditando.userId;

                if (!entrenadorId) {
                    throw new Error('ID del entrenador no encontrado');
                }

                console.log('🔄 Actualizando entrenador:', entrenadorId);
                await AdminAPI.updateEntrenador(entrenadorId, formData);

                AdminAPI.showNotification('✅ Entrenador actualizado exitosamente', 'success');

            } else {
                console.log('➕ Creando nuevo entrenador (PENDIENTE DE REGISTRO)');
                await AdminAPI.createEntrenador(formData);

                AdminAPI.showNotification('✅ Entrenador creado exitosamente. Se enviará un correo para completar el registro.', 'success');
            }

            this.cerrarModal();
            await this.loadEntrenadores();

        } catch (error) {
            console.error('❌ Error guardando:', error);
            AdminAPI.showNotification('❌ Error al guardar entrenador: ' + error.message, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    cerrarModal() {
        const trainerModal = document.getElementById('trainerModal');
        if (trainerModal) trainerModal.classList.add('hidden');

        const trainerForm = document.getElementById('trainerForm');
        if (trainerForm) trainerForm.reset();

        // Mostrar campo de contraseña nuevamente
        const passwordContainer = document.getElementById('passwordContainer');
        if (passwordContainer) passwordContainer.style.display = 'block';

        this.state.nivelesSeleccionados = [];
        this.state.equiposSeleccionados = [];
        this.state.entrenadorEditando = null;
    },
    mostrarConfirmacionEliminar(id, nombre) {
        // Guardar referencia
        this.state.entrenadorAEliminar = {
            id: id,
            nombre: nombre
        };

        const confirmMessage = document.getElementById('confirmMessage');
        if (confirmMessage) {
            // Mensaje más detallado y con advertencia
            confirmMessage.innerHTML = `
            <div class="space-y-3">
                <div class="flex items-start gap-3">
                    <span class="material-symbols-outlined text-yellow-600 mt-0.5">warning</span>
                    <div>
                        <p class="font-semibold text-gray-900 dark:text-white">⚠️ ¿ELIMINAR ENTRENADOR?</p>
                        <p class="text-gray-600 dark:text-gray-300 mt-1">¿Estás seguro de eliminar al entrenador <strong>"${this.escapeHTML(nombre)}"</strong>?</p>
                    </div>
                </div>
                
                <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 rounded">
                    <div class="flex items-start gap-2">
                        <span class="material-symbols-outlined text-red-600 text-sm">info</span>
                        <div class="text-sm text-red-700 dark:text-red-300">
                            <p class="font-medium">ADVERTENCIA:</p>
                            <ul class="list-disc ml-4 mt-1 space-y-1">
                                <li>Esta acción <strong>NO</strong> se puede deshacer</li>
                                <li>Las evaluaciones asociadas se conservarán sin entrenador asignado</li>
                                <li>Si el entrenador tiene historial, considera <em>"Desactivar"</em> en lugar de <em>"Eliminar"</em></li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <p class="text-sm text-gray-500 dark:text-gray-400 italic">
                    Escribe "ELIMINAR" en el campo de abajo para confirmar:
                </p>
                
                <input type="text" 
                       id="confirmDeleteInput" 
                       placeholder="Escribe ELIMINAR aquí" 
                       class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                       onkeyup="window.EntrenadoresManager.validarConfirmacionEliminar()">
                
                <div id="confirmDeleteError" class="text-sm text-red-600 dark:text-red-400 hidden">
                    ❌ Debes escribir exactamente "ELIMINAR" para continuar
                </div>
            </div>
        `;
        }

        const confirmModal = document.getElementById('confirmModal');
        if (confirmModal) {
            confirmModal.classList.remove('hidden');

            // Resetear input
            const input = document.getElementById('confirmDeleteInput');
            if (input) {
                input.value = '';
                input.focus();
            }

            // Resetear error
            const errorDiv = document.getElementById('confirmDeleteError');
            if (errorDiv) {
                errorDiv.classList.add('hidden');
            }

            // Deshabilitar botón de confirmación inicialmente
            const confirmBtn = document.getElementById('confirmDeleteBtn');
            if (confirmBtn) {
                confirmBtn.disabled = true;
            }
        }
    },

    validarConfirmacionEliminar() {
        const input = document.getElementById('confirmDeleteInput');
        const errorDiv = document.getElementById('confirmDeleteError');
        const confirmBtn = document.getElementById('confirmDeleteBtn');

        if (!input || !errorDiv || !confirmBtn) return;

        const textoIngresado = input.value.trim();
        const esValido = textoIngresado === 'ELIMINAR';

        if (esValido) {
            errorDiv.classList.add('hidden');
            input.classList.remove('border-red-500');
            input.classList.add('border-green-500');
            confirmBtn.disabled = false;
        } else {
            errorDiv.classList.remove('hidden');
            input.classList.add('border-red-500');
            input.classList.remove('border-green-500');
            confirmBtn.disabled = true;
        }
    },
    cerrarConfirmacion() {
        const confirmModal = document.getElementById('confirmModal');
        if (confirmModal) confirmModal.classList.add('hidden');
        this.state.entrenadorAEliminar = null;
    },

    async ejecutarAccionConfirmada() {
        if (!this.state.entrenadorAEliminar) return;

        // Verificar confirmación final
        const confirmacionFinal = confirm(
            `⚠️ **ÚLTIMA CONFIRMACIÓN**\n\n` +
            `Vas a eliminar permanentemente al entrenador:\n\n` +
            `👤 ${this.state.entrenadorAEliminar.nombre}\n\n` +
            `¿Estás ABSOLUTAMENTE seguro?\n\n` +
            `Esta acción NO se puede deshacer.`
        );

        if (!confirmacionFinal) {
            console.log('❌ Eliminación cancelada en última confirmación');
            this.cerrarConfirmacion();
            return;
        }

        try {
            this.setLoading(true);

            console.log(`🗑️ Enviando solicitud de eliminación para entrenador:`,
                this.state.entrenadorAEliminar);

            const resultado = await AdminAPI.deleteEntrenador(this.state.entrenadorAEliminar.id);

            if (resultado && resultado.success) {
                console.log('✅ Eliminación exitosa:', resultado);

                // Mostrar detalles si existen
                if (resultado.detalles && resultado.detalles.evaluaciones_actualizadas > 0) {
                    AdminAPI.showNotification(
                        `✅ Entrenador eliminado exitosamente. ${resultado.detalles.evaluaciones_actualizadas} evaluaciones actualizadas.`,
                        'success'
                    );
                } else {
                    AdminAPI.showNotification('✅ Entrenador eliminado exitosamente', 'success');
                }

                this.cerrarConfirmacion();
                await this.loadEntrenadores();

            } else {
                throw new Error(resultado?.error || 'Error desconocido al eliminar');
            }

        } catch (error) {
            console.error('❌ Error eliminando entrenador:', error);

            // Manejar errores específicos
            let mensajeError = error.message;

            if (error.message.includes('Foreign Key') ||
                error.message.includes('FK') ||
                error.message.includes('constraint')) {

                mensajeError = `
                ❌ **NO SE PUEDE ELIMINAR**\n\n
                El entrenador tiene registros asociados en el sistema.\n\n
                🔧 **SOLUCIONES DISPONIBLES:**\n
                1. Usa "Desactivar" en lugar de "Eliminar"\n
                2. Contacta al administrador para eliminar manualmente\n
                3. Espera 24h y reintenta
            `;

                // Mostrar alerta más detallada
                alert(mensajeError);

            } else if (error.message.includes('Conflict') || error.message.includes('409')) {
                AdminAPI.showNotification('❌ No se puede eliminar porque hay registros asociados. Usa "Desactivar" en su lugar.', 'error');
            } else {
                AdminAPI.showNotification(`❌ ${error.message}`, 'error');
            }

            // Cerrar modal de confirmación
            this.cerrarConfirmacion();

        } finally {
            this.setLoading(false);
        }
    },

    async toggleEstadoEntrenador(id, nombre) {
        // Mostrar confirmación más clara
        const nuevoEstadoConfirmacion = confirm(
            `🔄 **CAMBIAR ESTADO DEL ENTRENADOR**\n\n` +
            `Entrenador: ${nombre}\n\n` +
            `Esta acción es REVERSIBLE y NO elimina datos.\n\n` +
            `¿Continuar con el cambio de estado?`
        );

        if (!nuevoEstadoConfirmacion) {
            console.log('❌ Cambio de estado cancelado');
            return;
        }

        try {
            this.setLoading(true);

            console.log(`🔄 Cambiando estado del entrenador ${id} (${nombre})...`);

            const resultado = await AdminAPI.toggleEntrenadorStatus(id);

            if (resultado && resultado.success) {
                const nuevoEstado = resultado.entrenador?.activo ? 'ACTIVO' : 'INACTIVO';

                AdminAPI.showNotification(
                    `✅ Estado cambiado a: ${nuevoEstado}`,
                    'success'
                );

                await this.loadEntrenadores();

            } else {
                throw new Error('Error al cambiar estado');
            }

        } catch (error) {
            console.error('❌ Error cambiando estado:', error);
            AdminAPI.showNotification(`❌ ${error.message}`, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    async enviarRecordatorio(id, email) {
        console.log('📧 Enviando recordatorio a:', email);

        if (confirm(`¿Enviar recordatorio de registro a ${email}?`)) {
            try {
                this.setLoading(true);

                // Aquí deberías llamar a un endpoint del backend para reenviar el código
                // Por ahora solo mostramos una notificación
                await new Promise(resolve => setTimeout(resolve, 1000));
                AdminAPI.showNotification(`📧 Recordatorio enviado a ${email} exitosamente`, 'success');

            } catch (error) {
                console.error('❌ Error enviando recordatorio:', error);
                AdminAPI.showNotification('❌ Error al enviar recordatorio', 'error');
            } finally {
                this.setLoading(false);
            }
        }
    },

    cambiarPagina(direction) {
        const totalPages = Math.ceil(this.state.entrenadoresFiltrados.length / this.state.itemsPerPage);
        const newPage = this.state.currentPage + direction;

        if (newPage < 1 || newPage > totalPages) return;

        this.state.currentPage = newPage;
        this.renderizarTabla();
        this.actualizarPaginacion();
    },

    actualizarPaginacion() {
        const totalPages = Math.ceil(this.state.entrenadoresFiltrados.length / this.state.itemsPerPage);
        const startIndex = (this.state.currentPage - 1) * this.state.itemsPerPage + 1;
        const endIndex = Math.min(this.state.currentPage * this.state.itemsPerPage, this.state.entrenadoresFiltrados.length);

        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const showingText = document.getElementById('showingText');

        if (prevBtn) prevBtn.disabled = this.state.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.state.currentPage === totalPages || totalPages === 0;
        if (showingText) showingText.textContent = `Mostrando ${startIndex}-${endIndex} de ${this.state.entrenadoresFiltrados.length} entrenadores`;
    },

    async updateServerStatus() {
        try {
            const isOnline = await AdminAPI.checkServerStatus();

            const serverStatus = document.getElementById('serverStatus');
            if (serverStatus) {
                serverStatus.textContent = isOnline ? 'ONLINE' : 'OFFLINE';
            }

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

    getColorPorNombre(nombre) {
        if (!nombre) return '#6B7280';

        const colores = [
            '#E21B23', '#10B981', '#3B82F6',
            '#8B5CF6', '#F59E0B', '#EC4899',
            '#06B6D4', '#84CC16', '#F97316'
        ];

        const suma = nombre.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colores[suma % colores.length];
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
    if (confirm('¿Estás seguro de cerrar sesión?')) {
        AdminAPI.logout();
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM cargado, inicializando entrenadores...');
    EntrenadoresManager.init();
});

// Hacer funciones disponibles globalmente
window.EntrenadoresManager = EntrenadoresManager;
window.toggleTheme = toggleTheme;
window.logout = logout;

console.log('✅ Script de entrenadores CORREGIDO (SIN CONTRASEÑA) cargado correctamente');