// ==========================================
// EVALUACIONES.JS ADMIN - VERSIÓN CORREGIDA
// Muestra estadísticas SOLO del deportista seleccionado
// ==========================================

console.log('📂 Evaluaciones Admin CORREGIDO cargado');

// ESTADO GLOBAL
let estadoEvaluaciones = {
    deportistas: [],
    deportistaSeleccionado: null,
    evaluaciones: [],
    habilidades: [],
    progreso: null,
    categoriaActual: 'habilidad',
    filtros: {
        deportistaId: '',
        nivel: '',
        grupo: ''
    },
    graficas: {
        radar: null,
        barras: null
    }
};

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando Módulo de Evaluaciones...');
    
    if (!window.AdminAPI) {
        console.error('❌ AdminAPI no disponible');
        mostrarError('Error: AdminAPI no disponible');
        return;
    }
    
    if (!AdminAPI.checkAuth()) {
        return;
    }
    
    AdminAPI.updateUserInfo();
    
    try {
        await inicializarEvaluaciones();
        configurarEventListeners();
        console.log('✅ Módulo inicializado');
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarError('Error al inicializar');
    }
});

async function inicializarEvaluaciones() {
    try {
        mostrarCargando(true);
        
        await cargarDeportistas();
        
        // 🔥 CAMBIO: Limpiar estadísticas al inicio
        limpiarEstadisticas();
        
        await cargarEvaluacionesRecientes();
        
        inicializarGraficas();
        
        console.log('✅ Inicialización completada');
        
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarError('Error al cargar datos');
    } finally {
        mostrarCargando(false);
    }
}

// 🔥 NUEVA FUNCIÓN: Limpiar estadísticas
function limpiarEstadisticas() {
    document.getElementById('totalEvaluaciones').textContent = '0';
    document.getElementById('evaluacionesCompletadas').textContent = '0';
    document.getElementById('promedioGeneral').textContent = '0.0';
    document.getElementById('cambiosPendientes').textContent = '0';
}

// ==========================================
// CARGA DE DATOS
// ==========================================

async function cargarDeportistas() {
    try {
        console.log('👥 Cargando deportistas...');
        
        const deportistas = await AdminAPI.getDeportistas();
        estadoEvaluaciones.deportistas = deportistas;
        
        // Crear buscador
        const contenedorBuscador = document.getElementById('filtroDeportista').parentElement;
        contenedorBuscador.innerHTML = `
            <label class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Deportista</label>
            <div class="relative">
                <input 
                    type="text" 
                    id="buscadorDeportista" 
                    placeholder="Buscar deportista por nombre..."
                    class="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm font-semibold focus:ring-primary focus:border-primary"
                />
                <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">search</span>
                <div id="resultadosBusqueda" class="hidden absolute z-10 w-full mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto"></div>
            </div>
            <input type="hidden" id="deportistaSeleccionadoId" value="" />
        `;
        
        configurarBuscadorDeportistas(deportistas);
        
        // Grupos únicos
        const grupos = [...new Set(deportistas
            .filter(d => d.equipo_competitivo && d.equipo_competitivo !== 'sin_equipo')
            .map(d => d.equipo_competitivo)
            .sort())];
        
        const selectGrupo = document.getElementById('filtroGrupo');
        if (selectGrupo) {
            selectGrupo.innerHTML = `
                <option value="">Todos los grupos</option>
                ${grupos.map(grupo => `
                    <option value="${grupo}">${formatearGrupo(grupo)}</option>
                `).join('')}
            `;
        }
        
        console.log(`✅ ${deportistas.length} deportistas | ${grupos.length} grupos`);
        
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarError('Error al cargar deportistas');
    }
}

function configurarBuscadorDeportistas(deportistas) {
    const input = document.getElementById('buscadorDeportista');
    const resultados = document.getElementById('resultadosBusqueda');
    const hiddenInput = document.getElementById('deportistaSeleccionadoId');
    
    if (!input || !resultados) return;
    
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length < 2) {
            resultados.classList.add('hidden');
            return;
        }
        
        const coincidencias = deportistas.filter(d => {
            const nombre = (d.nombre || d.User?.nombre || '').toLowerCase();
            const email = (d.User?.email || '').toLowerCase();
            return nombre.includes(query) || email.includes(query);
        });
        
        if (coincidencias.length === 0) {
            resultados.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    <span class="material-symbols-outlined text-2xl mb-2 block">person_off</span>
                    <p class="text-sm">No se encontraron deportistas</p>
                </div>
            `;
            resultados.classList.remove('hidden');
            return;
        }
        
        resultados.innerHTML = coincidencias.map(d => {
            const nombre = d.nombre || d.User?.nombre || 'Sin nombre';
            const nivel = obtenerNivelLegible(d.nivel_actual);
            const grupo = formatearGrupo(d.equipo_competitivo);
            
            return `
                <div class="p-3 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer border-b border-gray-100 dark:border-white/5 last:border-0"
                     onclick="seleccionarDeportistaDesdeBusqueda('${d.id}', '${nombre.replace(/'/g, "\\'")}')">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            ${nombre.charAt(0).toUpperCase()}
                        </div>
                        <div class="flex-1">
                            <p class="font-bold text-sm">${nombre}</p>
                            <p class="text-xs text-gray-500">${nivel} • ${grupo}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        resultados.classList.remove('hidden');
    });
    
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !resultados.contains(e.target)) {
            resultados.classList.add('hidden');
        }
    });
}

window.seleccionarDeportistaDesdeBusqueda = function(deportistaId, nombre) {
    const input = document.getElementById('buscadorDeportista');
    const hiddenInput = document.getElementById('deportistaSeleccionadoId');
    const resultados = document.getElementById('resultadosBusqueda');
    
    input.value = nombre;
    hiddenInput.value = deportistaId;
    resultados.classList.add('hidden');
    
    estadoEvaluaciones.filtros.deportistaId = deportistaId;
    seleccionarDeportista(deportistaId);
};

function formatearGrupo(grupo) {
    if (!grupo || grupo === 'sin_equipo') return 'Sin grupo';
    return grupo.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

// 🔥 FUNCIÓN CORREGIDA: Calcular estadísticas SOLO del deportista seleccionado
async function cargarEstadisticasDeportista(deportistaId) {
    try {
        console.log('📊 Calculando estadísticas del deportista:', deportistaId);
        
        // Obtener evaluaciones del deportista
        const evaluaciones = await AdminAPI.getEvaluacionesDeportista(deportistaId);
        
        console.log(`📋 ${evaluaciones.length} evaluaciones encontradas`);
        
        // 🔥 Calcular estadísticas SOLO de este deportista
        const totalEvaluaciones = evaluaciones.length;
        let evaluacionesCompletadas = 0;
        let sumaPuntuaciones = 0;
        let contadorPuntuaciones = 0;
        
        evaluaciones.forEach(e => {
            if (e.completado) evaluacionesCompletadas++;
            if (e.puntuacion) {
                sumaPuntuaciones += e.puntuacion;
                contadorPuntuaciones++;
            }
        });
        
        const promedioGeneral = contadorPuntuaciones > 0 
            ? (sumaPuntuaciones / contadorPuntuaciones).toFixed(1) 
            : '0.0';
        
        // 🔥 Calcular niveles completados
        const deportista = estadoEvaluaciones.deportistas.find(d => d.id === deportistaId);
        const nivelActual = deportista?.nivel_actual || '1_basico';
        
        // Obtener progreso
        let nivelesCompletados = 0;
        try {
            const progreso = await AdminAPI.getProgresoDeportista(deportistaId);
            if (progreso && progreso.progreso_por_nivel) {
                nivelesCompletados = Object.values(progreso.progreso_por_nivel)
                    .filter(n => n.porcentaje === 100).length;
            }
        } catch (error) {
            console.warn('⚠️ No se pudo obtener progreso');
        }
        
        // 🔥 ACTUALIZAR UI CON ESTADÍSTICAS DEL DEPORTISTA
        document.getElementById('totalEvaluaciones').textContent = totalEvaluaciones;
        document.getElementById('evaluacionesCompletadas').textContent = evaluacionesCompletadas;
        document.getElementById('promedioGeneral').textContent = promedioGeneral;
        document.getElementById('cambiosPendientes').textContent = nivelesCompletados;
        
        // Cambiar el texto del label
        const cambiosPendientesLabel = document.querySelector('#cambiosPendientes').parentElement.querySelector('.stat-footer span');
        if (cambiosPendientesLabel) {
            cambiosPendientesLabel.textContent = 'Niveles completados';
        }
        
        console.log('📊 Estadísticas actualizadas:');
        console.log(`   - Total evaluaciones: ${totalEvaluaciones}`);
        console.log(`   - Completadas: ${evaluacionesCompletadas}`);
        console.log(`   - Promedio: ${promedioGeneral}`);
        console.log(`   - Niveles completados: ${nivelesCompletados}`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

async function cargarEvaluacionesRecientes() {
    try {
        console.log('🔄 Cargando evaluaciones recientes...');
        
        const evaluaciones = await AdminAPI.getEvaluacionesRecientes();
        estadoEvaluaciones.evaluaciones = evaluaciones;
        
        actualizarListaEvaluaciones(evaluaciones);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// ==========================================
// SELECCIÓN Y FILTRADO
// ==========================================

async function seleccionarDeportista(deportistaId) {
    try {
        if (!deportistaId) {
            resetearVistaDeportista();
            return;
        }
        
        mostrarCargando(true);
        
        console.log(`👤 Seleccionando deportista ${deportistaId}...`);
        
        const deportista = estadoEvaluaciones.deportistas.find(d => d.id === deportistaId);
        if (!deportista) {
            throw new Error('Deportista no encontrado');
        }
        
        estadoEvaluaciones.deportistaSeleccionado = deportista;
        
        // 🔥 CARGAR ESTADÍSTICAS DEL DEPORTISTA
        await cargarEstadisticasDeportista(deportistaId);
        
        // Obtener evaluaciones
        const evaluacionesDeportista = await AdminAPI.getEvaluacionesDeportista(deportistaId);
        estadoEvaluaciones.evaluaciones = evaluacionesDeportista || [];
        
        console.log(`📊 ${evaluacionesDeportista.length} evaluaciones del deportista`);
        
        // Obtener habilidades del nivel
        let habilidadesDelNivel = [];
        try {
            const nivel = deportista.nivel_actual || '1_basico';
            const habilidadesResponse = await AdminAPI.getHabilidadesPorNivel(nivel);
            
            if (habilidadesResponse.habilidades && habilidadesResponse.habilidades.length > 0) {
                habilidadesDelNivel = habilidadesResponse.habilidades;
            }
        } catch (error) {
            console.error('❌ Error obteniendo habilidades:', error);
        }
        
        // Unir habilidades con evaluaciones
        const habilidadesConEvaluaciones = habilidadesDelNivel.map(habilidad => {
            const evaluacion = evaluacionesDeportista.find(e => 
                e.habilidad_id === habilidad.id || e.habilidad_nombre === habilidad.nombre
            );
            
            return {
                ...habilidad,
                evaluacion: evaluacion || {
                    puntuacion: 0,
                    observaciones: 'Sin retroalimentación',
                    completado: false
                }
            };
        });
        
        estadoEvaluaciones.habilidades = habilidadesConEvaluaciones;
        
        // Obtener progreso
        try {
            const progreso = await AdminAPI.getProgresoDeportista(deportistaId);
            estadoEvaluaciones.progreso = progreso;
        } catch (error) {
            console.warn('⚠️ No se pudo cargar progreso');
        }
        
        actualizarVistaDeportista(deportista, estadoEvaluaciones.habilidades, estadoEvaluaciones.progreso);
        
        if (estadoEvaluaciones.progreso && estadoEvaluaciones.habilidades.length > 0) {
            actualizarGraficasConDatos(estadoEvaluaciones.progreso, estadoEvaluaciones.habilidades);
        }
        
        document.getElementById('deportistaInfo').classList.remove('hidden');
        
        console.log('✅ Deportista cargado');
        
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarError('Error al cargar deportista');
    } finally {
        mostrarCargando(false);
    }
}

function resetearVistaDeportista() {
    estadoEvaluaciones.deportistaSeleccionado = null;
    estadoEvaluaciones.habilidades = [];
    estadoEvaluaciones.progreso = null;
    
    const input = document.getElementById('buscadorDeportista');
    const hiddenInput = document.getElementById('deportistaSeleccionadoId');
    
    if (input) input.value = '';
    if (hiddenInput) hiddenInput.value = '';
    
    // 🔥 Limpiar estadísticas
    limpiarEstadisticas();
    
    document.getElementById('deportistaInfo').classList.add('hidden');
    document.getElementById('tablaHabilidades').innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-12 text-gray-400">
                <span class="material-symbols-outlined text-4xl mb-2 block">assignment</span>
                <p class="text-sm">Selecciona un deportista para ver sus habilidades</p>
            </td>
        </tr>
    `;
}

function actualizarVistaDeportista(deportista, habilidades, progreso) {
    const nombre = deportista.nombre || deportista.User?.nombre || 'Sin nombre';
    const nivel = obtenerNivelLegible(deportista.nivel_actual);
    const grupo = formatearGrupo(deportista.equipo_competitivo);
    
    document.getElementById('deportistaInicial').textContent = nombre.charAt(0).toUpperCase();
    document.getElementById('deportistaNombre').textContent = nombre;
    document.getElementById('deportistaDetalles').textContent = 
        `Nivel: ${nivel} • Grupo: ${grupo} • Evaluaciones: ${estadoEvaluaciones.evaluaciones.length}`;
    
    if (progreso && progreso.progreso_total) {
        const porcentaje = progreso.progreso_total.porcentaje || 0;
        document.getElementById('progresoPorcentaje').textContent = `${porcentaje}%`;
        document.getElementById('progresoBar').style.width = `${porcentaje}%`;
    } else {
        document.getElementById('progresoPorcentaje').textContent = '0%';
        document.getElementById('progresoBar').style.width = '0%';
    }
    
    const habilidadesFiltradas = habilidades.filter(h => h.categoria === estadoEvaluaciones.categoriaActual);
    
    switch (estadoEvaluaciones.categoriaActual) {
        case 'habilidad':
            actualizarTablaHabilidades(habilidadesFiltradas);
            break;
        case 'ejercicio_accesorio':
            actualizarTablaEjercicios(habilidadesFiltradas);
            break;
        case 'postura':
            actualizarGridPosturas(habilidadesFiltradas);
            break;
    }
}

// ==========================================
// ACTUALIZACIÓN DE TABLAS
// ==========================================

function actualizarTablaHabilidades(habilidades) {
    const tbody = document.getElementById('tablaHabilidades');
    
    if (!habilidades || habilidades.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-12 text-gray-400">
                    <span class="material-symbols-outlined text-4xl mb-2 block">info</span>
                    <p class="text-sm">No hay habilidades en esta categoría</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = habilidades.map((habilidad, index) => {
        const evaluacion = habilidad.evaluacion || {};
        
        let puntuacionOriginal = evaluacion.puntuacion || 0;
        let puntuacion = puntuacionOriginal;
        if (puntuacionOriginal > 5) {
            puntuacion = Math.round(puntuacionOriginal / 2);
        }
        puntuacion = Math.min(puntuacion, 5);
        
        const completada = evaluacion.completado || false;
        const observaciones = evaluacion.observaciones || 'Sin retroalimentación';
        
        const estrellas = puntuacion;
        
        let estadoClase = 'estado-pendiente';
        let estadoTexto = 'Pendiente';
        
        if (completada) {
            estadoClase = 'estado-dominado';
            estadoTexto = 'Dominado';
        } else if (puntuacion > 0) {
            estadoClase = 'estado-proceso';
            estadoTexto = 'En Proceso';
        }
        
        return `
            <tr class="skill-row transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                <td class="px-6 py-4">
                    <p class="font-bold text-sm">${habilidad.nombre}</p>
                    <p class="text-[10px] text-gray-400 uppercase">${obtenerCategoriaLegible(habilidad.categoria)}</p>
                </td>
                <td class="px-6 py-4">
                    <div class="flex justify-center gap-1">
                        ${Array(5).fill(0).map((_, i) => `
                            <span class="material-symbols-outlined text-sm ${i < estrellas ? 'star-filled' : 'star-empty'}">star</span>
                        `).join('')}
                    </div>
                    <div class="text-center text-xs text-gray-500 mt-1">${puntuacion}/5</div>
                </td>
                <td class="px-6 py-4 text-xs italic text-gray-500 max-w-xs truncate">
                    ${observaciones}
                </td>
                <td class="px-6 py-4 text-right">
                    <span class="${estadoClase} text-[9px] font-bold px-2 py-1 uppercase rounded-full">
                        ${estadoTexto}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

function actualizarTablaEjercicios(ejercicios) {
    const tbody = document.getElementById('tablaEjercicios');
    
    if (!ejercicios || ejercicios.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-12 text-gray-400">
                    <span class="material-symbols-outlined text-4xl mb-2 block">fitness_center</span>
                    <p class="text-sm">No hay ejercicios accesorios</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = ejercicios.map(ejercicio => {
        const evaluacion = ejercicio.evaluacion || {};
        
        let puntuacionOriginal = evaluacion.puntuacion || 0;
        let puntuacion = puntuacionOriginal;
        if (puntuacionOriginal > 5) {
            puntuacion = Math.round(puntuacionOriginal / 2);
        }
        puntuacion = Math.min(puntuacion, 5);
        const porcentaje = (puntuacion / 5) * 100;
        
        const observaciones = evaluacion.observaciones || 'Sin observaciones';
        const completado = evaluacion.completado || false;
        
        return `
            <tr class="skill-row">
                <td class="px-6 py-4">
                    <p class="font-bold text-sm">${ejercicio.nombre}</p>
                </td>
                <td class="px-6 py-4">
                    <div class="w-full bg-gray-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                        <div class="bg-primary h-full progreso-bar" style="width: ${porcentaje}%"></div>
                    </div>
                    <div class="text-center text-xs text-gray-500 mt-1">${puntuacion}/5 (${porcentaje.toFixed(0)}%)</div>
                </td>
                <td class="px-6 py-4 text-xs italic text-gray-500">
                    ${observaciones}
                </td>
                <td class="px-6 py-4 text-right">
                    <span class="material-symbols-outlined ${completado ? 'text-green-500' : 'text-gray-300'}">
                        ${completado ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

function actualizarGridPosturas(posturas) {
    const grid = document.getElementById('gridPosturas');
    
    if (!posturas || posturas.length === 0) {
        grid.innerHTML = `
            <div class="col-span-3 text-center py-12 text-gray-400">
                <span class="material-symbols-outlined text-4xl mb-2 block">self_improvement</span>
                <p class="text-sm">No hay posturas registradas</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = posturas.map(postura => {
        const evaluacion = postura.evaluacion || {};
        
        let puntuacionOriginal = evaluacion.puntuacion || 0;
        let puntuacion = puntuacionOriginal;
        if (puntuacionOriginal > 5) {
            puntuacion = Math.round(puntuacionOriginal / 2);
        }
        puntuacion = Math.min(puntuacion, 5);
        
        const puntuacionFormateada = puntuacion.toFixed(1);
        const porcentaje = (puntuacion / 5) * 100;
        const observaciones = evaluacion.observaciones || 'Sin retroalimentación';
        
        return `
            <div class="bg-white dark:bg-zinc-900 p-5 border border-gray-100 dark:border-white/5 shadow-md rounded-xl">
                <div class="flex justify-between items-start mb-4">
                    <h4 class="font-display text-lg font-bold uppercase italic">${postura.nombre}</h4>
                    <span class="text-primary font-bold">${puntuacionFormateada}/5</span>
                </div>
                <p class="text-xs text-gray-500 italic mb-4">"${observaciones}"</p>
                <div class="flex items-center gap-2">
                    <div class="flex-1 h-1 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div class="bg-primary h-full progreso-bar" style="width: ${porcentaje}%"></div>
                    </div>
                    <span class="text-[10px] font-bold text-gray-400">${porcentaje.toFixed(0)}%</span>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// GRÁFICAS
// ==========================================

function inicializarGraficas() {
    const radarCtx = document.getElementById('radarChart')?.getContext('2d');
    if (radarCtx) {
        estadoEvaluaciones.graficas.radar = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['Flexibilidad', 'Fuerza', 'Técnica', 'Potencia', 'Equilibrio', 'Resistencia'],
                datasets: [{
                    label: 'Nivel Actual',
                    data: [0, 0, 0, 0, 0, 0],
                    fill: true,
                    backgroundColor: 'rgba(226, 27, 35, 0.2)',
                    borderColor: '#E21B23',
                    pointBackgroundColor: '#E21B23',
                    pointBorderColor: '#fff'
                }]
            },
            options: {
                elements: { line: { borderWidth: 3 } },
                scales: { r: { suggestedMin: 0, suggestedMax: 100 } },
                plugins: { legend: { display: false } }
            }
        });
    }
    
    const barCtx = document.getElementById('barChart')?.getContext('2d');
    if (barCtx) {
        estadoEvaluaciones.graficas.barras = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Habilidades', 'Accesorios', 'Posturas', 'Fuerza Core', 'Tumbling'],
                datasets: [{
                    label: '% de Dominio',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: '#E21B23',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100 },
                    x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
}

function actualizarGraficasConDatos(progreso, habilidades) {
    if (!progreso || !estadoEvaluaciones.graficas.radar || !estadoEvaluaciones.graficas.barras) {
        return;
    }
    
    const radarData = [
        progreso.progreso_por_categoria?.habilidad?.porcentaje || 0,
        progreso.progreso_por_categoria?.ejercicio_accesorio?.porcentaje || 0,
        Math.min(100, (progreso.progreso_total?.porcentaje || 0) * 1.2),
        Math.min(100, (progreso.progreso_total?.porcentaje || 0) * 0.8),
        progreso.progreso_por_categoria?.postura?.porcentaje || 0,
        Math.min(100, (progreso.progreso_total?.porcentaje || 0) * 0.9)
    ];
    
    estadoEvaluaciones.graficas.radar.data.datasets[0].data = radarData;
    estadoEvaluaciones.graficas.radar.update();
    
    const barData = [
        progreso.progreso_por_categoria?.habilidad?.porcentaje || 0,
        progreso.progreso_por_categoria?.ejercicio_accesorio?.porcentaje || 0,
        progreso.progreso_por_categoria?.postura?.porcentaje || 0,
        65,
        55
    ];
    
    estadoEvaluaciones.graficas.barras.data.datasets[0].data = barData;
    estadoEvaluaciones.graficas.barras.update();
}

// ==========================================
// LISTA DE EVALUACIONES RECIENTES
// ==========================================

function actualizarListaEvaluaciones(evaluaciones) {
    const container = document.getElementById('listaEvaluaciones');
    
    if (!evaluaciones || evaluaciones.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <span class="material-symbols-outlined text-4xl mb-2 block">history</span>
                <p class="text-sm">No hay evaluaciones recientes</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = evaluaciones.map(evaluacion => {
        const deportistaNombre = evaluacion.deportista_nombre || evaluacion.Deportista?.User?.nombre || 'Desconocido';
        const habilidadNombre = evaluacion.habilidad_nombre || evaluacion.Habilidad?.nombre || 'Sin habilidad';
        const fecha = new Date(evaluacion.fecha_evaluacion).toLocaleDateString('es-ES', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
        const hora = new Date(evaluacion.fecha_evaluacion).toLocaleTimeString('es-ES', {
            hour: '2-digit', minute: '2-digit'
        });
        
        let puntuacionOriginal = evaluacion.puntuacion || 0;
        let puntuacion = puntuacionOriginal;
        if (puntuacionOriginal > 5) {
            puntuacion = Math.round(puntuacionOriginal / 2);
        }
        puntuacion = Math.min(puntuacion, 5);
        
        const puntuacionFormateada = puntuacion.toFixed(1);
        
        let colorClase = '';
        if (puntuacion >= 4) {
            colorClase = 'text-green-600';
        } else if (puntuacion >= 2.5) {
            colorClase = 'text-yellow-600';
        } else {
            colorClase = 'text-red-600';
        }
        
        return `
            <div class="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-gray-100 dark:border-white/5">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="material-symbols-outlined ${evaluacion.completado ? 'text-green-500' : 'text-yellow-500'}">
                                ${evaluacion.completado ? 'check_circle' : 'pending'}
                            </span>
                            <div>
                                <p class="font-bold text-sm">${deportistaNombre}</p>
                                <p class="text-xs text-gray-500">${habilidadNombre}</p>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500">${fecha} • ${hora}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-xl font-bold ${colorClase}">${puntuacionFormateada}/5</div>
                        <div class="text-xs text-gray-500">Puntuación</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function configurarEventListeners() {
    document.getElementById('filtroNivel')?.addEventListener('change', (e) => {
        estadoEvaluaciones.filtros.nivel = e.target.value;
    });
    
    document.getElementById('filtroGrupo')?.addEventListener('change', (e) => {
        estadoEvaluaciones.filtros.grupo = e.target.value;
    });
    
    document.getElementById('btnFiltrar')?.addEventListener('click', aplicarFiltros);
    
    document.getElementById('btnActualizar')?.addEventListener('click', async () => {
        await cargarEvaluacionesRecientes();
        mostrarExito('Evaluaciones actualizadas');
    });
    
    document.getElementById('tabHabilidades')?.addEventListener('click', () => {
        cambiarCategoria('habilidad');
    });
    
    document.getElementById('tabEjercicios')?.addEventListener('click', () => {
        cambiarCategoria('ejercicio_accesorio');
    });
    
    document.getElementById('tabPosturas')?.addEventListener('click', () => {
        cambiarCategoria('postura');
    });
    
    document.getElementById('closeModal')?.addEventListener('click', cerrarModal);
}

function aplicarFiltros() {
    const deportistaId = document.getElementById('deportistaSeleccionadoId')?.value;
    
    if (deportistaId) {
        seleccionarDeportista(deportistaId);
    } else {
        mostrarError('Selecciona un deportista');
    }
}

function cambiarCategoria(categoria) {
    estadoEvaluaciones.categoriaActual = categoria;
    
    document.querySelectorAll('[id^="tab"]').forEach(tab => {
        tab.classList.remove('categoria-activa');
        tab.classList.add('text-gray-500');
    });
    
    const tabMap = {
        'habilidad': 'tabHabilidades',
        'ejercicio_accesorio': 'tabEjercicios',
        'postura': 'tabPosturas'
    };
    
    const tabActivo = document.getElementById(tabMap[categoria]);
    if (tabActivo) {
        tabActivo.classList.add('categoria-activa');
        tabActivo.classList.remove('text-gray-500');
    }
    
    document.querySelectorAll('[id^="seccion"]').forEach(seccion => {
        seccion.classList.add('hidden');
    });
    
    const seccionMap = {
        'habilidad': 'seccionHabilidades',
        'ejercicio_accesorio': 'seccionEjercicios',
        'postura': 'seccionPosturas'
    };
    
    document.getElementById(seccionMap[categoria])?.classList.remove('hidden');
    
    if (estadoEvaluaciones.deportistaSeleccionado) {
        const habilidadesFiltradas = estadoEvaluaciones.habilidades.filter(h => h.categoria === categoria);
        
        switch (categoria) {
            case 'habilidad':
                actualizarTablaHabilidades(habilidadesFiltradas);
                break;
            case 'ejercicio_accesorio':
                actualizarTablaEjercicios(habilidadesFiltradas);
                break;
            case 'postura':
                actualizarGridPosturas(habilidadesFiltradas);
                break;
        }
    }
}

// ==========================================
// UTILIDADES
// ==========================================

function obtenerNivelLegible(nivel) {
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
}

function obtenerCategoriaLegible(categoria) {
    const categorias = {
        'habilidad': 'Habilidad Técnica',
        'ejercicio_accesorio': 'Ejercicio Accesorio',
        'postura': 'Postura Corporal'
    };
    return categorias[categoria] || categoria;
}

function mostrarCargando(mostrar) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('hidden', !mostrar);
    }
}

function mostrarExito(mensaje) {
    if (window.AdminAPI) {
        window.AdminAPI.showNotification(mensaje, 'success');
    }
}

function mostrarError(mensaje) {
    if (window.AdminAPI) {
        window.AdminAPI.showNotification(mensaje, 'error');
    }
}

function cerrarModal() {
    document.getElementById('modalDetalle').classList.add('hidden');
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', 
        document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );
}

function logout() {
    if (confirm('¿Deseas cerrar sesión?')) {
        if (window.AdminAPI) {
            window.AdminAPI.logout();
        }
    }
}

window.toggleTheme = toggleTheme;
window.logout = logout;

console.log('✅ Evaluaciones Admin CORREGIDO - Estadísticas por deportista');