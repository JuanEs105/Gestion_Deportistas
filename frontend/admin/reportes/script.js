// ==========================================
// REPORTES APP - VERSIÓN COMPLETA Y DEFINITIVA
// ==========================================

// Solo definir ReportesApp si no existe
if (typeof window.ReportesApp === 'undefined') {
    window.ReportesApp = {
        // Estado de la aplicación
        state: {
            deportistas: [],
            deportistasFiltrados: [],
            documentosFiltrados: [],
            loading: false,
            opcionesFiltros: {
                niveles: [],
                equipos: [],
                estados: [],
                eps: []
            },
            
            // Filtros actuales
            filtros: {
                // Datos Personales
                nombreCompleto: '',
                tipoDocumento: '',
                numeroDocumento: '',
                ciudad: '',
                direccion: '',
                telefono: '',
                email: '',
                fechaNacimiento: '',
                eps: '',
                acudiente: '',
                estado: '',
                nivel: '',
                
                // Datos Médicos
                tallaCamiseta: '',
                pesoMin: '',
                pesoMax: '',
                alturaMin: '',
                alturaMax: '',
                edadMin: '',
                edadMax: '',
                
                // Datos Deportivos
                equipoCompetitivo: '',
                
                // Documentos
                tieneDocumento: 'todos'
            },
            
            // Estadísticas
            estadisticas: {
                totalDeportistas: 0,
                conDocumento: 0,
                sinDocumento: 0,
                cloudinaryDocs: 0,
                otrosDocs: 0,
                porcentajeCompletos: 0
            }
        },

        // ==========================================
        // MÉTODOS DE INICIALIZACIÓN
        // ==========================================
        async init() {
            console.log('🚀 Inicializando ReportesApp...');
            
            // Verificar autenticación
            if (!this.checkAuth()) {
                return;
            }
            
            // Cargar estadísticas
            await this.cargarEstadisticas();
            
            // Cargar opciones de filtros
            await this.cargarOpcionesFiltros();
            
            // Cargar deportistas iniciales
            await this.cargarDeportistas();
            
            // Configurar eventos
            this.configurarEventos();
            
            // Actualizar información de usuario
            this.updateUserInfo();
            
            console.log('✅ ReportesApp inicializado correctamente');
        },

        // Verificar autenticación
        checkAuth() {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            
            if (!token) {
                console.warn('⚠️ No hay token de autenticación');
                this.showNotification('Sesión expirada. Redirigiendo al login...', 'warning');
                setTimeout(() => {
                    window.location.href = '../auth/login-admin.html';
                }, 1500);
                return false;
            }
            
            return true;
        },

        // ==========================================
        // MÉTODO PRINCIPAL: DESCARGAR EXCEL COMPLETO
        // ==========================================
        async descargarExcelCompleto() {
            try {
                console.log('📊 PREPARANDO DESCARGAR EXCEL COMPLETO...');
                
                // 1. OBTENER TODOS LOS FILTROS DEL FORMULARIO
                const filtros = this.obtenerTodosLosFiltrosDelFormulario();
                console.log('🔍 Filtros obtenidos del formulario:', filtros);
                
                // 2. VALIDAR FILTROS
                const errores = this.validarFiltros(filtros);
                if (errores.length > 0) {
                    this.showNotification(`❌ Errores en filtros:\n${errores.join('\n')}`, 'error');
                    return;
                }
                
                // 3. MOSTRAR LOADING
                this.mostrarLoading(true);
                
                // 4. CONSTRUIR PARÁMETROS DE LA URL
                const params = new URLSearchParams();
                
                // Agregar TODOS los filtros al query string
                Object.keys(filtros).forEach(key => {
                    const value = filtros[key];
                    if (value && value !== '' && value !== 'todos') {
                        params.append(key, value);
                    }
                });
                
                // 5. OBTENER TOKEN DE AUTENTICACIÓN
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                if (!token) {
                    throw new Error('No hay sesión activa');
                }
                
                // 6. CONSTRUIR URL COMPLETA
                const baseURL = 'https://gestiondeportistas-production.up.railway.app/api/reportes/excel/grupal';
                const queryString = params.toString();
                const url = queryString ? `${baseURL}?${queryString}` : baseURL;
                
                console.log('🌐 URL generada para descargar Excel:', url);
                
                // 7. CREAR ELEMENTO DE ENLACE TEMPORAL
                const link = document.createElement('a');
                link.style.display = 'none';
                
                // 8. AGREGAR HEADERS DE AUTENTICACIÓN
                const options = {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    }
                };
                
                // 9. HACER LA PETICIÓN FETCH
                const response = await fetch(url, options);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
                
                // 10. OBTENER EL BLOB (archivo Excel)
                const blob = await response.blob();
                
                // 11. CREAR URL TEMPORAL PARA EL BLOB
                const blobUrl = window.URL.createObjectURL(blob);
                
                // 12. CONFIGURAR EL ENLACE DE DESCARGA
                link.href = blobUrl;
                
                // Nombre del archivo con timestamp
                const timestamp = new Date().toISOString().split('T')[0];
                const hora = new Date().toTimeString().slice(0, 8).replace(/:/g, '-');
                link.download = `reporte_deportistas_${timestamp}_${hora}.xlsx`;
                
                // 13. AGREGAR AL DOM Y HACER CLIC
                document.body.appendChild(link);
                link.click();
                
                // 14. LIMPIAR
                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(blobUrl);
                }, 100);
                
                // 15. MOSTRAR MENSAJE DE ÉXITO
                const count = this.state.deportistasFiltrados.length || 'todos';
                this.showNotification(`✅ Excel generado exitosamente\n📊 Exportando ${count} registros`, 'success', 5000);
                
            } catch (error) {
                console.error('❌ ERROR CRÍTICO descargando Excel:', error);
                
                // Mostrar error específico
                let mensajeError = 'Error al generar Excel';
                
                if (error.message.includes('Failed to fetch')) {
                    mensajeError = '❌ No se pudo conectar con el servidor\n\nVerifica que:\n1. El backend esté corriendo en https://gestiondeportistas-production.up.railway.app\n2. El servidor esté activo\n3. No haya errores de CORS';
                } else if (error.message.includes('401') || error.message.includes('403')) {
                    mensajeError = '🔒 Sesión expirada o sin permisos\n\nPor favor, inicia sesión nuevamente';
                } else if (error.message.includes('500')) {
                    mensajeError = '⚙️ Error interno del servidor\n\nRevisa los logs del backend para más detalles';
                } else {
                    mensajeError = error.message;
                }
                
                this.showNotification(mensajeError, 'error', 8000);
                
            } finally {
                // 16. OCULTAR LOADING
                this.mostrarLoading(false);
            }
        },

        // ==========================================
        // OBTENER TODOS LOS FILTROS DEL FORMULARIO
        // ==========================================
        obtenerTodosLosFiltrosDelFormulario() {
            const filtros = {};
            
            console.log('📝 Capturando todos los filtros del formulario...');
            
            // ========== DATOS PERSONALES (Pestaña 1) ==========
            filtros.nombreCompleto = document.getElementById('filtroNombreCompleto')?.value?.trim() || '';
            filtros.tipoDocumento = document.getElementById('filtroTipoDocumento')?.value || '';
            filtros.numeroDocumento = document.getElementById('filtroNumeroDocumento')?.value?.trim() || '';
            filtros.ciudad = document.getElementById('filtroCiudad')?.value?.trim() || '';
            filtros.direccion = document.getElementById('filtroDireccion')?.value?.trim() || '';
            filtros.telefono = document.getElementById('filtroTelefono')?.value?.trim() || '';
            filtros.email = document.getElementById('filtroEmail')?.value?.trim() || '';
            filtros.fechaNacimiento = document.getElementById('filtroFechaNacimiento')?.value || '';
            filtros.eps = document.getElementById('filtroEPS')?.value?.trim() || '';
            filtros.acudiente = document.getElementById('filtroAcudiente')?.value?.trim() || '';
            
            // Estado del chip activo
            const estadoChip = document.querySelector('.filtro-chip.estado.active');
            filtros.estado = estadoChip?.dataset.estado || '';
            
            // Nivel del chip activo
            const nivelChip = document.querySelector('.filtro-chip.nivel.active');
            filtros.nivel = nivelChip?.dataset.nivel || '';
            
            // ========== DATOS MÉDICOS (Pestaña 2) ==========
            filtros.tallaCamiseta = document.getElementById('filtroTallaCamiseta')?.value || '';
            
            // Rangos numéricos
            filtros.pesoMin = document.getElementById('filtroPesoMin')?.value?.trim() || '';
            filtros.pesoMax = document.getElementById('filtroPesoMax')?.value?.trim() || '';
            filtros.alturaMin = document.getElementById('filtroAlturaMin')?.value?.trim() || '';
            filtros.alturaMax = document.getElementById('filtroAlturaMax')?.value?.trim() || '';
            filtros.edadMin = document.getElementById('filtroEdadMin')?.value?.trim() || '';
            filtros.edadMax = document.getElementById('filtroEdadMax')?.value?.trim() || '';
            
            // ========== DATOS DEPORTIVOS (Pestaña 3) ==========
            filtros.equipoCompetitivo = document.getElementById('filtroGrupoCompetitivo')?.value || '';
            
            // Nivel detallado (sobrescribe el del chip si existe)
            const nivelDetallado = document.getElementById('filtroNivelDetallado')?.value;
            if (nivelDetallado && nivelDetallado !== '') {
                filtros.nivel = nivelDetallado;
            }
            
            // Filtro de documentos
            const tieneDocumento = document.getElementById('filtroTieneDocumento')?.value;
            filtros.tieneDocumento = tieneDocumento || 'todos';
            
            // ========== FILTROS DE DOCUMENTOS (Pestaña 4) ==========
            const estadoDocumento = document.getElementById('filtroEstadoDocumento')?.value;
            if (estadoDocumento && estadoDocumento !== 'todos') {
                if (estadoDocumento === 'con_documento') {
                    filtros.tieneDocumento = 'true';
                } else if (estadoDocumento === 'sin_documento') {
                    filtros.tieneDocumento = 'false';
                } else if (estadoDocumento === 'cloudinary') {
                    filtros.tieneDocumento = 'true'; // Cloudinary implica tener documento
                    // Nota: El backend filtra por Cloudinary automáticamente
                }
            }
            
            console.log('📋 Filtros capturados:', filtros);
            return filtros;
        },

        // ==========================================
        // VALIDAR FILTROS (EVITA ERRORES EN EL BACKEND)
        // ==========================================
        validarFiltros(filtros) {
            const errores = [];
            
            // Validar rangos numéricos
            if (filtros.pesoMin && filtros.pesoMax) {
                const min = parseFloat(filtros.pesoMin);
                const max = parseFloat(filtros.pesoMax);
                if (min > max) {
                    errores.push('❌ El peso mínimo no puede ser mayor que el máximo');
                }
                if (min < 0 || max < 0) {
                    errores.push('❌ El peso no puede ser negativo');
                }
            }
            
            if (filtros.alturaMin && filtros.alturaMax) {
                const min = parseFloat(filtros.alturaMin);
                const max = parseFloat(filtros.alturaMax);
                if (min > max) {
                    errores.push('❌ La altura mínima no puede ser mayor que la máxima');
                }
                if (min < 0 || max < 0) {
                    errores.push('❌ La altura no puede ser negativa');
                }
            }
            
            if (filtros.edadMin && filtros.edadMax) {
                const min = parseInt(filtros.edadMin);
                const max = parseInt(filtros.edadMax);
                if (min > max) {
                    errores.push('❌ La edad mínima no puede ser mayor que la máxima');
                }
                if (min < 0 || max < 0) {
                    errores.push('❌ La edad no puede ser negativa');
                }
                if (max > 100) {
                    errores.push('❌ La edad máxima no puede ser mayor a 100 años');
                }
            }
            
            // Validar fecha de nacimiento
            if (filtros.fechaNacimiento) {
                const fecha = new Date(filtros.fechaNacimiento);
                const hoy = new Date();
                if (fecha > hoy) {
                    errores.push('❌ La fecha de nacimiento no puede ser futura');
                }
            }
            
            // Validar email si está presente
            if (filtros.email && filtros.email !== '') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(filtros.email)) {
                    errores.push('❌ El formato del email no es válido');
                }
            }
            
            return errores;
        },

        // ==========================================
        // MÉTODO ALTERNATIVO: DESCARGAR EXCEL SIMPLE
        // ==========================================
        async descargarExcelSimple() {
            try {
                console.log('📥 DESCARGANDO EXCEL (MÉTODO SIMPLE)...');
                
                // 1. Obtener filtros
                const filtros = this.obtenerTodosLosFiltrosDelFormulario();
                
                // 2. Construir query string
                const params = new URLSearchParams();
                
                // Agregar solo filtros no vacíos
                Object.keys(filtros).forEach(key => {
                    const value = filtros[key];
                    if (value && value !== '' && value !== 'todos') {
                        params.append(key, value);
                    }
                });
                
                // 3. Obtener token
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                
                // 4. Construir URL
                const baseURL = 'https://gestiondeportistas-production.up.railway.app/api/reportes/excel/grupal';
                const queryString = params.toString();
                const url = queryString ? `${baseURL}?${queryString}` : baseURL;
                
                console.log('🔗 URL final:', url);
                
                // 5. Usar window.open (más simple)
                window.open(url, '_blank');
                
                this.showNotification('✅ Iniciando descarga del Excel...', 'success');
                
            } catch (error) {
                console.error('❌ Error en descarga simple:', error);
                this.showNotification('❌ Error al iniciar descarga', 'error');
            }
        },

        // ==========================================
        // DESCARGAR EXCEL DE DOCUMENTOS
        // ==========================================
        async descargarExcelDocumentos() {
            try {
                console.log('📄 PREPARANDO EXCEL DE DOCUMENTOS...');
                
                // 1. Obtener filtros básicos
                const filtros = this.obtenerFiltrosBasicosParaDocumentos();
                
                // 2. Construir query string
                const params = new URLSearchParams();
                
                Object.keys(filtros).forEach(key => {
                    if (filtros[key] && filtros[key] !== '' && filtros[key] !== 'todos') {
                        params.append(key, filtros[key]);
                    }
                });
                
                // Siempre pedir documentos (true)
                params.append('tieneDocumento', 'true');
                
                // 3. Obtener token
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                
                // 4. Construir URL
                const baseURL = 'https://gestiondeportistas-production.up.railway.app/api/reportes/excel/documentos';
                const url = `${baseURL}?${params.toString()}`;
                
                console.log('🔗 URL documentos:', url);
                
                // 5. Descargar
                window.open(url, '_blank');
                
                this.showNotification('✅ Generando Excel de documentos...', 'success');
                
            } catch (error) {
                console.error('❌ Error descargando Excel de documentos:', error);
                this.showNotification('❌ Error al generar Excel de documentos', 'error');
            }
        },

        // ==========================================
        // MÉTODOS AUXILIARES
        // ==========================================
        
        obtenerFiltrosBasicosParaDocumentos() {
            return {
                nivel: this.state.filtros.nivel || '',
                estado: this.state.filtros.estado || '',
                equipoCompetitivo: this.state.filtros.equipoCompetitivo || ''
            };
        },

        // Cargar estadísticas
        async cargarEstadisticas() {
            try {
                console.log('📊 Cargando estadísticas...');
                
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
                
                const response = await fetch('https://gestiondeportistas-production.up.railway.app/api/reportes/estadisticas', {
                    headers: headers
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    this.state.estadisticas = data.estadisticas;
                    this.actualizarEstadisticasUI();
                }
                
            } catch (error) {
                console.error('❌ Error cargando estadísticas:', error);
                this.showNotification('Error cargando estadísticas', 'error');
            }
        },

        // Cargar opciones de filtros
        async cargarOpcionesFiltros() {
            try {
                console.log('🔧 Cargando opciones de filtros...');
                
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
                
                const response = await fetch('https://gestiondeportistas-production.up.railway.app/api/reportes/opciones-filtros', {
                    headers: headers
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    this.state.opcionesFiltros = {
                        niveles: data.niveles || [],
                        equipos: data.equipos_competitivos || [],
                        estados: data.estados || [],
                        eps: data.eps || []
                    };
                }
                
            } catch (error) {
                console.error('❌ Error cargando opciones de filtros:', error);
            }
        },

        // Cargar deportistas
        async cargarDeportistas() {
            try {
                console.log('📥 Cargando deportistas...');
                this.mostrarLoading(true);
                
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
                
                const response = await fetch('https://gestiondeportistas-production.up.railway.app/api/reportes/deportistas', {
                    headers: headers
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    this.state.deportistas = data.deportistas || [];
                    this.state.deportistasFiltrados = [...this.state.deportistas];
                    this.actualizarVistaPrevia();
                    this.actualizarContadores();
                }
                
            } catch (error) {
                console.error('❌ Error cargando deportistas:', error);
                this.showNotification('Error cargando deportistas', 'error');
            } finally {
                this.mostrarLoading(false);
            }
        },

        // Aplicar filtros
        async aplicarFiltros() {
            try {
                console.log('🔍 Aplicando filtros...');
                
                // Construir query string
                const params = new URLSearchParams();
                
                // Datos personales
                if (this.state.filtros.nombreCompleto) {
                    params.append('nombre', this.state.filtros.nombreCompleto);
                }
                
                if (this.state.filtros.numeroDocumento) {
                    params.append('numeroDocumento', this.state.filtros.numeroDocumento);
                }
                
                if (this.state.filtros.estado && this.state.filtros.estado !== '') {
                    params.append('estado', this.state.filtros.estado);
                }
                
                if (this.state.filtros.nivel && this.state.filtros.nivel !== '') {
                    params.append('nivel', this.state.filtros.nivel);
                }
                
                if (this.state.filtros.equipoCompetitivo && this.state.filtros.equipoCompetitivo !== '') {
                    params.append('equipoCompetitivo', this.state.filtros.equipoCompetitivo);
                }
                
                if (this.state.filtros.tieneDocumento && this.state.filtros.tieneDocumento !== 'todos') {
                    params.append('tieneDocumento', this.state.filtros.tieneDocumento);
                }
                
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
                
                const url = `https://gestiondeportistas-production.up.railway.app/api/reportes/deportistas?${params.toString()}`;
                
                const response = await fetch(url, {
                    headers: headers
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    this.state.deportistasFiltrados = data.deportistas || [];
                    this.actualizarVistaPrevia();
                    this.actualizarContadores();
                    
                    // Mostrar indicador de filtros aplicados
                    const filtrosAplicados = document.getElementById('filtrosAplicados');
                    if (filtrosAplicados) {
                        filtrosAplicados.classList.remove('hidden');
                    }
                }
                
            } catch (error) {
                console.error('❌ Error aplicando filtros:', error);
                this.showNotification('Error aplicando filtros', 'error');
            }
        },

        // Buscar documentos individuales
        async buscarDocumentos() {
            try {
                console.log('📄 Buscando documentos...');
                this.mostrarLoading(true);
                
                const params = new URLSearchParams();
                
                const filtroPDFNombre = document.getElementById('filtroPDFNombre');
                const filtroPDFDocumento = document.getElementById('filtroPDFDocumento');
                const filtroPDFNivel = document.getElementById('filtroPDFNivel');
                const filtroPDFConDocumento = document.getElementById('filtroPDFConDocumento');
                
                if (filtroPDFNombre?.value) {
                    params.append('nombre', filtroPDFNombre.value);
                }
                
                if (filtroPDFDocumento?.value) {
                    params.append('numeroDocumento', filtroPDFDocumento.value);
                }
                
                if (filtroPDFNivel?.value) {
                    params.append('nivel', filtroPDFNivel.value);
                }
                
                if (filtroPDFConDocumento?.value === 'si') {
                    params.append('tieneDocumento', 'true');
                } else if (filtroPDFConDocumento?.value === 'no') {
                    params.append('tieneDocumento', 'false');
                }
                
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
                
                const url = `https://gestiondeportistas-production.up.railway.app/api/reportes/deportistas?${params.toString()}`;
                
                const response = await fetch(url, {
                    headers: headers
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    this.state.documentosFiltrados = data.deportistas || [];
                    this.actualizarTablaDocumentos();
                }
                
            } catch (error) {
                console.error('❌ Error buscando documentos:', error);
                this.showNotification('Error buscando documentos', 'error');
            } finally {
                this.mostrarLoading(false);
            }
        },

        // Descargar documento individual
        descargarDocumentoIndividual(deportistaId) {
            try {
                console.log(`📄 Descargando documento para deportista ${deportistaId}`);
                
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const url = `https://gestiondeportistas-production.up.railway.app/api/reportes/documento/${deportistaId}`;
                window.open(url, '_blank');
                
            } catch (error) {
                console.error('❌ Error descargando documento:', error);
                this.showNotification('Error descargando documento', 'error');
            }
        },

        // Ver documento en nueva pestaña
        verDocumento(url) {
            if (url) {
                window.open(url, '_blank');
            } else {
                this.showNotification('No hay documento disponible', 'warning');
            }
        },

        // ==========================================
        // ACTUALIZAR INTERFAZ
        // ==========================================
        actualizarEstadisticasUI() {
            const stats = this.state.estadisticas;
            
            const totalDeportistas = document.getElementById('totalDeportistas');
            const conDocumento = document.getElementById('conDocumento');
            const sinDocumento = document.getElementById('sinDocumento');
            const cloudinaryDocs = document.getElementById('cloudinaryDocs');
            
            if (totalDeportistas) totalDeportistas.textContent = stats.total_deportistas || 0;
            if (conDocumento) conDocumento.textContent = stats.con_documento || 0;
            if (sinDocumento) sinDocumento.textContent = stats.sin_documento || 0;
            if (cloudinaryDocs) cloudinaryDocs.textContent = stats.cloudinary || 0;
        },

        actualizarVistaPrevia() {
            const tbody = document.getElementById('tablaResultados');
            const sinResultados = document.getElementById('sinResultados');
            const resultadosTotales = document.getElementById('resultadosTotales');
            
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            if (this.state.deportistasFiltrados.length === 0) {
                if (sinResultados) sinResultados.classList.remove('hidden');
                if (resultadosTotales) resultadosTotales.textContent = 'Mostrando 0 resultados';
                return;
            }
            
            if (sinResultados) sinResultados.classList.add('hidden');
            
            // Mostrar solo los primeros 10 resultados
            const resultados = this.state.deportistasFiltrados.slice(0, 10);
            
            resultados.forEach(deportista => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50 dark:hover:bg-zinc-800 documento-row';
                
                // Formatear datos
                const nombre = deportista.nombre_completo || `${deportista.user?.nombre || ''} ${deportista.user?.apellidos || ''}`.trim();
                const documento = deportista.numero_documento || deportista.user?.numero_documento || '';
                const nivel = this.formatearNivel(deportista.nivel_actual);
                const estado = this.formatearEstado(deportista.estado);
                const tieneDoc = deportista.tiene_documento || deportista.documento_identidad;
                
                row.innerHTML = `
                    <td class="px-4 py-3 font-medium">${nombre}</td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-400">${documento}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                            ${nivel}
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 text-xs rounded-full ${this.getEstadoColor(estado)}">
                            ${estado}
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        ${tieneDoc ? 
                            '<span class="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">✓ Subido</span>' : 
                            '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">✗ Pendiente</span>'
                        }
                    </td>
                    <td class="px-4 py-3">
                        ${tieneDoc ? 
                            `<button onclick="ReportesApp.descargarDocumentoIndividual('${deportista.id}')" 
                              class="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-red-700 transition-colors">
                                Descargar
                             </button>` : 
                            '<span class="text-gray-400 text-xs">No disponible</span>'
                        }
                    </td>
                `;
                
                tbody.appendChild(row);
            });
            
            if (resultadosTotales) {
                resultadosTotales.textContent = `Mostrando ${Math.min(resultados.length, 10)} de ${this.state.deportistasFiltrados.length} resultados`;
            }
        },

        actualizarTablaDocumentos() {
            const tbody = document.getElementById('tablaDocumentos');
            const mensajeSinDocumentos = document.getElementById('mensajeSinDocumentos');
            
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            if (this.state.documentosFiltrados.length === 0) {
                if (mensajeSinDocumentos) mensajeSinDocumentos.classList.remove('hidden');
                return;
            }
            
            if (mensajeSinDocumentos) mensajeSinDocumentos.classList.add('hidden');
            
            // Filtrar solo deportistas con documentos
            const deportistasConDocumentos = this.state.documentosFiltrados.filter(d => 
                d.documento_identidad || d.tiene_documento
            );
            
            if (deportistasConDocumentos.length === 0) {
                if (mensajeSinDocumentos) {
                    mensajeSinDocumentos.classList.remove('hidden');
                    mensajeSinDocumentos.querySelector('h4').textContent = 'Ningún deportista tiene documentos';
                }
                return;
            }
            
            deportistasConDocumentos.forEach(deportista => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50 dark:hover:bg-zinc-800 documento-row';
                
                const nombre = deportista.nombre_completo || `${deportista.user?.nombre || ''} ${deportista.user?.apellidos || ''}`.trim();
                const documento = deportista.numero_documento || deportista.user?.numero_documento || '';
                const nivel = this.formatearNivel(deportista.nivel_actual);
                const equipo = this.formatearEquipo(deportista.equipo_competitivo);
                const tipoDoc = deportista.user?.tipo_documento || 'No especificado';
                const estado = this.formatearEstado(deportista.estado);
                const esCloudinary = deportista.es_cloudinary || 
                    (deportista.documento_identidad && 
                     (deportista.documento_identidad.includes('cloudinary') || 
                      deportista.documento_identidad.includes('res.cloudinary.com')));
                
                row.innerHTML = `
                    <td class="px-8 py-4">
                        <div>
                            <p class="font-medium">${nombre}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">${deportista.user?.email || ''}</p>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <p class="font-mono text-sm">${documento}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${tipoDoc}</p>
                    </td>
                    <td class="px-6 py-4">
                        <p class="font-medium">${nivel}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${equipo}</p>
                    </td>
                    <td class="px-6 py-4">
                        ${esCloudinary ? 
                            '<span class="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300">☁️ Cloudinary</span>' : 
                            '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">📁 Local</span>'
                        }
                    </td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs rounded-full ${this.getEstadoColor(estado)}">
                            ${estado}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex justify-end gap-2">
                            <button onclick="ReportesApp.verDocumento('${deportista.documento_identidad || ''}')" 
                                    class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${!deportista.documento_identidad ? 'opacity-50 cursor-not-allowed' : ''}"
                                    ${!deportista.documento_identidad ? 'disabled' : ''}>
                                <span class="material-symbols-outlined text-sm">visibility</span>
                            </button>
                            <button onclick="ReportesApp.descargarDocumentoIndividual('${deportista.id}')" 
                                    class="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-red-700 transition-colors ${!deportista.documento_identidad ? 'opacity-50 cursor-not-allowed' : ''}"
                                    ${!deportista.documento_identidad ? 'disabled' : ''}>
                                <span class="material-symbols-outlined text-sm">download</span>
                            </button>
                        </div>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
        },

        actualizarContadores() {
            const contadorResultados = document.getElementById('contadorResultados');
            if (contadorResultados) {
                contadorResultados.textContent = this.state.deportistasFiltrados.length;
            }
        },

        // ==========================================
        // UTILIDADES
        // ==========================================
        formatearNivel(nivel) {
            const niveles = {
                'pendiente': 'Pendiente',
                'baby_titans': 'Baby Titans',
                '1_basico': '1 Básico',
                '1_medio': '1 Medio',
                '1_avanzado': '1 Avanzado',
                '2': 'Nivel 2',
                '3': 'Nivel 3',
                '4': 'Nivel 4'
            };
            return niveles[nivel] || nivel;
        },

        formatearEquipo(equipo) {
            const equipos = {
                'sin_equipo': 'Sin equipo',
                'rocks_titans': 'Rocks Titans',
                'lightning_titans': 'Lightning Titans',
                'storm_titans': 'Storm Titans',
                'fire_titans': 'Fire Titans',
                'electric_titans': 'Electric Titans'
            };
            return equipos[equipo] || equipo;
        },

        formatearEstado(estado) {
            const estados = {
                'activo': 'Activo',
                'inactivo': 'Inactivo',
                'lesionado': 'Lesionado',
                'descanso': 'Descanso',
                'pendiente': 'Pendiente'
            };
            return estados[estado] || estado;
        },

        getEstadoColor(estado) {
            const colores = {
                'Activo': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300',
                'Inactivo': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300',
                'Lesionado': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300',
                'Descanso': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300',
                'Pendiente': 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
            };
            return colores[estado] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
        },

        // ==========================================
        // UI HELPERS
        // ==========================================
        mostrarLoading(mostrar) {
            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator) {
                if (mostrar) {
                    loadingIndicator.classList.remove('hidden');
                } else {
                    loadingIndicator.classList.add('hidden');
                }
            }
        },

        limpiarFiltros() {
            console.log('🧹 Limpiando todos los filtros...');
            
            // Resetear estado
            this.state.filtros = {
                nombreCompleto: '',
                tipoDocumento: '',
                numeroDocumento: '',
                ciudad: '',
                direccion: '',
                telefono: '',
                email: '',
                fechaNacimiento: '',
                eps: '',
                acudiente: '',
                estado: '',
                nivel: '',
                tallaCamiseta: '',
                pesoMin: '',
                pesoMax: '',
                alturaMin: '',
                alturaMax: '',
                edadMin: '',
                edadMax: '',
                equipoCompetitivo: '',
                tieneDocumento: 'todos'
            };
            
            // Resetear UI - TODOS los inputs
            const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="number"], input[type="date"]');
            inputs.forEach(input => {
                input.value = '';
            });
            
            // Resetear selects
            const selects = document.querySelectorAll('select');
            selects.forEach(select => {
                select.value = '';
                if (select.id === 'filtroTieneDocumento' || select.id === 'filtroEstadoDocumento') {
                    select.value = 'todos';
                }
            });
            
            // Resetear chips activos
            document.querySelectorAll('.filtro-chip.active').forEach(chip => {
                chip.classList.remove('active', 'bg-primary', 'text-white');
                chip.classList.add('bg-gray-100', 'dark:bg-zinc-800', 'text-gray-700', 'dark:text-gray-300');
            });
            
            // Activar "Todos" chips
            document.querySelectorAll('.filtro-chip[data-estado=""], .filtro-chip[data-nivel=""]').forEach(chip => {
                chip.classList.add('active', 'bg-primary', 'text-white');
                chip.classList.remove('bg-gray-100', 'dark:bg-zinc-800', 'text-gray-700', 'dark:text-gray-300');
            });
            
            // Ocultar indicador de filtros aplicados
            const filtrosAplicados = document.getElementById('filtrosAplicados');
            if (filtrosAplicados) {
                filtrosAplicados.classList.add('hidden');
            }
            
            // Recargar deportistas sin filtros
            this.cargarDeportistas();
            
            this.showNotification('✅ Filtros limpiados', 'success');
        },

        updateUserInfo() {
            const userEmail = document.getElementById('userEmail');
            if (userEmail) {
                try {
                    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
                    const user = userStr ? JSON.parse(userStr) : null;
                    if (user && user.email) {
                        userEmail.textContent = user.email;
                    }
                } catch (e) {
                    console.error('❌ Error parseando usuario:', e);
                }
            }
        },

        // ==========================================
        // CONFIGURAR EVENTOS
        // ==========================================
        configurarEventos() {
            console.log('⚙️ Configurando eventos...');
            
            // 1. BOTÓN DESCARGAR EXCEL COMPLETO
            const descargarExcelCompletoBtn = document.getElementById('descargarExcelCompletoBtn');
            if (descargarExcelCompletoBtn) {
                descargarExcelCompletoBtn.addEventListener('click', () => {
                    console.log('🖱️ Click en DESCARGAR EXCEL COMPLETO');
                    this.descargarExcelCompleto();
                });
            }
            
            // 2. BOTÓN DESCARGAR EXCEL DE DOCUMENTOS
            const descargarExcelDocumentosBtn = document.getElementById('descargarExcelDocumentosBtn');
            if (descargarExcelDocumentosBtn) {
                descargarExcelDocumentosBtn.addEventListener('click', () => {
                    console.log('🖱️ Click en EXCEL DE DOCUMENTOS');
                    this.descargarExcelDocumentos();
                });
            }
            
            // 3. BOTÓN APLICAR FILTROS
            const aplicarFiltrosBtn = document.getElementById('aplicarFiltrosBtn');
            if (aplicarFiltrosBtn) {
                aplicarFiltrosBtn.addEventListener('click', () => {
                    console.log('🖱️ Click en APLICAR FILTROS');
                    
                    // Actualizar estado con los valores actuales
                    this.state.filtros = this.obtenerTodosLosFiltrosDelFormulario();
                    
                    // Aplicar filtros
                    this.aplicarFiltros();
                });
            }
            
            // 4. BOTÓN LIMPIAR FILTROS
            const limpiarFiltrosBtn = document.getElementById('limpiarFiltrosBtn');
            if (limpiarFiltrosBtn) {
                limpiarFiltrosBtn.addEventListener('click', () => {
                    this.limpiarFiltros();
                });
            }
            
            // 5. BOTÓN BUSCAR DOCUMENTOS
            const buscarDocumentosBtn = document.getElementById('buscarDocumentosBtn');
            if (buscarDocumentosBtn) {
                buscarDocumentosBtn.addEventListener('click', () => {
                    this.buscarDocumentos();
                });
            }
            
            // 6. BOTÓN LIMPIAR FILTROS PDF
            const limpiarFiltrosPDFBtn = document.getElementById('limpiarFiltrosPDFBtn');
            if (limpiarFiltrosPDFBtn) {
                limpiarFiltrosPDFBtn.addEventListener('click', () => {
                    document.getElementById('filtroPDFNombre').value = '';
                    document.getElementById('filtroPDFDocumento').value = '';
                    document.getElementById('filtroPDFNivel').value = '';
                    const filtroPDFConDocumento = document.getElementById('filtroPDFConDocumento');
                    if (filtroPDFConDocumento) filtroPDFConDocumento.value = 'todos';
                    this.buscarDocumentos();
                });
            }
            
            // 7. TABS DE FILTROS
            document.querySelectorAll('.filtro-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const tabId = e.target.id.replace('tab', '').toLowerCase();
                    
                    // Remover clase active de todas las tabs
                    document.querySelectorAll('.filtro-tab').forEach(t => {
                        t.classList.remove('active', 'bg-primary', 'text-white');
                        t.classList.add('bg-gray-100', 'dark:bg-zinc-800', 'text-gray-700', 'dark:text-gray-300');
                    });
                    
                    // Agregar clase active a la tab clickeada
                    e.target.classList.add('active', 'bg-primary', 'text-white');
                    e.target.classList.remove('bg-gray-100', 'dark:bg-zinc-800', 'text-gray-700', 'dark:text-gray-300');
                    
                    // Mostrar contenido correspondiente
                    document.querySelectorAll('.filtro-contenido').forEach(content => {
                        content.classList.remove('active');
                        content.classList.add('hidden');
                    });
                    
                    const contenido = document.getElementById(`filtros${tabId}`);
                    if (contenido) {
                        contenido.classList.add('active');
                        contenido.classList.remove('hidden');
                    }
                });
            });
            
            // 8. CHIPS DE FILTRO
            document.querySelectorAll('.filtro-chip').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    const tipo = e.target.classList.contains('estado') ? 'estado' : 'nivel';
                    const valor = e.target.dataset[tipo];
                    
                    // Remover active de todos los chips del mismo tipo
                    document.querySelectorAll(`.filtro-chip.${tipo}`).forEach(c => {
                        c.classList.remove('active', 'bg-primary', 'text-white');
                        c.classList.add('bg-gray-100', 'dark:bg-zinc-800', 'text-gray-700', 'dark:text-gray-300');
                    });
                    
                    // Agregar active al chip clickeado
                    e.target.classList.add('active', 'bg-primary', 'text-white');
                    e.target.classList.remove('bg-gray-100', 'dark:bg-zinc-800', 'text-gray-700', 'dark:text-gray-300');
                    
                    // Actualizar estado
                    this.state.filtros[tipo] = valor;
                });
            });
            
            // 9. INPUTS DE FILTRO (actualizan estado en tiempo real)
            document.querySelectorAll('input, select').forEach(input => {
                input.addEventListener('change', (e) => {
                    const id = e.target.id.replace('filtro', '');
                    const key = id.charAt(0).toLowerCase() + id.slice(1);
                    
                    if (key in this.state.filtros) {
                        this.state.filtros[key] = e.target.value;
                    }
                });
            });
            
            // 10. BUSCAR CON ENTER EN FILTROS DE DOCUMENTOS
            document.querySelectorAll('#filtroPDFNombre, #filtroPDFDocumento').forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.buscarDocumentos();
                    }
                });
            });
            
            // 11. BUSCAR CON ENTER EN FILTROS PRINCIPALES
            document.querySelectorAll('#filtroNombreCompleto, #filtroNumeroDocumento, #filtroEmail').forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.aplicarFiltros();
                    }
                });
            });
            
            console.log('✅ Todos los eventos configurados correctamente');
        },

        // ==========================================
        // MÉTODOS AUXILIARES
        // ==========================================
        logout() {
            console.log('👋 CERRANDO SESIÓN...');
            
            this.showNotification('Sesión cerrada exitosamente', 'info');
            
            localStorage.clear();
            sessionStorage.clear();
            
            setTimeout(() => {
                window.location.href = '../auth/login-admin.html';
            }, 1500);
        },

        mostrarAyuda() {
            this.showNotification(
                '📘 AYUDA DE REPORTES\n\n' +
                '1️⃣ FILTROS: Usa las pestañas para filtrar por diferentes criterios\n' +
                '2️⃣ EXCEL COMPLETO: Exporta TODOS los datos con los filtros aplicados\n' +
                '3️⃣ EXCEL DOCUMENTOS: Solo exporta información de documentos\n' +
                '4️⃣ DESCARGAS INDIVIDUALES: Ve y descarga documentos uno por uno\n' +
                '5️⃣ CLOUDINARY: Los documentos pueden estar en la nube o servidor local',
                'info',
                10000
            );
        },

        // ==========================================
        // SISTEMA DE NOTIFICACIONES
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
                <span style="flex: 1; white-space: pre-line;">${message}</span>
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
}

// ==========================================
// INICIALIZACIÓN CUANDO EL DOM ESTÉ LISTO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM cargado, inicializando ReportesApp...');
    
    // Agregar estilos CSS para las animaciones de notificaciones si no existen
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
    
    // Inicializar la aplicación
    if (window.ReportesApp && window.ReportesApp.init) {
        window.ReportesApp.init();
    } else {
        console.error('❌ ReportesApp no está definido correctamente');
    }
});

// Función para cambiar tema (compartida)
function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}

// Cargar tema guardado
if (localStorage.getItem('theme') === 'dark' || 
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}