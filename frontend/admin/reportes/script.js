// Aplicación principal de reportes con filtros completos
const ReportesApp = {
    // Estado de la aplicación
    state: {
        deportistas: [],
        deportistasFiltrados: [],
        deportistasConDocumentos: [],
        loading: false,
        gruposCompetitivos: [],
        filtrosExcel: {
            apellidos: '',
            nombres: '',
            tipoDocumento: '',
            numeroDocumento: '',
            email: '',
            fechaNacimiento: '',
            ciudad: '',
            direccion: '',
            telefono: '',
            eps: '',
            tallaCamiseta: '',
            acudiente: '',
            nivel: '',
            grupo: '',
            estado: '',
            pesoMin: '',
            pesoMax: '',
            alturaMin: '',
            alturaMax: '',
            edadMin: '',
            edadMax: ''
        },
        filtrosPDF: {
            nombre: '',
            email: '',
            nivel: '',
            grupo: ''
        }
    },

    // Inicialización
    init() {
        console.log('🚀 Inicializando aplicación de reportes...');

        // Verificar autenticación
        if (!this.checkAuth()) {
            return;
        }

        // Cargar datos del usuario
        this.cargarUsuario();

        // Configurar eventos
        this.configurarEventos();

        // Cargar datos iniciales
        this.cargarDatosIniciales();
    },

    // Verificar autenticación
    checkAuth() {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            this.showNotification('Sesión expirada. Redirigiendo al login...', 'warning');
            setTimeout(() => {
                window.location.href = '../auth/login.html';
            }, 1500);
            return false;
        }

        // Verificar rol de usuario
        try {
            const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            if (user) {
                const userRole = user.role || user.tipo || user.rol;
                if (userRole !== 'admin') {
                    this.showNotification('Acceso restringido a administradores', 'error');
                    setTimeout(() => this.logout(), 2000);
                    return false;
                }
            }
        } catch (error) {
            console.error('Error verificando usuario:', error);
        }

        return true;
    },

    // Cargar datos del usuario
    cargarUsuario() {
        try {
            const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            if (user && user.email) {
                const userEmailElement = document.getElementById('userEmail');
                if (userEmailElement) {
                    userEmailElement.textContent = user.email;
                }
            }
        } catch (error) {
            console.error('Error cargando usuario:', error);
        }
    },

    // Configurar eventos
    configurarEventos() {
        // Eventos para filtros Excel
        const filtrosExcelIds = [
            'filtroApellidos', 'filtroNombres', 'filtroTipoDocumento', 'filtroNumeroDocumento',
            'filtroEmail', 'filtroFechaNacimiento', 'filtroCiudad', 'filtroDireccion',
            'filtroTelefono', 'filtroEPS', 'filtroTallaCamiseta', 'filtroAcudiente',
            'filtroNivel', 'filtroGrupo', 'filtroEstado', 'filtroPesoMin', 'filtroPesoMax',
            'filtroAlturaMin', 'filtroAlturaMax', 'filtroEdadMin', 'filtroEdadMax'
        ];

        filtrosExcelIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (e) => {
                    const fieldName = id.replace('filtro', '').replace(/([A-Z])/g, '_$1').toLowerCase().substring(1);
                    this.state.filtrosExcel[fieldName] = e.target.value;
                });

                element.addEventListener('change', (e) => {
                    const fieldName = id.replace('filtro', '').replace(/([A-Z])/g, '_$1').toLowerCase().substring(1);
                    this.state.filtrosExcel[fieldName] = e.target.value;
                });
            }
        });

        // Eventos para filtros PDF
        const filtrosPDFIds = ['filtroPDFNombre', 'filtroPDFEmail', 'filtroPDFNivel', 'filtroPDFGrupo'];
        filtrosPDFIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (e) => {
                    const fieldName = id.replace('filtroPDF', '').toLowerCase();
                    this.state.filtrosPDF[fieldName] = e.target.value;
                });

                element.addEventListener('change', (e) => {
                    const fieldName = id.replace('filtroPDF', '').toLowerCase();
                    this.state.filtrosPDF[fieldName] = e.target.value;
                });
            }
        });

        // Botones de acción
        document.getElementById('aplicarFiltrosExcel').addEventListener('click', () => {
            this.aplicarFiltrosExcel();
        });

        document.getElementById('limpiarFiltrosExcel').addEventListener('click', () => {
            this.limpiarFiltrosExcel();
        });

        document.getElementById('aplicarFiltrosPDF').addEventListener('click', () => {
            this.aplicarFiltrosPDF();
        });

        document.getElementById('limpiarFiltrosPDF').addEventListener('click', () => {
            this.limpiarFiltrosPDF();
        });

        // Botón de descarga Excel
        document.getElementById('descargarExcelBtn').addEventListener('click', () => {
            this.descargarExcel();
        });
    },

    // Cargar datos iniciales
    async cargarDatosIniciales() {
        try {
            this.setLoading(true);

            // Cargar deportistas
            await this.cargarDeportistas();

            // Cargar grupos competitivos
            await this.cargarGruposCompetitivos();

            // Aplicar filtros iniciales
            this.aplicarFiltrosExcel();

        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
            this.showNotification('Error al cargar datos iniciales', 'error');
        } finally {
            this.setLoading(false);
        }
    },

    // Cargar deportistas
    async cargarDeportistas() {
        try {
            console.log('📥 Cargando deportistas...');

            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/admin/deportistas', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.state.deportistas = data.deportistas || data || [];

            console.log(`✅ ${this.state.deportistas.length} deportistas cargados`);

        } catch (error) {
            console.error('❌ Error cargando deportistas:', error);
            this.showNotification('Error al cargar deportistas', 'error');
            this.state.deportistas = [];
        }
    },

    // Cargar grupos competitivos
    async cargarGruposCompetitivos() {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/admin/deportistas', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const todosDeportistas = data.deportistas || data || [];

            // Extraer grupos únicos
            const gruposSet = new Set();
            todosDeportistas.forEach(d => {
                if (d.grupo_competitivo) {
                    gruposSet.add(d.grupo_competitivo);
                }
                if (Array.isArray(d.grupos_competitivos)) {
                    d.grupos_competitivos.forEach(g => gruposSet.add(g));
                }
            });

            this.state.gruposCompetitivos = [...gruposSet].sort();

            // Actualizar selects de grupos
            this.actualizarSelectsGrupos();

            console.log(`✅ ${this.state.gruposCompetitivos.length} grupos cargados`);

        } catch (error) {
            console.error('❌ Error cargando grupos:', error);
            this.state.gruposCompetitivos = [];
        }
    },

    // Actualizar selects de grupos
    actualizarSelectsGrupos() {
        const selects = ['filtroGrupo', 'filtroPDFGrupo'];

        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                // Guardar valor seleccionado actual
                const valorActual = select.value;

                // Limpiar opciones (excepto la primera)
                while (select.options.length > 1) {
                    select.remove(1);
                }

                // Agregar opciones de grupos
                this.state.gruposCompetitivos.forEach(grupo => {
                    const option = document.createElement('option');
                    option.value = grupo;
                    option.textContent = grupo;
                    select.appendChild(option);
                });

                // Restaurar valor seleccionado si existe
                if (valorActual && this.state.gruposCompetitivos.includes(valorActual)) {
                    select.value = valorActual;
                }
            }
        });
    },

    // Aplicar filtros Excel
    aplicarFiltrosExcel() {
        console.log('🔍 Aplicando filtros Excel...');

        this.state.deportistasFiltrados = this.state.deportistas.filter(deportista => {
            const user = deportista.user || {};
            const datos = deportista;

            // Helper para comparar strings (case insensitive, partial match)
            const matchesString = (value, filter) => {
                if (!filter) return true;
                if (!value) return false;
                return value.toString().toLowerCase().includes(filter.toLowerCase());
            };

            // Helper para comparar números en rangos
            const matchesRange = (value, min, max) => {
                if (!value) return false;
                const numValue = parseFloat(value);
                if (isNaN(numValue)) return false;

                if (min && numValue < parseFloat(min)) return false;
                if (max && numValue > parseFloat(max)) return false;
                return true;
            };

            // Helper para calcular edad
            const calcularEdad = (fechaNacimiento) => {
                if (!fechaNacimiento) return null;
                const hoy = new Date();
                const nacimiento = new Date(fechaNacimiento);
                let edad = hoy.getFullYear() - nacimiento.getFullYear();
                const mes = hoy.getMonth() - nacimiento.getMonth();
                if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
                    edad--;
                }
                return edad;
            };

            // 1. Datos personales básicos
            if (!matchesString(user.nombre || '', this.state.filtrosExcel.nombres)) return false;
            if (!matchesString(user.apellidos || '', this.state.filtrosExcel.apellidos)) return false;
            if (!matchesString(user.email || '', this.state.filtrosExcel.email)) return false;

            // 2. Documento de identidad
            if (this.state.filtrosExcel.tipoDocumento &&
                user.tipo_documento !== this.state.filtrosExcel.tipoDocumento) return false;

            if (this.state.filtrosExcel.numeroDocumento &&
                !matchesString(user.numero_documento || '', this.state.filtrosExcel.numeroDocumento)) return false;

            // 3. Fecha de nacimiento
            if (this.state.filtrosExcel.fechaNacimiento) {
                const fechaNac = new Date(datos.fecha_nacimiento || user.fecha_nacimiento);
                const filtroFecha = new Date(this.state.filtrosExcel.fechaNacimiento);

                if (fechaNac.toDateString() !== filtroFecha.toDateString()) return false;
            }

            // 4. Datos de ubicación y contacto
            if (!matchesString(user.ciudad || datos.ciudad || '', this.state.filtrosExcel.ciudad)) return false;
            if (!matchesString(user.direccion || datos.direccion || '', this.state.filtrosExcel.direccion)) return false;
            if (!matchesString(user.telefono || datos.telefono || '', this.state.filtrosExcel.telefono)) return false;

            // 5. Datos médicos y adicionales
            if (!matchesString(datos.eps || user.eps || '', this.state.filtrosExcel.eps)) return false;
            if (!matchesString(datos.talla_camiseta || user.talla_camiseta || '', this.state.filtrosExcel.talla_camiseta)) return false;
            if (!matchesString(datos.acudiente_nombre || user.acudiente_nombre || '', this.state.filtrosExcel.acudiente)) return false;

            // 6. Datos deportivos
            if (this.state.filtrosExcel.nivel && datos.nivel_actual !== this.state.filtrosExcel.nivel) return false;
            if (this.state.filtrosExcel.grupo && datos.grupo_competitivo !== this.state.filtrosExcel.grupo) return false;
            if (this.state.filtrosExcel.estado && datos.estado !== this.state.filtrosExcel.estado) return false;

            // 7. Mediciones físicas
            if (!matchesRange(datos.peso, this.state.filtrosExcel.pesoMin, this.state.filtrosExcel.pesoMax)) return false;
            if (!matchesRange(datos.altura, this.state.filtrosExcel.alturaMin, this.state.filtrosExcel.alturaMax)) return false;

            // 8. Edad (calculada)
            if (this.state.filtrosExcel.edadMin || this.state.filtrosExcel.edadMax) {
                const edad = calcularEdad(datos.fecha_nacimiento || user.fecha_nacimiento);
                if (!matchesRange(edad, this.state.filtrosExcel.edadMin, this.state.filtrosExcel.edadMax)) return false;
            }

            return true;
        });

        console.log(`✅ ${this.state.deportistasFiltrados.length} deportistas filtrados para Excel`);
        this.actualizarContadorExcel();
    },

    // Aplicar filtros PDF
    aplicarFiltrosPDF() {
        console.log('🔍 Aplicando filtros PDF...');

        // Filtrar solo deportistas con documentos
        this.state.deportistasConDocumentos = this.state.deportistas.filter(deportista => {
            const user = deportista.user || {};
            const datos = deportista;

            // Solo deportistas con documento de identidad
            if (!datos.documento_identidad && !user.documento_identidad) return false;

            // Aplicar filtros
            if (this.state.filtrosPDF.nombre) {
                const nombreCompleto = `${user.nombre || ''} ${user.apellidos || ''}`.toLowerCase();
                if (!nombreCompleto.includes(this.state.filtrosPDF.nombre.toLowerCase())) {
                    return false;
                }
            }

            if (this.state.filtrosPDF.email && user.email) {
                if (!user.email.toLowerCase().includes(this.state.filtrosPDF.email.toLowerCase())) {
                    return false;
                }
            }

            if (this.state.filtrosPDF.nivel && datos.nivel_actual !== this.state.filtrosPDF.nivel) {
                return false;
            }

            if (this.state.filtrosPDF.grupo && datos.grupo_competitivo !== this.state.filtrosPDF.grupo) {
                return false;
            }

            return true;
        });

        console.log(`✅ ${this.state.deportistasConDocumentos.length} deportistas con documentos filtrados`);
        this.renderizarTablaDocumentos();
    },

    // Actualizar contador Excel
    actualizarContadorExcel() {
        const contadorElement = document.getElementById('contadorExcel');
        if (contadorElement) {
            contadorElement.textContent = this.state.deportistasFiltrados.length;
        }

        // Habilitar/deshabilitar botón de descarga
        const descargarBtn = document.getElementById('descargarExcelBtn');
        if (descargarBtn) {
            descargarBtn.disabled = this.state.deportistasFiltrados.length === 0;
        }
    },

    // Renderizar tabla de documentos
    renderizarTablaDocumentos() {
        const tbody = document.getElementById('tablaDocumentos');
        const mensajeVacio = document.getElementById('mensajeSinDocumentos');

        if (!tbody) return;

        if (this.state.deportistasConDocumentos.length === 0) {
            tbody.innerHTML = '';
            if (mensajeVacio) mensajeVacio.classList.remove('hidden');
            return;
        }

        if (mensajeVacio) mensajeVacio.classList.add('hidden');

        tbody.innerHTML = this.state.deportistasConDocumentos.map(deportista => {
            const user = deportista.user || {};
            const datos = deportista;
            const nombreCompleto = `${user.nombre || ''} ${user.apellidos || ''}`.trim();
            const iniciales = this.obtenerIniciales(nombreCompleto);

            return `
                <tr class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    <td class="px-8 py-6">
                        <div class="deportista-info">
                            <div class="avatar">${iniciales}</div>
                            <div class="detalles-deportista">
                                <p class="font-bold text-secondary dark:text-gray-200">${nombreCompleto || 'Sin nombre'}</p>
                                <p class="text-[10px] text-gray-400">${user.email || 'Sin email'}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-6">
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                            ${user.tipo_documento || 'CC'} ${user.numero_documento || ''}
                        </div>
                    </td>
                    <td class="px-6 py-6">
                        <div class="badge-nivel">${this.getNivelNombre(datos.nivel_actual)}</div>
                        <div class="badge-grupo mt-1">${datos.grupo_competitivo || 'Sin grupo'}</div>
                    </td>
                    <td class="px-6 py-6 text-right">
                        <button onclick="ReportesApp.descargarDocumentoPDF('${deportista.id}', '${nombreCompleto.replace(/'/g, "\\'")}')"
                                class="btn-accion">
                            <span class="material-symbols-outlined text-sm">picture_as_pdf</span> 
                            DESCARGAR IDENTIDAD
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    // Limpiar filtros Excel
    limpiarFiltrosExcel() {
        console.log('🧹 Limpiando filtros Excel...');

        // Resetear estado
        this.state.filtrosExcel = {
            apellidos: '',
            nombres: '',
            tipoDocumento: '',
            numeroDocumento: '',
            email: '',
            fechaNacimiento: '',
            ciudad: '',
            direccion: '',
            telefono: '',
            eps: '',
            tallaCamiseta: '',
            acudiente: '',
            nivel: '',
            grupo: '',
            estado: '',
            pesoMin: '',
            pesoMax: '',
            alturaMin: '',
            alturaMax: '',
            edadMin: '',
            edadMax: ''
        };

        // Resetear inputs
        const inputs = [
            'filtroApellidos', 'filtroNombres', 'filtroNumeroDocumento', 'filtroEmail',
            'filtroCiudad', 'filtroDireccion', 'filtroTelefono', 'filtroEPS',
            'filtroAcudiente', 'filtroPesoMin', 'filtroPesoMax', 'filtroAlturaMin',
            'filtroAlturaMax', 'filtroEdadMin', 'filtroEdadMax'
        ];

        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });

        const selects = ['filtroTipoDocumento', 'filtroTallaCamiseta', 'filtroNivel', 'filtroGrupo', 'filtroEstado'];
        selects.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });

        // Resetear input de fecha
        const fechaInput = document.getElementById('filtroFechaNacimiento');
        if (fechaInput) fechaInput.value = '';

        // Aplicar filtros vacíos
        this.aplicarFiltrosExcel();

        this.showNotification('✅ Filtros Excel limpiados', 'success');
    },

    // Limpiar filtros PDF
    limpiarFiltrosPDF() {
        console.log('🧹 Limpiando filtros PDF...');

        // Resetear estado
        this.state.filtrosPDF = {
            nombre: '',
            email: '',
            nivel: '',
            grupo: ''
        };

        // Resetear inputs
        document.getElementById('filtroPDFNombre').value = '';
        document.getElementById('filtroPDFEmail').value = '';
        document.getElementById('filtroPDFNivel').value = '';
        document.getElementById('filtroPDFGrupo').value = '';

        // Aplicar filtros vacíos
        this.aplicarFiltrosPDF();

        this.showNotification('✅ Filtros PDF limpiados', 'success');
    },

    // Descargar Excel
    async descargarExcel() {
        if (this.state.deportistasFiltrados.length === 0) {
            this.showNotification('No hay deportistas para descargar', 'warning');
            return;
        }

        try {
            this.setLoading(true);

            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const params = new URLSearchParams();

            // Agregar todos los filtros a los parámetros
            Object.entries(this.state.filtrosExcel).forEach(([key, value]) => {
                if (value && value !== '') {
                    params.append(key, value);
                }
            });

            const queryString = params.toString();
            const url = `http://localhost:5000/api/reportes/excel/grupal${queryString ? '?' + queryString : ''}`;

            console.log('📗 Descargando Excel con filtros:', this.state.filtrosExcel);

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Error en la descarga');
            }

            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);

            // Nombre del archivo
            const timestamp = new Date().toISOString().split('T')[0];
            const nombreArchivo = `reporte_deportistas_${timestamp}.xlsx`;

            link.download = nombreArchivo;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(link.href);

            this.showNotification('✅ Excel descargado correctamente', 'success');

        } catch (error) {
            console.error('❌ Error descargando Excel:', error);
            this.showNotification('❌ Error al descargar el reporte Excel', 'error');
        } finally {
            this.setLoading(false);
        }
    },

    // Descargar documento PDF individual
    async descargarDocumentoPDF(deportistaId, nombre) {
        try {
            this.setLoading(true);

            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const url = `http://localhost:5000/api/reportes/documento/${deportistaId}`;

            console.log(`📄 Descargando documento para deportista ${deportistaId}`);

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al descargar documento');
            }

            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);

            const nombreLimpio = nombre.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            link.download = `documento_${nombreLimpio}.pdf`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(link.href);

            this.showNotification('✅ Documento descargado correctamente', 'success');

        } catch (error) {
            console.error('❌ Error descargando documento:', error);
            this.showNotification(`❌ Error: ${error.message}`, 'error');
        } finally {
            this.setLoading(false);
        }
    },

    // Helper: Obtener iniciales
    obtenerIniciales(nombreCompleto) {
        if (!nombreCompleto) return '?';
        return nombreCompleto
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .substring(0, 2);
    },

    // Helper: Obtener nombre del nivel
    getNivelNombre(nivel) {
        const nombres = {
            'pendiente': 'Pendiente',
            '1_basico': '1 Básico',
            '1_medio': '1 Medio',
            '1_avanzado': '1 Avanzado',
            '2': 'Nivel 2',
            '3': 'Nivel 3',
            '4': 'Nivel 4'
        };
        return nombres[nivel] || nivel;
    },

    // Set loading state
    setLoading(loading) {
        this.state.loading = loading;
        const loadingElement = document.getElementById('loadingIndicator');
        if (loadingElement) {
            if (loading) {
                loadingElement.classList.remove('hidden');
            } else {
                loadingElement.classList.add('hidden');
            }
        }
    },

    // Mostrar notificación
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
    },

    logout() {
        localStorage.clear();
        sessionStorage.clear();
        this.showNotification('Sesión cerrada exitosamente', 'info');
        setTimeout(() => {
            window.location.href = '../../auth/login-admin.html';
        }, 1500);
    },
};

// ==========================================
// FUNCIONES GLOBALES PARA EL HTML
// ==========================================

function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        ReportesApp.logout();
    }
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    ReportesApp.init();
});