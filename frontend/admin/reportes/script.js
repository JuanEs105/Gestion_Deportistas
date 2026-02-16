// ==========================================
// REPORTES APP - VERSIÓN CORREGIDA
// Tabla alineada correctamente
// ==========================================

if (typeof window.ReportesApp === 'undefined') {
    window.ReportesApp = {
        state: {
            deportistas: [],
            deportistasFiltrados: [],
            loading: false,
            filtros: {}
        },

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
                setTimeout(() => window.location.href = '/', 1500);
                return false;
            }
            return true;
        },

        // ==========================================
        // ACTUALIZAR VISTA PREVIA - CORREGIDO
        // ==========================================
        actualizarVistaPrevia() {
            const tbody = document.getElementById('tablaResultados');
            const sinResultados = document.getElementById('sinResultados');
            const resultadosTotales = document.getElementById('resultadosTotales');

            if (!tbody) return;

            tbody.innerHTML = '';

            if (this.state.deportistasFiltrados.length === 0) {
                sinResultados?.classList.remove('hidden');
                if (resultadosTotales) resultadosTotales.textContent = 'Mostrando 0 resultados';
                return;
            }

            sinResultados?.classList.add('hidden');

            const resultados = this.state.deportistasFiltrados.slice(0, 10);

            resultados.forEach(deportista => {
                const row = document.createElement('tr');
                row.className = 'border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800';

                // 🔥 OBTENER DATOS CORRECTAMENTE
                const user = deportista.user || deportista.User || {};
                
                // Nombre completo
                let nombreCompleto = '';
                if (deportista.nombre_completo && deportista.nombre_completo.trim()) {
                    nombreCompleto = deportista.nombre_completo;
                } else if (user.nombre || user.apellidos) {
                    nombreCompleto = `${user.nombre || ''} ${user.apellidos || ''}`.trim();
                } else {
                    nombreCompleto = deportista.nombre || 'Sin nombre';
                }

                // Documento
                const numeroDocumento = deportista.numero_documento || 
                                       user.numero_documento || 
                                       'Sin documento';

                // Nivel
                const nivelRaw = deportista.nivel_actual || 'pendiente';
                const nivelLegible = this.formatearNivel(nivelRaw);

                // Estado
                const estado = deportista.estado || 'activo';
                const estadoColor = this.getEstadoColor(estado);

                // Documento subido
                const tieneDoc = deportista.tiene_documento ?? false;

                row.innerHTML = `
                    <td class="px-6 py-4">
                        <div class="font-medium text-gray-900 dark:text-white">${nombreCompleto}</div>
                        <div class="text-xs text-gray-500">${user.email || ''}</div>
                    </td>
                    <td class="px-6 py-4 text-gray-700 dark:text-gray-300">${numeroDocumento}</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs font-semibold rounded ${nivelColor}">${nivelLegible}</span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs font-semibold rounded ${estadoColor}">${this.capitalize(estado)}</span>
                    </td>
                    <td class="px-6 py-4">
                        ${tieneDoc
                            ? '<span class="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">✓ Subido</span>'
                            : '<span class="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">✗ Pendiente</span>'}
                    </td>
                    <td class="px-6 py-4 text-right">
                        ${tieneDoc
                            ? `<button onclick="ReportesApp.descargarDocumentoIndividual('${deportista.id}')" 
                                      class="px-4 py-2 text-xs font-semibold bg-primary text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2 ml-auto">
                                   <span class="material-symbols-outlined" style="font-size: 16px;">download</span>
                                   Descargar
                               </button>`
                            : '<span class="text-gray-400 text-xs">No disponible</span>'}
                    </td>
                `;

                tbody.appendChild(row);
            });

            if (resultadosTotales) {
                resultadosTotales.textContent = `Mostrando ${Math.min(resultados.length, 10)} de ${this.state.deportistasFiltrados.length} resultados`;
            }
        },

        formatearNivel(nivel) {
            const niveles = {
                'baby_titans': 'Baby Titans',
                '1_basico': '1 Básico',
                '1_medio': '1 Medio',
                '1_avanzado': '1 Avanzado',
                '2': 'Nivel 2',
                '3': 'Nivel 3',
                '4': 'Nivel 4',
                'pendiente': 'Pendiente'
            };
            return niveles[nivel] || nivel;
        },

        getNivelColor(nivel) {
            const colores = {
                'baby_titans': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                '1_basico': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                '1_medio': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
                '1_avanzado': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
                '2': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                '3': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                '4': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                'pendiente': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            };
            return colores[nivel] || colores['pendiente'];
        },

        getEstadoColor(estado) {
            const colores = {
                'activo': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                'inactivo': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                'lesionado': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                'pendiente': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            };
            return colores[estado?.toLowerCase()] || colores['pendiente'];
        },

        capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        },

        // ==========================================
        // RESTO DE FUNCIONES (sin cambios)
        // ==========================================

        async descargarExcelCompleto() {
            try {
                console.log('📊 DESCARGANDO EXCEL...');
                this.mostrarLoading(true);

                const params = new URLSearchParams();

                const estadoChip = document.querySelector('.filtro-chip.estado.active');
                const estado = estadoChip?.dataset.estado || '';
                if (estado && estado !== '') params.append('estado', estado);

                const nivelSelect = document.getElementById('filtroNivelDetallado')?.value;
                const nivelChip = document.querySelector('.filtro-chip.nivel.active')?.dataset.nivel || '';
                const nivel = nivelSelect || nivelChip;
                if (nivel && nivel !== '') params.append('nivel', nivel);

                const grupoCompetitivo = document.getElementById('filtroGrupoCompetitivo')?.value;
                if (grupoCompetitivo && grupoCompetitivo !== '') params.append('equipoCompetitivo', grupoCompetitivo);

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
                if (tieneDocumento && tieneDocumento !== 'todos') params.append('tieneDocumento', tieneDocumento);

                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const baseURL = 'https://gestiondeportistas-production.up.railway.app/api/reportes/excel/grupal';
                const url = params.toString() ? `${baseURL}?${params}` : baseURL;

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    }
                });

                if (!response.ok) throw new Error(`Error ${response.status}`);

                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;

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

                this.showNotification('✅ Excel descargado exitosamente', 'success');

            } catch (error) {
                console.error('❌ Error:', error);
                this.showNotification('❌ Error al generar Excel', 'error');
            } finally {
                this.mostrarLoading(false);
            }
        },

        async descargarDocumentoIndividual(deportistaId) {
            try {
                console.log(`📄 Descargando documento ID: ${deportistaId}`);
                this.mostrarLoading(true);

                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const url = `https://gestiondeportistas-production.up.railway.app/api/reportes/documento/${deportistaId}`;

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) throw new Error('Error descargando documento');

                const data = await response.json();

                if (!data.success || !data.url) throw new Error('No se pudo obtener el documento');

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

                this.showNotification('✅ Documento descargado', 'success');

            } catch (error) {
                console.error('❌ Error:', error);
                this.showNotification('Error descargando documento', 'error');
            } finally {
                this.mostrarLoading(false);
            }
        },

        async aplicarFiltros() {
            try {
                this.mostrarLoading(true);

                const params = new URLSearchParams();

                const estadoChip = document.querySelector('.filtro-chip.estado.active');
                const estado = estadoChip?.dataset.estado || '';
                if (estado && estado !== '') params.append('estado', estado);

                const nivelSelect = document.getElementById('filtroNivelDetallado')?.value;
                const nivelChip = document.querySelector('.filtro-chip.nivel.active')?.dataset.nivel || '';
                const nivel = nivelSelect || nivelChip;
                if (nivel && nivel !== '') params.append('nivel', nivel);

                const grupoCompetitivo = document.getElementById('filtroGrupoCompetitivo')?.value;
                if (grupoCompetitivo && grupoCompetitivo !== '') params.append('equipoCompetitivo', grupoCompetitivo);

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
                if (tieneDocumento && tieneDocumento !== 'todos') params.append('tieneDocumento', tieneDocumento);

                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const url = `https://gestiondeportistas-production.up.railway.app/api/reportes/deportistas?${params}`;

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
                    this.showNotification(`✅ ${this.state.deportistasFiltrados.length} deportistas encontrados`, 'success');
                }

            } catch (error) {
                console.error('❌ Error:', error);
                this.showNotification('Error aplicando filtros', 'error');
            } finally {
                this.mostrarLoading(false);
            }
        },

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
                console.error('❌ Error estadísticas:', error);
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
                console.error('❌ Error deportistas:', error);
            } finally {
                this.mostrarLoading(false);
            }
        },

        actualizarEstadisticasUI(stats) {
            document.getElementById('totalDeportistas').textContent = stats.total_deportistas || 0;
            document.getElementById('conDocumento').textContent = stats.con_documento || 0;
            document.getElementById('sinDocumento').textContent = stats.sin_documento || 0;
            document.getElementById('cloudinaryDocs').textContent = stats.cloudinary || 0;
        },

        actualizarContadores() {
            const contador = document.getElementById('contadorResultados');
            if (contador) contador.textContent = this.state.deportistasFiltrados.length;
        },

        limpiarFiltros() {
            document.querySelectorAll('input[type="text"], input[type="email"]').forEach(input => {
                input.value = '';
            });

            document.querySelectorAll('select').forEach(select => {
                select.value = select.id === 'filtroTieneDocumento' ? 'todos' : '';
            });

            document.querySelectorAll('.filtro-chip').forEach(chip => chip.classList.remove('active'));
            document.querySelectorAll('.filtro-chip[data-estado=""], .filtro-chip[data-nivel=""]').forEach(chip => {
                chip.classList.add('active');
            });

            document.getElementById('filtrosAplicados')?.classList.add('hidden');

            this.state.deportistasFiltrados = [...this.state.deportistas];
            this.actualizarVistaPrevia();
            this.actualizarContadores();

            this.showNotification('✅ Filtros limpiados', 'success');
        },

        mostrarLoading(mostrar) {
            const loading = document.getElementById('loadingIndicator');
            if (loading) loading.classList.toggle('hidden', !mostrar);
        },

        updateUserInfo() {
            const userEmail = document.getElementById('userEmail');
            if (userEmail) {
                try {
                    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
                    const user = userStr ? JSON.parse(userStr) : null;
                    if (user?.email) userEmail.textContent = user.email;
                } catch (e) {
                    console.error('Error updateUserInfo:', e);
                }
            }
        },

        configurarEventos() {
            document.getElementById('descargarExcelCompletoBtn')?.addEventListener('click', () => {
                this.descargarExcelCompleto();
            });

            document.getElementById('aplicarFiltrosBtn')?.addEventListener('click', () => {
                this.aplicarFiltros();
            });

            document.getElementById('limpiarFiltrosBtn')?.addEventListener('click', () => {
                this.limpiarFiltros();
            });

            document.querySelectorAll('.filtro-chip').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    const tipo = e.target.classList.contains('estado') ? 'estado' : 'nivel';
                    document.querySelectorAll(`.filtro-chip.${tipo}`).forEach(c => c.classList.remove('active'));
                    e.target.classList.add('active');
                });
            });

            document.querySelectorAll('#filtroNombreCompleto, #filtroNumeroDocumento, #filtroEmail, #filtroCiudad, #filtroTelefono, #filtroEPS').forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.aplicarFiltros();
                });
            });

            document.getElementById('btnAyuda')?.addEventListener('click', () => {
                alert(
                    '📋 GUÍA DE USO\n\n' +
                    '1️⃣ Completa los filtros que necesites\n' +
                    '2️⃣ Haz clic en "Aplicar" para buscar\n' +
                    '3️⃣ Los deportistas aparecen en la tabla\n' +
                    '4️⃣ Descarga PDFs individuales\n' +
                    '5️⃣ O descarga el Excel completo'
                );
            });
        },

        logout() {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';
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
            const bgColor = type === 'error' ? '#EF4444'
                : type === 'success' ? '#10B981'
                : type === 'warning' ? '#F59E0B'
                : '#3B82F6';

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
                <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;margin-left:10px;cursor:pointer;">✕</button>
            `;

            container.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }
    };
}

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

    if (window.ReportesApp) window.ReportesApp.init();
});

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

if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
}

console.log('✅ Reportes App CORREGIDO - Tabla alineada');