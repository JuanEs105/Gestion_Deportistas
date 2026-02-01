// ===================================
// MIS EVALUACIONES - TITANES EVOLUTION
// JavaScript Funcional
// ===================================

console.log('🎯 Inicializando Mis Evaluaciones...');

// ==========================================
// VARIABLES GLOBALES
// ==========================================
let deportistaData = null;
let evaluacionesData = [];
let evaluacionesFiltradas = [];
let filtros = {
    categoria: 'todas',
    estado: 'todas',
    orden: 'reciente'
};

const EVALUACIONES_POR_PAGINA = 10;
let paginaActual = 1;

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM cargado');
    
    // Verificar autenticación
    if (!window.DeportistaAPI.checkAuth()) {
        return;
    }
    
    // Configurar eventos
    setupEventListeners();
    
    // Cargar datos
    cargarDatos();
});

// ==========================================
// CONFIGURAR EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
                window.DeportistaAPI.logout();
            }
        });
    }
    
    // Refresh
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            cargarDatos();
        });
    }
    
    // Filtros
    const filtroCategoria = document.getElementById('filtroCategoria');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroOrden = document.getElementById('filtroOrden');
    
    if (filtroCategoria) {
        filtroCategoria.addEventListener('change', (e) => {
            filtros.categoria = e.target.value;
            aplicarFiltros();
        });
    }
    
    if (filtroEstado) {
        filtroEstado.addEventListener('change', (e) => {
            filtros.estado = e.target.value;
            aplicarFiltros();
        });
    }
    
    if (filtroOrden) {
        filtroOrden.addEventListener('change', (e) => {
            filtros.orden = e.target.value;
            aplicarFiltros();
        });
    }
    
    // Descargar reporte
    const downloadBtn = document.getElementById('downloadReportBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            descargarReportePDF();
        });
    }
    
    console.log('✅ Event listeners configurados');
}

// ==========================================
// CARGAR DATOS
// ==========================================
async function cargarDatos() {
    try {
        showLoading();
        console.log('📥 Cargando datos...');
        
        // Cargar perfil del deportista
        deportistaData = await window.DeportistaAPI.getMe();
        if (!deportistaData) {
            throw new Error('No se pudo cargar el perfil del deportista');
        }
        
        // Obtener nombre usando la misma estructura que el dashboard
        const user = deportistaData.user || {};
        const nombreFinal = user.nombre || deportistaData.nombre || window.DeportistaAPI.user?.nombre || window.DeportistaAPI.user?.name || 'Deportista';
        
        console.log('👤 Perfil cargado:', nombreFinal);
        
        // Actualizar perfil en sidebar con nombre correcto
        actualizarPerfilSidebar({ ...deportistaData, nombre: nombreFinal, user: user });
        
        // Cargar evaluaciones
        evaluacionesData = await window.DeportistaAPI.getEvaluaciones();
        console.log('📋 Evaluaciones cargadas:', evaluacionesData.length);
        
        // Aplicar filtros iniciales
        aplicarFiltros();
        
        // Renderizar todo
        renderizarContenido();
        
        hideLoading();
        showContent();
        
        window.DeportistaAPI.showNotification('✅ Evaluaciones cargadas exitosamente', 'success');
        
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        showError(error.message || 'Error al cargar tus evaluaciones');
        hideLoading();
    }
}

// ==========================================
// ACTUALIZAR PERFIL EN SIDEBAR
// ==========================================
function actualizarPerfilSidebar(deportista) {
    const profileName = document.getElementById('profileName');
    const profileInitial = document.getElementById('profileInitial');
    const profileAvatarContainer = document.getElementById('profileAvatarContainer');
    
    const nombreMostrar = deportista.nombre || 'Deportista';
    
    if (profileName) {
        profileName.textContent = nombreMostrar;
    }
    
    // Avatar: foto o inicial
    if (profileAvatarContainer) {
        if (deportista.foto_perfil) {
            profileAvatarContainer.innerHTML = `
                <img src="${deportista.foto_perfil}" alt="${nombreMostrar}" class="w-full h-full object-cover">
            `;
        } else if (profileInitial) {
            profileInitial.textContent = nombreMostrar.charAt(0).toUpperCase();
        }
    }
}

// ==========================================
// APLICAR FILTROS
// ==========================================
function aplicarFiltros() {
    console.log('🔍 Aplicando filtros:', filtros);
    
    evaluacionesFiltradas = [...evaluacionesData];
    
    // Filtrar por categoría
    if (filtros.categoria !== 'todas') {
        evaluacionesFiltradas = evaluacionesFiltradas.filter(e => 
            e.habilidad?.categoria === filtros.categoria
        );
    }
    
    // Filtrar por estado
    if (filtros.estado === 'completadas') {
        evaluacionesFiltradas = evaluacionesFiltradas.filter(e => e.completado);
    } else if (filtros.estado === 'pendientes') {
        evaluacionesFiltradas = evaluacionesFiltradas.filter(e => !e.completado);
    }
    
    // Ordenar
    switch (filtros.orden) {
        case 'reciente':
            evaluacionesFiltradas.sort((a, b) => new Date(b.fecha_evaluacion) - new Date(a.fecha_evaluacion));
            break;
        case 'antigua':
            evaluacionesFiltradas.sort((a, b) => new Date(a.fecha_evaluacion) - new Date(b.fecha_evaluacion));
            break;
        case 'mejor':
            evaluacionesFiltradas.sort((a, b) => b.puntuacion - a.puntuacion);
            break;
        case 'peor':
            evaluacionesFiltradas.sort((a, b) => a.puntuacion - b.puntuacion);
            break;
    }
    
    console.log('✅ Filtros aplicados. Resultados:', evaluacionesFiltradas.length);
    
    // Re-renderizar
    if (deportistaData) {
        renderizarContenido();
    }
}

// ==========================================
// RENDERIZAR CONTENIDO COMPLETO
// ==========================================
function renderizarContenido() {
    renderizarHeader();
    renderizarUltimas3Evaluaciones();
    renderizarFeedbackDestacado();
    renderizarHistorialCompleto();
    renderizarRadarChart();
    renderizarEstadisticas();
}

// ==========================================
// RENDERIZAR HEADER
// ==========================================
function renderizarHeader() {
    const promedioGlobal = document.getElementById('promedioGlobal');
    const nivelPromedio = document.getElementById('nivelPromedio');
    
    if (evaluacionesData.length === 0) {
        promedioGlobal.textContent = '0.0';
        nivelPromedio.textContent = 'Sin Evaluaciones';
        return;
    }
    
    const promedio = (evaluacionesData.reduce((sum, e) => sum + e.puntuacion, 0) / evaluacionesData.length).toFixed(1);
    promedioGlobal.textContent = promedio;
    
    if (promedio >= 9) {
        nivelPromedio.textContent = 'Nivel Elite';
    } else if (promedio >= 7) {
        nivelPromedio.textContent = 'Nivel Pro';
    } else if (promedio >= 5) {
        nivelPromedio.textContent = 'Nivel Sólido';
    } else {
        nivelPromedio.textContent = 'En Desarrollo';
    }
}

// ==========================================
// RENDERIZAR ÚLTIMAS 3 EVALUACIONES
// ==========================================
function renderizarUltimas3Evaluaciones() {
    const container = document.getElementById('ultimasEvaluacionesContainer');
    if (!container) return;
    
    const ultimas3 = evaluacionesData
        .sort((a, b) => new Date(b.fecha_evaluacion) - new Date(a.fecha_evaluacion))
        .slice(0, 3);
    
    if (ultimas3.length === 0) {
        container.innerHTML = `
            <div class="col-span-3 text-center py-12 text-gray-400">
                <div class="text-6xl mb-4">📋</div>
                <h4 class="text-xl font-bold mb-2">No tienes evaluaciones aún</h4>
                <p class="text-sm">Tu entrenador registrará aquí tus evaluaciones</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = ultimas3.map((evaluacion, index) => {
        const fecha = formatFecha(evaluacion.fecha_evaluacion, 'corta');
        const entrenador = evaluacion.entrenador?.nombre || 'Entrenador';
        const entrenadorFoto = evaluacion.entrenador?.foto_perfil;
        const puntuacion = evaluacion.puntuacion;
        const completado = evaluacion.completado;
        
        let iconoEstado = 'check_circle';
        let colorEstado = 'primary';
        
        if (index === 0 && puntuacion >= 9) {
            iconoEstado = 'check_circle';
            colorEstado = 'primary';
        } else if (completado) {
            iconoEstado = 'verified';
            colorEstado = 'green-500';
        } else {
            iconoEstado = 'trending_up';
            colorEstado = 'blue-500';
        }
        
        const borderClass = index === 0 ? 'border-2 border-primary/40 shadow-[0_0_15px_rgba(226,27,35,0.2)]' : 'border border-white/10';
        
        return `
            <div class="bg-zinc-900/90 ${borderClass} p-6 rounded-xl interactive-hover relative overflow-hidden group slide-in-up" style="animation-delay: ${index * 0.1}s">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <p class="text-[10px] uppercase font-bold ${index === 0 ? 'text-primary' : 'text-gray-400'} tracking-widest">${fecha}</p>
                        <p class="font-display text-2xl font-bold italic text-white uppercase">Sesión #${evaluacionesData.length - evaluacionesData.indexOf(evaluacion)}</p>
                    </div>
                    <div class="bg-${colorEstado}/20 text-${colorEstado} p-2 rounded-lg flex items-center justify-center">
                        <span class="material-symbols-outlined text-2xl fill-1">${iconoEstado}</span>
                    </div>
                </div>
                <div class="flex items-center gap-4 mb-6">
                    ${entrenadorFoto ? 
                        `<img src="${entrenadorFoto}" alt="${entrenador}" class="w-10 h-10 rounded-full object-cover border border-${index === 0 ? 'primary' : 'white'}/40" />` :
                        `<div class="w-10 h-10 rounded-full overflow-hidden border border-${index === 0 ? 'primary' : 'white'}/40 bg-primary/20 flex items-center justify-center">
                            <span class="material-symbols-outlined text-primary">person</span>
                        </div>`
                    }
                    <p class="text-sm font-semibold text-gray-300">${entrenador}</p>
                </div>
                <div class="flex items-baseline justify-between">
                    <div class="flex items-baseline gap-2">
                        <span class="font-display text-5xl font-bold ${index === 0 ? 'text-primary neon-text' : 'text-gray-300'} italic">${puntuacion.toFixed(1)}</span>
                        <span class="text-[10px] uppercase font-bold text-gray-500">${puntuacion >= 9 ? 'Elite Score' : puntuacion >= 7 ? 'Pro Score' : 'Solid Base'}</span>
                    </div>
                    <button onclick="verDetalleEvaluacion(${evaluacion.id})" class="text-primary group-hover:bg-primary group-hover:text-white p-2 rounded-full border border-primary/20 transition-all">
                        <span class="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// RENDERIZAR FEEDBACK DESTACADO
// ==========================================
function renderizarFeedbackDestacado() {
    const container = document.getElementById('feedbackDestacadoContainer');
    if (!container) return;
    
    const evaluacionDestacada = evaluacionesData
        .filter(e => e.observaciones && e.observaciones.trim() !== '')
        .sort((a, b) => new Date(b.fecha_evaluacion) - new Date(a.fecha_evaluacion))[0];
    
    if (!evaluacionDestacada) {
        container.innerHTML = `
            <div class="p-8 text-center text-gray-400">
                <div class="text-5xl mb-4">💬</div>
                <h4 class="text-xl font-bold mb-2">Sin feedback reciente</h4>
                <p class="text-sm">Cuando recibas evaluaciones con comentarios, aparecerán aquí</p>
            </div>
        `;
        return;
    }
    
    const entrenador = evaluacionDestacada.entrenador?.nombre || 'Entrenador';
    const entrenadorFoto = evaluacionDestacada.entrenador?.foto_perfil;
    const puntuacion = evaluacionDestacada.puntuacion;
    const observaciones = evaluacionDestacada.observaciones;
    
    container.innerHTML = `
        <div class="absolute top-0 right-0 top-performance-badge px-4 py-1.5 flex items-center gap-2 transform translate-x-1 translate-y-2 -rotate-2 z-20">
            <span class="material-symbols-outlined text-sm fill-1">stars</span>
            <span class="font-display font-bold italic tracking-wider text-[10px] uppercase">Destacado Reciente</span>
        </div>
        <div class="p-8">
            <div class="relative flex flex-col justify-center">
                <div class="flex items-center gap-4 mb-8">
                    <h4 class="font-display text-xl font-bold uppercase tracking-widest text-primary italic flex items-center gap-2">
                        <span class="material-symbols-outlined text-2xl">forum</span> Feedback del Coach
                    </h4>
                    <div class="flex-1 h-px bg-white/5"></div>
                </div>
                <div class="relative bg-zinc-800 border-2 border-primary/30 p-10 rounded-2xl shadow-2xl">
                    <span class="material-symbols-outlined absolute -top-8 -left-4 text-primary text-8xl opacity-80 neon-text leading-none select-none">format_quote</span>
                    <div class="flex flex-col md:flex-row items-center md:items-start gap-8">
                        <div class="flex-shrink-0 flex flex-col items-center">
                            <div class="bg-primary text-white font-display text-6xl font-bold px-5 py-2 italic rounded-lg neon-border mb-3">${puntuacion.toFixed(1)}</div>
                            <span class="text-[10px] uppercase font-bold text-primary tracking-widest text-center">Calificación<br/>Final</span>
                        </div>
                        <div class="flex-1">
                            <p class="italic text-xl leading-relaxed text-gray-200 mb-6">
                                "${observaciones}"
                            </p>
                            <div class="flex items-center gap-4">
                                ${entrenadorFoto ?
                                    `<img src="${entrenadorFoto}" alt="${entrenador}" class="w-12 h-12 rounded-full object-cover border-2 border-primary" />` :
                                    `<div class="w-12 h-12 rounded-full overflow-hidden border-2 border-primary bg-primary/20 flex items-center justify-center">
                                        <span class="material-symbols-outlined text-primary text-2xl">person</span>
                                    </div>`
                                }
                                <div>
                                    <p class="font-bold text-white">${entrenador}</p>
                                    <p class="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Head Technical Coach</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="absolute -bottom-4 right-10 w-8 h-8 bg-zinc-800 border-r-2 border-b-2 border-primary/30 chat-bubble-tail rotate-45"></div>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// RENDERIZAR HISTORIAL COMPLETO
// ==========================================
function renderizarHistorialCompleto() {
    const container = document.getElementById('historialEvaluacionesContainer');
    const contador = document.getElementById('contadorEvaluaciones');
    
    if (!container) return;
    
    if (contador) {
        contador.textContent = `${evaluacionesFiltradas.length} evaluacion${evaluacionesFiltradas.length !== 1 ? 'es' : ''}`;
    }
    
    if (evaluacionesFiltradas.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-400">
                <div class="text-6xl mb-4">🔍</div>
                <h4 class="text-xl font-bold mb-2">No hay evaluaciones con estos filtros</h4>
                <p class="text-sm">Intenta cambiar los filtros para ver más resultados</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = evaluacionesFiltradas.map((evaluacion, index) => {
        const habilidad = evaluacion.habilidad?.nombre || 'Habilidad';
        const categoria = evaluacion.habilidad?.categoria || 'habilidad';
        const fecha = formatFecha(evaluacion.fecha_evaluacion);
        const puntuacion = evaluacion.puntuacion;
        const minimo = evaluacion.habilidad?.puntuacion_minima || 7;
        const completado = evaluacion.completado;
        const observaciones = evaluacion.observaciones;
        const videoUrl = evaluacion.video_url;
        const entrenador = evaluacion.entrenador?.nombre || 'Entrenador';
        
        const categoryIcon = getCategoriaIcon(categoria);
        const categoryClass = `category-badge-${categoria.replace('_', '-')}`;
        
        return `
            <div class="evaluation-card ${completado ? 'evaluation-card-completed' : 'evaluation-card-pending'} bg-zinc-800 border-2 rounded-xl p-5 slide-in-up" style="animation-delay: ${index * 0.05}s">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3 flex-1">
                        <span class="text-3xl">${categoryIcon}</span>
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <h4 class="font-bold text-white text-lg">${habilidad}</h4>
                                <span class="px-2 py-1 ${categoryClass} rounded-full text-xs font-bold uppercase">
                                    ${categoria.replace('_', ' ')}
                                </span>
                            </div>
                            <p class="text-xs text-gray-400">📅 ${fecha} • 👨‍🏫 ${entrenador}</p>
                        </div>
                    </div>
                    <div class="score-circle" style="--score: ${puntuacion * 10}">
                        <span class="text-primary neon-text">${puntuacion}</span>
                    </div>
                </div>
                
                <div class="flex items-center gap-4 text-sm text-gray-400 mb-3">
                    <span>Mínimo: <span class="font-bold text-blue-400">${minimo}/10</span></span>
                    <span>•</span>
                    <span class="${completado ? 'text-green-400' : 'text-yellow-400'} font-bold">
                        ${completado ? '✅ Completado' : '🔄 En Progreso'}
                    </span>
                </div>
                
                ${observaciones || videoUrl ? `
                    <div class="mt-4">
                        <button onclick="toggleFeedback(${evaluacion.id})" class="flex items-center justify-between w-full p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-all">
                            <div class="flex items-center gap-2">
                                <span class="text-lg">💬</span>
                                <span class="font-semibold text-primary">Retroalimentación del Entrenador</span>
                                ${videoUrl ? '<span class="text-xs px-2 py-1 bg-primary/30 text-primary rounded-full ml-2">🎥 Video</span>' : ''}
                            </div>
                            <span class="text-primary feedback-toggle-icon-${evaluacion.id}">▼</span>
                        </button>
                        
                        <div id="feedback-${evaluacion.id}" class="feedback-collapsed mt-3">
                            <div class="p-4 bg-zinc-900 rounded-lg space-y-3">
                                ${observaciones ? `
                                    <div>
                                        <p class="text-sm font-semibold text-gray-300 mb-2 flex items-center">
                                            <span class="mr-2">📝</span> Observaciones:
                                        </p>
                                        <p class="text-sm text-gray-400 bg-zinc-800 p-3 rounded-lg">
                                            ${observaciones}
                                        </p>
                                    </div>
                                ` : ''}
                                
                                ${videoUrl ? `
                                    <div>
                                        <p class="text-sm font-semibold text-gray-300 mb-2 flex items-center">
                                            <span class="mr-2">🎥</span> Video de Retroalimentación:
                                        </p>
                                        <div class="bg-zinc-800 p-3 rounded-lg">
                                            <a href="${videoUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition">
                                                <span class="mr-2">▶️</span>
                                                Ver Video de Retroalimentación
                                            </a>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// ==========================================
// RENDERIZAR RADAR CHART
// ==========================================
function renderizarRadarChart() {
    const radarPolygon = document.getElementById('radarPolygon');
    if (!radarPolygon) return;
    
    const ultimas6 = evaluacionesData
        .sort((a, b) => new Date(b.fecha_evaluacion) - new Date(a.fecha_evaluacion))
        .slice(0, 6);
    
    if (ultimas6.length === 0) {
        radarPolygon.setAttribute('points', '50,50 50,50 50,50 50,50 50,50');
        return;
    }
    
    // Calcular promedio por tipo (simplificado)
    const puntuaciones = ultimas6.map(e => e.puntuacion);
    const promedio = puntuaciones.reduce((a, b) => a + b, 0) / puntuaciones.length;
    
    // Generar puntos del polígono (5 puntos para 5 ejes)
    const factor = promedio / 10; // Normalizar a 0-1
    const radio = 45; // Radio máximo
    const centro = 50;
    
    const puntos = [
        { x: centro, y: centro - (radio * factor) }, // Top
        { x: centro + (radio * factor * 0.95), y: centro - (radio * factor * 0.35) }, // Top-right
        { x: centro + (radio * factor * 0.8), y: centro + (radio * factor * 0.85) }, // Bottom-right
        { x: centro - (radio * factor * 0.8), y: centro + (radio * factor * 0.85) }, // Bottom-left
        { x: centro - (radio * factor * 0.95), y: centro - (radio * factor * 0.35) }  // Top-left
    ];
    
    const pointsString = puntos.map(p => `${p.x},${p.y}`).join(' ');
    radarPolygon.setAttribute('points', pointsString);
}

// ==========================================
// RENDERIZAR ESTADÍSTICAS
// ==========================================
function renderizarEstadisticas() {
    const container = document.getElementById('estadisticasContainer');
    if (!container) return;
    
    if (evaluacionesData.length === 0) {
        container.innerHTML = `
            <p class="text-gray-400 text-sm text-center py-4">
                No hay estadísticas disponibles
            </p>
        `;
        return;
    }
    
    const completadas = evaluacionesData.filter(e => e.completado).length;
    const mejor = Math.max(...evaluacionesData.map(e => e.puntuacion));
    const peor = Math.min(...evaluacionesData.map(e => e.puntuacion));
    const promedio = (evaluacionesData.reduce((sum, e) => sum + e.puntuacion, 0) / evaluacionesData.length).toFixed(1);
    const conFeedback = evaluacionesData.filter(e => e.observaciones || e.video_url).length;
    
    container.innerHTML = `
        <div class="bg-zinc-800 p-3 rounded-lg flex justify-between items-center border-l-2 border-primary">
            <span class="text-xs uppercase font-bold text-gray-400">Total Evaluaciones</span>
            <span class="font-bold text-primary text-lg">${evaluacionesData.length}</span>
        </div>
        <div class="bg-zinc-800 p-3 rounded-lg flex justify-between items-center border-l-2 border-green-500">
            <span class="text-xs uppercase font-bold text-gray-400">Completadas</span>
            <span class="font-bold text-green-400 text-lg">${completadas}</span>
        </div>
        <div class="bg-zinc-800 p-3 rounded-lg flex justify-between items-center border-l-2 border-yellow-500">
            <span class="text-xs uppercase font-bold text-gray-400">Promedio</span>
            <span class="font-bold text-yellow-400 text-lg">${promedio}</span>
        </div>
        <div class="bg-zinc-800 p-3 rounded-lg flex justify-between items-center border-l-2 border-blue-500">
            <span class="text-xs uppercase font-bold text-gray-400">Mejor Puntuación</span>
            <span class="font-bold text-blue-400 text-lg">${mejor.toFixed(1)}</span>
        </div>
        <div class="bg-zinc-800 p-3 rounded-lg flex justify-between items-center border-l-2 border-purple-500">
            <span class="text-xs uppercase font-bold text-gray-400">Con Feedback</span>
            <span class="font-bold text-purple-400 text-lg">${conFeedback}</span>
        </div>
    `;
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================
function getCategoriaIcon(categoria) {
    const iconos = {
        'habilidad': '🏆',
        'ejercicio_accesorio': '💪',
        'postura': '🧘'
    };
    return iconos[categoria] || '📋';
}

function formatFecha(fecha, tipo = 'completa') {
    const date = new Date(fecha);
    
    if (tipo === 'corta') {
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).toUpperCase();
    }
    
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function toggleFeedback(evaluacionId) {
    const feedbackDiv = document.getElementById(`feedback-${evaluacionId}`);
    const toggleIcon = document.querySelector(`.feedback-toggle-icon-${evaluacionId}`);
    
    if (!feedbackDiv) return;
    
    if (feedbackDiv.classList.contains('feedback-collapsed')) {
        feedbackDiv.classList.remove('feedback-collapsed');
        feedbackDiv.classList.add('feedback-expanded');
        if (toggleIcon) toggleIcon.textContent = '▲';
    } else {
        feedbackDiv.classList.remove('feedback-expanded');
        feedbackDiv.classList.add('feedback-collapsed');
        if (toggleIcon) toggleIcon.textContent = '▼';
    }
}

function verDetalleEvaluacion(evaluacionId) {
    const evaluacion = evaluacionesData.find(e => e.id === evaluacionId);
    if (!evaluacion) return;
    
    // Scroll a la evaluación en el historial
    const feedbackBtn = document.querySelector(`button[onclick="toggleFeedback(${evaluacionId})"]`);
    if (feedbackBtn) {
        feedbackBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        feedbackBtn.click();
    }
}

function descargarReportePDF() {
    window.DeportistaAPI.showNotification('📄 Función de reporte PDF en desarrollo', 'info');
    // TODO: Implementar generación de PDF
}

// ==========================================
// ESTADOS DE UI
// ==========================================
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('mainContent').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
}

function showContent() {
    document.getElementById('mainContent').classList.remove('hidden');
}

function showError(message) {
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('mainContent').classList.add('hidden');
}

// Hacer funciones globales para onclick
window.toggleFeedback = toggleFeedback;
window.verDetalleEvaluacion = verDetalleEvaluacion;

console.log('✅ Mis Evaluaciones cargado correctamente');