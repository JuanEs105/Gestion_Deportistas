// ==========================================
// REPORTES APP - VERSIÓN CORREGIDA
// ✅ DESCARGA DE PDFs CON TOKEN EN HEADER
// ==========================================

if (typeof window.ReportesApp === 'undefined') {
    window.ReportesApp = {
        state: {
            deportistas: [],
            deportistasFiltrados: [],
            documentosFiltrados: [],
            loading: false,

            filtros: {
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
            }
        },

        // ==========================================
        // INICIALIZACIÓN
        // ==========================================
        async init() {
            console.log('🚀 Inicializando ReportesApp...');

            if (!this.checkAuth()) return;

            await this.cargarEstadisticas();
            await this.cargarDeportistas();
            this.configurarEventos();
            this.updateUserInfo();

            console.log('✅ ReportesApp inicializado');
        },

        checkAuth() {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) {
                this.showNotification('Sesión expirada', 'warning');
                setTimeout(() => window.location.href = '../auth/login-admin.html', 1500);
                return false;
            }
            return true;
        },

        // ==========================================
        // 🔥 DESCARGAR DOCUMENTO PDF INDIVIDUAL - CORREGIDO
        // ==========================================
        async descargarDocumentoIndividual(deportistaId) {
            try {
                console.log(`📄 Descargando documento ID: ${deportistaId}`);
                this.mostrarLoading(true);

                const token = localStorage.getItem('token') || sessionStorage.getItem('token');

                if (!token) {
                    throw new Error('No hay sesión activa');
                }

                const url = `https://gestiondeportistas-production.up.railway.app/api/reportes/documento/${deportistaId}`;

                console.log('🌐 URL:', url);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('📡 Response status:', response.status);

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
                    }
                    if (response.status === 404) {
                        throw new Error('Documento no encontrado');
                    }

                    const errorData = await response.json().catch(() => null);
                    throw new Error(errorData?.error || `Error ${response.status}`);
                }

                const data = await response.json();
                console.log('📦 Datos recibidos:', data);

                if (!data.success || !data.url) {
                    throw new Error('No se pudo obtener la URL del documento');
                }

                // 🔥 AGREGAR .pdf A LA URL SI NO LO TIENE
                let pdfUrl = data.url;
                if (!pdfUrl.toLowerCase().endsWith('.pdf')) {
                    pdfUrl = pdfUrl + '.pdf';
                }

                console.log('✅ URL del PDF:', pdfUrl);

                // 🔥 ABRIR EN NUEVA PESTAÑA
                const newWindow = window.open(pdfUrl, '_blank');

                if (!newWindow) {
                    // Fallback si popup bloqueado
                    const link = document.createElement('a');
                    link.href = pdfUrl;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.download = `documento_${deportistaId}.pdf`; // 🔥 AGREGAR NOMBRE
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    this.showNotification('⚠️ Popup bloqueado. El documento se descargó.', 'warning', 3000);
                } else {
                    this.showNotification('✅ Documento abierto correctamente', 'success', 2000);
                }

            } catch (error) {
                console.error('❌ Error:', error);

                let mensaje = 'Error abriendo el documento';

                if (error.message.includes('Sesión expirada')) {
                    mensaje = '🔒 Sesión expirada. Redirigiendo al login...';
                    setTimeout(() => {
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.href = '../auth/login-admin.html';
                    }, 2000);
                } else if (error.message.includes('Documento no encontrado')) {
                    mensaje = '❌ Este deportista no tiene documento subido';
                } else if (error.message.includes('Failed to fetch')) {
                    mensaje = '❌ No se pudo conectar al servidor';
                } else {
                    mensaje = `❌ Error: ${error.message}`;
                }

                this.showNotification(mensaje, 'error', 5000);

            } finally {
                this.mostrarLoading(false);
            }
        },

        // ==========================================
        // 🔥 VER DOCUMENTO EN NUEVA PESTAÑA (ALTERNATIVA)
        // ==========================================
        async verDocumento(deportistaId) {
            try {
                console.log(`👁️ Viendo documento ID: ${deportistaId}`);

                // Buscar el deportista en el estado
                const deportista = this.state.documentosFiltrados.find(d => d.id === deportistaId) ||
                    this.state.deportistasFiltrados.find(d => d.id === deportistaId);

                if (deportista && deportista.documento_identidad) {
                    // Si tenemos la URL directa, abrir directamente
                    window.open(deportista.documento_identidad, '_blank');
                    this.showNotification('✅ Abriendo documento...', 'success', 2000);
                } else {
                    // Si no, usar el endpoint del backend
                    await this.descargarDocumentoIndividual(deportistaId);
                }

            } catch (error) {
                console.error('❌ Error:', error);
                this.showNotification('Error abriendo el documento', 'error');
            }
        },

        // ==========================================
        // DESCARGAR EXCEL COMPLETO CON FILTROS
        // ==========================================
        async descargarExcelCompleto() {
            try {
                console.log('📊 DESCARGANDO EXCEL COMPLETO...');
                this.mostrarLoading(true);

                const filtros = this.capturarFiltros();
                console.log('🔍 Filtros capturados:', filtros);

                const params = new URLSearchParams();

                Object.keys(filtros).forEach(key => {
                    const value = filtros[key];
                    if (value && value !== '' && value !== 'todos') {
                        params.append(key, value);
                    }
                });

                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                if (!token) throw new Error('No hay sesión activa');

                const baseURL = 'https://gestiondeportistas-production.up.railway.app/api/reportes/excel/grupal';
                const queryString = params.toString();
                const url = queryString ? `${baseURL}?${queryString}` : baseURL;

                console.log('🌐 URL:', url);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ Error servidor:', errorText);
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }

                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `reporte_deportistas_${new Date().toISOString().split('T')[0]}.xlsx`;
                link.style.display = 'none';

                document.body.appendChild(link);
                link.click();

                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(blobUrl);
                }, 100);

                const count = this.state.deportistasFiltrados.length || 'todos';
                this.showNotification(`✅ Excel generado: ${count} registros`, 'success', 3000);

            } catch (error) {
                console.error('❌ Error:', error);

                let mensaje = 'Error al generar Excel';
                if (error.message.includes('Failed to fetch')) {
                    mensaje = '❌ No se pudo conectar al servidor';
                } else if (error.message.includes('401') || error.message.includes('403')) {
                    mensaje = '🔒 Sesión expirada. Inicia sesión nuevamente';
                }

                this.showNotification(mensaje, 'error', 5000);

            } finally {
                this.mostrarLoading(false);
            }
        },

        // ==========================================
        // DESCARGAR EXCEL DE DOCUMENTOS
        // ==========================================
        async descargarExcelDocumentos() {
            try {
                console.log('📄 DESCARGANDO EXCEL DE DOCUMENTOS...');
                this.mostrarLoading(true);

                const filtros = this.capturarFiltros();

                const params = new URLSearchParams();

                if (filtros.nivel && filtros.nivel !== '') {
                    params.append('nivel', filtros.nivel);
                }
                if (filtros.estado && filtros.estado !== '') {
                    params.append('estado', filtros.estado);
                }
                if (filtros.equipoCompetitivo && filtros.equipoCompetitivo !== '') {
                    params.append('equipoCompetitivo', filtros.equipoCompetitivo);
                }

                params.append('tieneDocumento', 'true');

                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                if (!token) throw new Error('No hay sesión activa');

                const baseURL = 'https://gestiondeportistas-production.up.railway.app/api/reportes/excel/documentos';
                const url = `${baseURL}?${params.toString()}`;

                console.log('🔗 URL documentos:', url);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }

                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `documentos_deportistas_${new Date().toISOString().split('T')[0]}.xlsx`;
                link.style.display = 'none';

                document.body.appendChild(link);
                link.click();

                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(blobUrl);
                }, 100);

                this.showNotification('✅ Excel de documentos generado', 'success', 3000);

            } catch (error) {
                console.error('❌ Error:', error);
                this.showNotification('Error al generar Excel de documentos: ' + error.message, 'error');
            } finally {
                this.mostrarLoading(false);
            }
        },

        // ==========================================
        // CAPTURAR FILTROS DEL FORMULARIO
        // ==========================================
        capturarFiltros() {
            const filtros = {};

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

            const estadoChip = document.querySelector('.filtro-chip.estado.active');
            filtros.estado = estadoChip?.dataset.estado || '';

            const nivelChip = document.querySelector('.filtro-chip.nivel.active');
            filtros.nivel = nivelChip?.dataset.nivel || '';

            filtros.tallaCamiseta = document.getElementById('filtroTallaCamiseta')?.value || '';
            filtros.pesoMin = document.getElementById('filtroPesoMin')?.value?.trim() || '';
            filtros.pesoMax = document.getElementById('filtroPesoMax')?.value?.trim() || '';
            filtros.alturaMin = document.getElementById('filtroAlturaMin')?.value?.trim() || '';
            filtros.alturaMax = document.getElementById('filtroAlturaMax')?.value?.trim() || '';
            filtros.edadMin = document.getElementById('filtroEdadMin')?.value?.trim() || '';
            filtros.edadMax = document.getElementById('filtroEdadMax')?.value?.trim() || '';

            filtros.equipoCompetitivo = document.getElementById('filtroGrupoCompetitivo')?.value || '';

            const nivelDetallado = document.getElementById('filtroNivelDetallado')?.value;
            if (nivelDetallado && nivelDetallado !== '') {
                filtros.nivel = nivelDetallado;
            }

            const tieneDocumento = document.getElementById('filtroTieneDocumento')?.value;
            filtros.tieneDocumento = tieneDocumento || 'todos';

            const estadoDocumento = document.getElementById('filtroEstadoDocumento')?.value;
            if (estadoDocumento && estadoDocumento !== 'todos') {
                if (estadoDocumento === 'con_documento') {
                    filtros.tieneDocumento = 'true';
                } else if (estadoDocumento === 'sin_documento') {
                    filtros.tieneDocumento = 'false';
                }
            }

            this.state.filtros = filtros;

            return filtros;
        },

        // ==========================================
        // APLICAR FILTROS (Vista Previa)
        // ==========================================
        async aplicarFiltros() {
            try {
                console.log('🔍 Aplicando filtros...');
                this.mostrarLoading(true);

                const filtros = this.capturarFiltros();

                const params = new URLSearchParams();

                Object.keys(filtros).forEach(key => {
                    const value = filtros[key];
                    if (value && value !== '' && value !== 'todos') {
                        params.append(key, value);
                    }
                });

                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const url = `https://gestiondeportistas-production.up.railway.app/api/reportes/deportistas?${params.toString()}`;

                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Error aplicando filtros');

                const data = await response.json();

                if (data.success) {
                    this.state.deportistasFiltrados = data.deportistas || [];
                    this.actualizarVistaPrevia();
                    this.actualizarContadores();

                    document.getElementById('filtrosAplicados')?.classList.remove('hidden');

                    this.showNotification(`✅ ${this.state.deportistasFiltrados.length} deportistas encontrados`, 'success', 2000);
                }

            } catch (error) {
                console.error('❌ Error:', error);
                this.showNotification('Error aplicando filtros', 'error');
            } finally {
                this.mostrarLoading(false);
            }
        },

        // ==========================================
        // BUSCAR DOCUMENTOS CON FILTROS
        // ==========================================
        async buscarDocumentos() {
            try {
                console.log('📄 Buscando documentos...');
                this.mostrarLoading(true);

                const params = new URLSearchParams();

                const nombre = document.getElementById('filtroPDFNombre')?.value?.trim();
                const documento = document.getElementById('filtroPDFDocumento')?.value?.trim();
                const nivel = document.getElementById('filtroPDFNivel')?.value;
                const conDocumento = document.getElementById('filtroPDFConDocumento')?.value;

                if (nombre) params.append('nombre', nombre);
                if (documento) params.append('numeroDocumento', documento);
                if (nivel && nivel !== '') params.append('nivel', nivel);

                if (conDocumento === 'si') {
                    params.append('tieneDocumento', 'true');
                } else if (conDocumento === 'no') {
                    params.append('tieneDocumento', 'false');
                }

                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const url = `https://gestiondeportistas-production.up.railway.app/api/reportes/deportistas?${params.toString()}`;

                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Error buscando documentos');

                const data = await response.json();

                if (data.success) {
                    this.state.documentosFiltrados = data.deportistas || [];
                    this.actualizarTablaDocumentos();
                }

            } catch (error) {
                console.error('❌ Error:', error);
                this.showNotification('Error buscando documentos', 'error');
            } finally {
                this.mostrarLoading(false);
            }
        },

        // ==========================================
        // CARGAR DATOS
        // ==========================================
        async cargarEstadisticas() {
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const response = await fetch('https://gestiondeportistas-production.up.railway.app/api/reportes/estadisticas', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Error cargando estadísticas');

                const data = await response.json();
                if (data.success) {
                    this.actualizarEstadisticasUI(data.estadisticas);
                }
            } catch (error) {
                console.error('❌ Error:', error);
            }
        },

        async cargarDeportistas() {
            try {
                this.mostrarLoading(true);
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');

                const response = await fetch('https://gestiondeportistas-production.up.railway.app/api/reportes/deportistas', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Error cargando deportistas');

                const data = await response.json();
                if (data.success) {
                    this.state.deportistas = data.deportistas || [];
                    this.state.deportistasFiltrados = [...this.state.deportistas];
                    this.actualizarVistaPrevia();
                    this.actualizarContadores();
                }
            } catch (error) {
                console.error('❌ Error:', error);
            } finally {
                this.mostrarLoading(false);
            }
        },

        // ==========================================
        // UI HELPERS
        // ==========================================
        actualizarEstadisticasUI(stats) {
            document.getElementById('totalDeportistas').textContent = stats.total_deportistas || 0;
            document.getElementById('conDocumento').textContent = stats.con_documento || 0;
            document.getElementById('sinDocumento').textContent = stats.sin_documento || 0;
            document.getElementById('cloudinaryDocs').textContent = stats.cloudinary || 0;
        },

        actualizarVistaPrevia() {
            const tbody = document.getElementById('tablaResultados');
            const sinResultados = document.getElementById('sinResultados');
            const resultadosTotales = document.getElementById('resultadosTotales');

            if (!tbody) return;

            tbody.innerHTML = '';

            if (this.state.deportistasFiltrados.length === 0) {
                sinResultados?.classList.remove('hidden');
                resultadosTotales.textContent = 'Mostrando 0 resultados';
                return;
            }

            sinResultados?.classList.add('hidden');

            const resultados = this.state.deportistasFiltrados.slice(0, 10);

            resultados.forEach(deportista => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50 dark:hover:bg-zinc-800';

                const nombre = deportista.nombre_completo || '';
                const documento = deportista.numero_documento || '';
                const nivel = deportista.nivel_actual || 'Pendiente';
                const estado = deportista.estado || 'Activo';
                const tieneDoc = deportista.tiene_documento;

                row.innerHTML = `
                    <td class="px-4 py-3 font-medium">${nombre}</td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-400">${documento}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
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
                        '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">✓ Subido</span>' :
                        '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">✗ Pendiente</span>'
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

            resultadosTotales.textContent = `Mostrando ${Math.min(resultados.length, 10)} de ${this.state.deportistasFiltrados.length} resultados`;
        },

        actualizarTablaDocumentos() {
            const tbody = document.getElementById('tablaDocumentos');
            const mensaje = document.getElementById('mensajeSinDocumentos');

            if (!tbody) return;

            tbody.innerHTML = '';

            const conDocs = this.state.documentosFiltrados.filter(d => d.documento_identidad || d.tiene_documento);

            if (conDocs.length === 0) {
                mensaje?.classList.remove('hidden');
                return;
            }

            mensaje?.classList.add('hidden');

            conDocs.forEach(deportista => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors';

                const nombre = deportista.nombre_completo || '';
                const documento = deportista.numero_documento || '';
                const nivel = deportista.nivel_actual || 'Pendiente';
                const equipo = deportista.equipo_competitivo || 'Sin equipo';
                const tipoDoc = deportista.user?.tipo_documento || 'No especificado';
                const estado = deportista.estado || 'Activo';
                const esCloudinary = deportista.documento_identidad?.includes('cloudinary');

                row.innerHTML = `
                    <td class="px-8 py-4">
                        <div>
                            <p class="font-medium">${nombre}</p>
                            <p class="text-xs text-gray-500">${deportista.email || ''}</p>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <p class="font-mono text-sm">${documento}</p>
                        <p class="text-xs text-gray-500">${tipoDoc}</p>
                    </td>
                    <td class="px-6 py-4">
                        <p class="font-medium">${nivel}</p>
                        <p class="text-xs text-gray-500">${equipo}</p>
                    </td>
                    <td class="px-6 py-4">
                        ${esCloudinary ?
                        '<span class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">☁️ Cloudinary</span>' :
                        '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">📁 Local</span>'
                    }
                    </td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs rounded-full ${this.getEstadoColor(estado)}">
                            ${estado}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex justify-end gap-2">
                            <button onclick="ReportesApp.verDocumento('${deportista.id}')" 
                                    class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                                Ver
                            </button>
                            <button onclick="ReportesApp.descargarDocumentoIndividual('${deportista.id}')" 
                                    class="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-red-700 transition-colors">
                                Descargar
                            </button>
                        </div>
                    </td>
                `;

                tbody.appendChild(row);
            });
        },

        actualizarContadores() {
            const contador = document.getElementById('contadorResultados');
            if (contador) {
                contador.textContent = this.state.deportistasFiltrados.length;
            }
        },

        getEstadoColor(estado) {
            const colores = {
                'activo': 'bg-green-100 text-green-800',
                'inactivo': 'bg-red-100 text-red-800',
                'lesionado': 'bg-yellow-100 text-yellow-800',
                'pendiente': 'bg-gray-100 text-gray-800'
            };
            return colores[estado?.toLowerCase()] || 'bg-gray-100 text-gray-800';
        },

        limpiarFiltros() {
            document.querySelectorAll('input[type="text"], input[type="email"], input[type="number"], input[type="date"]').forEach(input => {
                input.value = '';
            });

            document.querySelectorAll('select').forEach(select => {
                select.value = select.id === 'filtroTieneDocumento' ? 'todos' : '';
            });

            document.querySelectorAll('.filtro-chip').forEach(chip => {
                chip.classList.remove('active', 'bg-primary', 'text-white');
                chip.classList.add('bg-gray-100', 'text-gray-700');
            });

            document.querySelectorAll('.filtro-chip[data-estado=""], .filtro-chip[data-nivel=""]').forEach(chip => {
                chip.classList.add('active', 'bg-primary', 'text-white');
                chip.classList.remove('bg-gray-100', 'text-gray-700');
            });

            document.getElementById('filtrosAplicados')?.classList.add('hidden');

            this.state.deportistasFiltrados = [...this.state.deportistas];
            this.actualizarVistaPrevia();
            this.actualizarContadores();

            this.showNotification('✅ Filtros limpiados', 'success');
        },

        mostrarLoading(mostrar) {
            const loading = document.getElementById('loadingIndicator');
            if (loading) {
                loading.classList.toggle('hidden', !mostrar);
            }
        },

        updateUserInfo() {
            const userEmail = document.getElementById('userEmail');
            if (userEmail) {
                try {
                    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
                    const user = userStr ? JSON.parse(userStr) : null;
                    if (user?.email) userEmail.textContent = user.email;
                } catch (e) {
                    console.error('Error:', e);
                }
            }
        },

        // ==========================================
        // CONFIGURAR EVENTOS
        // ==========================================
        configurarEventos() {
            document.getElementById('descargarExcelCompletoBtn')?.addEventListener('click', () => {
                this.descargarExcelCompleto();
            });

            document.getElementById('descargarExcelDocumentosBtn')?.addEventListener('click', () => {
                this.descargarExcelDocumentos();
            });

            document.getElementById('aplicarFiltrosBtn')?.addEventListener('click', () => {
                this.aplicarFiltros();
            });

            document.getElementById('limpiarFiltrosBtn')?.addEventListener('click', () => {
                this.limpiarFiltros();
            });

            document.getElementById('buscarDocumentosBtn')?.addEventListener('click', () => {
                this.buscarDocumentos();
            });

            document.getElementById('limpiarFiltrosPDFBtn')?.addEventListener('click', () => {
                document.getElementById('filtroPDFNombre').value = '';
                document.getElementById('filtroPDFDocumento').value = '';
                document.getElementById('filtroPDFNivel').value = '';
                document.getElementById('filtroPDFConDocumento').value = 'todos';
                this.buscarDocumentos();
            });

            document.querySelectorAll('.filtro-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const tabId = e.target.id.replace('tab', '').toLowerCase();

                    document.querySelectorAll('.filtro-tab').forEach(t => {
                        t.classList.remove('active', 'bg-primary', 'text-white');
                        t.classList.add('bg-gray-100', 'text-gray-700');
                    });

                    e.target.classList.add('active', 'bg-primary', 'text-white');
                    e.target.classList.remove('bg-gray-100', 'text-gray-700');

                    document.querySelectorAll('.filtro-contenido').forEach(content => {
                        content.classList.add('hidden');
                    });

                    document.getElementById(`filtros${tabId}`)?.classList.remove('hidden');
                });
            });

            document.querySelectorAll('.filtro-chip').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    const tipo = e.target.classList.contains('estado') ? 'estado' : 'nivel';

                    document.querySelectorAll(`.filtro-chip.${tipo}`).forEach(c => {
                        c.classList.remove('active', 'bg-primary', 'text-white');
                        c.classList.add('bg-gray-100', 'text-gray-700');
                    });

                    e.target.classList.add('active', 'bg-primary', 'text-white');
                    e.target.classList.remove('bg-gray-100', 'text-gray-700');
                });
            });

            document.querySelectorAll('#filtroNombreCompleto, #filtroNumeroDocumento, #filtroEmail').forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.aplicarFiltros();
                });
            });
        },

        logout() {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../auth/login-admin.html';
        },

        showNotification(message, type = 'info', duration = 5000) {
            let container = document.getElementById('notificationContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'notificationContainer';
                container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
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
                margin-bottom: 10px;
                animation: slideIn 0.3s ease-out;
            `;

            notification.innerHTML = `
                <span>${message}</span>
                <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; margin-left: 10px; cursor: pointer;">✕</button>
            `;

            container.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }
    };
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
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

    if (window.ReportesApp) {
        window.ReportesApp.init();
    }
});

// Función para cambiar tema
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
if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
}