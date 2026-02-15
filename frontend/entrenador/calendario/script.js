// ===================================
// CALENDARIO.JS - TITANES EVOLUTION
// VERSIÓN FINAL - CORRECCIONES COMPLETAS
// ===================================

console.log('📂 Archivo calendario.js (entrenador) cargado - VERSIÓN FINAL');

// CONFIGURACIÓN GLOBAL
const API_BASE_URL = window.EntrenadorAPI ? window.EntrenadorAPI.baseURL : (() => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return (() => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    return 'https://gestiondeportistas-production.up.railway.app/api';
})();
    }
    return 'https://gestiondeportistas-production.up.railway.app/api';
})();
console.log('⚙️ Configuración inicial:');
console.log('  - API_BASE_URL:', API_BASE_URL);
console.log('  - EntrenadorAPI disponible:', !!window.EntrenadorAPI);

// ESTADO GLOBAL DEL CALENDARIO
let estadoCalendario = {
    mesActual: new Date().getMonth(),
    añoActual: new Date().getFullYear(),
    eventosGlobales: [],
    eventosFiltrados: [],
    nivelesSeleccionados: [],
    gruposSeleccionados: [],
    nivelesDisponibles: ['baby_titans', '1_basico', '1_medio', '1_avanzado', '2', '3', '4'],
    gruposDisponibles: ['ROCKS TITANS', 'LIGHTNING TITANS', 'STORM TITANS', 'FIRE TITANS', 'ELECTRIC TITANS', 'STARS EVOLUTION']
};

// ===================================
// INICIALIZACIÓN
// ===================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando Calendario (Entrenador)...');
    
    // Verificar autenticación
    if (!window.EntrenadorAPI || !window.EntrenadorAPI.checkAuth()) {
        console.error('❌ Usuario no autenticado');
        window.location.href = '../../auth/login-entrenador.html';
        return;
    }
    
    // Actualizar información del sidebar
    actualizarSidebar();
    
    // Verificar elementos del DOM
    const elementosRequeridos = [
        'calendarGrid',
        'nivelesCheckboxes',
        'gruposCheckboxes',
        'proximosEventos',
        'currentMonth',
        'totalEventos',
        'crearEventoBtn'
    ];
    
    const elementosFaltantes = elementosRequeridos.filter(id => !document.getElementById(id));
    
    if (elementosFaltantes.length > 0) {
        console.error('❌ Elementos del DOM faltantes:', elementosFaltantes);
        mostrarError('Error: Elementos del calendario no encontrados en el DOM');
        return;
    }
    
    console.log('✅ Todos los elementos del DOM encontrados');
    
    // Mejorar diseño del botón "Crear Evento"
    mejorarBotonCrearEvento();
    
    try {
        await inicializarCalendario();
        configurarEventListeners();
        console.log('✅ Calendario inicializado correctamente');
    } catch (error) {
        console.error('❌ Error fatal inicializando calendario:', error);
        mostrarError('Error al inicializar el calendario. Revisa la consola.');
    }
});

// FUNCIÓN PARA MEJORAR EL DISEÑO DEL BOTÓN CREAR EVENTO
function mejorarBotonCrearEvento() {
    const crearEventoBtn = document.getElementById('crearEventoBtn');
    if (!crearEventoBtn) {
        console.error('❌ Botón "crearEventoBtn" no encontrado');
        return;
    }
    
    // Añadir estilos adicionales
    crearEventoBtn.style.cssText = `
        background: linear-gradient(135deg, #E21B23 0%, #C4161D 100%);
        color: white;
        padding: 0.75rem 2rem;
        border-radius: 50px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: 0 4px 15px rgba(226, 27, 35, 0.3);
        position: relative;
        overflow: hidden;
    `;
    
    // Efecto hover
    crearEventoBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px)';
        this.style.boxShadow = '0 8px 25px rgba(226, 27, 35, 0.4)';
        this.style.background = 'linear-gradient(135deg, #C4161D 0%, #A81218 100%)';
    });
    
    crearEventoBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 15px rgba(226, 27, 35, 0.3)';
        this.style.background = 'linear-gradient(135deg, #E21B23 0%, #C4161D 100%)';
    });
    
    // Efecto click
    crearEventoBtn.addEventListener('mousedown', function() {
        this.style.transform = 'translateY(1px)';
        this.style.boxShadow = '0 2px 10px rgba(226, 27, 35, 0.3)';
    });
    
    crearEventoBtn.addEventListener('mouseup', function() {
        this.style.transform = 'translateY(-3px)';
        this.style.boxShadow = '0 8px 25px rgba(226, 27, 35, 0.4)';
    });
    
    console.log('🎨 Botón "Crear Evento" mejorado');
}

async function inicializarCalendario() {
    try {
        mostrarCargando(true);
        
        console.log('📥 Paso 1: Cargando grupos disponibles...');
        await cargarGruposDisponibles();
        
        console.log('🎨 Paso 2: Renderizando filtros...');
        renderizarFiltrosNiveles();
        renderizarFiltrosGrupos();
        
        console.log('📅 Paso 3: Cargando eventos...');
        await cargarEventos();
        
        console.log('📊 Paso 4: Renderizando calendario...');
        renderizarCalendario();
        
        console.log('📈 Paso 5: Actualizando estadísticas...');
        actualizarEstadisticas();
        
        console.log('⏰ Paso 6: Renderizando próximos eventos...');
        renderizarProximosEventos();
        
        actualizarTiempoActualizacion();
        
        console.log('✅ Inicialización completada exitosamente');
        
    } catch (error) {
        console.error('❌ Error en inicializarCalendario:', error);
        console.error('Stack trace:', error.stack);
        mostrarError('Error al cargar el calendario: ' + error.message);
        throw error;
    } finally {
        mostrarCargando(false);
    }
}

// ===================================
// SIDEBAR
// ===================================
function actualizarSidebar() {
    const user = window.EntrenadorAPI.user;
    if (user) {
        const sidebarName = document.getElementById('sidebarName');
        const sidebarAvatar = document.getElementById('sidebarAvatar');
        
        if (sidebarName) {
            sidebarName.textContent = user.nombre || user.email || 'Entrenador';
        }
        
        if (sidebarAvatar && user.foto_perfil) {
            sidebarAvatar.src = user.foto_perfil;
        }
    }
}

// ===================================
// CARGA DE DATOS DESDE LA API
// ===================================
async function cargarEventos() {
    try {
        const mes = estadoCalendario.mesActual + 1;
        const año = estadoCalendario.añoActual;
        
        console.log(`📅 Cargando eventos para ${mes}/${año}...`);
        
        const eventos = await window.EntrenadorAPI.getEventosCalendario({
            mes: mes,
            año: año
        });
        
        console.log('📊 Eventos recibidos de la API:', eventos);
        console.log('📋 Detalle de eventos:');
        eventos.forEach((evento, index) => {
            console.log(`  ${index + 1}. ${evento.titulo} | Nivel: ${evento.nivel} | Grupo: ${evento.grupo_competitivo} | Fecha: ${new Date(evento.fecha).toLocaleDateString()}`);
        });
        
        estadoCalendario.eventosGlobales = eventos || [];
        console.log(`✅ ${eventos.length} eventos cargados`);
        
        aplicarFiltros();
        
    } catch (error) {
        console.error('❌ Error cargando eventos:', error);
        estadoCalendario.eventosGlobales = [];
        estadoCalendario.eventosFiltrados = [];
        mostrarError('Error al cargar eventos');
        throw error;
    }
}

async function cargarGruposDisponibles() {
    try {
        console.log('🏆 Cargando grupos competitivos...');
        
        // Intentar cargar desde la API
        try {
            const response = await fetch(`${API_BASE_URL}/calendario/grupos-competitivos`, {
                headers: window.EntrenadorAPI.getHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.grupos && Array.isArray(data.grupos) && data.grupos.length > 0) {
                    estadoCalendario.gruposDisponibles = data.grupos;
                    console.log(`✅ ${data.grupos.length} grupos cargados desde API:`, data.grupos);
                    return;
                }
            }
        } catch (error) {
            console.warn('⚠️ No se pudieron cargar grupos desde API, usando valores por defecto');
        }
        
        console.log('✅ Usando grupos por defecto');
        
    } catch (error) {
        console.error('❌ Error cargando grupos:', error);
        console.log('✅ Usando grupos por defecto');
    }
}

// ===================================
// RENDERIZADO DE FILTROS
// ===================================
function renderizarFiltrosNiveles() {
    const container = document.getElementById('nivelesCheckboxes');
    if (!container) return;
    
    const nivelesLabels = {
        'baby_titans': 'Baby Titans',
        '1_basico': 'Nivel 1 - Básico',
        '1_medio': 'Nivel 1 - Medio',
        '1_avanzado': 'Nivel 1 - Avanzado',
        '2': 'Nivel 2',
        '3': 'Nivel 3',
        '4': 'Nivel 4'
    };
    
    // Filtrar solo los niveles asignados al entrenador
    const user = window.EntrenadorAPI.user;
    const nivelesAsignados = user?.niveles_asignados || estadoCalendario.nivelesDisponibles;
    
    container.innerHTML = nivelesAsignados.map(nivel => `
        <label class="filter-checkbox">
            <input 
                type="checkbox" 
                value="${nivel}" 
                onchange="toggleFiltroNivel('${nivel}')"
                ${estadoCalendario.nivelesSeleccionados.includes(nivel) ? 'checked' : ''}
            >
            <span>${nivelesLabels[nivel]}</span>
            <span class="event-count-badge" id="count-nivel-${nivel}">0</span>
        </label>
    `).join('');
    
    actualizarContadoresFiltros();
}

function renderizarFiltrosGrupos() {
    const container = document.getElementById('gruposCheckboxes');
    if (!container) return;
    
    container.innerHTML = estadoCalendario.gruposDisponibles.map(grupo => {
        const grupoId = grupo.toLowerCase().replace(/\s+/g, '_');
        return `
            <label class="filter-checkbox">
                <input 
                    type="checkbox" 
                    value="${grupo}" 
                    onchange="toggleFiltroGrupo('${grupo}')"
                    ${estadoCalendario.gruposSeleccionados.includes(grupo) ? 'checked' : ''}
                >
                <span>${grupo}</span>
                <span class="event-count-badge" id="count-grupo-${grupoId}">0</span>
            </label>
        `;
    }).join('');
    
    actualizarContadoresFiltros();
}

// ===================================
// FILTROS
// ===================================
function toggleFiltroNivel(nivel) {
    const checkbox = document.querySelector(`#nivelesCheckboxes input[value="${nivel}"]`);
    if (!checkbox) return;
    
    if (checkbox.checked) {
        if (!estadoCalendario.nivelesSeleccionados.includes(nivel)) {
            estadoCalendario.nivelesSeleccionados.push(nivel);
        }
    } else {
        const index = estadoCalendario.nivelesSeleccionados.indexOf(nivel);
        if (index > -1) {
            estadoCalendario.nivelesSeleccionados.splice(index, 1);
        }
    }
    
    console.log('📊 Niveles seleccionados:', estadoCalendario.nivelesSeleccionados);
    
    aplicarFiltros();
    renderizarCalendario();
    actualizarEstadisticas();
    renderizarProximosEventos();
}

function toggleFiltroGrupo(grupo) {
    const checkbox = document.querySelector(`#gruposCheckboxes input[value="${grupo}"]`);
    if (!checkbox) return;
    
    if (checkbox.checked) {
        if (!estadoCalendario.gruposSeleccionados.includes(grupo)) {
            estadoCalendario.gruposSeleccionados.push(grupo);
        }
    } else {
        const index = estadoCalendario.gruposSeleccionados.indexOf(grupo);
        if (index > -1) {
            estadoCalendario.gruposSeleccionados.splice(index, 1);
        }
    }
    
    console.log('🏆 Grupos seleccionados:', estadoCalendario.gruposSeleccionados);
    
    aplicarFiltros();
    renderizarCalendario();
    actualizarEstadisticas();
    renderizarProximosEventos();
}

function aplicarFiltros() {
    console.log('🔍 Aplicando filtros...');
    console.log('📊 Eventos globales:', estadoCalendario.eventosGlobales.length);
    console.log('🎯 Niveles seleccionados:', estadoCalendario.nivelesSeleccionados);
    console.log('🏆 Grupos seleccionados:', estadoCalendario.gruposSeleccionados);
    
    let eventosFiltrados = [...estadoCalendario.eventosGlobales];
    
    // Si no hay filtros, mostrar todo
    if (estadoCalendario.nivelesSeleccionados.length === 0 && estadoCalendario.gruposSeleccionados.length === 0) {
        console.log('🎯 Mostrando TODOS los eventos (sin filtros)');
        estadoCalendario.eventosFiltrados = eventosFiltrados;
        return;
    }
    
    // Filtrar por niveles
    if (estadoCalendario.nivelesSeleccionados.length > 0) {
        eventosFiltrados = eventosFiltrados.filter(evento => 
            estadoCalendario.nivelesSeleccionados.includes(evento.nivel) || 
            evento.nivel === 'todos'
        );
    }
    
    // Filtrar por grupos
    if (estadoCalendario.gruposSeleccionados.length > 0) {
        eventosFiltrados = eventosFiltrados.filter(evento => {
            if (!evento.grupo_competitivo) return true;
            
            const grupoEvento = evento.grupo_competitivo.toUpperCase();
            return estadoCalendario.gruposSeleccionados.some(g => 
                g.toUpperCase() === grupoEvento
            );
        });
    }
    
    estadoCalendario.eventosFiltrados = eventosFiltrados;
    
    console.log(`✅ Filtrados: ${eventosFiltrados.length} de ${estadoCalendario.eventosGlobales.length} eventos`);
}

// ===================================
// RENDERIZADO DEL CALENDARIO
// ===================================
function renderizarCalendario() {
    console.log('🎨 Renderizando calendario...');
    console.log(`📊 Eventos filtrados: ${estadoCalendario.eventosFiltrados.length}`);
    
    const grid = document.getElementById('calendarGrid');
    if (!grid) {
        console.error('❌ Elemento calendarGrid no encontrado');
        return;
    }
    
    grid.innerHTML = '';
    
    const primerDia = new Date(estadoCalendario.añoActual, estadoCalendario.mesActual, 1);
    const ultimoDia = new Date(estadoCalendario.añoActual, estadoCalendario.mesActual + 1, 0);
    
    const primerDiaSemana = primerDia.getDay();
    const diasEnMes = ultimoDia.getDate();
    
    // Días del mes anterior
    const mesAnterior = new Date(estadoCalendario.añoActual, estadoCalendario.mesActual, 0);
    const diasMesAnterior = mesAnterior.getDate();
    
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
        const dia = diasMesAnterior - i;
        grid.appendChild(crearCeldaDia(dia, true, mesAnterior.getMonth(), mesAnterior.getFullYear()));
    }
    
    // Días del mes actual
    for (let dia = 1; dia <= diasEnMes; dia++) {
        grid.appendChild(crearCeldaDia(dia, false, estadoCalendario.mesActual, estadoCalendario.añoActual));
    }
    
    // Días del siguiente mes
    const diasRestantes = 42 - (primerDiaSemana + diasEnMes);
    for (let dia = 1; dia <= diasRestantes; dia++) {
        const mesSiguiente = estadoCalendario.mesActual + 1;
        grid.appendChild(crearCeldaDia(dia, true, mesSiguiente, estadoCalendario.añoActual));
    }
    
    actualizarTituloMes();
}

function crearCeldaDia(dia, esOtroMes, mes, año) {
    const celda = document.createElement('div');
    celda.className = 'calendar-day';
    
    const fecha = new Date(año, mes, dia);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSinHora = new Date(fecha);
    fechaSinHora.setHours(0, 0, 0, 0);
    
    const esHoy = fechaSinHora.getTime() === hoy.getTime();
    const esFinDeSemana = fecha.getDay() === 0 || fecha.getDay() === 6;
    
    // Clases CSS
    if (esOtroMes) {
        celda.classList.add('other-month');
    }
    if (esHoy) {
        celda.classList.add('today');
    }
    if (esFinDeSemana && !esOtroMes) {
        celda.classList.add('weekend');
    }
    
    // Obtener eventos del día
    const eventosDelDia = obtenerEventosDelDia(fecha);
    
    // HTML de la celda
    celda.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
            <span class="day-number">${dia}</span>
            ${eventosDelDia.length > 0 ? `
                <span class="event-count">${eventosDelDia.length}</span>
            ` : ''}
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            ${eventosDelDia.slice(0, 3).map(evento => `
                <div class="event-badge ${evento.tipo}" onclick="abrirDetalleEvento('${evento.id}')">
                    <span style="font-size: 0.7rem; margin-right: 2px;">${obtenerIconoTipo(evento.tipo)}</span>
                    ${evento.titulo.substring(0, 20)}${evento.titulo.length > 20 ? '...' : ''}
                </div>
            `).join('')}
            ${eventosDelDia.length > 3 ? `
                <div style="font-size: 0.65rem; color: #6B7280; font-weight: 600; margin-top: 0.25rem;">
                    +${eventosDelDia.length - 3} más
                </div>
            ` : ''}
        </div>
    `;
    
    // Si hay eventos, añadir botón para eliminar todos
    if (eventosDelDia.length > 1) {
        const eliminarTodosBtn = document.createElement('div');
        eliminarTodosBtn.className = 'eliminar-todos-btn';
        eliminarTodosBtn.innerHTML = `
            <span class="material-symbols-outlined" style="font-size: 0.8rem;">delete_sweep</span>
            Eliminar todos (${eventosDelDia.length})
        `;
        eliminarTodosBtn.style.cssText = `
            font-size: 0.65rem;
            color: #EF4444;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 4px;
            padding: 2px 6px;
            margin-top: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 2px;
            justify-content: center;
            transition: all 0.2s;
        `;
        eliminarTodosBtn.onmouseenter = function() {
            this.style.background = 'rgba(239, 68, 68, 0.2)';
        };
        eliminarTodosBtn.onmouseleave = function() {
            this.style.background = 'rgba(239, 68, 68, 0.1)';
        };
        eliminarTodosBtn.onclick = (e) => {
            e.stopPropagation();
            eliminarEventosDelDia(fecha);
        };
        
        const container = celda.querySelector('div:last-child');
        container.appendChild(eliminarTodosBtn);
    }
    
    celda.onclick = (e) => {
        if (!e.target.classList.contains('event-badge') && !e.target.closest('.eliminar-todos-btn')) {
            mostrarEventosDelDia(fecha, eventosDelDia);
        }
    };
    
    return celda;
}

function obtenerIconoTipo(tipo) {
    const iconos = {
        'competencia': '🏆',
        'entrenamiento': '🏋️',
        'evaluacion': '📝',
        'festivo': '🎉',
        'general': '📅',
        'otro': '📌'
    };
    return iconos[tipo] || '📅';
}

function obtenerEventosDelDia(fecha) {
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(0, 0, 0, 0);
    
    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);
    
    return estadoCalendario.eventosFiltrados.filter(evento => {
        const fechaEvento = new Date(evento.fecha);
        return fechaEvento >= fechaInicio && fechaEvento <= fechaFin;
    });
}

// ===================================
// ELIMINACIÓN MÚLTIPLE DE EVENTOS
// ===================================
async function eliminarEventosDelDia(fecha) {
    try {
        // Obtener eventos del día
        const eventosDelDia = obtenerEventosDelDia(fecha);
        
        if (eventosDelDia.length === 0) {
            mostrarError('No hay eventos para eliminar en este día');
            return;
        }
        
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const confirmacion = confirm(`¿Estás seguro de eliminar TODOS los eventos del ${fechaFormateada}?\n\nSe eliminarán ${eventosDelDia.length} evento(s).\n\n⚠️ Esta acción NO se puede deshacer.`);
        
        if (!confirmacion) return;
        
        mostrarCargando(true);
        
        let eliminadosExitosos = 0;
        let errores = [];
        
        // Eliminar todos los eventos en paralelo
        const promesas = eventosDelDia.map(async (evento) => {
            try {
                await window.EntrenadorAPI.deleteEvento(evento.id);
                eliminadosExitosos++;
                console.log(`✅ Evento eliminado: ${evento.titulo}`);
                return { success: true, evento: evento.titulo };
            } catch (error) {
                errores.push(`❌ ${evento.titulo}: ${error.message}`);
                console.error(`Error eliminando ${evento.titulo}:`, error);
                return { success: false, evento: evento.titulo, error: error.message };
            }
        });
        
        await Promise.all(promesas);
        
        mostrarCargando(false);
        
        // Mostrar resultados
        if (eliminadosExitosos > 0) {
            mostrarExito(`✅ ${eliminadosExitosos} evento(s) eliminado(s) correctamente`);
            
            // Cerrar modal si está abierto
            const modal = document.getElementById('eventModal');
            if (modal && modal.classList.contains('active')) {
                closeModal();
            }
            
            // Recargar datos inmediatamente
            await recargarDatosCalendario();
            
            if (errores.length > 0) {
                console.warn('⚠️ Algunos eventos no se pudieron eliminar:', errores);
            }
        } else {
            mostrarError('No se pudo eliminar ningún evento');
        }
        
    } catch (error) {
        console.error('❌ Error eliminando eventos del día:', error);
        mostrarError('Error al eliminar eventos: ' + error.message);
    }
}

async function recargarDatosCalendario() {
    try {
        await cargarEventos();
        renderizarCalendario();
        actualizarEstadisticas();
        renderizarProximosEventos();
        console.log('✅ Datos del calendario recargados');
    } catch (error) {
        console.error('❌ Error recargando datos:', error);
    }
}

// ===================================
// ESTADÍSTICAS
// ===================================
function actualizarEstadisticas() {
    const eventos = estadoCalendario.eventosFiltrados;
    
    // Total eventos
    const totalElement = document.getElementById('totalEventos');
    if (totalElement) totalElement.textContent = eventos.length;
    
    // Por tipo
    const competencias = eventos.filter(e => e.tipo === 'competencia').length;
    const entrenamientos = eventos.filter(e => e.tipo === 'entrenamiento').length;
    const evaluaciones = eventos.filter(e => e.tipo === 'evaluacion').length;
    
    const competenciasElement = document.getElementById('competenciasEventos');
    const entrenamientosElement = document.getElementById('entrenamientosEventos');
    const evaluacionesElement = document.getElementById('evaluacionesEventos');
    
    if (competenciasElement) competenciasElement.textContent = competencias;
    if (entrenamientosElement) entrenamientosElement.textContent = entrenamientos;
    if (evaluacionesElement) evaluacionesElement.textContent = evaluaciones;
    
    // Próximos 7 días
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const enUnaSemana = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const proximos = eventos.filter(e => {
        const fechaEvento = new Date(e.fecha);
        return fechaEvento >= hoy && fechaEvento <= enUnaSemana;
    }).length;
    
    const proximosElement = document.getElementById('proximos7dias');
    if (proximosElement) proximosElement.textContent = proximos;
    
    // Filtrados
    const filtradosElement = document.getElementById('filtradosEventos');
    if (filtradosElement) filtradosElement.textContent = eventos.length;
    
    actualizarContadoresFiltros();
}

function actualizarContadoresFiltros() {
    // Actualizar contadores de niveles
    estadoCalendario.nivelesDisponibles.forEach(nivel => {
        const count = estadoCalendario.eventosGlobales.filter(e => 
            e.nivel === nivel || e.nivel === 'todos'
        ).length;
        
        const badge = document.getElementById(`count-nivel-${nivel}`);
        if (badge) badge.textContent = count;
    });
    
    // Actualizar contadores de grupos
    estadoCalendario.gruposDisponibles.forEach(grupo => {
        const grupoId = grupo.toLowerCase().replace(/\s+/g, '_');
        const grupoNormalizado = grupo.toUpperCase();
        
        const count = estadoCalendario.eventosGlobales.filter(e => {
            if (!e.grupo_competitivo) return false;
            return e.grupo_competitivo.toUpperCase() === grupoNormalizado;
        }).length;
        
        const badge = document.getElementById(`count-grupo-${grupoId}`);
        if (badge) badge.textContent = count;
    });
}

// ===================================
// PRÓXIMOS EVENTOS
// ===================================
function renderizarProximosEventos() {
    const container = document.getElementById('proximosEventos');
    if (!container) return;
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const proximos = estadoCalendario.eventosFiltrados
        .filter(e => {
            const fechaEvento = new Date(e.fecha);
            return fechaEvento >= hoy;
        })
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .slice(0, 5);
    
    if (proximos.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <span class="material-symbols-outlined">event_busy</span>
                <p class="text-small mt-2">No hay eventos próximos</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = proximos.map(evento => {
        const fecha = new Date(evento.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        });
        
        return `
            <div class="proximo-evento" onclick="abrirDetalleEvento('${evento.id}')">
                <div class="fecha">${fechaFormateada.toUpperCase()}</div>
                <div class="titulo">${evento.titulo}</div>
                <div class="ubicacion">${obtenerNivelLegible(evento.nivel)} ${evento.grupo_competitivo ? '• ' + evento.grupo_competitivo : ''}</div>
            </div>
        `;
    }).join('');
}

// ===================================
// MODAL DE CREACIÓN/EDICIÓN - CORREGIDO
// ===================================
function openCreateEventModal() {
    console.log('🎯 Abriendo modal de crear evento...');
    
    const modal = document.getElementById('eventModal');
    const backdrop = document.getElementById('modalBackdrop');
    const content = document.getElementById('modalContent');
    
    if (!modal || !backdrop || !content) {
        console.error('❌ Elementos del modal no encontrados');
        return;
    }
    
    content.innerHTML = generarFormularioEvento();
    
    backdrop.classList.add('active');
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Forzar selección por defecto del primer nivel
    setTimeout(() => {
        forzarSeleccionNivelPorDefecto();
    }, 100);
}

function forzarSeleccionNivelPorDefecto() {
    const botonesNivel = document.querySelectorAll('#nivelesOptions .option-btn');
    if (botonesNivel.length > 0) {
        // Si no hay ninguno seleccionado, seleccionar el primero
        const seleccionados = document.querySelectorAll('#nivelesOptions .option-btn.selected');
        if (seleccionados.length === 0) {
            botonesNivel[0].click();
            console.log('🔧 Nivel por defecto seleccionado:', botonesNivel[0].dataset.value);
        }
    }
}

function generarFormularioEvento(evento = null) {
    const esEdicion = evento !== null;
    
    console.log('🎯 Generando formulario para evento:', evento?.titulo);
    console.log('📋 Datos del evento (ORIGINAL):', {
        nivel: evento?.nivel,
        grupo_competitivo: evento?.grupo_competitivo,
        tipo: evento?.tipo,
        eventoCompleto: evento
    });
    
    // 🔥 CORRECCIÓN CRÍTICA: Normalizar grupo competitivo para comparación
    let gruposSeleccionados = [];
    if (esEdicion && evento.grupo_competitivo) {
        // IMPORTANTE: Normalizar el grupo para comparación con los disponibles
        const grupoOriginal = evento.grupo_competitivo;
        
        // Buscar coincidencia exacta en los grupos disponibles
        const grupoEncontrado = estadoCalendario.gruposDisponibles.find(grupo => 
            grupo.toUpperCase() === grupoOriginal.toUpperCase()
        );
        
        if (grupoEncontrado) {
            gruposSeleccionados = [grupoEncontrado];
            console.log('🎯 Grupo competitivo encontrado y normalizado:', grupoEncontrado);
        } else {
            // Si no encuentra coincidencia exacta, usar el original
            gruposSeleccionados = [grupoOriginal];
            console.log('⚠️ Grupo no encontrado en lista disponible, usando original:', grupoOriginal);
        }
    }
    
    // Preparar niveles seleccionados
    let nivelesSeleccionados = [];
    if (esEdicion && evento.nivel) {
        nivelesSeleccionados = [evento.nivel];
    } else {
        // Para creación nueva
        const user = window.EntrenadorAPI.user;
        const nivelesPermitidos = user?.niveles_asignados || estadoCalendario.nivelesDisponibles;
        if (nivelesPermitidos.length > 0) {
            nivelesSeleccionados = [nivelesPermitidos[0]];
        }
    }
    
    console.log('🎯 Configuración inicial para formulario:', { 
        nivelesSeleccionados, 
        gruposSeleccionados,
        gruposDisponibles: estadoCalendario.gruposDisponibles 
    });
    
    return `
        <form onsubmit="guardarEvento(event, ${esEdicion ? `'${evento.id}'` : 'null'})" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <!-- Título -->
            <div class="form-group">
                <label class="form-label">Título del Evento *</label>
                <input 
                    type="text" 
                    name="titulo" 
                    class="form-input" 
                    placeholder="Ej: Torneo Nacional de Cheerleading"
                    value="${esEdicion ? evento.titulo : ''}"
                    required
                >
            </div>
            
            <!-- Descripción -->
            <div class="form-group">
                <label class="form-label">Descripción</label>
                <textarea 
                    name="descripcion" 
                    class="form-textarea"
                    placeholder="Detalles adicionales del evento..."
                >${esEdicion && evento.descripcion ? evento.descripcion : ''}</textarea>
            </div>
            
            <!-- Fecha y Hora -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                    <label class="form-label">Fecha *</label>
                    <input 
                        type="date" 
                        name="fecha" 
                        class="form-input"
                        value="${esEdicion ? new Date(evento.fecha).toISOString().split('T')[0] : ''}"
                        required
                    >
                </div>
                <div class="form-group">
                    <label class="form-label">Hora</label>
                    <input 
                        type="time" 
                        name="hora" 
                        class="form-input"
                        value="${esEdicion && evento.hora ? evento.hora : ''}"
                        placeholder="HH:MM"
                    >
                </div>
            </div>
            
            <!-- Ubicación -->
            <div class="form-group">
                <label class="form-label">Ubicación</label>
                <input 
                    type="text" 
                    name="ubicacion" 
                    class="form-input"
                    value="${esEdicion && evento.ubicacion ? evento.ubicacion : ''}"
                    placeholder="Ej: Gimnasio Principal, Cancha 2, etc."
                >
            </div>
            
            <!-- Tipo -->
            <div class="form-group">
                <label class="form-label">Tipo de Evento *</label>
                <select name="tipo" id="tipoEvento" class="form-select" onchange="toggleTipoPersonalizado()" required>
                    <option value="general" ${esEdicion && evento.tipo === 'general' ? 'selected' : ''}>General</option>
                    <option value="competencia" ${esEdicion && evento.tipo === 'competencia' ? 'selected' : ''}>Competencia</option>
                    <option value="entrenamiento" ${esEdicion && evento.tipo === 'entrenamiento' ? 'selected' : ''}>Entrenamiento</option>
                    <option value="evaluacion" ${esEdicion && evento.tipo === 'evaluacion' ? 'selected' : ''}>Evaluación</option>
                    <option value="festivo" ${esEdicion && evento.tipo === 'festivo' ? 'selected' : ''}>Festivo</option>
                    <option value="otro" ${esEdicion && evento.tipo === 'otro' ? 'selected' : ''}>Otro (Personalizado)</option>
                </select>
            </div>
            
            <!-- Tipo Personalizado (oculto por defecto) -->
            <div id="tipoPersonalizadoContainer" class="form-group" style="display: ${esEdicion && evento.tipo === 'otro' ? 'block' : 'none'};">
                <label class="form-label">Especificar Tipo de Evento</label>
                <input 
                    type="text" 
                    name="tipo_personalizado" 
                    id="tipoPersonalizado"
                    class="form-input"
                    value="${esEdicion && evento.tipo_personalizado ? evento.tipo_personalizado : ''}"
                    placeholder="Ej: Reunión de padres, Presentación especial, etc."
                >
            </div>
            
            <!-- Niveles -->
            <div class="form-group">
                <label class="form-label">Niveles *</label>
                <div class="option-grid" id="nivelesOptions">
                    ${generarOpcionesNiveles(nivelesSeleccionados)}
                </div>
            </div>
            
            <!-- Grupos Competitivos -->
            <div class="form-group">
                <label class="form-label">Grupos Competitivos</label>
                <p style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.5rem;">Dejar vacío para aplicar a todos los grupos</p>
                <div class="option-grid" id="gruposOptions">
                    ${generarOpcionesGrupos(gruposSeleccionados)}
                </div>
            </div>
            
            <!-- Botones -->
            <div class="form-actions">
                <button type="submit" class="btn-form-primary" style="background: linear-gradient(135deg, #E21B23 0%, #C4161D 100%);">
                    <span class="material-symbols-outlined">save</span>
                    ${esEdicion ? 'Actualizar' : 'Crear'} Evento
                </button>
                <button type="button" onclick="closeModal()" class="btn-form-secondary">
                    Cancelar
                </button>
            </div>
        </form>
        
        ${esEdicion ? `
            <div class="danger-zone">
                <h4>
                    <span class="material-symbols-outlined">warning</span>
                    Zona de Peligro
                </h4>
                <p style="font-size: 0.875rem; color: #6B7280; margin-bottom: 1rem;">
                    Esta acción no se puede deshacer.
                </p>
                <button onclick="eliminarEventoConfirmar('${evento.id}', '${evento.titulo.replace(/'/g, "\\'")}')" class="btn-danger">
                    <span class="material-symbols-outlined">delete</span>
                    Eliminar Evento
                </button>
            </div>
        ` : ''}
    `;
}

function toggleTipoPersonalizado() {
    const tipoSelect = document.getElementById('tipoEvento');
    const container = document.getElementById('tipoPersonalizadoContainer');
    const input = document.getElementById('tipoPersonalizado');
    
    if (tipoSelect && container && input) {
        if (tipoSelect.value === 'otro') {
            container.style.display = 'block';
            input.required = true;
        } else {
            container.style.display = 'none';
            input.required = false;
            input.value = '';
        }
    }
}

function generarOpcionesNiveles(seleccionados = []) {
    const niveles = {
        'baby_titans': 'Baby Titans',
        '1_basico': 'Nivel 1 - Básico',
        '1_medio': 'Nivel 1 - Medio',
        '1_avanzado': 'Nivel 1 - Avanzado',
        '2': 'Nivel 2',
        '3': 'Nivel 3',
        '4': 'Nivel 4'
    };
    
    // Filtrar solo niveles asignados al entrenador
    const user = window.EntrenadorAPI.user;
    const nivelesPermitidos = user?.niveles_asignados || Object.keys(niveles);
    
    // Siempre debe haber al menos uno seleccionado
    if (seleccionados.length === 0 && nivelesPermitidos.length > 0) {
        seleccionados = [nivelesPermitidos[0]];
    }
    
    console.log('🎯 Generando opciones de niveles con:', { seleccionados, nivelesPermitidos });
    
    return Object.entries(niveles)
        .filter(([valor]) => nivelesPermitidos.includes(valor))
        .map(([valor, label]) => {
            const estaSeleccionado = seleccionados.includes(valor);
            
            return `
                <button 
                    type="button" 
                    class="option-btn ${estaSeleccionado ? 'selected' : ''}"
                    data-value="${valor}"
                    onclick="toggleOpcion(this, 'niveles')"
                >
                    ${label}
                    ${estaSeleccionado ? '<span class="check-mark">✓</span>' : ''}
                </button>
            `;
        }).join('');
}

function generarOpcionesGrupos(seleccionados = []) {
    console.log('🎯 Generando opciones de grupos con seleccionados:', seleccionados);
    console.log('📊 Grupos disponibles:', estadoCalendario.gruposDisponibles);
    
    // 🔥 CORRECCIÓN: Normalizar para comparación insensible a mayúsculas
    const seleccionadosNormalizados = seleccionados.map(g => g.toUpperCase());
    
    const html = estadoCalendario.gruposDisponibles.map(grupo => {
        const estaSeleccionado = seleccionadosNormalizados.includes(grupo.toUpperCase());
        
        console.log(`  - "${grupo}": ${estaSeleccionado ? 'SELECCIONADO ✓' : 'no seleccionado'}`);
        
        return `
            <button 
                type="button" 
                class="option-btn ${estaSeleccionado ? 'selected' : ''}"
                data-value="${grupo}"
                onclick="toggleOpcion(this, 'grupos')"
            >
                ${grupo}
                ${estaSeleccionado ? '<span class="check-mark">✓</span>' : ''}
            </button>
        `;
    }).join('');
    
    return html;
}

function toggleOpcion(btn, tipo) {
    const container = btn.closest('.option-grid');
    const opcionesSeleccionadas = container.querySelectorAll('.option-btn.selected');
    
    if (tipo === 'niveles') {
        // Para niveles: debe haber al menos uno seleccionado
        if (opcionesSeleccionadas.length === 1 && btn.classList.contains('selected')) {
            console.log('⚠️ No se puede deseleccionar el último nivel');
            return;
        }
    }
    
    btn.classList.toggle('selected');
    
    // Agregar/remover checkmark visual
    if (btn.classList.contains('selected')) {
        if (!btn.querySelector('.check-mark')) {
            const checkMark = document.createElement('span');
            checkMark.className = 'check-mark';
            checkMark.textContent = '✓';
            btn.appendChild(checkMark);
        }
    } else {
        const checkMark = btn.querySelector('.check-mark');
        if (checkMark) {
            checkMark.remove();
        }
    }
    
    // Mostrar en consola para debugging
    const valor = btn.getAttribute('data-value');
    const ahoraSeleccionado = btn.classList.contains('selected');
    console.log(`🔄 ${tipo} "${valor}": ${ahoraSeleccionado ? 'SELECCIONADO' : 'DESELECCIONADO'}`);
}

async function guardarEvento(e, eventoId = null) {
    e.preventDefault();
    
    console.log('📝 ========== INICIANDO GUARDADO DE EVENTO ==========');
    console.log('📋 Modo:', eventoId ? 'EDICIÓN' : 'CREACIÓN');
    
    // Obtener valores del formulario
    const form = e.target;
    const titulo = form.querySelector('[name="titulo"]').value;
    const descripcion = form.querySelector('[name="descripcion"]').value;
    const fecha = form.querySelector('[name="fecha"]').value;
    const horaInput = form.querySelector('[name="hora"]').value;
    const ubicacion = form.querySelector('[name="ubicacion"]').value;
    const tipo = form.querySelector('[name="tipo"]').value;
    const tipo_personalizado = form.querySelector('[name="tipo_personalizado"]')?.value || '';
    
    // Obtener niveles seleccionados
    const nivelesSeleccionados = [];
    const botonesNivel = form.querySelectorAll('#nivelesOptions .option-btn.selected');
    botonesNivel.forEach(btn => {
        nivelesSeleccionados.push(btn.getAttribute('data-value'));
    });
    
    console.log('🔍 DEBUG - Niveles seleccionados encontrados:', nivelesSeleccionados);
    
    // Si no hay niveles seleccionados, forzar selección
    if (nivelesSeleccionados.length === 0) {
        console.warn('⚠️ No se encontraron niveles seleccionados, forzando selección...');
        
        const todosBotonesNivel = form.querySelectorAll('#nivelesOptions .option-btn');
        if (todosBotonesNivel.length > 0) {
            todosBotonesNivel[0].classList.add('selected');
            nivelesSeleccionados.push(todosBotonesNivel[0].getAttribute('data-value'));
            console.log('🔧 Nivel forzado:', nivelesSeleccionados[0]);
        } else {
            console.error('❌ No hay botones de nivel disponibles');
            mostrarError('No se encontraron niveles disponibles');
            return;
        }
    }
    
    // Obtener grupos seleccionados
    const gruposSeleccionados = Array.from(form.querySelectorAll('#gruposOptions .option-btn.selected'))
        .map(btn => btn.getAttribute('data-value'));
    
    console.log('📋 Valores obtenidos:');
    console.log('- título:', titulo);
    console.log('- fecha:', fecha);
    console.log('- hora:', horaInput);
    console.log('- niveles seleccionados:', nivelesSeleccionados);
    console.log('- grupos seleccionados:', gruposSeleccionados);
    console.log('- tipo:', tipo);
    
    // Validación básica
    if (!titulo || !fecha) {
        mostrarError('El título y la fecha son obligatorios');
        return;
    }
    
    if (nivelesSeleccionados.length === 0) {
        mostrarError('Debes seleccionar al menos un nivel');
        return;
    }
    
    // Procesar tipo personalizado
    let tipoFinal = tipo;
    let tipoPersonalizadoFinal = null;
    
    if (tipo === 'otro') {
        tipoPersonalizadoFinal = tipo_personalizado;
        if (!tipoPersonalizadoFinal || tipoPersonalizadoFinal.trim() === '') {
            mostrarError('Debes especificar el tipo de evento');
            return;
        }
    }
    
    // Formato correcto de fecha y hora
    let fechaCompleta = fecha;
    
    // Si hay hora, formatearla correctamente
    if (horaInput && horaInput.trim() !== '') {
        const [horas, minutos] = horaInput.split(':');
        const horaFormateada = `${horas}:${minutos ? minutos.slice(0, 2) : '00'}`;
        fechaCompleta = `${fecha}T${horaFormateada}:00`;
        console.log('🕒 Hora formateada:', horaFormateada);
    }
    
    console.log('📅 Fecha final enviada:', fechaCompleta);
    
    // Verificar que la fecha sea válida
    const testDate = new Date(fechaCompleta);
    if (isNaN(testDate.getTime())) {
        console.error('❌ Fecha inválida:', fechaCompleta);
        mostrarError('Fecha inválida. Por favor verifica el formato.');
        return;
    }
    
    // Datos para el backend
    const datos = {
        titulo: titulo.trim(),
        descripcion: descripcion && descripcion.trim() !== '' ? descripcion.trim() : null,
        fecha: fechaCompleta,
        hora: horaInput && horaInput.trim() !== '' ? horaInput.split(':').slice(0, 2).join(':') : null,
        ubicacion: ubicacion && ubicacion.trim() !== '' ? ubicacion.trim() : null,
        niveles: nivelesSeleccionados,
        grupos_competitivos: gruposSeleccionados,
        tipo: tipoFinal,
        tipo_personalizado: tipoPersonalizadoFinal,
        entrenador_id: window.EntrenadorAPI?.user?.id
    };
    
    console.log('📤 ========== ENVIANDO AL BACKEND ==========');
    console.log('Datos completos:', datos);
    
    try {
        mostrarCargando(true);
        
        let resultado;
        if (eventoId) {
            console.log(`✏️ Actualizando evento ${eventoId}...`);
            // Para actualizar, usar nivel y grupo singular
            const datosUpdate = {
                titulo: titulo.trim(),
                descripcion: descripcion && descripcion.trim() !== '' ? descripcion.trim() : null,
                fecha: fechaCompleta,
                hora: horaInput && horaInput.trim() !== '' ? horaInput.split(':').slice(0, 2).join(':') : null,
                ubicacion: ubicacion && ubicacion.trim() !== '' ? ubicacion.trim() : null,
                nivel: nivelesSeleccionados[0],
                grupo_competitivo: gruposSeleccionados.length > 0 ? gruposSeleccionados[0] : null,
                tipo: tipoFinal,
                tipo_personalizado: tipoPersonalizadoFinal
            };
            
            console.log('📤 Datos para actualizar (singular):', datosUpdate);
            resultado = await window.EntrenadorAPI.updateEvento(eventoId, datosUpdate);
        } else {
            console.log('➕ Creando nuevo evento (múltiples)...');
            resultado = await window.EntrenadorAPI.createEvento(datos);
        }
        
        console.log('✅ RESPUESTA DEL BACKEND:', resultado);
        
        // Cerrar modal inmediatamente
        closeModal();
        
        // Recargar datos inmediatamente
        await recargarDatosCalendario();
        
        mostrarExito(eventoId ? '✅ Evento actualizado correctamente' : '✅ Evento creado correctamente');
        
        console.log('✅ Proceso de guardado COMPLETADO');
        
    } catch (error) {
        console.error('❌ ERROR EN GUARDADO:', error);
        mostrarError(error.message || 'Error al guardar el evento');
    } finally {
        mostrarCargando(false);
    }
}

async function abrirDetalleEvento(eventoId) {
    try {
        mostrarCargando(true);
        
        // Buscar el evento en el array de eventos cargados
        const evento = estadoCalendario.eventosGlobales.find(e => e.id === eventoId);
        
        if (!evento) {
            throw new Error('Evento no encontrado');
        }
        
        console.log('📋 Evento encontrado para editar:', {
            id: evento.id,
            titulo: evento.titulo,
            nivel: evento.nivel,
            grupo_competitivo: evento.grupo_competitivo
        });
        
        const modal = document.getElementById('eventModal');
        const backdrop = document.getElementById('modalBackdrop');
        const content = document.getElementById('modalContent');
        
        content.innerHTML = generarFormularioEvento(evento);
        
        backdrop.classList.add('active');
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
    } catch (error) {
        console.error('❌ Error cargando evento:', error);
        mostrarError('Error al cargar el evento');
    } finally {
        mostrarCargando(false);
    }
}

function closeModal() {
    const modal = document.getElementById('eventModal');
    const backdrop = document.getElementById('modalBackdrop');
    
    modal.classList.remove('active');
    
    setTimeout(() => {
        backdrop.classList.remove('active');
    }, 300);
}

async function eliminarEventoConfirmar(eventoId, titulo) {
    if (!confirm(`¿Estás seguro de eliminar "${titulo}"?`)) {
        return;
    }
    
    try {
        mostrarCargando(true);
        
        await window.EntrenadorAPI.deleteEvento(eventoId);
        
        console.log('✅ Evento eliminado');
        
        // Cerrar modal inmediatamente
        closeModal();
        
        // Recargar datos inmediatamente
        await recargarDatosCalendario();
        
        mostrarExito('✅ Evento eliminado correctamente');
        
    } catch (error) {
        console.error('❌ Error eliminando evento:', error);
        mostrarError('Error al eliminar el evento');
    } finally {
        mostrarCargando(false);
    }
}

// ===================================
// MODAL DE EVENTOS DEL DÍA
// ===================================
function mostrarEventosDelDia(fecha, eventos) {
    console.log('📅 Mostrando eventos del día:', fecha, eventos);
    
    const modal = document.getElementById('eventModal');
    const backdrop = document.getElementById('modalBackdrop');
    const content = document.getElementById('modalContent');
    
    if (!modal || !backdrop || !content) {
        console.error('❌ Elementos del modal no encontrados');
        return;
    }
    
    const fechaFormateada = fecha.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    if (eventos.length === 0) {
        content.innerHTML = `
            <div class="text-center py-4" style="padding: 3rem 0;">
                <span class="material-symbols-outlined" style="font-size: 4rem; color: #D1D5DB; margin-bottom: 1rem; display: block;">event_busy</span>
                <h3 style="font-family: 'Oswald', sans-serif; font-size: 1.5rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">No hay eventos</h3>
                <p style="color: #6B7280; margin-bottom: 2rem;">${fechaFormateada}</p>
                <button onclick="closeModal()" class="btn-form-secondary">
                    Cerrar
                </button>
            </div>
        `;
    } else {
        content.innerHTML = `
            <div class="eventos-dia-header">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 class="eventos-dia-title">Eventos del día</h3>
                    ${eventos.length > 1 ? `
                        <button onclick="eliminarEventosDelDiaModal('${fecha.toISOString()}')" class="btn-danger" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                            <span class="material-symbols-outlined" style="font-size: 1rem;">delete_sweep</span>
                            Eliminar todos (${eventos.length})
                        </button>
                    ` : ''}
                </div>
                <p class="eventos-dia-fecha">${fechaFormateada}</p>
                <div class="eventos-dia-stats">
                    <p style="font-size: 0.75rem; color: var(--primary-red); font-weight: 700;">${eventos.length} evento(s) programado(s)</p>
                </div>
            </div>
            
            <div class="eventos-lista">
                ${eventos.map(evento => generarTarjetaEvento(evento)).join('')}
            </div>
            
            <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-light); display: flex; gap: 1rem;">
                <button onclick="closeModal()" class="btn-form-secondary" style="flex: 1;">
                    Cerrar
                </button>
            </div>
        `;
    }
    
    backdrop.classList.add('active');
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

function eliminarEventosDelDiaModal(fechaISO) {
    const fecha = new Date(fechaISO);
    eliminarEventosDelDia(fecha);
}

function generarTarjetaEvento(evento) {
    const tipoIconos = {
        'competencia': 'emoji_events',
        'entrenamiento': 'fitness_center',
        'evaluacion': 'assignment',
        'festivo': 'celebration',
        'general': 'event',
        'otro': 'more_horiz'
    };
    
    const icono = tipoIconos[evento.tipo] || 'event';
    
    return `
        <div class="evento-card">
            <div class="evento-card-header">
                <div class="evento-icon">
                    <span class="material-symbols-outlined" style="font-size: 1.75rem;">${icono}</span>
                </div>
                <div class="evento-info">
                    <h4 class="evento-titulo">${evento.titulo}</h4>
                    <div class="evento-badges">
                        <span class="evento-badge-small" style="background: rgba(226, 27, 35, 0.1); color: var(--primary-red);">
                            ${evento.tipo_personalizado || evento.tipo}
                        </span>
                        <span class="evento-badge-small" style="background: rgba(59, 130, 246, 0.1); color: #2563EB;">
                            ${obtenerNivelLegible(evento.nivel)}
                        </span>
                        ${evento.grupo_competitivo ? `
                            <span class="evento-badge-small" style="background: rgba(16, 185, 129, 0.1); color: #059669;">
                                ${evento.grupo_competitivo}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            ${evento.descripcion ? `
                <p class="evento-descripcion">${evento.descripcion}</p>
            ` : ''}
            
            <div class="evento-detalles">
                ${evento.hora ? `
                    <div class="evento-detalle">
                        <span class="material-symbols-outlined" style="font-size: 1rem;">schedule</span>
                        <span>${evento.hora}</span>
                    </div>
                ` : ''}
                ${evento.ubicacion ? `
                    <div class="evento-detalle">
                        <span class="material-symbols-outlined" style="font-size: 1rem;">location_on</span>
                        <span>${evento.ubicacion}</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="evento-acciones">
                <button onclick="abrirDetalleEvento('${evento.id}')" class="btn-editar">
                    <span class="material-symbols-outlined" style="font-size: 1rem;">edit</span>
                    Editar
                </button>
                <button onclick="eliminarEventoDirecto('${evento.id}', '${evento.titulo.replace(/'/g, "\\'")}')" class="btn-eliminar">
                    <span class="material-symbols-outlined" style="font-size: 1rem;">delete</span>
                </button>
            </div>
        </div>
    `;
}

async function eliminarEventoDirecto(eventoId, titulo) {
    if (!confirm(`¿Estás seguro de eliminar "${titulo}"?`)) {
        return;
    }
    
    try {
        mostrarCargando(true);
        
        await window.EntrenadorAPI.deleteEvento(eventoId);
        
        console.log('✅ Evento eliminado');
        
        // Cerrar modal si está abierto
        const modal = document.getElementById('eventModal');
        if (modal && modal.classList.contains('active')) {
            closeModal();
        }
        
        // Recargar datos inmediatamente
        await recargarDatosCalendario();
        
        mostrarExito('✅ Evento eliminado correctamente');
        
    } catch (error) {
        console.error('❌ Error eliminando evento:', error);
        mostrarError('Error al eliminar el evento');
    } finally {
        mostrarCargando(false);
    }
}

// ===================================
// NAVEGACIÓN DEL CALENDARIO
// ===================================
function configurarEventListeners() {
    console.log('🎯 Configurando event listeners...');
    
    // Botones de navegación de mes
    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');
    const todayBtn = document.getElementById('todayBtn');
    
    if (prevBtn) prevBtn.addEventListener('click', mesAnterior);
    if (nextBtn) nextBtn.addEventListener('click', mesSiguiente);
    if (todayBtn) todayBtn.addEventListener('click', irAHoy);
    
    // Botón de actualizar
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await recargarDatosCalendario();
            mostrarExito('Calendario actualizado');
        });
    }
    
    // Botón crear evento
    const crearEventoBtn = document.getElementById('crearEventoBtn');
    if (crearEventoBtn) {
        console.log('🎯 Configurando evento click para "Crear Evento"');
        crearEventoBtn.addEventListener('click', openCreateEventModal);
    } else {
        console.error('❌ Botón "crearEventoBtn" no encontrado en el DOM');
    }
    
    // Botón cerrar modal
    const closeModalBtn = document.getElementById('closeModalBtn');
    const backdrop = document.getElementById('modalBackdrop');
    
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);
    
    // Botón de ayuda
    const ayudaBtn = document.getElementById('ayudaBtn');
    if (ayudaBtn) ayudaBtn.addEventListener('click', mostrarAyuda);
    
    // Botón de tema
    const toggleTheme = document.getElementById('toggleTheme');
    if (toggleTheme) {
        toggleTheme.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', 
                document.documentElement.classList.contains('dark') ? 'dark' : 'light'
            );
        });
    }
    
    // Botón de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Deseas cerrar sesión?')) {
                window.EntrenadorAPI.logout();
            }
        });
    }
    
    console.log('✅ Event listeners configurados correctamente');
}

async function mesAnterior() {
    estadoCalendario.mesActual--;
    
    if (estadoCalendario.mesActual < 0) {
        estadoCalendario.mesActual = 11;
        estadoCalendario.añoActual--;
    }
    
    await cargarEventos();
    renderizarCalendario();
    actualizarEstadisticas();
    renderizarProximosEventos();
}

async function mesSiguiente() {
    estadoCalendario.mesActual++;
    
    if (estadoCalendario.mesActual > 11) {
        estadoCalendario.mesActual = 0;
        estadoCalendario.añoActual++;
    }
    
    await cargarEventos();
    renderizarCalendario();
    actualizarEstadisticas();
    renderizarProximosEventos();
}

async function irAHoy() {
    const hoy = new Date();
    estadoCalendario.mesActual = hoy.getMonth();
    estadoCalendario.añoActual = hoy.getFullYear();
    
    await cargarEventos();
    renderizarCalendario();
    actualizarEstadisticas();
    renderizarProximosEventos();
}

function actualizarTituloMes() {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const titulo = document.getElementById('currentMonth');
    if (titulo) {
        titulo.innerHTML = `${meses[estadoCalendario.mesActual]} <span class="text-primary">${estadoCalendario.añoActual}</span>`;
    }
    
    const status = document.getElementById('loadingStatus');
    if (status) {
        status.textContent = `Calendario cargado • ${meses[estadoCalendario.mesActual]} ${estadoCalendario.añoActual}`;
    }
}

// ===================================
// UTILIDADES
// ===================================
function obtenerNivelLegible(nivel) {
    const niveles = {
        'baby_titans': 'Baby Titans',
        '1_basico': 'Nivel 1 - Básico',
        '1_medio': 'Nivel 1 - Medio',
        '1_avanzado': 'Nivel 1 - Avanzado',
        '2': 'Nivel 2',
        '3': 'Nivel 3',
        '4': 'Nivel 4',
        'todos': 'Todos los niveles'
    };
    
    return niveles[nivel] || nivel;
}

function actualizarTiempoActualizacion() {
    const ahora = new Date();
    const horas = ahora.getHours().toString().padStart(2, '0');
    const minutos = ahora.getMinutes().toString().padStart(2, '0');
    
    const elemento = document.getElementById('updateTime');
    if (elemento) {
        elemento.textContent = `Actualizado: ${horas}:${minutos}`;
    }
}

function mostrarCargando(mostrar) {
    const loadingStatus = document.getElementById('loadingStatus');
    if (loadingStatus) {
        if (mostrar) {
            loadingStatus.innerHTML = '<span style="display: inline-block; width: 1rem; height: 1rem; border: 2px solid #E5E7EB; border-top-color: var(--primary-red); border-radius: 50%; animation: spin 1s linear infinite;"></span> Cargando...';
        } else {
            actualizarTituloMes();
        }
    }
}

function mostrarExito(mensaje) {
    console.log('✅', mensaje);
    if (window.EntrenadorAPI) {
        window.EntrenadorAPI.showNotification(mensaje, 'success');
    } else {
        alert(mensaje);
    }
}

function mostrarError(mensaje) {
    console.error('❌', mensaje);
    if (window.EntrenadorAPI) {
        window.EntrenadorAPI.showNotification(mensaje, 'error');
    } else {
        alert(mensaje);
    }
}

function mostrarAyuda() {
    const ayuda = `
AYUDA - CALENDARIO TITANES EVOLUTION

• FILTROS: Selecciona niveles y grupos para ver eventos específicos
• CREAR EVENTO: Haz clic en el botón "Crear Evento"
• VER EVENTO: Haz clic en un evento en el calendario
• EDITAR: Abre un evento y modifica los campos
• ELIMINAR UNO: En el evento, haz clic en el botón eliminar
• ELIMINAR VARIOS: En días con múltiples eventos, botón "Eliminar todos"
• ACTUALIZAR: Los cambios se reflejan inmediatamente

¿Problemas?
Verifica que tu backend esté corriendo en http://localhost:5000
    `;
    
    mostrarExito(ayuda);
}

// Cargar tema guardado
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
}

// Exponer funciones globales
window.openCreateEventModal = openCreateEventModal;
window.closeModal = closeModal;
window.toggleFiltroNivel = toggleFiltroNivel;
window.toggleFiltroGrupo = toggleFiltroGrupo;
window.toggleOpcion = toggleOpcion;
window.guardarEvento = guardarEvento;
window.abrirDetalleEvento = abrirDetalleEvento;
window.eliminarEventoConfirmar = eliminarEventoConfirmar;
window.eliminarEventoDirecto = eliminarEventoDirecto;
window.eliminarEventosDelDia = eliminarEventosDelDia;
window.eliminarEventosDelDiaModal = eliminarEventosDelDiaModal;
window.mostrarAyuda = mostrarAyuda;
window.toggleTipoPersonalizado = toggleTipoPersonalizado;
window.mostrarEventosDelDia = mostrarEventosDelDia;
window.forzarSeleccionNivelPorDefecto = forzarSeleccionNivelPorDefecto;

console.log('✅✅✅ Calendario.js COMPLETO cargado y listo - VERSIÓN FINAL');