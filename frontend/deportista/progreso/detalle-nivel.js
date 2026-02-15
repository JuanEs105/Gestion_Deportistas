// ===================================
// DETALLE DE NIVEL - TITANES EVOLUTION
// VERSIÓN CORREGIDA - Solo evalúa habilidades del nivel específico
// ===================================

console.log('📊 Inicializando Detalle de Nivel (VERSIÓN CORREGIDA)...');

let deportistaData = null;
let nivelId = null;
let habilidadesData = [];
let evaluacionesData = [];
let evaluacionesDelNivel = []; // 🔥 NUEVO: Solo las evaluaciones de este nivel

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM cargado');
    
    if (!window.DeportistaAPI.checkAuth()) {
        return;
    }
    
    // Obtener el nivel de la URL
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
        
        // Cargar perfil
        deportistaData = await window.DeportistaAPI.getMe();
        if (!deportistaData) {
            throw new Error('No se pudo cargar el perfil del deportista');
        }
        
        const user = deportistaData.user || {};
        const nombreFinal = user.nombre || deportistaData.nombre || 
                           window.DeportistaAPI.user?.nombre || 
                           window.DeportistaAPI.user?.name || 'Deportista';
        
        console.log('👤 Perfil cargado:', nombreFinal);
        console.log('📍 Nivel del deportista:', deportistaData.nivel_actual);
        console.log('🎯 Nivel solicitado:', nivelId);
        
        actualizarPerfilSidebar({ ...deportistaData, nombre: nombreFinal, user: user });
        
        // Cargar TODAS las evaluaciones primero
        const todasEvaluaciones = await window.DeportistaAPI.getEvaluaciones();
        
        console.log('📋 Total evaluaciones recibidas:', todasEvaluaciones.length);
        
        // 🔥 FILTRAR: Solo habilidades del nivel específico
        evaluacionesDelNivel = todasEvaluaciones.filter(e => {
            const esHabilidad = e.habilidad?.categoria === 'habilidad';
            const esDelNivel = e.habilidad?.nivel === nivelId;
            
            if (esHabilidad && esDelNivel) {
                console.log(`   ✅ Evaluación del nivel: ${e.habilidad?.nombre} | Puntuación: ${e.puntuacion} | Completado: ${e.completado}`);
                return true;
            }
            
            return false;
        });
        
        console.log(`📊 Evaluaciones del nivel ${nivelId}:`, evaluacionesDelNivel.length);
        
        // Extraer habilidades únicas de las evaluaciones de este nivel
        const habilidadesUnicas = new Map();
        
        evaluacionesDelNivel.forEach(ev => {
            const habilidadId = ev.habilidad_id || ev.habilidad?.id;
            if (!habilidadId) return;
            
            // Si ya existe, mantener la de mayor puntuación
            if (habilidadesUnicas.has(habilidadId)) {
                const existente = habilidadesUnicas.get(habilidadId);
                if (ev.puntuacion > existente.puntuacion) {
                    habilidadesUnicas.set(habilidadId, ev.habilidad);
                }
            } else {
                habilidadesUnicas.set(habilidadId, ev.habilidad);
            }
        });
        
        habilidadesData = Array.from(habilidadesUnicas.values());
        
        console.log('✅ Habilidades únicas del nivel:', habilidadesData.length);
        
        // Usar evaluacionesDelNivel para todo
        evaluacionesData = evaluacionesDelNivel;
        
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
    renderizarUltimasEvaluaciones();
}

function renderizarHeader() {
    const nivelTitulo = document.getElementById('nivelTitulo');
    const estadoTexto = document.getElementById('estadoTexto');
    const porcentajeNivel = document.getElementById('porcentajeNivel');
    const contadorHabilidades = document.getElementById('contadorHabilidades');
    const promedioEvaluaciones = document.getElementById('promedioEvaluaciones');
    const totalEvaluaciones = document.getElementById('totalEvaluaciones');
    const barraProgreso = document.getElementById('barraProgreso');
    
    // Título del nivel
    const nombreNivel = obtenerNombreNivel(nivelId);
    if (nivelTitulo) {
        nivelTitulo.innerHTML = nombreNivel;
    }
    
    // Estado
    const esNivelActual = nivelId === deportistaData.nivel_actual;
    if (estadoTexto) {
        estadoTexto.textContent = esNivelActual ? 'En Progreso' : 'Completado';
    }
    
    // 🔥 Calcular progreso CON LAS EVALUACIONES DEL NIVEL
    const { completadas, total, porcentaje } = calcularProgreso();
    
    if (porcentajeNivel) {
        porcentajeNivel.textContent = porcentaje;
    }
    
    if (contadorHabilidades) {
        contadorHabilidades.textContent = `${completadas} de ${total} Habilidades`;
    }
    
    // 🔥 Promedio - USAR SOLO EVALUACIONES DEL NIVEL
    if (promedioEvaluaciones && evaluacionesDelNivel.length > 0) {
        const promedio = evaluacionesDelNivel.reduce((sum, e) => sum + e.puntuacion, 0) / evaluacionesDelNivel.length;
        promedioEvaluaciones.textContent = promedio.toFixed(1);
    } else if (promedioEvaluaciones) {
        promedioEvaluaciones.textContent = '0.0';
    }
    
    // 🔥 Total evaluaciones - USAR SOLO DEL NIVEL
    if (totalEvaluaciones) {
        totalEvaluaciones.textContent = evaluacionesDelNivel.length;
    }
    
    console.log(`📊 RESUMEN DEL NIVEL:
    - Total habilidades: ${total}
    - Completadas: ${completadas}
    - Porcentaje: ${porcentaje}%
    - Evaluaciones totales: ${evaluacionesDelNivel.length}
    - Promedio: ${promedioEvaluaciones ? promedioEvaluaciones.textContent : '0.0'}`);
    
    // Barra de progreso
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

function calcularProgreso() {
    if (habilidadesData.length === 0) {
        return { completadas: 0, total: 0, porcentaje: 0 };
    }
    
    let completadas = 0;
    
    habilidadesData.forEach(habilidad => {
        if (verificarHabilidadCompletada(habilidad)) {
            completadas++;
        }
    });
    
    const porcentaje = Math.round((completadas / habilidadesData.length) * 100);
    
    return { completadas, total: habilidadesData.length, porcentaje };
}

function verificarHabilidadCompletada(habilidad) {
    const evaluacion = evaluacionesData.find(e => 
        e.habilidad_id === habilidad.id || 
        (e.habilidad && e.habilidad.id === habilidad.id) ||
        (e.habilidad && e.habilidad.nombre === habilidad.nombre)
    );
    
    if (!evaluacion) return false;
    
    const puntuacionMinima = habilidad.puntuacion_minima || 3;
    return evaluacion.completado === true && evaluacion.puntuacion >= puntuacionMinima;
}

function renderizarHabilidades() {
    const completadasContainer = document.getElementById('habilidadesCompletadasContainer');
    const pendientesContainer = document.getElementById('habilidadesPendientesContainer');
    const contadorCompletadas = document.getElementById('contadorCompletadas');
    const contadorPendientes = document.getElementById('contadorPendientes');
    
    if (!completadasContainer || !pendientesContainer) return;
    
    const completadas = [];
    const pendientes = [];
    
    habilidadesData.forEach(habilidad => {
        if (verificarHabilidadCompletada(habilidad)) {
            completadas.push(habilidad);
        } else {
            pendientes.push(habilidad);
        }
    });
    
    // Actualizar contadores
    if (contadorCompletadas) {
        contadorCompletadas.textContent = `${completadas.length} items`;
    }
    
    if (contadorPendientes) {
        contadorPendientes.textContent = `${pendientes.length} items`;
    }
    
    // Renderizar completadas
    if (completadas.length === 0) {
        completadasContainer.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <span class="material-symbols-outlined text-4xl mb-2">emoji_events</span>
                <p class="text-sm font-bold">Sin habilidades completadas</p>
            </div>
        `;
    } else {
        completadasContainer.innerHTML = completadas.map(habilidad => {
            const evaluacion = evaluacionesData.find(e => 
                e.habilidad_id === habilidad.id || 
                (e.habilidad && e.habilidad.id === habilidad.id)
            );
            
            const puntuacion = evaluacion ? evaluacion.puntuacion : 0;
            
            return `
                <div class="bg-zinc-900/30 p-4 border border-white/5 flex items-center justify-between group hover:border-green-500/30 transition-colors">
                    <div class="flex items-center gap-4">
                        <span class="material-symbols-outlined text-green-500">check_circle</span>
                        <div>
                            <p class="font-bold text-sm">${escapeHTML(habilidad.nombre)}</p>
                            <p class="text-[10px] text-gray-400 uppercase">
                                Habilidad | <span class="text-green-500/70">Score: ${puntuacion.toFixed(1)}/5</span>
                            </p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Renderizar pendientes
    if (pendientes.length === 0) {
        if (habilidadesData.length === 0) {
            // No hay habilidades en este nivel
            pendientesContainer.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <span class="material-symbols-outlined text-4xl mb-2">inbox</span>
                    <p class="text-sm font-bold">Sin habilidades asignadas</p>
                    <p class="text-xs mt-2">Este nivel no tiene habilidades configuradas</p>
                </div>
            `;
        } else {
            // Todas las habilidades están completadas
            pendientesContainer.innerHTML = `
                <div class="text-center py-8 text-green-500">
                    <span class="material-symbols-outlined text-4xl mb-2">celebration</span>
                    <p class="text-sm font-bold">¡Nivel completado!</p>
                    <p class="text-xs mt-2 text-gray-400">Has dominado todas las habilidades</p>
                </div>
            `;
        }
    } else {
        pendientesContainer.innerHTML = pendientes.map(habilidad => {
            const evaluacion = evaluacionesData.find(e => 
                e.habilidad_id === habilidad.id || 
                (e.habilidad && e.habilidad.id === habilidad.id)
            );
            
            const puntuacion = evaluacion ? evaluacion.puntuacion : 0;
            const puntuacionMinima = habilidad.puntuacion_minima || 3;
            const porcentaje = puntuacion > 0 ? Math.round((puntuacion / puntuacionMinima) * 100) : 0;
            
            return `
                <div class="bg-zinc-900/80 p-4 border-l-4 ${puntuacion > 0 ? 'border-primary/50' : 'border-white/10'} flex flex-col gap-3 group">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined ${puntuacion > 0 ? 'text-primary group-hover:animate-pulse' : 'text-gray-500'}">
                                ${puntuacion > 0 ? 'hourglass_top' : 'lock'}
                            </span>
                            <p class="font-bold text-sm">${escapeHTML(habilidad.nombre)}</p>
                        </div>
                        ${puntuacion > 0 ? `
                            <span class="text-[10px] font-bold text-primary uppercase">${porcentaje}%</span>
                        ` : ''}
                    </div>
                    ${puntuacion > 0 ? `
                        <div class="w-full h-1 bg-white/5">
                            <div class="bg-primary h-full transition-all duration-500" style="width: ${porcentaje}%"></div>
                        </div>
                    ` : ''}
                    <p class="text-[10px] ${puntuacion > 0 ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-tighter">
                        ${puntuacion > 0 
                            ? `Progreso: ${puntuacion.toFixed(1)}/${puntuacionMinima} necesarios` 
                            : 'Sin evaluar'}
                    </p>
                </div>
            `;
        }).join('');
    }
}

function renderizarFeedback() {
    const feedbackContainer = document.getElementById('feedbackContainer');
    if (!feedbackContainer) return;
    
    // 🔥 USAR SOLO evaluacionesDelNivel (ya filtradas)
    const evaluacionesConFeedback = evaluacionesDelNivel.filter(e => 
        e.observaciones || e.video_url
    ).sort((a, b) => new Date(b.fecha_evaluacion) - new Date(a.fecha_evaluacion));
    
    console.log(`💬 Feedback del nivel: ${evaluacionesConFeedback.length} evaluaciones con comentarios`);
    
    if (evaluacionesConFeedback.length === 0) {
        feedbackContainer.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <span class="material-symbols-outlined text-4xl mb-2">forum</span>
                <p class="text-sm font-bold">Sin feedback registrado para este nivel</p>
            </div>
        `;
        return;
    }
    
    feedbackContainer.innerHTML = evaluacionesConFeedback.map(evaluacion => {
        const entrenador = evaluacion.entrenador?.nombre || 'Entrenador';
        const entrenadorFoto = evaluacion.entrenador?.foto_perfil;
        const fecha = window.DeportistaAPI.formatFecha(evaluacion.fecha_evaluacion);
        const habilidad = evaluacion.habilidad?.nombre || evaluacion.nombre_habilidad || 'Habilidad';
        const puntuacion = evaluacion.puntuacion;
        
        return `
            <div class="bg-black/40 p-6 border border-white/5 relative">
                <div class="flex gap-4 items-start mb-4">
                    ${entrenadorFoto ? `
                        <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-primary shadow-[0_0_10px_rgba(226,27,35,0.5)]">
                            <img alt="Coach" class="w-full h-full object-cover" src="${entrenadorFoto}"/>
                        </div>
                    ` : `
                        <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-primary bg-primary/20 flex items-center justify-center">
                            <span class="material-symbols-outlined text-primary text-2xl">person</span>
                        </div>
                    `}
                    <div class="flex-1">
                        <div class="flex justify-between items-center mb-1">
                            <p class="text-sm font-bold uppercase italic">${entrenador}</p>
                            <span class="text-[10px] text-primary font-bold">${fecha}</span>
                        </div>
                        <p class="text-[10px] text-gray-400 mb-1">${escapeHTML(habilidad)}</p>
                        <div class="h-[1px] w-full bg-gradient-to-r from-primary/50 to-transparent mb-3"></div>
                        
                        ${evaluacion.observaciones ? `
                            <p class="text-sm text-gray-300 leading-relaxed italic mb-3">
                                "${evaluacion.observaciones}"
                            </p>
                        ` : ''}
                        
                        <div class="flex items-center gap-4">
                            <div class="flex items-center gap-1">
                                <span class="text-xs text-gray-400">Puntuación:</span>
                                <span class="font-bold text-primary">${puntuacion.toFixed(1)}/5</span>
                            </div>
                            ${evaluacion.video_url ? `
                                <a href="${evaluacion.video_url}" target="_blank" rel="noopener noreferrer" 
                                   class="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-colors">
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

let chartRendimiento = null; // Variable global para la gráfica

function renderizarUltimasEvaluaciones() {
    const container = document.getElementById('ultimasEvaluacionesContainer');
    if (!container) return;
    
    // 🔥 USAR SOLO evaluacionesDelNivel (ya filtradas)
    const evaluacionesRecientes = [...evaluacionesDelNivel]
        .sort((a, b) => new Date(a.fecha_evaluacion) - new Date(b.fecha_evaluacion)) // Cronológico
        .slice(-10); // Últimas 10
    
    console.log(`📅 Evaluaciones para gráfica: ${evaluacionesRecientes.length}`);
    
    if (evaluacionesRecientes.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <span class="material-symbols-outlined text-4xl mb-2">bar_chart</span>
                <p class="text-sm">Sin evaluaciones en este nivel</p>
            </div>
        `;
        return;
    }
    
    // Crear canvas para la gráfica
    container.innerHTML = '<canvas id="chartRendimiento" class="w-full" style="max-height: 400px;"></canvas>';
    
    // Esperar a que el canvas esté en el DOM
    setTimeout(() => {
        const canvas = document.getElementById('chartRendimiento');
        if (!canvas) return;
        
        // Preparar datos
        const labels = evaluacionesRecientes.map(e => {
            const habilidad = e.habilidad?.nombre || 'Habilidad';
            // Acortar nombres largos
            return habilidad.length > 20 ? habilidad.substring(0, 17) + '...' : habilidad;
        });
        
        const puntuaciones = evaluacionesRecientes.map(e => e.puntuacion || 0);
        
        // Colores según puntuación
        const coloresFondo = puntuaciones.map(p => {
            if (p >= 4.5) return 'rgba(34, 197, 94, 0.8)'; // Verde
            if (p >= 4) return 'rgba(59, 130, 246, 0.8)'; // Azul
            if (p >= 3) return 'rgba(234, 179, 8, 0.8)'; // Amarillo
            if (p >= 2) return 'rgba(249, 115, 22, 0.8)'; // Naranja
            return 'rgba(239, 68, 68, 0.8)'; // Rojo
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
        
        // Crear gráfica
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
    }, 100);
}

function escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Estados de UI
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

console.log('✅ Detalle de Nivel cargado correctamente - VERSIÓN CORREGIDA');