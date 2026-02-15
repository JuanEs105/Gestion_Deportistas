// ==========================================
// REPORTES APP - VERSIÓN FINAL Y COMPLETA
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
        // DESCARGAR EXCEL CON FILTROS
        // ==========================================
        async descargarExcelCompleto() {
            try {
                console.log('📊 DESCARGANDO EXCEL...');
                this.mostrarLoading(true);

                const params = new URLSearchParams();

                // FILTRO ESTADO (desde chips)
                const estadoChip = document.querySelector('.filtro-chip.estado.active');
                const estado = estadoChip?.dataset.estado || '';
                if (estado && estado !== '') {
                    params.append('estado', estado);
                    console.log('📊 Filtro Estado:', estado);
                }

                // FILTRO NIVEL (select detallado tiene prioridad, luego chip)
                const nivelSelect = document.getElementById('filtroNivelDetallado')?.value;
                const nivelChip = document.querySelector('.filtro-chip.nivel.active')?.dataset.nivel || '';
                const nivel = nivelSelect || nivelChip;
                if (nivel && nivel !== '') {
                    params.append('nivel', nivel);
                    console.log('📈 Filtro Nivel:', nivel);
                }

                // FILTRO GRUPO COMPETITIVO
                const grupoCompetitivo = document.getElementById('filtroGrupoCompetitivo')?.value;
                if (grupoCompetitivo && grupoCompetitivo !== '') {
                    params.append('equipoCompetitivo', grupoCompetitivo);
                    console.log('🏆 Filtro Grupo:', grupoCompetitivo);
                }

                // FILTROS ADICIONALES DE TEXTO
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

                let mensaje = '✅ Excel descargado';
                if (estado || nivel || grupoCompetitivo) mensaje += ' con filtros aplicados';
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
                if (!token) throw new Error('No hay sesión activa');

                const url = `https://gestiondeportistas-production.up.railway.app/api/reportes/documento/${deportistaId}`;

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) throw new Error('Sesión expirada');
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

                // FILTRO ESTADO (desde chips)
                const estadoChip = document.querySelector('.filtro-chip.estado.active');
                const estado = estadoChip?.dataset.estado || '';
                if (estado && estado !== '') {
                    params.append('estado', estado);
                    console.log('📊 Filtro Estado:', estado);
                }

                // FILTRO NIVEL (select detallado tiene prioridad, luego chip)
                const nivelSelect = document.getElementById('filtroNivelDetallado')?.value;
                const nivelChip = document.querySelector('.filtro-chip.nivel.active')?.dataset.nivel || '';
                const nivel = nivelSelect || nivelChip;
                if (nivel && nivel !== '') {
                    params.append('nivel', nivel);
                    console.log('📈 Filtro Nivel:', nivel);
                }

                // FILTRO GRUPO COMPETITIVO
                const grupoCompetitivo = document.getElementById('filtroGrupoCompetitivo')?.value;
                if (grupoCompetitivo && grupoCompetitivo !== '') {
                    params.append('equipoCompetitivo', grupoCompetitivo);
                    console.log('🏆 Filtro Grupo:', grupoCompetitivo);
                }

                // FILTROS ADICIONALES DE TEXTO
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
        // CARGAR DATOS INICIALES
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
                if (resultadosTotales) resultadosTotales.textContent = 'Mostrando 0 resultados';
                return;
            }

            sinResultados?.classList.add('hidden');

            const resultados = this.state.deportistasFiltrados.slice(0, 10);

            // 🔍 DEBUG TEMPORAL - ver estructura real del API (borrar cuando funcione)
            if (resultados.length > 0) {
                console.log('=== ESTRUCTURA DEL API ===');
                console.log('Claves del objeto:', Object.keys(resultados[0]));
                console.log('Objeto completo:', JSON.stringify(resultados[0], null, 2));
                console.log('=========================');
            }

            resultados.forEach(deportista => {
                const row = document.createElement('tr');

                // Buscar en todas las posibles estructuras
                const d = deportista;
                const u = deportista.User || deportista.user || {};
                const dd = deportista.deportista || {};

                // DEBUG por fila - ver exactamente qué tiene cada campo
                console.log('Deportista raw:', JSON.stringify(d));

                // NOMBRE: buscar campo que tenga letras (no solo números)
                const esNombre = (val) => val && typeof val === 'string' && isNaN(val.replace(/\s/g,''));

                let nombre = '';
                const candidatosNombre = [
                    d.nombre_completo, d.nombreCompleto, d.full_name,
                    u.nombre, u.name, dd.nombre, d.nombre, d.name
                ];
                for (const c of candidatosNombre) {
                    if (esNombre(c)) { nombre = c; break; }
                }

                // DOCUMENTO: buscar campo que tenga solo números
                const esDocumento = (val) => val && typeof val === 'string' && /^\d+$/.test(val.trim());

                let documento = '';
                const candidatosDoc = [
                    d.numero_documento, d.numeroDocumento, d.cedula,
                    d.documento, u.cedula, u.numero_documento, u.documento
                ];
                for (const c of candidatosDoc) {
                    if (esDocumento(c)) { documento = c; break; }
                }

                const nivel = d.nivel_actual
                    || dd.nivel_actual
                    || d.nivelActual
                    || d.nivel
                    || 'Pendiente';

                const estado = d.estado
                    || dd.estado
                    || d.status
                    || 'activo';

                const tieneDoc = d.tiene_documento
                    ?? d.tieneDocumento
                    ?? d.has_document
                    ?? false;

                row.innerHTML = `
                    <td class="px-6 py-4 font-medium">${nombre}</td>
                    <td class="px-6 py-4">${documento}</td>
                    <td class="px-6 py-4">
                        <span class="badge bg-blue-100">${nivel}</span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="badge ${this.getEstadoColor(estado)}">${estado}</span>
                    </td>
                    <td class="px-6 py-4">
                        ${tieneDoc
                            ? '<span class="badge bg-green-100">✓ Subido</span>'
                            : '<span class="badge bg-gray-100">✗ Pendiente</span>'
                        }
                    </td>
                    <td class="px-6 py-4 text-right">
                        ${tieneDoc
                            ? `<button onclick="ReportesApp.descargarDocumentoIndividual('${deportista.id}')"
                                class="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-red-700 transition-colors">
                                    Descargar
                               </button>`
                            : '<span class="text-gray-400 text-xs">No disponible</span>'
                        }
                    </td>
                `;

                tbody.appendChild(row);
            });

            if (resultadosTotales) {
                resultadosTotales.textContent = `Mostrando ${Math.min(resultados.length, 10)} de ${this.state.deportistasFiltrados.length} resultados`;
            }
        },

        actualizarContadores() {
            const contador = document.getElementById('contadorResultados');
            if (contador) contador.textContent = this.state.deportistasFiltrados.length;
        },

        getEstadoColor(estado) {
            const colores = {
                'activo': 'bg-green-100',
                'inactivo': 'bg-red-100',
                'lesionado': 'bg-yellow-100',
                'pendiente': 'bg-gray-100'
            };
            return colores[estado?.toLowerCase()] || 'bg-gray-100';
        },

        limpiarFiltros() {
            // Limpiar inputs de texto
            document.querySelectorAll('input[type="text"], input[type="email"]').forEach(input => {
                input.value = '';
            });

            // Limpiar selects
            document.querySelectorAll('select').forEach(select => {
                select.value = select.id === 'filtroTieneDocumento' ? 'todos' : '';
            });

            // Resetear chips: quitar active de todos, poner active en "Todos"
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

        // ==========================================
        // CONFIGURAR EVENTOS
        // ==========================================
        configurarEventos() {
            // Descargar Excel
            document.getElementById('descargarExcelCompletoBtn')?.addEventListener('click', () => {
                this.descargarExcelCompleto();
            });

            // Aplicar filtros
            document.getElementById('aplicarFiltrosBtn')?.addEventListener('click', () => {
                this.aplicarFiltros();
            });

            // Limpiar filtros
            document.getElementById('limpiarFiltrosBtn')?.addEventListener('click', () => {
                this.limpiarFiltros();
            });

            // Chips de estado y nivel
            document.querySelectorAll('.filtro-chip').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    const tipo = e.target.classList.contains('estado') ? 'estado' : 'nivel';
                    document.querySelectorAll(`.filtro-chip.${tipo}`).forEach(c => c.classList.remove('active'));
                    e.target.classList.add('active');
                });
            });

            // Enter en campos de texto dispara búsqueda
            document.querySelectorAll('#filtroNombreCompleto, #filtroNumeroDocumento, #filtroEmail, #filtroCiudad, #filtroTelefono, #filtroEPS').forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.aplicarFiltros();
                });
            });

            // Botón de ayuda
            document.getElementById('btnAyuda')?.addEventListener('click', () => {
                alert(
                    '📋 GUÍA DE USO\n\n' +
                    '1️⃣ Completa los filtros que necesites (nombre, documento, email, etc.)\n' +
                    '2️⃣ Selecciona Estado, Nivel y/o Grupo Competitivo\n' +
                    '3️⃣ Haz clic en "Aplicar" para buscar\n' +
                    '4️⃣ Los deportistas encontrados aparecen en la tabla\n' +
                    '5️⃣ Descarga PDFs individuales con el botón "Descargar"\n' +
                    '6️⃣ O descarga el Excel completo con "Descargar Excel"'
                );
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

// ==========================================
// INICIALIZAR AL CARGAR DOM
// ==========================================
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

// ==========================================
// TEMA OSCURO
// ==========================================
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