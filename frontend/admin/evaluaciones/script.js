// ==========================================
// EVALUACIONES.JS - TITANES EVOLUTION (VERSIÓN CORREGIDA)
// ==========================================

console.log('📂 Archivo evaluaciones.js cargado');

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
    
    // Verificar autenticación
    if (!AdminAPI.checkAuth()) {
        return;
    }
    
    // Actualizar info del usuario
    AdminAPI.updateUserInfo();
    
    try {
        await inicializarEvaluaciones();
        configurarEventListeners();
        console.log('✅ Módulo de evaluaciones inicializado correctamente');
    } catch (error) {
        console.error('❌ Error inicializando evaluaciones:', error);
        mostrarError('Error al inicializar el módulo de evaluaciones');
    }
});

async function inicializarEvaluaciones() {
    try {
        mostrarCargando(true);
        
        console.log('📥 Paso 1: Cargando deportistas...');
        await cargarDeportistas();
        
        console.log('📊 Paso 2: Cargando estadísticas...');
        await cargarEstadisticas();
        
        console.log('🔄 Paso 3: Cargando evaluaciones recientes...');
        await cargarEvaluacionesRecientes();
        
        console.log('🎨 Paso 4: Inicializando gráficas...');
        inicializarGraficas();
        
        console.log('✅ Inicialización completada');
        
    } catch (error) {
        console.error('❌ Error en inicializarEvaluaciones:', error);
        mostrarError('Error al cargar datos: ' + error.message);
    } finally {
        mostrarCargando(false);
    }
}

// ==========================================
// CARGA DE DATOS
// ==========================================

async function cargarDeportistas() {
    try {
        console.log('👥 Cargando lista de deportistas...');
        
        const deportistas = await AdminAPI.getDeportistas();
        estadoEvaluaciones.deportistas = deportistas;
        
        // Crear buscador en lugar de select
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
                <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    search
                </span>
                <div id="resultadosBusqueda" class="hidden absolute z-10 w-full mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto"></div>
            </div>
            <input type="hidden" id="deportistaSeleccionadoId" value="" />
        `;
        
        // Configurar buscador
        configurarBuscadorDeportistas(deportistas);
        
        // Extraer TODOS los grupos únicos (AQUÍ ESTÁ LA CLAVE)
        const grupos = [...new Set(deportistas
            .filter(d => d.equipo_competitivo && d.equipo_competitivo !== 'sin_equipo')
            .map(d => d.equipo_competitivo)
            .sort())];
        
        console.log('📋 Grupos encontrados:', grupos);
        console.log('📊 Total de grupos:', grupos.length);
        
        const selectGrupo = document.getElementById('filtroGrupo');
        if (selectGrupo) {
            selectGrupo.innerHTML = `
                <option value="">Todos los grupos</option>
                ${grupos.map(grupo => `
                    <option value="${grupo}">${formatearGrupo(grupo)}</option>
                `).join('')}
            `;
        }
        
        console.log(`✅ ${deportistas.length} deportistas cargados`);
        console.log(`✅ ${grupos.length} grupos únicos encontrados`);
        
    } catch (error) {
        console.error('❌ Error cargando deportistas:', error);
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
                     data-deportista-id="${d.id}"
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
    
    // Cerrar resultados al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !resultados.contains(e.target)) {
            resultados.classList.add('hidden');
        }
    });
}

// Función global para seleccionar desde el buscador
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
    
    // Convertir snake_case a Title Case
    return grupo
        .split('_')
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(' ');
}

async function cargarEstadisticas() {
    try {
        console.log('📊 Calculando estadísticas...');
        
        const deportistas = estadoEvaluaciones.deportistas;
        
        let totalEvaluaciones = 0;
        let evaluacionesCompletadas = 0;
        let sumaPuntuaciones = 0;
        let contadorPuntuaciones = 0;
        
        for (const deportista of deportistas.slice(0, 5)) {
            try {
                const evaluaciones = await AdminAPI.getEvaluacionesDeportista(deportista.id);
                totalEvaluaciones += evaluaciones.length;
                
                evaluaciones.forEach(e => {
                    if (e.completado) evaluacionesCompletadas++;
                    if (e.puntuacion) {
                        sumaPuntuaciones += e.puntuacion;
                        contadorPuntuaciones++;
                    }
                });
            } catch (error) {
                console.log(`⚠️ No se pudieron cargar evaluaciones para ${deportista.id}`);
            }
        }
        
        const promedioGeneral = contadorPuntuaciones > 0 
            ? (sumaPuntuaciones / contadorPuntuaciones).toFixed(1) 
            : 0;
        
        let cambiosPendientes = 0;
        try {
            const deportistasConCambio = await AdminAPI.getDeportistasConCambioPendiente();
            cambiosPendientes = deportistasConCambio.length;
        } catch (error) {
            console.log('⚠️ No se pudo obtener deportistas con cambio pendiente');
        }
        
        document.getElementById('totalEvaluaciones').textContent = totalEvaluaciones;
        document.getElementById('evaluacionesCompletadas').textContent = evaluacionesCompletadas;
        document.getElementById('promedioGeneral').textContent = promedioGeneral;
        document.getElementById('cambiosPendientes').textContent = cambiosPendientes;
        
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
    }
}

async function cargarEvaluacionesRecientes() {
    try {
        console.log('🔄 Cargando evaluaciones recientes...');
        
        const evaluaciones = await AdminAPI.getEvaluacionesRecientes();
        estadoEvaluaciones.evaluaciones = evaluaciones;
        
        actualizarListaEvaluaciones(evaluaciones);
        
    } catch (error) {
        console.error('❌ Error cargando evaluaciones recientes:', error);
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
            throw new Error('Deportista no encontrado en la lista');
        }
        
        estadoEvaluaciones.deportistaSeleccionado = deportista;
        
        console.log('📋 Cargando datos del deportista...');
        
        try {
            // 🔥 CAMBIO 1: Obtener todas las evaluaciones del deportista
            const evaluacionesDeportista = await AdminAPI.getEvaluacionesDeportista(deportistaId);
            estadoEvaluaciones.evaluaciones = evaluacionesDeportista || [];
            
            console.log(`📊 ${evaluacionesDeportista.length} evaluaciones encontradas para este deportista`);
            
            // 🔥 CAMBIO 2: Obtener habilidades del nivel del deportista
            let habilidadesDelNivel = [];
            try {
                const nivel = deportista.nivel_actual || '1_basico';
                console.log(`📋 Obteniendo habilidades para nivel: ${nivel}`);
                
                const habilidadesResponse = await AdminAPI.getHabilidadesPorNivel(nivel);
                
                if (habilidadesResponse.habilidades && habilidadesResponse.habilidades.length > 0) {
                    habilidadesDelNivel = habilidadesResponse.habilidades;
                    console.log(`✅ ${habilidadesDelNivel.length} habilidades encontradas para nivel ${nivel}`);
                } else {
                    console.warn(`⚠️ No se encontraron habilidades para nivel ${nivel}`);
                    // Intentar obtener todas las habilidades
                    const todasHabilidades = await AdminAPI.getAllHabilidades();
                    if (todasHabilidades && todasHabilidades.length > 0) {
                        habilidadesDelNivel = todasHabilidades.filter(h => 
                            h.nivel === nivel || !h.nivel
                        );
                        console.log(`✅ ${habilidadesDelNivel.length} habilidades filtradas de todas`);
                    }
                }
            } catch (error) {
                console.error('❌ Error obteniendo habilidades por nivel:', error);
            }
            
            // 🔥 CAMBIO 3: Unir habilidades con sus evaluaciones correspondientes
            const habilidadesConEvaluaciones = habilidadesDelNivel.map(habilidad => {
                // Buscar evaluación para esta habilidad específica
                const evaluacionParaHabilidad = evaluacionesDeportista.find(e => 
                    e.habilidad_id === habilidad.id || 
                    e.habilidad_nombre === habilidad.nombre
                );
                
                return {
                    ...habilidad,
                    evaluacion: evaluacionParaHabilidad || {
                        puntuacion: 0,
                        observaciones: 'Sin retroalimentación',
                        completado: false
                    }
                };
            });
            
            estadoEvaluaciones.habilidades = habilidadesConEvaluaciones;
            
            // Obtener progreso
            let progreso = null;
            try {
                progreso = await AdminAPI.getProgresoDeportista(deportistaId);
                estadoEvaluaciones.progreso = progreso;
            } catch (error) {
                console.warn('⚠️ No se pudo cargar progreso:', error.message);
            }
            
            actualizarVistaDeportista(deportista, estadoEvaluaciones.habilidades, estadoEvaluaciones.progreso);
            
            if (estadoEvaluaciones.progreso && estadoEvaluaciones.habilidades.length > 0) {
                actualizarGraficasConDatos(estadoEvaluaciones.progreso, estadoEvaluaciones.habilidades);
            }
            
            document.getElementById('deportistaInfo').classList.remove('hidden');
            
            console.log('✅ Datos del deportista cargados:');
            console.log(`   - Habilidades: ${habilidadesConEvaluaciones.length}`);
            console.log(`   - Evaluaciones: ${evaluacionesDeportista.length}`);
            console.log(`   - Habilidades con evaluación: ${habilidadesConEvaluaciones.filter(h => h.evaluacion.puntuacion > 0).length}`);
            
        } catch (error) {
            console.error('❌ Error cargando datos del deportista:', error);
            
            actualizarVistaDeportista(deportista, [], null);
            document.getElementById('deportistaInfo').classList.remove('hidden');
            
            mostrarError('Algunos datos no se pudieron cargar. Mostrando información básica.');
        }
        
    } catch (error) {
        console.error('❌ Error seleccionando deportista:', error);
        mostrarError('Error al cargar datos del deportista: ' + error.message);
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
    
    document.getElementById('deportistaInfo').classList.add('hidden');
    document.getElementById('tablaHabilidades').innerHTML = `
        <tr id="sinHabilidades">
            <td colspan="4" class="text-center py-12 text-gray-400">
                <span class="material-symbols-outlined text-4xl mb-2 block">assignment</span>
                <p class="text-sm">Selecciona un deportista para ver sus habilidades</p>
            </td>
        </tr>
    `;
    
    document.getElementById('tablaEjercicios').innerHTML = '';
    document.getElementById('gridPosturas').innerHTML = '';
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
                    <p class="text-sm">No hay habilidades registradas en esta categoría</p>
                </td>
            </tr>
        `;
        return;
    }
    
    console.log('📊 Mostrando habilidades en tabla:', habilidades.length);
    
    tbody.innerHTML = habilidades.map((habilidad, index) => {
        const evaluacion = habilidad.evaluacion || {};
        
        // 🔥 CAMBIO AQUÍ: Convertir de 1-10 a 1-5
        let puntuacionOriginal = evaluacion.puntuacion || 0;
        
        // Si la puntuación viene en escala 1-10, convertir a 1-5
        let puntuacion = puntuacionOriginal;
        if (puntuacionOriginal > 5) {
            // Convertir de 1-10 a 1-5 (dividir entre 2)
            puntuacion = Math.round(puntuacionOriginal / 2);
            console.log(`🔄 Convertida ${puntuacionOriginal}/10 → ${puntuacion}/5`);
        }
        
        // Asegurar que no exceda 5
        puntuacion = Math.min(puntuacion, 5);
        
        const completada = evaluacion.completado || false;
        const observaciones = evaluacion.observaciones || 'Sin retroalimentación';
        
        console.log(`   Habilidad ${index+1}: ${habilidad.nombre}`);
        console.log(`     - Puntuación: ${puntuacion}/5 (original: ${puntuacionOriginal})`);
        console.log(`     - Observaciones: ${observaciones}`);
        console.log(`     - Completada: ${completada}`);
        
        // Usar la puntuación ya en escala 1-5
        const estrellas = puntuacion;
        
        let estado = 'pendiente';
        let estadoClase = 'estado-pendiente';
        let estadoTexto = 'Pendiente';
        
        if (completada) {
            estado = 'dominado';
            estadoClase = 'estado-dominado';
            estadoTexto = 'Dominado';
        } else if (puntuacion > 0) {
            estado = 'proceso';
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
                            <span class="material-symbols-outlined text-sm ${i < estrellas ? 'star-filled' : 'star-empty'}">
                                star
                            </span>
                        `).join('')}
                    </div>
                    <div class="text-center text-xs text-gray-500 mt-1">${puntuacion}/5</div>
                    ${puntuacionOriginal !== puntuacion ? `<div class="text-center text-[10px] text-gray-400">(Original: ${puntuacionOriginal}/10)</div>` : ''}
                </td>
                <td class="px-6 py-4 text-xs italic text-gray-500 dark:text-gray-400 max-w-xs truncate">
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
                    <p class="text-sm">No hay ejercicios accesorios registrados</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = ejercicios.map(ejercicio => {
        const evaluacion = ejercicio.evaluacion || {};
        
        // 🔥 CAMBIO AQUÍ: Convertir de 1-10 a 1-5 para ejercicios también
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
            <tr class="skill-row transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                <td class="px-6 py-4">
                    <p class="font-bold text-sm">${ejercicio.nombre}</p>
                </td>
                <td class="px-6 py-4">
                    <div class="w-full bg-gray-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                        <div class="bg-primary h-full progreso-bar" style="width: ${porcentaje}%"></div>
                    </div>
                    <div class="text-center text-xs text-gray-500 mt-1">${puntuacion}/5 (${porcentaje.toFixed(0)}%)</div>
                    ${puntuacionOriginal !== puntuacion ? `<div class="text-center text-[10px] text-gray-400">(Original: ${puntuacionOriginal}/10)</div>` : ''}
                </td>
                <td class="px-6 py-4 text-xs italic text-gray-500 dark:text-gray-400">
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
        
        // 🔥 CAMBIO AQUÍ: Posturas ya están en escala 1-5 según tu código
        // Pero por si acaso, verificamos
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
            <div class="bg-white dark:bg-zinc-900 p-5 border border-gray-100 dark:border-white/5 shadow-md rounded-xl flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-start mb-4">
                        <h4 class="font-display text-lg font-bold uppercase italic tracking-tighter">${postura.nombre}</h4>
                        <span class="text-primary font-bold">${puntuacionFormateada}/5</span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 italic mb-4">"${observaciones}"</p>
                </div>
                <div class="flex items-center gap-2">
                    <div class="flex-1 h-1 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div class="bg-primary h-full progreso-bar" style="width: ${porcentaje}%"></div>
                    </div>
                    <span class="text-[10px] font-bold text-gray-400">${porcentaje.toFixed(0)}%</span>
                </div>
                ${puntuacionOriginal !== puntuacion ? `<div class="text-[10px] text-gray-400 text-center mt-2">(Original: ${puntuacionOriginal}/10)</div>` : ''}
            </div>
        `;
    }).join('');
}
function convertirPuntuacion(puntuacion) {
    if (puntuacion === undefined || puntuacion === null) return 0;
    
    let puntuacionNum = parseFloat(puntuacion);
    
    // Si ya está en escala 1-5, dejarla como está
    if (puntuacionNum <= 5) {
        return Math.min(puntuacionNum, 5);
    }
    
    // Si está en escala 1-10, convertir a 1-5
    if (puntuacionNum <= 10) {
        return Math.round((puntuacionNum / 10) * 5 * 10) / 10; // Mantener 1 decimal
    }
    
    // Si es mayor a 10, normalizar a 5
    return Math.min(5, Math.round((puntuacionNum / 100) * 5 * 10) / 10);
}

// 🔥 NUEVA FUNCIÓN: Para mostrar estrellas
function generarEstrellas(puntuacion, maxEstrellas = 5) {
    puntuacion = convertirPuntuacion(puntuacion);
    const estrellasLlenas = Math.floor(puntuacion);
    const tieneMediaEstrella = (puntuacion % 1) >= 0.5;
    
    let estrellasHTML = '';
    
    for (let i = 0; i < maxEstrellas; i++) {
        if (i < estrellasLlenas) {
            // Estrella llena
            estrellasHTML += `<span class="material-symbols-outlined text-sm star-filled">star</span>`;
        } else if (i === estrellasLlenas && tieneMediaEstrella) {
            // Media estrella
            estrellasHTML += `<span class="material-symbols-outlined text-sm star-half">star_half</span>`;
        } else {
            // Estrella vacía
            estrellasHTML += `<span class="material-symbols-outlined text-sm star-empty">star</span>`;
        }
    }
    
    return estrellasHTML;
}

// ==========================================
// GRÁFICAS
// ==========================================

function inicializarGraficas() {
    console.log('📈 Inicializando gráficas...');
    
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
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#E21B23'
                }]
            },
            options: {
                elements: {
                    line: { borderWidth: 3 }
                },
                scales: {
                    r: {
                        angleLines: { display: true },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                },
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
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
}

function actualizarGraficasConDatos(progreso, habilidades) {
    if (!progreso || !estadoEvaluaciones.graficas.radar || !estadoEvaluaciones.graficas.barras) {
        console.log('⚠️ Gráficas no inicializadas o sin datos');
        return;
    }
    
    console.log('🔄 Actualizando gráficas con datos...');
    
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
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        const hora = new Date(evaluacion.fecha_evaluacion).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // 🔥 CAMBIO AQUÍ: Convertir puntuación de 1-10 a 1-5
        let puntuacionOriginal = evaluacion.puntuacion || 0;
        let puntuacionConvertida = convertirPuntuacion(puntuacionOriginal);
        let puntuacionFormateada = puntuacionConvertida.toFixed(1);
        
        // Determinar color según la puntuación (1-5)
        let colorClase = '';
        if (puntuacionConvertida >= 4) {
            colorClase = 'text-green-600';
        } else if (puntuacionConvertida >= 2.5) {
            colorClase = 'text-yellow-600';
        } else {
            colorClase = 'text-red-600';
        }
        
        // Generar estrellas para la vista rápida
        const estrellasHTML = generarEstrellas(puntuacionOriginal, 5);
        
        return `
            <div class="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-gray-100 dark:border-white/5 hover:shadow-md transition-all">
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
                        <div class="flex items-center gap-3 mb-2">
                            <div class="flex gap-1">
                                ${estrellasHTML}
                            </div>
                            <span class="text-xs text-gray-500">${puntuacionFormateada}/5</span>
                        </div>
                        <p class="text-xs text-gray-500">${fecha} • ${hora}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-xl font-bold ${colorClase}">
                            ${puntuacionFormateada}/5
                        </div>
                        <div class="text-xs text-gray-500">
                            <span class="text-[10px]">(Original: ${puntuacionOriginal}/10)</span>
                        </div>
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
    console.log('🔗 Configurando event listeners...');
    
    document.getElementById('filtroNivel')?.addEventListener('change', (e) => {
        estadoEvaluaciones.filtros.nivel = e.target.value;
        aplicarFiltrosDeportistas();
    });
    
    document.getElementById('filtroGrupo')?.addEventListener('change', (e) => {
        estadoEvaluaciones.filtros.grupo = e.target.value;
        aplicarFiltrosDeportistas();
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
    
    document.getElementById('btnAyuda')?.addEventListener('click', mostrarAyuda);
    
    document.getElementById('closeModal')?.addEventListener('click', cerrarModal);
}

function aplicarFiltros() {
    const deportistaId = document.getElementById('deportistaSeleccionadoId')?.value;
    
    if (deportistaId) {
        seleccionarDeportista(deportistaId);
    } else {
        mostrarError('Selecciona un deportista para filtrar');
    }
}

function aplicarFiltrosDeportistas() {
    const { nivel, grupo } = estadoEvaluaciones.filtros;
    
    let deportistasFiltrados = estadoEvaluaciones.deportistas;
    
    if (nivel) {
        deportistasFiltrados = deportistasFiltrados.filter(d => d.nivel_actual === nivel);
    }
    
    if (grupo) {
        deportistasFiltrados = deportistasFiltrados.filter(d => d.equipo_competitivo === grupo);
    }
    
    configurarBuscadorDeportistas(deportistasFiltrados);
    
    const deportistaActualId = document.getElementById('deportistaSeleccionadoId')?.value;
    if (deportistaActualId && !deportistasFiltrados.find(d => d.id === deportistaActualId)) {
        resetearVistaDeportista();
    }
}

function cambiarCategoria(categoria) {
    console.log(`🔄 Cambiando a categoría: ${categoria}`);
    
    estadoEvaluaciones.categoriaActual = categoria;
    
    document.querySelectorAll('[id^="tab"]').forEach(tab => {
        tab.classList.remove('categoria-activa');
        tab.classList.add('text-gray-500', 'hover:text-gray-700');
    });
    
    const tabMap = {
        'habilidad': 'tabHabilidades',
        'ejercicio_accesorio': 'tabEjercicios',
        'postura': 'tabPosturas'
    };
    
    const tabActivo = document.getElementById(tabMap[categoria]);
    if (tabActivo) {
        tabActivo.classList.add('categoria-activa');
        tabActivo.classList.remove('text-gray-500', 'hover:text-gray-700');
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
    console.log('✅', mensaje);
    if (window.AdminAPI) {
        window.AdminAPI.showNotification(mensaje, 'success');
    } else {
        alert(mensaje);
    }
}

function mostrarError(mensaje) {
    console.error('❌', mensaje);
    if (window.AdminAPI) {
        window.AdminAPI.showNotification(mensaje, 'error');
    } else {
        alert(mensaje);
    }
}

function cerrarModal() {
    document.getElementById('modalDetalle').classList.add('hidden');
}

function mostrarAyuda() {
    const ayuda = `
AYUDA - MÓDULO DE EVALUACIONES

📋 FUNCIONALIDADES:
1. Busca deportistas escribiendo su nombre
2. Filtra por nivel y grupo competitivo
3. Navega entre diferentes categorías (Habilidades, Ejercicios, Posturas)
4. Visualiza gráficas de progreso
5. Revisa evaluaciones recientes

🔧 INFORMACIÓN:
• El administrador solo puede visualizar evaluaciones
• Los entrenadores son responsables de registrar nuevas evaluaciones
• Contacta al soporte técnico si encuentras discrepancias
    `;
    
    if (window.AdminAPI) {
        window.AdminAPI.showNotification(ayuda, 'info', 10000);
    } else {
        alert(ayuda);
    }
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
        } else {
            localStorage.removeItem('token');
            window.location.href = '../auth/login-admin.html';
        }
    }
}
function debugEvaluacionesDeportista(deportistaId) {
    console.log('🔍 DEBUG - Verificando datos del deportista:', deportistaId);
    
    const deportista = estadoEvaluaciones.deportistas.find(d => d.id === deportistaId);
    if (!deportista) {
        console.error('❌ Deportista no encontrado');
        return;
    }
    
    console.log('📊 Información del deportista:');
    console.log('   Nombre:', deportista.nombre || deportista.User?.nombre);
    console.log('   Nivel:', deportista.nivel_actual);
    console.log('   Equipo:', deportista.equipo_competitivo);
    
    // Llamar a la API para obtener datos directos
    Promise.all([
        AdminAPI.getEvaluacionesDeportista(deportistaId),
        AdminAPI.getProgresoDeportista(deportistaId),
        AdminAPI.getHabilidadesPorNivel(deportista.nivel_actual || '1_basico')
    ]).then(([evaluaciones, progreso, habilidadesResponse]) => {
        console.log('📋 Resultados directos de API:');
        console.log(`   - Evaluaciones: ${evaluaciones.length}`);
        console.log('   - Progreso:', progreso);
        console.log(`   - Habilidades: ${habilidadesResponse.habilidades?.length || habilidadesResponse.length || 0}`);
        
        // Mostrar algunas evaluaciones de ejemplo
        if (evaluaciones.length > 0) {
            console.log('📝 Ejemplo de evaluaciones:');
            evaluaciones.slice(0, 3).forEach((evalu, i) => {
                console.log(`     ${i+1}. ${evalu.habilidad_nombre}: ${evalu.puntuacion}/10`);
            });
        }
        
        if (habilidadesResponse.habilidades && habilidadesResponse.habilidades.length > 0) {
            console.log('🏆 Ejemplo de habilidades:');
            habilidadesResponse.habilidades.slice(0, 3).forEach((hab, i) => {
                console.log(`     ${i+1}. ${hab.nombre} (${hab.categoria})`);
            });
        }
    }).catch(error => {
        console.error('❌ Error en debug:', error);
    });
}

window.toggleTheme = toggleTheme;
window.logout = logout;