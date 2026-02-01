// ===================================
// CALENDARIO DEPORTISTA - VERSIÓN CORREGIDA
// Titanes Evolution
// ===================================

console.log('📅 Iniciando Calendario Deportista (VERSIÓN CORREGIDA)...');

// ===================================
// VARIABLES GLOBALES
// ===================================

let mesActual = new Date();
let eventos = [];
let eventosSinFiltrar = [];
let miInfo = {
    nivel: null,
    grupo: null,
    nombre: '',
    id: null
};
let ultimaActualizacion = null;
let intervaloActualizacion = null;

// ===================================
// CONSTANTES
// ===================================

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const TIPOS_EVENTO = {
    competencia: { emoji: '🏆', color: 'event-competencia', label: 'Competencia' },
    entrenamiento: { emoji: '💪', color: 'event-entrenamiento', label: 'Entrenamiento' },
    evaluacion: { emoji: '📋', color: 'event-evaluacion', label: 'Evaluación' },
    festivo: { emoji: '🎉', color: 'event-festivo', label: 'Festivo' },
    general: { emoji: '📌', color: 'event-general', label: 'General' }
};

const NIVELES = {
    'pendiente': '⏳ Pendiente',
    'baby_titans': '👶 Baby Titans',
    '1_basico': '🥉 Nivel 1 Básico',
    '1_medio': '🥈 Nivel 1 Medio',
    '1_avanzado': '🥇 Nivel 1 Avanzado',
    '2': '⭐ Nivel 2',
    '3': '⭐⭐ Nivel 3',
    '4': '⭐⭐⭐ Nivel 4',
    'todos': '🌟 Todos los niveles'
};

// ===================================
// INICIALIZACIÓN
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM cargado, inicializando...');
    
    // Verificar autenticación
    if (!window.DeportistaAPI.checkAuth()) {
        return;
    }
    
    // Cargar información del deportista
    await cargarInformacionDeportista();
    
    // Inicializar event listeners
    inicializarEventListeners();
    
    // Cargar eventos del mes actual
    await cargarEventos(false);
    
    // Iniciar auto-actualización cada 15 segundos
    iniciarAutoActualizacion();
    
    // Mostrar contenido
    document.getElementById('loadingState')?.classList.add('hidden');
    document.getElementById('mainContent')?.classList.remove('hidden');
    
    console.log('✅ Calendario inicializado correctamente');
});

// ===================================
// CARGAR INFORMACIÓN DEL DEPORTISTA
// ===================================

async function cargarInformacionDeportista() {
    try {
        console.log('👤 Cargando información del deportista...');
        
        const perfil = await window.DeportistaAPI.getMe();
        
        if (perfil) {
            const user = perfil.user || {};
            const nombreFinal = user.nombre || perfil.nombre || 
                               window.DeportistaAPI.user?.nombre || 
                               window.DeportistaAPI.user?.name || 'Deportista';
            
            miInfo = {
                nivel: perfil.nivel_actual || 'pendiente',
                grupo: perfil.equipo_competitivo || null,
                nombre: nombreFinal,
                id: perfil.id
            };
            
            console.log('========================================');
            console.log('👤 MI INFORMACIÓN:');
            console.log('   ID:', miInfo.id);
            console.log('   Nombre:', miInfo.nombre);
            console.log('   Nivel:', miInfo.nivel);
            console.log('   Grupo:', miInfo.grupo);
            console.log('========================================');
            
            actualizarUIDeportista({ ...perfil, nombre: nombreFinal, user: user });
        }
        
    } catch (error) {
        console.error('❌ Error cargando información:', error);
        window.DeportistaAPI.showNotification('Error al cargar tu información', 'error');
    }
}

// ===================================
// ACTUALIZAR UI CON INFO DEL DEPORTISTA
// ===================================

function actualizarUIDeportista(perfil) {
    // Perfil en sidebar
    const profileName = document.getElementById('profileName');
    const profileLevel = document.getElementById('profileLevel');
    const profileInitial = document.getElementById('profileInitial');
    const profileAvatarContainer = document.getElementById('profileAvatarContainer');
    
    const nombreMostrar = perfil.nombre || 'Deportista';
    const nivelMostrar = perfil.nivel_actual || 'pendiente';
    
    if (profileName) profileName.textContent = nombreMostrar;
    if (profileLevel) profileLevel.textContent = NIVELES[nivelMostrar] || 'Sin nivel';
    
    // Avatar: foto o inicial
    if (profileAvatarContainer) {
        if (perfil.foto_perfil) {
            profileAvatarContainer.innerHTML = `
                <img src="${perfil.foto_perfil}" alt="${nombreMostrar}" class="w-full h-full object-cover">
            `;
        } else if (profileInitial) {
            profileInitial.textContent = nombreMostrar.charAt(0).toUpperCase();
        }
    }
    
    // Badges de información
    const nivelBadge = document.getElementById('nivelBadge');
    const grupoBadge = document.getElementById('grupoBadge');
    const grupoBadgeContainer = document.getElementById('grupoBadgeContainer');
    
    if (nivelBadge) {
        nivelBadge.textContent = NIVELES[nivelMostrar] || 'SIN NIVEL';
    }
    
    if (perfil.equipo_competitivo && grupoBadge && grupoBadgeContainer) {
        grupoBadge.textContent = formatearGrupo(perfil.equipo_competitivo);
        grupoBadgeContainer.style.display = 'block';
    }
    
    // Info de filtrado
    const infoNivel = document.getElementById('infoNivel');
    const infoGrupo = document.getElementById('infoGrupo');
    const infoGrupoTexto = document.getElementById('infoGrupoTexto');
    
    if (infoNivel) {
        infoNivel.textContent = NIVELES[nivelMostrar] || 'sin nivel asignado';
    }
    
    if (perfil.equipo_competitivo && infoGrupo && infoGrupoTexto) {
        infoGrupoTexto.textContent = formatearGrupo(perfil.equipo_competitivo);
        infoGrupo.style.display = 'list-item';
    }
}

// ===================================
// CARGAR EVENTOS - 🔥 CORREGIDO
// ===================================

async function cargarEventos(silencioso = false) {
    try {
        if (!miInfo.nivel) {
            console.log('⚠️ No hay nivel configurado, esperando...');
            return;
        }
        
        if (!silencioso) {
            console.log('\n========================================');
            console.log('🔄 CARGANDO EVENTOS');
            console.log('👤 Mi información:');
            console.log('   Nivel:', miInfo.nivel);
            console.log('   Grupo:', miInfo.grupo);
            console.log('========================================');
        }
        
        const mes = mesActual.getMonth() + 1;
        const año = mesActual.getFullYear();
        
        console.log(`📅 Consultando eventos para ${mes}/${año}...`);
        
        // 🔥 CORRECCIÓN: Usar el endpoint correcto
        const todosEventos = await window.DeportistaAPI.getEventos({ 
            mes: mes, 
            año: año 
        });
        
        console.log(`📥 ${todosEventos.length} eventos totales recibidos`);
        
        if (!silencioso && todosEventos.length > 0) {
            console.log('📋 Muestra de eventos recibidos:');
            todosEventos.slice(0, 3).forEach((e, i) => {
                console.log(`   ${i + 1}. ${e.titulo}`);
                console.log(`      Nivel: ${e.nivel}, Grupo: ${e.grupo_competitivo || 'sin grupo'}`);
            });
        }
        
        // Filtrar eventos para este deportista
        const eventosFiltrados = filtrarEventosParaMi(todosEventos);
        
        console.log('========================================');
        console.log(`✅ RESULTADO DEL FILTRADO:`);
        console.log(`   Total eventos: ${todosEventos.length}`);
        console.log(`   Eventos para mí: ${eventosFiltrados.length}`);
        console.log('========================================');
        
        // Actualizar estado
        eventosSinFiltrar = todosEventos;
        eventos = eventosFiltrados;
        ultimaActualizacion = new Date();
        
        // Actualizar UI
        actualizarCalendario();
        actualizarProximosEventos();
        actualizarContadores();
        
        // Notificar si hay nuevos eventos (solo en actualizaciones silenciosas)
        if (silencioso && eventosFiltrados.length > eventos.length) {
            window.DeportistaAPI.showNotification('🔔 ¡Nuevo evento agregado!', 'success');
        }
        
    } catch (error) {
        console.error('❌ Error cargando eventos:', error);
        if (!silencioso) {
            window.DeportistaAPI.showNotification('Error al cargar eventos', 'error');
        }
    }
}

// ===================================
// FILTRAR EVENTOS - 🔥 CORREGIDO Y MEJORADO
// ===================================

function filtrarEventosParaMi(todosEventos) {
    console.log('\n🔍 ========== FILTRANDO EVENTOS ==========');
    console.log(`Eventos a filtrar: ${todosEventos.length}`);
    console.log(`Mi nivel: "${miInfo.nivel}"`);
    console.log(`Mi grupo: "${miInfo.grupo}"`);
    
    const miGrupoNormalizado = normalizarGrupo(miInfo.grupo);
    console.log(`Grupo normalizado: "${miGrupoNormalizado}"`);
    
    const eventosFiltrados = todosEventos.filter((evento, index) => {
        const eventoGrupoNormalizado = normalizarGrupo(evento.grupo_competitivo);
        
        // Logging detallado para debugging
        if (index < 5) { // Solo primeros 5 para no saturar logs
            console.log(`\n--- Evento ${index + 1}: "${evento.titulo}" ---`);
            console.log(`  Nivel evento: "${evento.nivel}"`);
            console.log(`  Grupo evento: "${evento.grupo_competitivo}"`);
            console.log(`  Grupo normalizado: "${eventoGrupoNormalizado}"`);
        }
        
        // 🔥 REGLA 1: Eventos sin nivel ni grupo (NULL/NULL) → TODOS los ven
        if (!evento.nivel && !evento.grupo_competitivo) {
            if (index < 5) console.log(`  ✅ REGLA 1: Evento general sin restricciones`);
            return true;
        }
        
        // 🔥 REGLA 2: Eventos para "todos" sin grupo específico → TODOS los ven
        if (evento.nivel === 'todos' && !evento.grupo_competitivo) {
            if (index < 5) console.log(`  ✅ REGLA 2: Para todos los niveles (sin grupo)`);
            return true;
        }
        
        // 🔥 REGLA 3: Eventos para "todos" con grupo específico → Solo los de ese grupo ven
        if (evento.nivel === 'todos' && evento.grupo_competitivo) {
            const cumpleGrupo = miGrupoNormalizado === eventoGrupoNormalizado;
            if (index < 5) console.log(`  📊 REGLA 3: Para todos + grupo ${eventoGrupoNormalizado} -> cumple grupo: ${cumpleGrupo}`);
            return cumpleGrupo;
        }
        
        // 🔥 REGLA 4: Eventos con nivel específico sin grupo → Todos de ese nivel ven
        if (evento.nivel && !evento.grupo_competitivo) {
            const cumpleNivel = evento.nivel === miInfo.nivel;
            if (index < 5) console.log(`  📊 REGLA 4: Nivel ${evento.nivel} sin grupo -> cumple nivel: ${cumpleNivel}`);
            return cumpleNivel;
        }
        
        // 🔥 REGLA 5: Eventos con nivel Y grupo específico → OR lógico
        if (evento.nivel && evento.grupo_competitivo) {
            const cumpleNivel = evento.nivel === miInfo.nivel;
            const cumpleGrupo = miGrupoNormalizado === eventoGrupoNormalizado;
            const resultado = cumpleNivel || cumpleGrupo;
            
            if (index < 5) {
                console.log(`  📊 REGLA 5: Nivel ${evento.nivel} + grupo ${eventoGrupoNormalizado}`);
                console.log(`     -> Cumple nivel: ${cumpleNivel}`);
                console.log(`     -> Cumple grupo: ${cumpleGrupo}`);
                console.log(`     -> Resultado (OR): ${resultado}`);
            }
            return resultado;
        }
        
        if (index < 5) console.log(`  ❌ No cumple ninguna regla`);
        return false;
    });
    
    console.log('\n========================================');
    console.log(`RESUMEN DEL FILTRADO:`);
    console.log(`  Eventos totales: ${todosEventos.length}`);
    console.log(`  Eventos filtrados: ${eventosFiltrados.length}`);
    console.log(`  Porcentaje visible: ${todosEventos.length > 0 ? Math.round((eventosFiltrados.length / todosEventos.length) * 100) : 0}%`);
    
    // Ejemplo de eventos filtrados para depuración
    eventosFiltrados.slice(0, 3).forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.titulo} (Nivel: ${e.nivel}, Grupo: ${e.grupo_competitivo || 'sin grupo'})`);
    });
    
    console.log('========================================\n');
    
    return eventosFiltrados;
}

// ===================================
// NORMALIZAR GRUPO - MEJORADO
// ===================================

function normalizarGrupo(grupo) {
    if (!grupo) return null;
    
    // Eliminar espacios, convertir a minúsculas y reemplazar espacios por guiones bajos
    const normalizado = grupo.toString().toLowerCase().trim().replace(/\s+/g, '_');
    
    return normalizado;
}

// ===================================
// FORMATEAR GRUPO
// ===================================

function formatearGrupo(grupo) {
    if (!grupo) return 'SIN EQUIPO';
    
    // Convertir a mayúsculas y reemplazar guiones bajos por espacios
    return grupo.toString().toUpperCase().replace(/_/g, ' ');
}

// ===================================
// ACTUALIZAR CALENDARIO
// ===================================

function actualizarCalendario() {
    // Actualizar título del mes
    const mesActualTitulo = document.getElementById('mesActualTitulo');
    if (mesActualTitulo) {
        mesActualTitulo.textContent = `${MESES[mesActual.getMonth()]} ${mesActual.getFullYear()}`;
    }
    
    // Generar días del mes
    const dias = getDiasDelMes();
    
    // Actualizar grid
    const grid = document.getElementById('calendarioGrid');
    if (grid) {
        grid.innerHTML = dias.map(dia => generarCeldaDia(dia)).join('');
        
        // Agregar event listeners a las celdas
        dias.forEach((dia, index) => {
            const celda = grid.children[index];
            if (celda) {
                celda.addEventListener('click', () => handleClickDia(dia));
            }
        });
    }
}

// ===================================
// GENERAR DÍAS DEL MES
// ===================================

function getDiasDelMes() {
    const año = mesActual.getFullYear();
    const mes = mesActual.getMonth();
    
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    
    // Ajustar para que lunes sea el primer día
    let diasAnteriores = primerDia.getDay() - 1;
    if (diasAnteriores < 0) diasAnteriores = 6;
    
    const diasMes = ultimoDia.getDate();
    const dias = [];
    
    // Días del mes anterior
    const ultimoDiaMesAnterior = new Date(año, mes, 0).getDate();
    for (let i = diasAnteriores - 1; i >= 0; i--) {
        dias.push({
            numero: ultimoDiaMesAnterior - i,
            mesActual: false,
            fecha: new Date(año, mes - 1, ultimoDiaMesAnterior - i)
        });
    }
    
    // Días del mes actual
    for (let i = 1; i <= diasMes; i++) {
        dias.push({
            numero: i,
            mesActual: true,
            fecha: new Date(año, mes, i)
        });
    }
    
    // Días del mes siguiente para completar 42 celdas
    const diasRestantes = 42 - dias.length;
    for (let i = 1; i <= diasRestantes; i++) {
        dias.push({
            numero: i,
            mesActual: false,
            fecha: new Date(año, mes + 1, i)
        });
    }
    
    return dias;
}

// ===================================
// GENERAR CELDA DE DÍA
// ===================================

function generarCeldaDia(dia) {
    const eventosDelDia = getEventosPorDia(dia);
    const tieneEventos = eventosDelDia.length > 0;
    const esHoyFlag = esHoy(dia);
    
    let clases = 'day-cell p-3 group transition-all';
    
    if (!dia.mesActual) {
        clases += ' bg-white/[0.01] other-month';
    } else if (esHoyFlag) {
        clases += ' today neon-border-red bg-primary/10';
    } else if (tieneEventos) {
        clases += ' has-events neon-border-red bg-primary/5 hover:bg-primary/10';
    } else {
        clases += ' hover:bg-white/[0.03]';
    }
    
    let html = `<div class="${clases}">`;
    
    // Número del día
    if (esHoyFlag) {
        html += `<span class="text-xs font-black text-white bg-primary px-1.5 py-0.5">${dia.numero}</span>`;
    } else if (tieneEventos) {
        html += `<span class="text-xs font-black text-primary">${dia.numero}</span>`;
    } else {
        html += `<span class="text-xs font-bold text-gray-600">${dia.numero}</span>`;
    }
    
    // Eventos
    if (tieneEventos) {
        html += '<div class="mt-2 space-y-1">';
        eventosDelDia.slice(0, 3).forEach(evento => {
            const tipo = TIPOS_EVENTO[evento.tipo] || TIPOS_EVENTO.general;
            html += `<span class="event-tag ${tipo.color}" title="${evento.titulo}">
                ${tipo.emoji} ${evento.titulo}
            </span>`;
        });
        if (eventosDelDia.length > 3) {
            html += `<span class="text-xs text-primary font-bold">+${eventosDelDia.length - 3} más</span>`;
        }
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

// ===================================
// OBTENER EVENTOS POR DÍA
// ===================================

function getEventosPorDia(diaObj) {
    return eventos.filter(evento => {
        const fechaEvento = new Date(evento.fecha);
        return fechaEvento.toDateString() === diaObj.fecha.toDateString();
    });
}

// ===================================
// VERIFICAR SI ES HOY
// ===================================

function esHoy(diaObj) {
    const hoy = new Date();
    return diaObj.fecha.toDateString() === hoy.toDateString();
}

// ===================================
// ACTUALIZAR PRÓXIMOS EVENTOS
// ===================================

function actualizarProximosEventos() {
    const container = document.getElementById('proximosEventos');
    if (!container) return;
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Filtrar eventos futuros y ordenar por fecha
    const eventosFuturos = eventos
        .filter(e => new Date(e.fecha) >= hoy)
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .slice(0, 5);
    
    if (eventosFuturos.length === 0) {
        container.innerHTML = `
            <div class="min-w-[280px] bg-zinc-800 border border-white/10 p-4 text-center text-gray-500">
                No hay eventos próximos
            </div>
        `;
        return;
    }
    
    container.innerHTML = eventosFuturos.map(evento => {
        const tipo = TIPOS_EVENTO[evento.tipo] || TIPOS_EVENTO.general;
        const fecha = new Date(evento.fecha);
        const borderColor = evento.tipo === 'entrenamiento' ? 'border-blue-500' :
                           evento.tipo === 'evaluacion' ? 'border-yellow-500' :
                           evento.tipo === 'festivo' ? 'border-green-500' : 'border-primary';
        
        return `
            <div class="min-w-[280px] bg-zinc-800 ${borderColor} border-l-4 p-4 hover:bg-zinc-700/50 transition-colors cursor-pointer"
                 onclick="mostrarDetalleEvento(${JSON.stringify(evento).replace(/"/g, '&quot;')})">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 ${tipo.color}">
                        ${tipo.label}
                    </span>
                    <span class="text-[10px] font-bold text-gray-400">
                        ${fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </span>
                </div>
                <h4 class="font-display text-lg font-bold italic text-white uppercase leading-tight mb-2">
                    ${tipo.emoji} ${evento.titulo}
                </h4>
                ${evento.descripcion ? `
                    <p class="text-xs text-gray-400 mb-2 line-clamp-2">${evento.descripcion}</p>
                ` : ''}
                <div class="flex items-center gap-2 text-gray-400">
                    <span class="material-symbols-outlined text-sm">schedule</span>
                    <span class="text-xs font-bold uppercase italic">
                        ${evento.hora || fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// ===================================
// ACTUALIZAR CONTADORES
// ===================================

function actualizarContadores() {
    const conteoEventos = document.getElementById('conteoEventos');
    const ultimaActualizacionEl = document.getElementById('ultimaActualizacion');
    
    if (conteoEventos) {
        conteoEventos.textContent = `${eventos.length} evento${eventos.length !== 1 ? 's' : ''}`;
    }
    
    if (ultimaActualizacionEl && ultimaActualizacion) {
        ultimaActualizacionEl.textContent = ultimaActualizacion.toLocaleTimeString('es-ES');
    }
}

// ===================================
// CLICK EN DÍA
// ===================================

function handleClickDia(dia) {
    const eventosDelDia = getEventosPorDia(dia);
    
    if (eventosDelDia.length > 0) {
        mostrarModalEventos(dia, eventosDelDia);
    }
}

// ===================================
// MOSTRAR MODAL DE EVENTOS
// ===================================

function mostrarModalEventos(dia, eventosDelDia) {
    const modal = document.getElementById('modalEvento');
    const modalTitulo = document.getElementById('modalTitulo');
    const modalFecha = document.getElementById('modalFecha');
    const modalContenido = document.getElementById('modalEventosContenido');
    
    if (!modal || !modalTitulo || !modalFecha || !modalContenido) return;
    
    const fecha = dia.fecha;
    modalTitulo.textContent = `Eventos del ${dia.numero} de ${MESES[fecha.getMonth()]}`;
    modalFecha.textContent = fecha.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    
    modalContenido.innerHTML = eventosDelDia.map(evento => {
        const tipo = TIPOS_EVENTO[evento.tipo] || TIPOS_EVENTO.general;
        
        return `
            <div class="modal-evento-item slide-in-up">
                <div class="flex items-start space-x-3 mb-3">
                    <span class="text-4xl">${tipo.emoji}</span>
                    <div class="flex-1">
                        <h4 class="text-xl font-bold text-white mb-2 font-display uppercase italic">
                            ${evento.titulo}
                        </h4>
                        <div class="flex flex-wrap gap-2 mb-3">
                            <span class="px-3 py-1 ${tipo.color} rounded-full text-xs font-bold uppercase">
                                ${tipo.label}
                            </span>
                            <span class="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold">
                                ${NIVELES[evento.nivel] || evento.nivel}
                            </span>
                            ${evento.grupo_competitivo ? `
                                <span class="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-bold">
                                    🏆 ${formatearGrupo(evento.grupo_competitivo)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                ${evento.descripcion ? `
                    <div class="mb-3 p-3 bg-black/40 rounded-lg border border-white/5">
                        <p class="text-sm text-gray-300 leading-relaxed">${evento.descripcion}</p>
                    </div>
                ` : ''}
                
                <div class="flex items-center gap-4 text-sm text-gray-400">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">schedule</span>
                        <span>${evento.hora || new Date(evento.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    ${evento.ubicacion ? `
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary">location_on</span>
                            <span>${evento.ubicacion}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    modal.classList.remove('hidden');
}

function mostrarDetalleEvento(evento) {
    mostrarModalEventos(
        { numero: new Date(evento.fecha).getDate(), fecha: new Date(evento.fecha) },
        [evento]
    );
}

// ===================================
// NAVEGACIÓN DE MESES
// ===================================

function mesAnterior() {
    mesActual = new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1);
    cargarEventos(false);
}

function mesSiguiente() {
    mesActual = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1);
    cargarEventos(false);
}

function irAHoy() {
    mesActual = new Date();
    cargarEventos(false);
}

// ===================================
// AUTO-ACTUALIZACIÓN
// ===================================

function iniciarAutoActualizacion() {
    console.log('🔄 Iniciando auto-actualización cada 15 segundos...');
    
    intervaloActualizacion = setInterval(() => {
        console.log('🔄 Auto-refresh: verificando nuevos eventos...');
        cargarEventos(true);
    }, 15000);
}

function detenerAutoActualizacion() {
    if (intervaloActualizacion) {
        clearInterval(intervaloActualizacion);
        console.log('⏹️ Auto-actualización detenida');
    }
}

// ===================================
// EVENT LISTENERS
// ===================================

function inicializarEventListeners() {
    // Navegación
    const btnMesAnterior = document.getElementById('btnMesAnterior');
    const btnMesSiguiente = document.getElementById('btnMesSiguiente');
    const btnHoy = document.getElementById('btnHoy');
    
    if (btnMesAnterior) btnMesAnterior.addEventListener('click', mesAnterior);
    if (btnMesSiguiente) btnMesSiguiente.addEventListener('click', mesSiguiente);
    if (btnHoy) btnHoy.addEventListener('click', irAHoy);
    
    // Modal
    const btnCerrarModal = document.getElementById('btnCerrarModal');
    const modal = document.getElementById('modalEvento');
    
    if (btnCerrarModal) {
        btnCerrarModal.addEventListener('click', () => {
            if (modal) modal.classList.add('hidden');
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            detenerAutoActualizacion();
            window.DeportistaAPI.logout();
        });
    }
}

// ===================================
// LIMPIAR AL SALIR
// ===================================

window.addEventListener('beforeunload', () => {
    detenerAutoActualizacion();
});

window.mostrarDetalleEvento = mostrarDetalleEvento;

console.log('✅ Calendario Deportista JavaScript cargado (VERSIÓN CORREGIDA)');