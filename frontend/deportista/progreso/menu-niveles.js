// ===================================
// MENÚ DE NIVELES - TITANES EVOLUTION
// VERSIÓN SIMPLIFICADA - USA SOLO EVALUACIONES
// No hace llamadas adicionales al backend problemático
// ===================================

console.log('🎯 Inicializando Menú de Niveles (VERSIÓN SIMPLIFICADA)...');

let deportistaData = null;
let todosLosNiveles = [];
let evaluacionesData = [];

// Definir todos los niveles del sistema
const NIVELES_SISTEMA = [
    { id: '1_basico', nombre: 'Nivel 1 BÁSICO', descripcion: '', orden: 1 },
    { id: '1_medio', nombre: 'Nivel 1 MEDIO', descripcion: '', orden: 2 },
    { id: '1_avanzado', nombre: 'Nivel 1 AVANZADO', descripcion: '', orden: 3 },
    { id: '2', nombre: 'Nivel 2 ', descripcion: '', orden: 4 },
    { id: '3', nombre: 'Nivel 3 ', descripcion: '', orden: 5 },
    { id: '4', nombre: 'Nivel 4 ', descripcion: '', orden: 6 }
];

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM cargado');
    
    if (!window.DeportistaAPI.checkAuth()) {
        return;
    }
    
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
        console.log('📥 Cargando datos del deportista...');
        
        // Cargar perfil
        deportistaData = await window.DeportistaAPI.getMe();
        if (!deportistaData) {
            throw new Error('No se pudo cargar el perfil del deportista');
        }
        
        const user = deportistaData.user || {};
        const nombreFinal = user.nombre || deportistaData.nombre || 
                           window.DeportistaAPI.user?.nombre || 
                           window.DeportistaAPI.user?.name || 'Deportista';
        
        console.log('👤 Perfil cargado:', nombreFinal, '| Nivel actual:', deportistaData.nivel_actual);
        
        actualizarPerfilSidebar({ ...deportistaData, nombre: nombreFinal, user: user });
        
        // Cargar TODAS las evaluaciones
        const todasEvaluaciones = await window.DeportistaAPI.getEvaluaciones();
        
        console.log('📋 Total evaluaciones recibidas:', todasEvaluaciones.length);
        
        // Filtrar solo habilidades
        evaluacionesData = todasEvaluaciones.filter(e => {
            const esHabilidad = e.habilidad?.categoria === 'habilidad';
            
            if (esHabilidad) {
                console.log(`   ✅ Evaluación: ${e.habilidad?.nombre || 'Sin nombre'} | Nivel: ${e.habilidad?.nivel} | Puntuación: ${e.puntuacion} | Completado: ${e.completado}`);
            }
            
            return esHabilidad;
        });
        
        console.log('📊 Evaluaciones de HABILIDADES:', evaluacionesData.length);
        
        // 🔥 NUEVO: Calcular progreso SOLO basándonos en las evaluaciones existentes
        calcularProgresoDesdeEvaluaciones();
        
        // Renderizar
        renderizarContenido();
        
        hideLoading();
        showContent();
        
        window.DeportistaAPI.showNotification('✅ Progreso cargado exitosamente', 'success');
        
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        showError(error.message || 'Error al cargar tu progreso');
        hideLoading();
    }
}

// 🔥 NUEVA FUNCIÓN: Calcular progreso solo desde evaluaciones
function calcularProgresoDesdeEvaluaciones() {
    console.log('🔍 Calculando progreso desde evaluaciones...');
    
    todosLosNiveles = [];
    
    // Agrupar evaluaciones por nivel
    const evaluacionesPorNivel = {};
    
    evaluacionesData.forEach(ev => {
        const nivel = ev.habilidad?.nivel;
        if (!nivel) return;
        
        if (!evaluacionesPorNivel[nivel]) {
            evaluacionesPorNivel[nivel] = [];
        }
        
        // Solo agregar si no está ya (evitar duplicados)
        const yaExiste = evaluacionesPorNivel[nivel].some(e => 
            e.habilidad_id === ev.habilidad_id || 
            (e.habilidad?.id === ev.habilidad?.id)
        );
        
        if (!yaExiste) {
            evaluacionesPorNivel[nivel].push(ev);
        }
    });
    
    console.log('📊 Evaluaciones agrupadas por nivel:', evaluacionesPorNivel);
    
    // Para cada nivel del sistema, calcular progreso
    for (const nivel of NIVELES_SISTEMA) {
        const evaluacionesNivel = evaluacionesPorNivel[nivel.id] || [];
        
        console.log(`\n📚 Procesando ${nivel.nombre} (${nivel.id})...`);
        console.log(`   Evaluaciones encontradas: ${evaluacionesNivel.length}`);
        
        if (evaluacionesNivel.length === 0) {
            // Nivel sin evaluaciones
            console.log(`   ⚠️ Sin evaluaciones para ${nivel.nombre}`);
            
            todosLosNiveles.push({
                ...nivel,
                habilidades: [],
                completadas: 0,
                total: 0,
                porcentaje: 0,
                estado: determinarEstadoNivel(nivel.id, deportistaData.nivel_actual, 0)
            });
            continue;
        }
        
        // Obtener habilidades únicas de este nivel
        const habilidadesUnicas = new Map();
        
        evaluacionesNivel.forEach(ev => {
            const habilidadId = ev.habilidad_id || ev.habilidad?.id;
            
            if (!habilidadId) return;
            
            // Si ya existe, mantener la de mayor puntuación
            if (habilidadesUnicas.has(habilidadId)) {
                const existente = habilidadesUnicas.get(habilidadId);
                if (ev.puntuacion > existente.puntuacion) {
                    habilidadesUnicas.set(habilidadId, ev);
                }
            } else {
                habilidadesUnicas.set(habilidadId, ev);
            }
        });
        
        const total = habilidadesUnicas.size;
        let completadas = 0;
        
        console.log(`   🎯 Habilidades únicas: ${total}`);
        
        // Contar completadas
        habilidadesUnicas.forEach((ev, habilidadId) => {
            const puntuacionMinima = ev.habilidad?.puntuacion_minima || 3;
            const puntuacion = parseFloat(ev.puntuacion) || 0;
            const estaCompletada = ev.completado === true || ev.completado === 1 || ev.completado === '1';
            const tienePuntuacionSuficiente = puntuacion >= puntuacionMinima;
            
            if (estaCompletada && tienePuntuacionSuficiente) {
                completadas++;
                console.log(`      ✅ ${ev.habilidad?.nombre}: ${puntuacion}/${puntuacionMinima} - COMPLETADA`);
            } else {
                console.log(`      🔄 ${ev.habilidad?.nombre}: ${puntuacion}/${puntuacionMinima} - EN PROGRESO`);
            }
        });
        
        const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
        
        console.log(`   📊 RESUMEN: ${completadas}/${total} = ${porcentaje}%`);
        
        const estado = determinarEstadoNivel(nivel.id, deportistaData.nivel_actual, porcentaje);
        
        console.log(`   🎯 Estado: ${estado}`);
        
        todosLosNiveles.push({
            ...nivel,
            habilidades: Array.from(habilidadesUnicas.values()).map(ev => ev.habilidad),
            completadas,
            total,
            porcentaje,
            estado
        });
    }
    
    console.log('\n✅ Todos los niveles procesados:', todosLosNiveles.length);
}

function determinarEstadoNivel(nivelId, nivelActual, porcentaje) {
    const nivelInfo = NIVELES_SISTEMA.find(n => n.id === nivelId);
    const nivelActualInfo = NIVELES_SISTEMA.find(n => n.id === nivelActual);
    
    if (!nivelInfo) {
        return 'bloqueado';
    }
    
    if (!nivelActualInfo) {
        return nivelInfo.orden === 1 ? 'en_progreso' : 'bloqueado';
    }
    
    if (nivelInfo.orden < nivelActualInfo.orden) {
        return 'completado';
    } else if (nivelInfo.orden === nivelActualInfo.orden) {
        return 'en_progreso';
    } else if (nivelInfo.orden === nivelActualInfo.orden + 1 && porcentaje >= 100) {
        return 'en_progreso';
    } else {
        return 'bloqueado';
    }
}

function renderizarContenido() {
    renderizarNiveles();
}

function renderizarNiveles() {
    const container = document.getElementById('nivelesContainer');
    if (!container) return;
    
    if (todosLosNiveles.length === 0) {
        container.innerHTML = `
            <div class="col-span-3 text-center py-12 text-gray-400">
                <div class="text-6xl mb-4">📋</div>
                <h4 class="text-xl font-bold mb-2">No hay niveles disponibles</h4>
                <p class="text-sm">Contacta con tu entrenador</p>
            </div>
        `;
        return;
    }
    
    console.log('🎯 Renderizando niveles. Nivel actual del deportista:', deportistaData.nivel_actual);
    
    container.innerHTML = todosLosNiveles.map((nivel, index) => {
        const esNivelActual = nivel.id === deportistaData.nivel_actual;
        
        console.log(`   Renderizando ${nivel.nombre}: ID=${nivel.id} | Es actual=${esNivelActual} | Estado=${nivel.estado} | Progreso=${nivel.porcentaje}%`);
        
        return renderizarCardNivel(nivel, esNivelActual, index);
    }).join('');
}

function renderizarCardNivel(nivel, esNivelActual, index) {
    const { estado, porcentaje, completadas, total } = nivel;
    
    let iconoEstado = 'lock';
    let colorEstado = 'gray-600';
    let textoEstado = 'Bloqueado';
    let borderClass = 'border-white/5';
    let bgClass = 'bg-zinc-900/50';
    let opacityClass = 'opacity-60 grayscale';
    let cursorClass = 'cursor-not-allowed';
    
    if (estado === 'completado') {
        iconoEstado = 'emoji_events';
        colorEstado = 'green-500';
        textoEstado = 'Superado';
        borderClass = 'border-green-500/30';
        bgClass = 'bg-zinc-900';
        opacityClass = '';
        cursorClass = 'cursor-pointer';
    } else if (estado === 'en_progreso' || esNivelActual) {
        iconoEstado = 'rocket_launch';
        colorEstado = 'primary';
        textoEstado = 'En Curso';
        borderClass = 'border-primary';
        bgClass = 'bg-zinc-900';
        opacityClass = '';
        cursorClass = 'cursor-pointer';
    }
    
    const strokeDashoffset = 263.89 - (263.89 * porcentaje / 100);
    
    const onclick = (estado === 'completado' || estado === 'en_progreso' || esNivelActual) 
        ? `onclick="verDetalleNivel('${nivel.id}')"` 
        : '';
    
    return `
        <button class="level-card ${bgClass} border ${borderClass} p-8 text-left group ${opacityClass} hover:grayscale-0 hover:opacity-100 transition-all ${cursorClass} relative"
                ${onclick}
                style="animation-delay: ${index * 0.1}s">
            
            ${esNivelActual ? `
                <div class="absolute top-4 right-4 flex items-center gap-1">
                    <span class="text-[10px] font-bold text-primary animate-pulse uppercase italic tracking-tighter">Nivel Actual</span>
                    <span class="material-symbols-outlined text-primary text-xl">${iconoEstado}</span>
                </div>
            ` : `
                <div class="absolute top-4 right-4 text-${colorEstado}">
                    <span class="material-symbols-outlined text-3xl ${estado === 'completado' ? 'fill-1' : ''}">${iconoEstado}</span>
                </div>
            `}
            
            <h3 class="font-display text-5xl font-black italic tracking-tighter ${estado === 'bloqueado' && !esNivelActual ? 'text-gray-500' : 'text-white'} mb-2 leading-none uppercase">
                ${nivel.nombre.split(' ')[0]} <span class="${estado === 'bloqueado' && !esNivelActual ? 'text-gray-700' : 'text-primary'}">${nivel.nombre.split(' ')[1]}</span>
            </h3>
            
            <p class="text-[10px] font-bold ${estado === 'bloqueado' && !esNivelActual ? 'text-gray-600' : 'text-gray-500'} tracking-[0.2em] mb-8 uppercase italic">
                ${nivel.descripcion}
            </p>
            
            <div class="flex items-center gap-6">
                <div class="relative w-24 h-24">
                    <svg class="w-full h-full" viewBox="0 0 100 100">
                        <circle class="text-zinc-800" cx="50" cy="50" fill="transparent" r="42" stroke="currentColor" stroke-width="8"></circle>
                        <circle class="text-${estado === 'completado' ? 'green-500' : (estado === 'en_progreso' || esNivelActual) ? 'primary' : 'gray-700'} progress-ring__circle" 
                                cx="50" cy="50" fill="transparent" r="42" 
                                stroke="currentColor" stroke-dasharray="263.89" 
                                stroke-dashoffset="${strokeDashoffset}" 
                                stroke-linecap="round" stroke-width="8"></circle>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center font-display text-xl font-bold italic ${estado === 'bloqueado' && !esNivelActual ? 'text-gray-700' : ''}">
                        ${porcentaje}%
                    </div>
                </div>
                
                <div class="flex-1">
                    <p class="text-[10px] font-bold ${estado === 'completado' ? 'text-green-500' : (estado === 'en_progreso' || esNivelActual) ? 'text-primary' : 'text-gray-700'} uppercase tracking-widest mb-1">
                        ${textoEstado}
                    </p>
                    <span class="text-xs ${estado === 'bloqueado' && !esNivelActual ? 'text-gray-600 italic' : 'text-gray-400'} font-medium">
                        ${total > 0 ? `${completadas}/${total} habilidades` : 'Sin evaluaciones'}
                    </span>
                </div>
            </div>
        </button>
    `;
}

function verDetalleNivel(nivelId) {
    window.location.href = `detalle-nivel.html?nivel=${nivelId}`;
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

function showLoading() {
    document.getElementById('loadingState')?.classList.remove('hidden');
    document.getElementById('mainContent')?.classList.add('hidden');
    document.getElementById('errorState')?.classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loadingState')?.classList.add('hidden');
}

function showContent() {
    document.getElementById('mainContent')?.classList.remove('hidden');
}

function showError(message) {
    document.getElementById('errorState')?.classList.remove('hidden');
    if (document.getElementById('errorMessage')) {
        document.getElementById('errorMessage').textContent = message;
    }
    document.getElementById('mainContent')?.classList.add('hidden');
}

window.verDetalleNivel = verDetalleNivel;

console.log('✅ Menu niveles cargado - VERSIÓN SIMPLIFICADA (sin llamadas problemáticas al backend)');