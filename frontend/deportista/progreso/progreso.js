// ===================================
// PROGRESO DEPORTISTA - VERSIÓN COMPLETA
// Con habilidades completadas/pendientes y gráficas
// ===================================

console.log('🏃 Inicializando página de progreso (VERSIÓN COMPLETA)...');

let deportistaData = null;
let progresoData = null;
let habilidadesData = null;
let evaluacionesData = [];

// Gráficas
let chartRadar = null;
let chartProgreso = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM cargado, verificando autenticación...');

    if (!window.DeportistaAPI || !window.DeportistaAPI.checkAuth()) {
        console.error('❌ Error de autenticación o DeportistaAPI no disponible');
        return;
    }

    setupEventListeners();
    cargarDatos();
});

function setupEventListeners() {
    const toggleThemeBtn = document.getElementById('toggleTheme');
    if (toggleThemeBtn) {
        toggleThemeBtn.addEventListener('click', toggleTheme);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
                window.DeportistaAPI.logout();
            }
        });
    }

    console.log('✅ Event listeners configurados');
}

function toggleTheme() {
    const html = document.documentElement;
    const themeBtn = document.getElementById('toggleTheme');
    const themeIcon = themeBtn?.querySelector('.material-symbols-outlined');
    const themeText = themeBtn?.querySelector('span:last-child');

    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        if (themeIcon) themeIcon.textContent = 'dark_mode';
        if (themeText) themeText.textContent = 'Modo Oscuro';
        localStorage.setItem('theme', 'light');
    } else {
        html.classList.add('dark');
        if (themeIcon) themeIcon.textContent = 'light_mode';
        if (themeText) themeText.textContent = 'Modo Claro';
        localStorage.setItem('theme', 'dark');
    }
}

async function cargarDatos() {
    try {
        showLoading();
        console.log('📊 ========== INICIANDO CARGA DE DATOS ==========');

        // 1. Cargar perfil del deportista
        console.log('👤 Paso 1: Cargando perfil...');
        deportistaData = await window.DeportistaAPI.getMe();
        
        if (!deportistaData) {
            throw new Error('No se pudo cargar el perfil del deportista');
        }

        console.log('✅ Perfil cargado:', deportistaData.nombre, '| Nivel:', deportistaData.nivel_actual);

        const user = deportistaData.user || {};
        const nombreFinal = user.nombre || deportistaData.nombre || 
                           window.DeportistaAPI.user?.nombre || 
                           window.DeportistaAPI.user?.name || 'Deportista';

        actualizarPerfilSidebar({ ...deportistaData, nombre: nombreFinal, user: user });

        // 2. Cargar evaluaciones
        console.log('📋 Paso 2: Cargando evaluaciones...');
        evaluacionesData = await window.DeportistaAPI.getEvaluaciones();
        console.log(`✅ ${evaluacionesData.length} evaluaciones cargadas`);

        // 3. Cargar habilidades
        console.log('🎯 Paso 3: Cargando habilidades...');
        
        if (!deportistaData.nivel_actual || deportistaData.nivel_actual === 'pendiente') {
            console.log('⚠️ Nivel no válido - Mostrando estado sin habilidades');
            habilidadesData = {
                habilidades: [],
                por_categoria: {
                    habilidad: [],
                    ejercicio_accesorio: [],
                    postura: []
                },
                total: 0
            };
        } else {
            habilidadesData = await window.DeportistaAPI.getHabilidades(deportistaData.nivel_actual);
            console.log(`✅ ${habilidadesData.total} habilidades cargadas`);
        }

        // 4. Cargar progreso (opcional)
        console.log('📈 Paso 4: Cargando progreso del servidor...');
        try {
            progresoData = await window.DeportistaAPI.getProgreso();
            console.log('✅ Progreso obtenido');
        } catch (error) {
            console.warn('⚠️ No se pudo cargar progreso del servidor:', error);
            progresoData = null;
        }

        console.log('========================================');
        console.log('✅ TODOS LOS DATOS CARGADOS');
        console.log('========================================');

        renderizarProgreso();
        inicializarGraficas();

        hideLoading();
        showContent();

        window.DeportistaAPI.showNotification('✅ Progreso cargado exitosamente', 'success');

    } catch (error) {
        console.error('❌ ERROR:', error);
        showError(error.message || 'Error al cargar tu progreso');
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
                <img src="${deportista.foto_perfil}" alt="${nombreMostrar}" class="w-full h-full object-cover">
            `;
        } else if (profileInitial) {
            profileInitial.textContent = nombreMostrar.charAt(0).toUpperCase();
        }
    }
}

function renderizarProgreso() {
    console.log('🎨 Renderizando progreso...');
    
    const tieneHabilidades = habilidadesData && 
                             habilidadesData.habilidades && 
                             habilidadesData.habilidades.length > 0;
    
    if (!tieneHabilidades) {
        console.log('❌ NO HAY HABILIDADES');
        renderizarSinHabilidades();
        return;
    }
    
    console.log('✅ Renderizando progreso con habilidades');
    renderizarHeader();
    renderizarHabilidades();
    renderizarPerfilTecnico();
    renderizarRecompensa();
    renderizarUltimasEvaluaciones();
}

function renderizarSinHabilidades() {
    const nivelBadge = document.getElementById('nivelBadge');
    const porcentajeCompletado = document.getElementById('porcentajeCompletado');
    const habilidadesFaltantes = document.getElementById('habilidadesFaltantes');
    const barraProgresoNivel = document.getElementById('barraProgresoNivel');
    
    if (nivelBadge) {
        const nivel = deportistaData.nivel_actual || 'pendiente';
        nivelBadge.textContent = nivel === 'pendiente' ? 'PEND' : nivel.substring(0, 4).toUpperCase();
    }
    
    if (porcentajeCompletado) porcentajeCompletado.textContent = '0% COMPLETADO';
    if (habilidadesFaltantes) habilidadesFaltantes.textContent = 'Sin habilidades asignadas';
    if (barraProgresoNivel) barraProgresoNivel.style.width = '0%';
    
    const completadasContainer = document.getElementById('habilidadesCompletadasContainer');
    if (completadasContainer) {
        completadasContainer.innerHTML = `
            <div class="col-span-2 text-center py-8 text-gray-400">
                <span class="material-symbols-outlined text-5xl mb-2">emoji_events</span>
                <p class="font-bold">Sin habilidades asignadas</p>
                <p class="text-sm mt-2">Consulta con tu entrenador</p>
            </div>
        `;
    }
    
    const pendientesContainer = document.getElementById('habilidadesPendientesContainer');
    if (pendientesContainer) {
        pendientesContainer.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <span class="material-symbols-outlined text-5xl mb-2">fitness_center</span>
                <p class="font-bold">Esperando asignación</p>
            </div>
        `;
    }
    
    renderizarUltimasEvaluaciones();
}

function renderizarHeader() {
    const nivelBadge = document.getElementById('nivelBadge');
    const porcentajeCompletado = document.getElementById('porcentajeCompletado');
    const habilidadesFaltantes = document.getElementById('habilidadesFaltantes');
    const barraProgresoNivel = document.getElementById('barraProgresoNivel');

    if (nivelBadge) {
        const nivel = window.DeportistaAPI.formatNivel(deportistaData.nivel_actual);
        nivelBadge.textContent = nivel.replace('Nivel ', 'L');
    }

    const { completadas, total, porcentaje, faltantes } = calcularProgresoHabilidades();

    if (porcentajeCompletado) {
        porcentajeCompletado.textContent = `${porcentaje}% COMPLETADO`;
    }

    if (habilidadesFaltantes) {
        habilidadesFaltantes.textContent = faltantes === 0 && total > 0
            ? '¡NIVEL COMPLETADO!'
            : faltantes > 0
                ? `Faltan ${faltantes} habilidad${faltantes !== 1 ? 'es' : ''}`
                : 'Sin habilidades asignadas';
    }

    if (barraProgresoNivel) {
        setTimeout(() => {
            barraProgresoNivel.style.width = `${porcentaje}%`;
        }, 300);
    }
}

function calcularProgresoHabilidades() {
    if (!habilidadesData || !habilidadesData.habilidades || habilidadesData.habilidades.length === 0) {
        return { completadas: 0, total: 0, porcentaje: 0, faltantes: 0 };
    }

    const total = habilidadesData.habilidades.length;
    let completadas = 0;

    habilidadesData.habilidades.forEach(habilidad => {
        if (verificarHabilidadCompletada(habilidad)) {
            completadas++;
        }
    });

    const faltantes = total - completadas;
    const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;

    return { completadas, total, porcentaje, faltantes };
}

function verificarHabilidadCompletada(habilidad) {
    if (!evaluacionesData || evaluacionesData.length === 0) {
        return false;
    }

    const evaluacion = evaluacionesData.find(e => {
        if (e.habilidad_id === habilidad.id) return true;
        if (e.habilidad && e.habilidad.id === habilidad.id) return true;
        if (e.habilidad && e.habilidad.nombre === habilidad.nombre) return true;
        if (e.nombre_habilidad === habilidad.nombre) return true;
        return false;
    });

    if (!evaluacion) return false;

    const puntuacionMinima = habilidad.puntuacion_minima || 3;
    return evaluacion.completado === true && evaluacion.puntuacion >= puntuacionMinima;
}

// 🔥 RENDERIZAR HABILIDADES COMPLETADAS Y PENDIENTES
function renderizarHabilidades() {
    console.log('🎯 Renderizando habilidades completadas y pendientes...');
    
    const completadasContainer = document.getElementById('habilidadesCompletadasContainer');
    const pendientesContainer = document.getElementById('habilidadesPendientesContainer');
    
    if (!completadasContainer || !pendientesContainer) {
        console.error('❌ Contenedores no encontrados');
        return;
    }
    
    const completadas = [];
    const pendientes = [];
    
    habilidadesData.habilidades.forEach(habilidad => {
        if (verificarHabilidadCompletada(habilidad)) {
            completadas.push(habilidad);
        } else {
            pendientes.push(habilidad);
        }
    });
    
    console.log(`✅ ${completadas.length} completadas, ${pendientes.length} pendientes`);
    
    // Renderizar completadas
    if (completadas.length === 0) {
        completadasContainer.innerHTML = `
            <div class="col-span-2 text-center py-8 text-gray-400">
                <span class="material-symbols-outlined text-5xl mb-2">emoji_events</span>
                <p class="font-bold">Aún no has completado ninguna habilidad</p>
                <p class="text-sm mt-2">¡Sigue entrenando para lograr tus primeras habilidades!</p>
            </div>
        `;
    } else {
        completadasContainer.innerHTML = completadas.map(habilidad => {
            const evaluacion = evaluacionesData.find(e => 
                e.habilidad_id === habilidad.id || 
                (e.habilidad && e.habilidad.id === habilidad.id)
            );
            
            const puntuacion = evaluacion ? evaluacion.puntuacion : 0;
            const fecha = evaluacion ? window.DeportistaAPI.formatFecha(evaluacion.fecha_evaluacion) : '';
            
            return `
                <div class="bg-white dark:bg-zinc-800 rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer"
                     onclick="verDetalleHabilidad('${habilidad.id}')">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                            <h4 class="font-bold text-gray-800 dark:text-white mb-1">
                                ${escapeHTML(habilidad.nombre)}
                            </h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase">
                                ${getCategoriaTexto(habilidad.categoria)}
                            </p>
                        </div>
                        <span class="material-symbols-outlined text-green-500 text-2xl">
                            check_circle
                        </span>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1">
                            ${generarEstrellas(puntuacion)}
                        </div>
                        <span class="text-xs text-gray-400">${fecha}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Renderizar pendientes
    if (pendientes.length === 0) {
        pendientesContainer.innerHTML = `
            <div class="text-center py-8 text-green-500">
                <span class="material-symbols-outlined text-5xl mb-2">celebration</span>
                <p class="font-bold">¡Has completado todas las habilidades de este nivel!</p>
                <p class="text-sm mt-2 text-gray-400">Consulta con tu entrenador para avanzar al siguiente nivel</p>
            </div>
        `;
    } else {
        pendientesContainer.innerHTML = pendientes.map(habilidad => {
            const evaluacion = evaluacionesData.find(e => 
                e.habilidad_id === habilidad.id || 
                (e.habilidad && e.habilidad.id === habilidad.id)
            );
            
            const puntuacion = evaluacion ? evaluacion.puntuacion : 0;
            const puntuacionMinima = habilidad.puntuacion_minima || 3;
            
            return `
                <div class="bg-white dark:bg-zinc-800 rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer"
                     onclick="verDetalleHabilidad('${habilidad.id}')">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                            <h4 class="font-bold text-gray-800 dark:text-white mb-1">
                                ${escapeHTML(habilidad.nombre)}
                            </h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase">
                                ${getCategoriaTexto(habilidad.categoria)}
                            </p>
                        </div>
                        <span class="material-symbols-outlined text-gray-400 text-2xl">
                            radio_button_unchecked
                        </span>
                    </div>
                    ${puntuacion > 0 ? `
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-1">
                                ${generarEstrellas(puntuacion)}
                            </div>
                            <span class="text-xs text-yellow-600 dark:text-yellow-400">
                                ${puntuacion}/${puntuacionMinima} necesarios
                            </span>
                        </div>
                    ` : `
                        <div class="text-xs text-gray-400">
                            Sin evaluar - Mínimo ${puntuacionMinima}/5 ⭐
                        </div>
                    `}
                </div>
            `;
        }).join('');
    }
}

function generarEstrellas(puntuacion) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= puntuacion) {
            html += '<span class="material-symbols-outlined text-yellow-500" style="font-size: 18px; font-variation-settings: \'FILL\' 1;">star</span>';
        } else {
            html += '<span class="material-symbols-outlined text-gray-300 dark:text-gray-600" style="font-size: 18px;">star</span>';
        }
    }
    return html;
}

// 🔥 RENDERIZAR PERFIL TÉCNICO CON GRÁFICA
function renderizarPerfilTecnico() {
    console.log('📊 Renderizando perfil técnico...');
    
    const perfilTecnicoInfo = document.getElementById('perfilTecnicoInfo');
    if (!perfilTecnicoInfo) return;
    
    if (!habilidadesData || !habilidadesData.habilidades || habilidadesData.habilidades.length === 0) {
        perfilTecnicoInfo.innerHTML = `
            <div class="bg-black/30 p-3 text-center text-gray-400">
                <span class="material-symbols-outlined text-3xl mb-2">query_stats</span>
                <p class="text-xs">Sin datos para mostrar</p>
            </div>
        `;
        return;
    }
    
    // Calcular promedios por categoría
    const promedios = calcularPromediosPorCategoria();
    
    perfilTecnicoInfo.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-400">Habilidades</span>
                <span class="font-bold text-white">${promedios.habilidad.toFixed(1)}/5.0</span>
            </div>
            <div class="w-full bg-black/30 rounded-full h-2">
                <div class="h-2 rounded-full transition-all duration-500"
                     style="width: ${(promedios.habilidad / 5) * 100}%; background: linear-gradient(90deg, #E21B23, #FF6B6B);"></div>
            </div>
            
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-400">Ejercicios</span>
                <span class="font-bold text-white">${promedios.ejercicio_accesorio.toFixed(1)}/5.0</span>
            </div>
            <div class="w-full bg-black/30 rounded-full h-2">
                <div class="h-2 rounded-full transition-all duration-500"
                     style="width: ${(promedios.ejercicio_accesorio / 5) * 100}%; background: linear-gradient(90deg, #3B82F6, #60A5FA);"></div>
            </div>
            
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-400">Posturas</span>
                <span class="font-bold text-white">${promedios.postura.toFixed(1)}/5.0</span>
            </div>
            <div class="w-full bg-black/30 rounded-full h-2">
                <div class="h-2 rounded-full transition-all duration-500"
                     style="width: ${(promedios.postura / 5) * 100}%; background: linear-gradient(90deg, #10B981, #34D399);"></div>
            </div>
        </div>
    `;
}

function calcularPromediosPorCategoria() {
    const categorias = {
        habilidad: [],
        ejercicio_accesorio: [],
        postura: []
    };
    
    habilidadesData.habilidades.forEach(habilidad => {
        const evaluacion = evaluacionesData.find(e => 
            e.habilidad_id === habilidad.id || 
            (e.habilidad && e.habilidad.id === habilidad.id)
        );
        
        if (evaluacion && evaluacion.puntuacion > 0) {
            if (categorias[habilidad.categoria]) {
                categorias[habilidad.categoria].push(evaluacion.puntuacion);
            }
        }
    });
    
    return {
        habilidad: categorias.habilidad.length > 0 
            ? categorias.habilidad.reduce((a, b) => a + b, 0) / categorias.habilidad.length 
            : 0,
        ejercicio_accesorio: categorias.ejercicio_accesorio.length > 0 
            ? categorias.ejercicio_accesorio.reduce((a, b) => a + b, 0) / categorias.ejercicio_accesorio.length 
            : 0,
        postura: categorias.postura.length > 0 
            ? categorias.postura.reduce((a, b) => a + b, 0) / categorias.postura.length 
            : 0
    };
}

function renderizarRecompensa() {
    const recompensaTexto = document.getElementById('recompensaTexto');
    const barraRecompensa = document.getElementById('barraRecompensa');
    const porcentajeRecompensa = document.getElementById('porcentajeRecompensa');
    
    if (!recompensaTexto || !barraRecompensa || !porcentajeRecompensa) return;
    
    const { completadas, total, porcentaje } = calcularProgresoHabilidades();
    
    if (total === 0) {
        recompensaTexto.textContent = 'Consulta con tu entrenador para que te asigne un nivel';
        barraRecompensa.style.width = '0%';
        porcentajeRecompensa.textContent = '0%';
        return;
    }
    
    if (porcentaje >= 100) {
        recompensaTexto.textContent = '¡Felicidades! Has completado todas las habilidades de este nivel';
    } else {
        const faltantes = total - completadas;
        recompensaTexto.textContent = `Te faltan ${faltantes} habilidad${faltantes !== 1 ? 'es' : ''} para completar tu nivel`;
    }
    
    setTimeout(() => {
        barraRecompensa.style.width = `${porcentaje}%`;
        porcentajeRecompensa.textContent = `${porcentaje}%`;
    }, 300);
}

// 🔥 INICIALIZAR GRÁFICAS CON CHART.JS
function inicializarGraficas() {
    console.log('📊 Inicializando gráficas...');
    
    const ctxRadar = document.getElementById('chartRadar');
    
    if (!ctxRadar) {
        console.warn('⚠️ Canvas chartRadar no encontrado');
        return;
    }
    
    if (!habilidadesData || !habilidadesData.habilidades || habilidadesData.habilidades.length === 0) {
        console.log('⚠️ Sin datos para gráficas');
        return;
    }
    
    // Destruir gráfica existente si existe
    if (chartRadar) {
        chartRadar.destroy();
    }
    
    const promedios = calcularPromediosPorCategoria();
    
    // Crear datos para el radar (6 ejes)
    const datosRadar = [
        promedios.habilidad,          // Habilidades
        promedios.ejercicio_accesorio, // Ejercicios
        promedios.postura,            // Posturas
        promedios.habilidad * 0.9,    // Técnica (derivado)
        promedios.ejercicio_accesorio * 1.1, // Fuerza (derivado)
        promedios.postura * 1.05      // Flexibilidad (derivado)
    ].map(v => Math.min(Math.max(v, 0), 5)); // Limitar entre 0 y 5
    
    console.log('📊 Datos para radar:', datosRadar);
    
    chartRadar = new Chart(ctxRadar.getContext('2d'), {
        type: 'radar',
        data: {
            labels: ['FUERZA', 'HABILIDADES', 'FLEXIBILIDAD', 'POSTURAS', 'TÉCNICA', 'EJERCICIOS'],
            datasets: [{
                label: 'Tu Progreso',
                data: datosRadar,
                backgroundColor: 'rgba(226, 27, 35, 0.2)',
                borderColor: '#E21B23',
                borderWidth: 2,
                pointBackgroundColor: '#E21B23',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#E21B23',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    min: 0,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        color: '#9CA3AF',
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    pointLabels: {
                        color: '#D1D5DB',
                        font: {
                            size: 11,
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed.r.toFixed(1)}/5.0`;
                        }
                    }
                }
            }
        }
    });
    
    console.log('✅ Gráfica radar inicializada');
}

function renderizarUltimasEvaluaciones() {
    console.log('📋 Renderizando últimas evaluaciones...');
    
    const container = document.getElementById('ultimasEvaluacionesContainer');
    if (!container) return;
    
    if (!evaluacionesData || evaluacionesData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <span class="material-symbols-outlined text-4xl mb-2">assignment</span>
                <p class="font-bold">Sin evaluaciones registradas</p>
                <p class="text-sm mt-2">Tus evaluaciones aparecerán aquí</p>
            </div>
        `;
        return;
    }
    
    const ultimasEvaluaciones = evaluacionesData
        .sort((a, b) => new Date(b.fecha_evaluacion) - new Date(a.fecha_evaluacion))
        .slice(0, 5);
    
    container.innerHTML = ultimasEvaluaciones.map(evaluacion => {
        const nombreHabilidad = evaluacion.habilidad?.nombre || evaluacion.nombre_habilidad || 'Habilidad';
        const fecha = window.DeportistaAPI.formatFecha(evaluacion.fecha_evaluacion);
        const puntuacion = evaluacion.puntuacion || 0;
        
        return `
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                <div class="flex-1">
                    <p class="font-semibold text-gray-800 dark:text-white text-sm">
                        ${escapeHTML(nombreHabilidad)}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${fecha}</p>
                </div>
                <div class="flex items-center gap-1">
                    <span class="font-bold text-lg ${puntuacion >= 3 ? 'text-green-600' : 'text-yellow-600'}">
                        ${puntuacion}
                    </span>
                    <span class="material-symbols-outlined text-yellow-500" style="font-size: 18px; font-variation-settings: 'FILL' 1;">
                        star
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

function getCategoriaTexto(categoria) {
    const categorias = {
        'habilidad': 'Habilidad',
        'ejercicio_accesorio': 'Ejercicio',
        'postura': 'Postura'
    };
    return categorias[categoria] || categoria;
}

function verDetalleHabilidad(habilidadId) {
    window.DeportistaAPI.showNotification('Redirigiendo a detalles de la habilidad...', 'info');
    setTimeout(() => {
        window.location.href = `../habilidades/index.html?id=${habilidadId}`;
    }, 1000);
}

function escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading() {
    const loadingState = document.getElementById('loadingState');
    const mainContent = document.getElementById('mainContent');
    const errorState = document.getElementById('errorState');
    
    if (loadingState) loadingState.classList.remove('hidden');
    if (mainContent) mainContent.classList.add('hidden');
    if (errorState) errorState.classList.add('hidden');
}

function hideLoading() {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) loadingState.classList.add('hidden');
}

function showContent() {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) mainContent.classList.remove('hidden');
}

function showError(message) {
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    const mainContent = document.getElementById('mainContent');
    
    if (errorState) errorState.classList.remove('hidden');
    if (errorMessage) errorMessage.textContent = message;
    if (mainContent) mainContent.classList.add('hidden');
}

window.verDetalleHabilidad = verDetalleHabilidad;

console.log('✅ Progreso.js COMPLETO cargado correctamente');