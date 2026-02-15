// ===================================
// DETALLE DE NIVEL - VERSIÓN COMPLETA CON GRÁFICA
// Incluye gráfica de barras de rendimiento
// ===================================

console.log('📊 Inicializando Detalle de Nivel (CON GRÁFICA)...');

let deportistaData = null;
let nivelId = null;
let todasLasHabilidadesDelNivel = [];
let evaluacionesDelNivel = [];
let chartRendimiento = null; // Variable global para la gráfica

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM cargado');
    
    if (!window.DeportistaAPI.checkAuth()) {
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    nivelId = urlParams.get('nivel');
    
    if (!nivelId) {
        showError('No se especificó un nivel');
        return;
    }
    
    console.log('🎯 Nivel a cargar:', nivelId);
    
    setupEventListeners();
    cargarDatos();
});

function setupEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
                window.DeportistaAPI.logout();
            }
        });
    }
}

async function cargarDatos() {
    try {
        showLoading();
        console.log('📥 Cargando datos del nivel...');
        
        deportistaData = await window.DeportistaAPI.getMe();
        if (!deportistaData) {
            throw new Error('No se pudo cargar el perfil del deportista');
        }
        
        const user = deportistaData.user || {};
        const nombreFinal = user.nombre || deportistaData.nombre || 
                           window.DeportistaAPI.user?.nombre || 'Deportista';
        
        console.log('👤 Perfil cargado:', nombreFinal);
        console.log('📍 Nivel del deportista:', deportistaData.nivel_actual);
        console.log('🎯 Nivel solicitado:', nivelId);
        
        actualizarPerfilSidebar({ ...deportistaData, nombre: nombreFinal, user: user });
        
        // 🔥 OBTENER TODAS LAS HABILIDADES DEL NIVEL
        console.log(`📚 Obteniendo TODAS las habilidades del nivel ${nivelId}...`);
        
        const response = await fetch(`${window.DeportistaAPI.baseURL}/habilidades/nivel/${nivelId}`, {
            headers: window.DeportistaAPI.getHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`No se pudieron cargar las habilidades del nivel ${nivelId}`);
        }
        
        const data = await response.json();
        const todasHabilidades = data.habilidades || data || [];
        todasLasHabilidadesDelNivel = todasHabilidades.filter(h => h.categoria === 'habilidad');
        
        console.log(`📊 Total habilidades en el nivel: ${todasLasHabilidadesDelNivel.length}`);
        
        // Cargar evaluaciones
        const todasEvaluaciones = await window.DeportistaAPI.getEvaluaciones();
        
        evaluacionesDelNivel = todasEvaluaciones.filter(e => {
            const esHabilidad = e.habilidad?.categoria === 'habilidad';
            const esDelNivel = e.habilidad?.nivel === nivelId;
            return esHabilidad && esDelNivel;
        });
        
        console.log(`📋 Evaluaciones del nivel: ${evaluacionesDelNivel.length}`);
        
        // Renderizar
        renderizarContenido();
        
        hideLoading();
        showContent();
        
        window.DeportistaAPI.showNotification('✅ Nivel cargado exitosamente', 'success');
        
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        showError(error.message || 'Error al cargar el nivel');
        hideLoading();
    }
}

function actualizarPerfilSidebar(deportista) {
    const profileName = document.getElementById('profileName');
    const profileInitial = document.getElementById('profileInitial');
    const profileAvatarContainer = document.getElementById('profileAvatarContainer');
    
    const nombreMostrar = deportista.nombre || 'Deportista';
    
    if (profileName) {
        profileName.textContent = nombreMostrar;
    }
    
    if (profileAvatarContainer) {
        if (deportista.foto_perfil) {
            profileAvatarContainer.innerHTML = `
                <img src="${deportista.foto_perfil}" alt="${nombreMostrar}" class="w-full h-full object-cover rounded-full">
            `;
        } else if (profileInitial) {
            profileInitial.textContent = nombreMostrar.charAt(0).toUpperCase();
        }
    }
}

function renderizarContenido() {
    renderizarHeader();
    renderizarHabilidades();
    renderizarFeedback();
    renderizarUltimasEvaluaciones(); // 🔥 AHORA SÍ COMPLETA
}

function renderizarHeader() {
    const nivelTitulo = document.getElementById('nivelTitulo');
    const estadoTexto = document.getElementById('estadoTexto');
    const porcentajeNivel = document.getElementById('porcentajeNivel');
    const contadorHabilidades = document.getElementById('contadorHabilidades');
    const promedioEvaluaciones = document.getElementById('promedioEvaluaciones');
    const totalEvaluaciones = document.getElementById('totalEvaluaciones');
    const barraProgreso = document.getElementById('barraProgreso');
    
    const nombreNivel = obtenerNombreNivel(nivelId);
    if (nivelTitulo) {
        nivelTitulo.innerHTML = nombreNivel;
    }
    
    const esNivelActual = nivelId === deportistaData.nivel_actual;
    if (estadoTexto) {
        estadoTexto.textContent = esNivelActual ? 'En Progreso' : 'Completado';
    }
    
    const { completadas, total, porcentaje } = calcularProgresoReal();
    
    if (porcentajeNivel) porcentajeNivel.textContent = porcentaje;
    if (contadorHabilidades) contadorHabilidades.textContent = `${completadas} de ${total} Habilidades`;
    
    if (promedioEvaluaciones && evaluacionesDelNivel.length > 0) {
        const promedio = evaluacionesDelNivel.reduce((sum, e) => sum + e.puntuacion, 0) / evaluacionesDelNivel.length;
        promedioEvaluaciones.textContent = promedio.toFixed(1);
    } else if (promedioEvaluaciones) {
        promedioEvaluaciones.textContent = '0.0';
    }
    
    if (totalEvaluaciones) {
        totalEvaluaciones.textContent = evaluacionesDelNivel.length;
    }
    
    console.log(`📊 RESUMEN:
    - Total habilidades: ${total}
    - Completadas: ${completadas}
    - Porcentaje: ${porcentaje}%
    - Evaluaciones: ${evaluacionesDelNivel.length}`);
    
    if (barraProgreso) {
        setTimeout(() => {
            barraProgreso.style.width = `${porcentaje}%`;
        }, 300);
    }
}

function obtenerNombreNivel(nivelId) {
    const niveles = {
        '1_basico': 'NIVEL 1 <span class="text-primary">BÁSICO</span>',
        '1_medio': 'NIVEL 1 <span class="text-primary">MEDIO</span>',
        '1_avanzado': 'NIVEL 1 <span class="text-primary">AVANZADO</span>',
        '2': 'NIVEL 2 <span class="text-primary">ELITE</span>',
        '3': 'NIVEL 3 <span class="text-primary">PRO</span>',
        '4': 'NIVEL 4 <span class="text-primary">MASTER</span>'
    };
    
    return niveles[nivelId] || 'NIVEL DESCONOCIDO';
}

function calcularProgresoReal() {
    const total = todasLasHabilidadesDelNivel.length;
    
    if (total === 0) {
        return { completadas: 0, total: 0, porcentaje: 0 };
    }
    
    let completadas = 0;
    
    todasLasHabilidadesDelNivel.forEach(habilidad => {
        const evaluacion = evaluacionesDelNivel.find(e => 
            e.habilidad_id === habilidad.id || e.habilidad?.id === habilidad.id
        );
        
        if (evaluacion) {
            const puntuacionMinima = habilidad.puntuacion_minima || 3;
            if (evaluacion.completado && evaluacion.puntuacion >= puntuacionMinima) {
                completadas++;
            }
        }
    });
    
    const porcentaje = Math.round((completadas / total) * 100);
    
    return { completadas, total, porcentaje };
}

function renderizarHabilidades() {
    const completadasContainer = document.getElementById('habilidadesCompletadasContainer');
    const pendientesContainer = document.getElementById('habilidadesPendientesContainer');
    const contadorCompletadas = document.getElementById('contadorCompletadas');
    const contadorPendientes = document.getElementById('contadorPendientes');
    
    if (!completadasContainer || !pendientesContainer) return;
    
    const completadas = [];
    const pendientes = [];
    
    todasLasHabilidadesDelNivel.forEach(habilidad => {
        const evaluacion = evaluacionesDelNivel.find(e => 
            e.habilidad_id === habilidad.id || e.habilidad?.id === habilidad.id
        );
        
        if (evaluacion) {
            const puntuacionMinima = habilidad.puntuacion_minima || 3;
            if (evaluacion.completado && evaluacion.puntuacion >= puntuacionMinima) {
                completadas.push({ habilidad, evaluacion });
            } else {
                pendientes.push({ habilidad, evaluacion });
            }
        } else {
            pendientes.push({ habilidad, evaluacion: null });
        }
    });
    
    if (contadorCompletadas) contadorCompletadas.textContent = `${completadas.length} items`;
    if (contadorPendientes) contadorPendientes.textContent = `${pendientes.length} items`;
    
    // Renderizar completadas
    if (completadas.length === 0) {
        completadasContainer.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <span class="material-symbols-outlined text-4xl mb-2">emoji_events</span>
                <p class="text-sm font-bold">Sin habilidades completadas</p>
            </div>
        `;
    } else {
        completadasContainer.innerHTML = completadas.map(({ habilidad, evaluacion }) => `
            <div class="bg-zinc-900/30 p-4 border border-white/5 flex items-center justify-between group hover:border-green-500/30 transition-colors">
                <div class="flex items-center gap-4">
                    <span class="material-symbols-outlined text-green-500">check_circle</span>
                    <div>
                        <p class="font-bold text-sm">${escapeHTML(habilidad.nombre)}</p>
                        <p class="text-[10px] text-gray-400 uppercase">
                            Habilidad | <span class="text-green-500/70">Score: ${evaluacion.puntuacion.toFixed(1)}/5</span>
                        </p>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Renderizar pendientes
    if (pendientes.length === 0) {
        pendientesContainer.innerHTML = `
            <div class="text-center py-8 text-green-500">
                <span class="material-symbols-outlined text-4xl mb-2">celebration</span>
                <p class="text-sm font-bold">¡Nivel completado!</p>
            </div>
        `;
    } else {
        pendientesContainer.innerHTML = pendientes.map(({ habilidad, evaluacion }) => {
            const puntuacion = evaluacion ? evaluacion.puntuacion : 0;
            const puntuacionMinima = habilidad.puntuacion_minima || 3;
            const porcentaje = puntuacion > 0 ? Math.round((puntuacion / puntuacionMinima) * 100) : 0;
            
            return `
                <div class="bg-zinc-900/80 p-4 border-l-4 ${puntuacion > 0 ? 'border-primary/50' : 'border-white/10'} flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined ${puntuacion > 0 ? 'text-primary' : 'text-gray-500'}">
                                ${puntuacion > 0 ? 'hourglass_top' : 'lock'}
                            </span>
                            <p class="font-bold text-sm">${escapeHTML(habilidad.nombre)}</p>
                        </div>
                        ${puntuacion > 0 ? `<span class="text-[10px] font-bold text-primary uppercase">${porcentaje}%</span>` : ''}
                    </div>
                    ${puntuacion > 0 ? `
                        <div class="w-full h-1 bg-white/5">
                            <div class="bg-primary h-full transition-all duration-500" style="width: ${porcentaje}%"></div>
                        </div>
                    ` : ''}
                    <p class="text-[10px] ${puntuacion > 0 ? 'text-gray-400' : 'text-gray-600'} uppercase">
                        ${puntuacion > 0 ? `Progreso: ${puntuacion.toFixed(1)}/${puntuacionMinima}` : 'Sin evaluar'}
                    </p>
                </div>
            `;
        }).join('');
    }
}

function renderizarFeedback() {
    const feedbackContainer = document.getElementById('feedbackContainer');
    if (!feedbackContainer) return;
    
    const evaluacionesConFeedback = evaluacionesDelNivel.filter(e => 
        e.observaciones || e.video_url
    ).sort((a, b) => new Date(b.fecha_evaluacion) - new Date(a.fecha_evaluacion));
    
    if (evaluacionesConFeedback.length === 0) {
        feedbackContainer.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <span class="material-symbols-outlined text-4xl mb-2">forum</span>
                <p class="text-sm font-bold">Sin feedback para este nivel</p>
            </div>
        `;
        return;
    }
    
    feedbackContainer.innerHTML = evaluacionesConFeedback.map(evaluacion => {
        const entrenador = evaluacion.entrenador?.nombre || 'Entrenador';
        const entrenadorFoto = evaluacion.entrenador?.foto_perfil;
        const fecha = window.DeportistaAPI.formatFecha(evaluacion.fecha_evaluacion);
        const habilidad = evaluacion.habilidad?.nombre || 'Habilidad';
        const puntuacion = evaluacion.puntuacion;
        
        return `
            <div class="bg-black/40 p-6 border border-white/5">
                <div class="flex gap-4 items-start mb-4">
                    ${entrenadorFoto ? `
                        <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
                            <img class="w-full h-full object-cover" src="${entrenadorFoto}"/>
                        </div>
                    ` : `
                        <div class="w-12 h-12 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center">
                            <span class="material-symbols-outlined text-primary">person</span>
                        </div>
                    `}
                    <div class="flex-1">
                        <div class="flex justify-between mb-1">
                            <p class="text-sm font-bold uppercase italic">${entrenador}</p>
                            <span class="text-[10px] text-primary font-bold">${fecha}</span>
                        </div>
                        <p class="text-[10px] text-gray-400 mb-1">${escapeHTML(habilidad)}</p>
                        <div class="h-[1px] bg-gradient-to-r from-primary/50 to-transparent mb-3"></div>
                        
                        ${evaluacion.observaciones ? `
                            <p class="text-sm text-gray-300 leading-relaxed italic mb-3">
                                "${evaluacion.observaciones}"
                            </p>
                        ` : ''}
                        
                        <div class="flex items-center gap-4">
                            <span class="font-bold text-primary">${puntuacion.toFixed(1)}/5</span>
                            ${evaluacion.video_url ? `
                                <a href="${evaluacion.video_url}" target="_blank" 
                                   class="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full hover:bg-primary hover:text-white">
                                    🎥 Ver Video
                                </a>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 🔥 FUNCIÓN COMPLETA CON GRÁFICA DE CHART.JS
function renderizarUltimasEvaluaciones() {
    const container = document.getElementById('ultimasEvaluacionesContainer');
    if (!container) {
        console.warn('⚠️ Container ultimasEvaluacionesContainer no encontrado');
        return;
    }
    
    console.log(`📅 Renderizando gráfica con ${evaluacionesDelNivel.length} evaluaciones`);
    
    if (evaluacionesDelNivel.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <span class="material-symbols-outlined text-4xl mb-2">bar_chart</span>
                <p class="text-sm">Sin evaluaciones en este nivel</p>
            </div>
        `;
        return;
    }
    
    // Ordenar cronológicamente y tomar las últimas 10
    const evaluacionesRecientes = [...evaluacionesDelNivel]
        .sort((a, b) => new Date(a.fecha_evaluacion) - new Date(b.fecha_evaluacion))
        .slice(-10);
    
    console.log(`📊 Mostrando ${evaluacionesRecientes.length} evaluaciones en gráfica`);
    
    // Crear canvas
    container.innerHTML = '<canvas id="chartRendimiento" class="w-full" style="max-height: 400px;"></canvas>';
    
    // Esperar que el canvas esté en el DOM
    setTimeout(() => {
        const canvas = document.getElementById('chartRendimiento');
        if (!canvas) {
            console.error('❌ Canvas no encontrado');
            return;
        }
        
        // Preparar datos
        const labels = evaluacionesRecientes.map(e => {
            const habilidad = e.habilidad?.nombre || 'Habilidad';
            return habilidad.length > 20 ? habilidad.substring(0, 17) + '...' : habilidad;
        });
        
        const puntuaciones = evaluacionesRecientes.map(e => e.puntuacion || 0);
        
        // Colores según puntuación
        const coloresFondo = puntuaciones.map(p => {
            if (p >= 4.5) return 'rgba(34, 197, 94, 0.8)';
            if (p >= 4) return 'rgba(59, 130, 246, 0.8)';
            if (p >= 3) return 'rgba(234, 179, 8, 0.8)';
            if (p >= 2) return 'rgba(249, 115, 22, 0.8)';
            return 'rgba(239, 68, 68, 0.8)';
        });
        
        const coloresBorde = puntuaciones.map(p => {
            if (p >= 4.5) return 'rgb(34, 197, 94)';
            if (p >= 4) return 'rgb(59, 130, 246)';
            if (p >= 3) return 'rgb(234, 179, 8)';
            if (p >= 2) return 'rgb(249, 115, 22)';
            return 'rgb(239, 68, 68)';
        });
        
        // Destruir gráfica anterior si existe
        if (chartRendimiento) {
            chartRendimiento.destroy();
        }
        
        // Crear gráfica con Chart.js
        const ctx = canvas.getContext('2d');
        chartRendimiento = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Puntuación',
                    data: puntuaciones,
                    backgroundColor: coloresFondo,
                    borderColor: coloresBorde,
                    borderWidth: 2,
                    borderRadius: 4,
                    barThickness: 'flex',
                    maxBarThickness: 50
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleFont: {
                            family: 'Oswald',
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            family: 'Montserrat',
                            size: 12
                        },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: function(tooltipItems) {
                                const index = tooltipItems[0].dataIndex;
                                return evaluacionesRecientes[index].habilidad?.nombre || 'Habilidad';
                            },
                            label: function(context) {
                                return `Puntuación: ${context.parsed.y.toFixed(1)}/5`;
                            },
                            afterLabel: function(context) {
                                const index = context.dataIndex;
                                const fecha = new Date(evaluacionesRecientes[index].fecha_evaluacion);
                                return `Fecha: ${fecha.toLocaleDateString('es-ES')}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            color: '#9CA3AF',
                            font: {
                                family: 'Montserrat',
                                weight: 'bold',
                                size: 11
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: '#9CA3AF',
                            font: {
                                family: 'Montserrat',
                                size: 9
                            },
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
        console.log('✅ Gráfica renderizada exitosamente');
    }, 100);
}

function escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('mainContent').classList.add('hidden');
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
}

console.log('✅ Detalle de Nivel COMPLETO - Con gráfica de Chart.js');