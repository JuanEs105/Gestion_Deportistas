// ==========================================
// REPORTES APP - VERSIÓN MEJORADA Y CORREGIDA
// ==========================================

if (typeof window.ReportesApp === 'undefined') {
    window.ReportesApp = {
        state: {
            deportistas: [],
            deportistasFiltrados: [],
            loading: false,
            filtros: {}
        },

        // ==========================================
        // INICIALIZACIÓN
        // ==========================================
        async init() {
            console.log('🚀 Inicializando ReportesApp Mejorado...');

            if (!this.checkAuth()) return;

            await this.cargarEstadisticas();
            await this.cargarDeportistas();
            this.configurarEventos();
            this.updateUserInfo();

            console.log('✅ ReportesApp Mejorado inicializado');
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
        // DESCARGAR EXCEL CON FILTROS
        // ==========================================
        async descargarExcelCompleto() {
            try {
                console.log('📊 DESCARGANDO EXCEL CON FILTROS...');
                this.mostrarLoading(true);

                const params = new URLSearchParams();

                // ✅ FILTRO 1: ESTADO
                const estado = document.getElementById('filtroEstado')?.value;
                if (estado && estado !== '') {
                    params.append('estado', estado);
                    console.log('📊 Filtro Estado:', estado);
                }

                // ✅ FILTRO 2: NIVEL
                const nivel = document.getElementById('filtroNivel')?.value;
                if (nivel && nivel !== '') {
                    params.append('nivel', nivel);
                    console.log('📈 Filtro Nivel:', nivel);
                }

                // ✅ FILTRO 3: GRUPO COMPETITIVO
                const grupoCompetitivo = document.getElementById('filtroGrupoCompetitivo')?.value;
                if (grupoCompetitivo && grupoCompetitivo !== '') {
                    params.append('equipoCompetitivo', grupoCompetitivo);
                    console.log('🏆 Filtro Grupo:', grupoCompetitivo);
                }

                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const baseURL = 'https://gestiondeportistas-production.up.railway.app/api/reportes/excel/grupal';
                const queryString = params.toString();
                const url = queryString ? `${baseURL}?${queryString}` : baseURL;

                console.log('🌐 URL final:', url);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Error ${response.status}`);
                }

                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = blobUrl;
                
                // Nombre descriptivo del archivo según filtros
                let nombreArchivo = 'reporte_deportistas';
                if (estado) nombreArchivo += `_${estado}`;
                if (nivel) nombreArchivo += `_${nivel}`;
                if (grupoCompetitivo) nombreArchivo += `_${grupoCompetitivo.replace('_titans', '')}`;
                nombreArchivo += `_${new Date().toISOString().split('T')[0]}.xlsx`;
                
                link.download = nombreArchivo;
                link.style.display = 'none';

                document.body.appendChild(link);
                link.click();

                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(blobUrl);
                }, 100);

                let mensaje = '✅ Excel descargado exitosamente';
                if (estado || nivel || grupoCompetitivo) {
                    mensaje += ' con filtros aplicados';
                }
                this.showNotification(mensaje, 'success', 3000);

            } catch (error) {
                console.error('❌ Error:', error);
                this.showNotification('❌ Error al generar Excel', 'error', 5000);
            } finally {
                this.mostrarLoading(false);
            }
        },

        // ==========================================
        // DESCARGAR DOCUMENTO PDF INDIVIDUAL
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

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Sesión expirada');
                    }
                    throw new Error('Error descargando documento');
                }

                const data = await response.json();

                if (!data.success || !data.url) {
                    throw new Error('No se pudo obtener el documento');
                }

                const pdfUrl = data.url;

                const nombreArchivo = data.deportista?.nombre
                    ? `${data.deportista.nombre.replace(/\s+/g, '_')}_documento.pdf`
                    : `documento_${deportistaId}.pdf`;

                const pdfResponse = await fetch(pdfUrl);
                const blob = await pdfResponse.blob();

                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = nombreArchivo;
                link.style.display = 'none';

                document.body.appendChild(link);
                link.click();

                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(blobUrl);
                }, 100);

                this.showNotification('✅ Documento descargado correctamente', 'success', 2000);

            } catch (error) {
                console.error('❌ Error:', error);

                let mensaje = 'Error descargando el documento';

                if (error.message.includes('Sesión expirada')) {
                    mensaje = '🔒 Sesión expirada. Redirigiendo...';
                    setTimeout(() => {
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.href = '../auth/login-admin.html';
                    }, 2000);
                }

                this.showNotification(mensaje, 'error', 5000);

            } finally {
                this.mostrarLoading(false);
            }
        },

        // ==========================================
        // APLICAR FILTROS (VISTA PREVIA)
        // ==========================================
        async aplicarFiltros() {
            try {
                console.log('🔍 Aplicando filtros...');
                this.mostrarLoading(true);

                const params = new URLSearchParams();

                // ✅ FILTRO 1: ESTADO
                const estado = document.getElementById('filtroEstado')?.value;
                if (estado && estado !== '') {
                    params.append('estado', estado);
                    console.log('📊 Filtro Estado:', estado);
                }

                // ✅ FILTRO 2: NIVEL
                const nivel = document.getElementById('filtroNivel')?.value;
                if (nivel && nivel !== '') {
                    params.append('nivel', nivel);
                    console.log('📈 Filtro Nivel:', nivel);
                }

                // ✅ FILTRO 3: GRUPO COMPETITIVO
                const grupoCompetitivo = document.getElementById('filtroGrupoCompetitivo')?.value;
                if (grupoCompetitivo && grupoCompetitivo !== '') {
                    params.append('equipoCompetitivo', grupoCompetitivo);
                    console.log('🏆 Filtro Grupo:', grupoCompetitivo);
                }

                // Agregar otros filtros opcionales
                const nombreCompleto = document.getElementById('filtroNombreCompleto')?.value?.trim();
                if (nombreCompleto) params.append('nombreCompleto', nombreCompleto);

                const numeroDocumento = document.getElementById('filtroNumeroDocumento')?.value?.trim();
                if (numeroDocumento) params.append('numeroDocumento', numeroDocumento);

                const email = document.getElementById('filtroEmail')?.value?.trim();
                if (email) params.append('email', email);

                const ciudad = document.getElementById('filtroCiudad')?.value?.trim();
                if (ciudad) params.append('ciudad', ciudad);

                const telefono = document.getElementById('filtroTelefono')?.value?.trim();
                if (telefono) params.append('telefono', telefono);

                const eps = document.getElementById('filtroEPS')?.value?.trim();
                if (eps) params.append('eps', eps);

                const tieneDocumento = document.getElementById('filtroTieneDocumento')?.value;
                if (tieneDocumento && tieneDocumento !== 'todos') {
                    params.append('tieneDocumento', tieneDocumento);
                }

                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const url = `https://gestiondeportistas-production.up.railway.app/api/reportes/deportistas?${params.toString()}`;

                console.log('🌐 URL de búsqueda:', url);

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
        // CARGAR DATOS
        // ==========================================
        async cargarEstadisticas() {
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const response = await fetch('https://gestiondeportistas-production.up.railway.app/api/reportes/estadisticas', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.actualizarEstadisticasUI(data.estadisticas);
                    }
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

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.state.deportistas = data.deportistas || [];
                        this.state.deportistasFiltrados = [...this.state.deportistas];
                        this.actualizarVistaPrevia();
                        this.actualizarContadores();
                    }
                }
            } catch (error) {
                console.error('❌ Error:', error);
            } finally {
                this.mostrarLoading(false);
            }
        },

        // ==========================================
        // UI HELPERS - TABLA CORREGIDA
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

            resultados.forEach((deportista, index) => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors';

                // 🔥 CORRECCIÓN: Extraer datos correctamente
                const nombre = deportista.nombre_completo || deportista.nombre || 'Sin nombre';
                const documento = deportista.numero_documento || deportista.documento || 'Sin documento';
                const nivel = this.formatearNivel(deportista.nivel_actual || 'Pendiente');
                const estado = deportista.estado || 'activo';
                const tieneDoc = deportista.tiene_documento;

                row.innerHTML = `
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                ${nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p class="font-semibold text-gray-900 dark:text-white">${nombre}</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">ID: ${deportista.id || 'N/A'}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <span class="font-mono text-sm font-medium text-gray-700 dark:text-gray-300">${documento}</span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="px-3 py-1.5 rounded-full text-xs font-bold ${this.getNivelColor(deportista.nivel_actual)}">${nivel}</span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="px-3 py-1.5 rounded-full text-xs font-bold ${this.getEstadoColor(estado)}">${this.formatearEstado(estado)}</span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        ${tieneDoc ?
                        '<span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><span class="material-symbols-outlined text-base">check_circle</span>Subido</span>' :
                        '<span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"><span class="material-symbols-outlined text-base">cancel</span>Pendiente</span>'}
                    </td>
                    <td class="px-6 py-4 text-right">
                        ${tieneDoc ?
                        `<button onclick="ReportesApp.descargarDocumentoIndividual('${deportista.id}')" 
                              class="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all hover:scale-105 shadow-lg hover:shadow-xl">
                                <span class="material-symbols-outlined text-base">download</span>
                                Descargar PDF
                             </button>` :
                        '<span class="text-gray-400 dark:text-gray-500 text-xs font-medium">Sin documento</span>'}
                    </td>
                `;

                tbody.appendChild(row);
            });

            resultadosTotales.textContent = `Mostrando ${Math.min(resultados.length, 10)} de ${this.state.deportistasFiltrados.length} resultados`;
        },

        actualizarContadores() {
            const contador = document.getElementById('contadorResultados');
            if (contador) {
                contador.textContent = this.state.deportistasFiltrados.length;
            }
        },

        // ==========================================
        // FORMATEO Y COLORES
        // ==========================================
        formatearNivel(nivel) {
            const niveles = {
                'baby_titans': 'Baby Titans',
                '1_basico': '1 Básico',
                '1_medio': '1 Medio',
                '1_avanzado': '1 Avanzado',
                '2': 'Nivel 2',
                '3': 'Nivel 3',
                '4': 'Nivel 4'
            };
            return niveles[nivel] || nivel || 'Pendiente';
        },

        formatearEstado(estado) {
            const estados = {
                'activo': 'Activo',
                'inactivo': 'Inactivo',
                'lesionado': 'Lesionado',
                'descanso': 'En Descanso',
                'pendiente': 'Pendiente'
            };
            return estados[estado?.toLowerCase()] || estado || 'Activo';
        },

        getNivelColor(nivel) {
            const colores = {
                'baby_titans': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
                '1_basico': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                '1_medio': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
                '1_avanzado': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
                '2': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                '3': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                '4': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
            };
            return colores[nivel] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        },

        getEstadoColor(estado) {
            const colores = {
                'activo': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                'inactivo': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                'lesionado': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                'descanso': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                'pendiente': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
            };
            return colores[estado?.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        },

        limpiarFiltros() {
            // Limpiar inputs
            document.querySelectorAll('input[type="text"], input[type="email"]').forEach(input => {
                input.value = '';
            });

            // Limpiar selects
            document.querySelectorAll('select').forEach(select => {
                select.value = '';
            });

            // Reset documento select
            const docSelect = document.getElementById('filtroTieneDocumento');
            if (docSelect) docSelect.value = 'todos';

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
            // Botón de descarga Excel
            document.getElementById('descargarExcelCompletoBtn')?.addEventListener('click', () => {
                this.descargarExcelCompleto();
            });

            // Botones de filtros
            document.getElementById('aplicarFiltrosBtn')?.addEventListener('click', () => {
                this.aplicarFiltros();
            });

            document.getElementById('limpiarFiltrosBtn')?.addEventListener('click', () => {
                this.limpiarFiltros();
            });

            // Enter en campos de texto
            document.querySelectorAll('#filtroNombreCompleto, #filtroNumeroDocumento, #filtroEmail').forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.aplicarFiltros();
                });
            });

            // Cambio en selects principales (aplicar automáticamente)
            ['filtroEstado', 'filtroNivel', 'filtroGrupoCompetitivo'].forEach(id => {
                document.getElementById(id)?.addEventListener('change', () => {
                    // Mostrar indicador de filtros activos
                    document.getElementById('filtrosAplicados')?.classList.remove('hidden');
                });
            });

            // Ayuda
            document.getElementById('btnAyuda')?.addEventListener('click', () => {
                alert('📋 GUÍA DE USO MEJORADA\n\n' +
                      '1️⃣ Usa los filtros principales (Estado, Nivel, Grupo Competitivo)\n' +
                      '2️⃣ Si necesitas más filtros, abre "Filtros Adicionales"\n' +
                      '3️⃣ Haz clic en "Buscar" para ver resultados\n' +
                      '4️⃣ Descarga PDFs individuales desde la tabla\n' +
                      '5️⃣ Descarga Excel con los filtros aplicados\n\n' +
                      '💡 TIP: Los filtros principales se aplican tanto al Excel como a la búsqueda');
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
                display: flex;
                align-items: center;
                gap: 12px;
            `;

            const icon = type === 'success' ? 'check_circle' :
                type === 'error' ? 'error' :
                    type === 'warning' ? 'warning' : 'info';

            notification.innerHTML = `
                <span class="material-symbols-outlined">${icon}</span>
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