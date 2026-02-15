// ===================================
// MENÚ DE NIVELES - VERSIÓN FINAL CORREGIDA
// Corrige: Nombres de niveles mostrados correctamente
// ===================================

console.log('🎯 Menú de Niveles FINAL');

let deportistaData = null;
let todosLosNiveles = [];

const NIVELES_SISTEMA = [
    { id: '1_basico', nombre: 'Nivel 1', subtitulo: 'BÁSICO', descripcion: 'Fundamentos', orden: 1 },
    { id: '1_medio', nombre: 'Nivel 1', subtitulo: 'MEDIO', descripcion: 'Progresión', orden: 2 },
    { id: '1_avanzado', nombre: 'Nivel 1', subtitulo: 'AVANZADO', descripcion: 'Dominio', orden: 3 },
    { id: '2', nombre: 'Nivel 2', subtitulo: 'ELITE', descripcion: 'Excelencia', orden: 4 },
    { id: '3', nombre: 'Nivel 3', subtitulo: 'PRO', descripcion: 'Profesional', orden: 5 },
    { id: '4', nombre: 'Nivel 4', subtitulo: 'MASTER', descripcion: 'Maestría', orden: 6 }
];

document.addEventListener('DOMContentLoaded', () => {
    if (!window.DeportistaAPI.checkAuth()) return;
    
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
        
        deportistaData = await window.DeportistaAPI.getMe();
        if (!deportistaData) throw new Error('No se pudo cargar el perfil');
        
        const user = deportistaData.user || {};
        const nombreFinal = user.nombre || deportistaData.nombre || 'Deportista';
        
        console.log('👤 Perfil:', nombreFinal, '| Nivel:', deportistaData.nivel_actual);
        
        actualizarPerfilSidebar({ ...deportistaData, nombre: nombreFinal, user: user });
        
        const todasEvaluaciones = await window.DeportistaAPI.getEvaluaciones();
        const evaluacionesHabilidades = todasEvaluaciones.filter(e => e.habilidad?.categoria === 'habilidad');
        
        await calcularProgresoRealPorNivel(evaluacionesHabilidades);
        
        renderizarContenido();
        
        hideLoading();
        showContent();
        
        window.DeportistaAPI.showNotification('✅ Progreso cargado', 'success');
        
    } catch (error) {
        console.error('❌ Error:', error);
        showError(error.message || 'Error al cargar');
        hideLoading();
    }
}

async function calcularProgresoRealPorNivel(evaluaciones) {
    todosLosNiveles = [];
    
    const evaluacionesPorNivel = {};
    evaluaciones.forEach(ev => {
        const nivel = ev.habilidad?.nivel;
        if (!nivel) return;
        
        if (!evaluacionesPorNivel[nivel]) {
            evaluacionesPorNivel[nivel] = [];
        }
        
        evaluacionesPorNivel[nivel].push(ev);
    });
    
    for (const nivel of NIVELES_SISTEMA) {
        try {
            const response = await fetch(`${window.DeportistaAPI.baseURL}/habilidades/nivel/${nivel.id}`, {
                headers: window.DeportistaAPI.getHeaders()
            });
            
            if (!response.ok) {
                todosLosNiveles.push({
                    ...nivel,
                    completadas: 0,
                    total: 0,
                    porcentaje: 0,
                    estado: determinarEstadoNivel(nivel.id, deportistaData.nivel_actual, 0)
                });
                continue;
            }
            
            const data = await response.json();
            const todasHabilidades = (data.habilidades || data || []).filter(h => h.categoria === 'habilidad');
            const totalHabilidades = todasHabilidades.length;
            
            const evaluacionesNivel = evaluacionesPorNivel[nivel.id] || [];
            
            let completadas = 0;
            todasHabilidades.forEach(habilidad => {
                const evaluacion = evaluacionesNivel.find(e => 
                    e.habilidad_id === habilidad.id || e.habilidad?.id === habilidad.id
                );
                
                if (evaluacion) {
                    const puntuacionMinima = habilidad.puntuacion_minima || 3;
                    if (evaluacion.completado && evaluacion.puntuacion >= puntuacionMinima) {
                        completadas++;
                    }
                }
            });
            
            const porcentaje = totalHabilidades > 0 ? Math.round((completadas / totalHabilidades) * 100) : 0;
            const estado = determinarEstadoNivel(nivel.id, deportistaData.nivel_actual, porcentaje);
            
            todosLosNiveles.push({
                ...nivel,
                completadas,
                total: totalHabilidades,
                porcentaje,
                estado
            });
            
        } catch (error) {
            console.error(`❌ Error nivel ${nivel.id}:`, error);
            todosLosNiveles.push({
                ...nivel,
                completadas: 0,
                total: 0,
                porcentaje: 0,
                estado: 'bloqueado'
            });
        }
    }
}

function determinarEstadoNivel(nivelId, nivelActual, porcentaje) {
    const nivelInfo = NIVELES_SISTEMA.find(n => n.id === nivelId);
    const nivelActualInfo = NIVELES_SISTEMA.find(n => n.id === nivelActual);
    
    if (!nivelInfo) return 'bloqueado';
    if (!nivelActualInfo) return nivelInfo.orden === 1 ? 'en_progreso' : 'bloqueado';
    
    if (nivelInfo.orden < nivelActualInfo.orden) {
        return 'completado';
    } else if (nivelInfo.orden === nivelActualInfo.orden) {
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
                <h4 class="text-xl font-bold">No hay niveles disponibles</h4>
            </div>
        `;
        return;
    }
    
    container.innerHTML = todosLosNiveles.map((nivel, index) => {
        const esNivelActual = nivel.id === deportistaData.nivel_actual;
        return renderizarCardNivel(nivel, esNivelActual, index);
    }).join('');
}

function renderizarCardNivel(nivel, esNivelActual, index) {
    const { estado, porcentaje, completadas, total, nombre, subtitulo, descripcion } = nivel;
    
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
        ? `onclick="verDetalleNivel('${nivel.id}')"` : '';
    
    // 🔥 CORRECCIÓN: Mostrar nombre completo
    return `
        <button class="level-card ${bgClass} border ${borderClass} p-8 text-left group ${opacityClass} hover:grayscale-0 hover:opacity-100 transition-all ${cursorClass} relative"
                ${onclick} style="animation-delay: ${index * 0.1}s">
            
            ${esNivelActual ? `
                <div class="absolute top-4 right-4 flex items-center gap-1">
                    <span class="text-[10px] font-bold text-primary animate-pulse uppercase italic">Nivel Actual</span>
                    <span class="material-symbols-outlined text-primary text-xl">${iconoEstado}</span>
                </div>
            ` : `
                <div class="absolute top-4 right-4 text-${colorEstado}">
                    <span class="material-symbols-outlined text-3xl ${estado === 'completado' ? 'fill-1' : ''}">${iconoEstado}</span>
                </div>
            `}
            
            <h3 class="font-display text-5xl font-black italic tracking-tighter ${estado === 'bloqueado' && !esNivelActual ? 'text-gray-500' : 'text-white'} mb-2 leading-none uppercase">
                ${nombre} <span class="${estado === 'bloqueado' && !esNivelActual ? 'text-gray-700' : 'text-primary'}">${subtitulo}</span>
            </h3>
            
            <p class="text-[10px] font-bold ${estado === 'bloqueado' && !esNivelActual ? 'text-gray-600' : 'text-gray-500'} tracking-[0.2em] mb-8 uppercase italic">
                ${descripcion}
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
                        ${total > 0 ? `${completadas}/${total} habilidades` : 'Sin habilidades'}
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
    
    if (profileName) profileName.textContent = nombreMostrar;
    
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

console.log('✅ Menu Niveles FINAL - Nombres correctos (NIVEL 1 BÁSICO, etc)');