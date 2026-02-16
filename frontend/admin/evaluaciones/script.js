// ==========================================
// EVALUACIONES ADMIN - VERSIÓN FINAL
// Solo muestra HABILIDADES del nivel actual del deportista
// ==========================================

console.log('📂 Evaluaciones Admin FINAL');

let estadoEvaluaciones = {
    deportistas: [],
    deportistaSeleccionado: null,
    evaluaciones: [],
    habilidades: [],
    progreso: null
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando...');
    
    if (!window.AdminAPI || !AdminAPI.checkAuth()) return;
    
    AdminAPI.updateUserInfo();
    
    try {
        await inicializarEvaluaciones();
        configurarEventListeners();
    } catch (error) {
        console.error('❌ Error:', error);
    }
});

async function inicializarEvaluaciones() {
    try {
        mostrarCargando(true);
        
        await cargarDeportistas();
        limpiarEstadisticas();
        await cargarEvaluacionesRecientes();
        inicializarGraficas();
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mostrarCargando(false);
    }
}

function limpiarEstadisticas() {
    document.getElementById('totalEvaluaciones').textContent = '0';
    document.getElementById('evaluacionesCompletadas').textContent = '0';
    document.getElementById('promedioGeneral').textContent = '0.0';
    document.getElementById('cambiosPendientes').textContent = '0';
}

async function cargarDeportistas() {
    try {
        const deportistas = await AdminAPI.getDeportistas();
        estadoEvaluaciones.deportistas = deportistas;
        
        const contenedorBuscador = document.getElementById('filtroDeportista').parentElement;
        contenedorBuscador.innerHTML = `
            <label class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Deportista</label>
            <div class="relative">
                <input 
                    type="text" 
                    id="buscadorDeportista" 
                    placeholder="Buscar deportista..."
                    class="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded px-3 py-2 text-sm"
                />
                <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                <div id="resultadosBusqueda" class="hidden absolute z-10 w-full mt-1 bg-white dark:bg-zinc-900 border rounded-lg shadow-lg max-h-60 overflow-y-auto"></div>
            </div>
            <input type="hidden" id="deportistaSeleccionadoId" value="" />
        `;
        
        configurarBuscador(deportistas);
        
        const grupos = [...new Set(deportistas
            .filter(d => d.equipo_competitivo && d.equipo_competitivo !== 'sin_equipo')
            .map(d => d.equipo_competitivo))];
        
        const selectGrupo = document.getElementById('filtroGrupo');
        if (selectGrupo) {
            selectGrupo.innerHTML = `
                <option value="">Todos los grupos</option>
                ${grupos.map(g => `<option value="${g}">${formatearGrupo(g)}</option>`).join('')}
            `;
        }
        
        console.log(`✅ ${deportistas.length} deportistas`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

function configurarBuscador(deportistas) {
    const input = document.getElementById('buscadorDeportista');
    const resultados = document.getElementById('resultadosBusqueda');
    
    if (!input) return;
    
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length < 2) {
            resultados.classList.add('hidden');
            return;
        }
        
        const coincidencias = deportistas.filter(d => {
            const nombre = (d.nombre || d.User?.nombre || '').toLowerCase();
            return nombre.includes(query);
        });
        
        if (coincidencias.length === 0) {
            resultados.innerHTML = '<div class="p-4 text-center text-gray-500">No se encontraron deportistas</div>';
            resultados.classList.remove('hidden');
            return;
        }
        
        resultados.innerHTML = coincidencias.map(d => {
            const nombre = d.nombre || d.User?.nombre || 'Sin nombre';
            const nivel = obtenerNivelLegible(d.nivel_actual);
            const grupo = formatearGrupo(d.equipo_competitivo);
            
            return `
                <div class="p-3 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer border-b last:border-0"
                     onclick="seleccionarDeportistaDesdeBusqueda('${d.id}', '${nombre.replace(/'/g, "\\'")}')">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            ${nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
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
    
    seleccionarDeportista(deportistaId);
};

// 🔥 FUNCIÓN PRINCIPAL: Cargar deportista y sus habilidades
async function seleccionarDeportista(deportistaId) {
    try {
        if (!deportistaId) {
            resetearVista();
            return;
        }
        
        mostrarCargando(true);
        
        const deportista = estadoEvaluaciones.deportistas.find(d => d.id === deportistaId);
        if (!deportista) {
            throw new Error('Deportista no encontrado');
        }
        
        estadoEvaluaciones.deportistaSeleccionado = deportista;
        
        console.log('👤 Deportista:', deportista.nombre);
        console.log('📍 Nivel:', deportista.nivel_actual);
        
        // 🔥 CARGAR ESTADÍSTICAS DEL DEPORTISTA
        await cargarEstadisticasDeportista(deportistaId, deportista);
        
        // Obtener evaluaciones
        const evaluaciones = await AdminAPI.getEvaluacionesDeportista(deportistaId);
        estadoEvaluaciones.evaluaciones = evaluaciones || [];
        
        console.log(`📊 ${evaluaciones.length} evaluaciones`);
        
        // 🔥 OBTENER SOLO HABILIDADES DEL NIVEL
        const nivel = deportista.nivel_actual || '1_basico';
        const habilidadesResponse = await AdminAPI.getHabilidadesPorNivel(nivel);
        
        // 🔥 FILTRAR SOLO HABILIDADES (no ejercicios ni posturas)
        let habilidadesDelNivel = [];
        if (habilidadesResponse.habilidades) {
            habilidadesDelNivel = habilidadesResponse.habilidades.filter(h => 
                h.categoria === 'habilidad'
            );
        }
        
        console.log(`🏆 ${habilidadesDelNivel.length} habilidades del nivel ${nivel}`);
        
        // Unir con evaluaciones
        const habilidadesConEvaluaciones = habilidadesDelNivel.map(habilidad => {
            const evaluacion = evaluaciones.find(e => 
                e.habilidad_id === habilidad.id
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
        
        // Progreso
        try {
            const progreso = await AdminAPI.getProgresoDeportista(deportistaId);
            estadoEvaluaciones.progreso = progreso;
        } catch (error) {
            console.warn('⚠️ Sin progreso');
        }
        
        actualizarVista(deportista);
        actualizarTablaHabilidades(habilidadesConEvaluaciones);
        
        if (estadoEvaluaciones.progreso) {
            actualizarGraficas(estadoEvaluaciones.progreso);
        }
        
        document.getElementById('deportistaInfo').classList.remove('hidden');
        
        // 🔥 OCULTAR TABS (solo mostrar habilidades)
        document.getElementById('tabEjercicios')?.classList.add('hidden');
        document.getElementById('tabPosturas')?.classList.add('hidden');
        document.getElementById('seccionEjercicios')?.classList.add('hidden');
        document.getElementById('seccionPosturas')?.classList.add('hidden');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mostrarCargando(false);
    }
}

// 🔥 CALCULAR ESTADÍSTICAS DEL DEPORTISTA
async function cargarEstadisticasDeportista(deportistaId, deportista) {
    try {
        const evaluaciones = await AdminAPI.getEvaluacionesDeportista(deportistaId);
        
        // 🔥 FILTRAR SOLO HABILIDADES
        const evaluacionesHabilidades = evaluaciones.filter(e => 
            e.habilidad?.categoria === 'habilidad' || 
            e.Habilidad?.categoria === 'habilidad'
        );
        
        const totalEvaluaciones = evaluacionesHabilidades.length;
        const completadas = evaluacionesHabilidades.filter(e => e.completado).length;
        
        let promedio = 0;
        if (evaluacionesHabilidades.length > 0) {
            const suma = evaluacionesHabilidades.reduce((sum, e) => sum + (e.puntuacion || 0), 0);
            promedio = (suma / evaluacionesHabilidades.length).toFixed(1);
        }
        
        // Niveles completados
        let nivelesCompletados = 0;
        try {
            const progreso = await AdminAPI.getProgresoDeportista(deportistaId);
            if (progreso && progreso.progreso_por_nivel) {
                nivelesCompletados = Object.values(progreso.progreso_por_nivel)
                    .filter(n => n.porcentaje === 100).length;
            }
        } catch (error) {
            console.warn('⚠️ Sin progreso');
        }
        
        // 🔥 ACTUALIZAR UI
        document.getElementById('totalEvaluaciones').textContent = totalEvaluaciones;
        document.getElementById('evaluacionesCompletadas').textContent = completadas;
        document.getElementById('promedioGeneral').textContent = promedio;
        document.getElementById('cambiosPendientes').textContent = nivelesCompletados;
        
        console.log(`📊 Estadísticas: ${totalEvaluaciones} evaluaciones, ${completadas} completadas, ${promedio} promedio`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

function actualizarVista(deportista) {
    const nombre = deportista.nombre || deportista.User?.nombre || 'Sin nombre';
    const nivel = obtenerNivelLegible(deportista.nivel_actual);
    const grupo = formatearGrupo(deportista.equipo_competitivo);
    
    document.getElementById('deportistaInicial').textContent = nombre.charAt(0).toUpperCase();
    document.getElementById('deportistaNombre').textContent = nombre;
    document.getElementById('deportistaDetalles').textContent = 
        `Nivel: ${nivel} • Grupo: ${grupo} • Evaluaciones: ${estadoEvaluaciones.evaluaciones.length}`;
    
    if (estadoEvaluaciones.progreso && estadoEvaluaciones.progreso.progreso_total) {
        const porcentaje = estadoEvaluaciones.progreso.progreso_total.porcentaje || 0;
        document.getElementById('progresoPorcentaje').textContent = `${porcentaje}%`;
        document.getElementById('progresoBar').style.width = `${porcentaje}%`;
    } else {
        document.getElementById('progresoPorcentaje').textContent = '0%';
        document.getElementById('progresoBar').style.width = '0%';
    }
}

function actualizarTablaHabilidades(habilidades) {
    const tbody = document.getElementById('tablaHabilidades');
    
    if (!habilidades || habilidades.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-12 text-gray-400">
                    <span class="material-symbols-outlined text-4xl mb-2 block">info</span>
                    <p class="text-sm">No hay habilidades en este nivel</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = habilidades.map(habilidad => {
        const evaluacion = habilidad.evaluacion || {};
        
        let puntuacion = evaluacion.puntuacion || 0;
        if (puntuacion > 5) {
            puntuacion = Math.round(puntuacion / 2);
        }
        puntuacion = Math.min(puntuacion, 5);
        
        const completada = evaluacion.completado || false;
        const observaciones = evaluacion.observaciones || 'Sin retroalimentación';
        
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
            <tr class="skill-row">
                <td class="px-6 py-4">
                    <p class="font-bold text-sm">${habilidad.nombre}</p>
                    <p class="text-[10px] text-gray-400 uppercase">HABILIDAD TÉCNICA</p>
                </td>
                <td class="px-6 py-4">
                    <div class="flex justify-center gap-1">
                        ${Array(5).fill(0).map((_, i) => `
                            <span class="material-symbols-outlined text-sm ${i < puntuacion ? 'star-filled' : 'star-empty'}">star</span>
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

function resetearVista() {
    estadoEvaluaciones.deportistaSeleccionado = null;
    
    limpiarEstadisticas();
    
    document.getElementById('deportistaInfo').classList.add('hidden');
    document.getElementById('tablaHabilidades').innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-12 text-gray-400">
                <span class="material-symbols-outlined text-4xl mb-2 block">assignment</span>
                <p class="text-sm">Selecciona un deportista</p>
            </td>
        </tr>
    `;
}

async function cargarEvaluacionesRecientes() {
    try {
        const evaluaciones = await AdminAPI.getEvaluacionesRecientes();
        actualizarListaEvaluaciones(evaluaciones);
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

function actualizarListaEvaluaciones(evaluaciones) {
    const container = document.getElementById('listaEvaluaciones');
    
    if (!evaluaciones || evaluaciones.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-gray-400"><p>No hay evaluaciones recientes</p></div>';
        return;
    }
    
    container.innerHTML = evaluaciones.map(e => {
        const nombre = e.deportista_nombre || 'Desconocido';
        const habilidad = e.habilidad_nombre || 'Sin habilidad';
        const fecha = new Date(e.fecha_evaluacion).toLocaleDateString('es-ES');
        
        let puntuacion = e.puntuacion || 0;
        if (puntuacion > 5) puntuacion = Math.round(puntuacion / 2);
        puntuacion = Math.min(puntuacion, 5);
        
        return `
            <div class="bg-white dark:bg-zinc-900 p-4 rounded-lg border">
                <div class="flex justify-between">
                    <div>
                        <p class="font-bold text-sm">${nombre}</p>
                        <p class="text-xs text-gray-500">${habilidad}</p>
                        <p class="text-xs text-gray-500">${fecha}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-xl font-bold text-primary">${puntuacion.toFixed(1)}/5</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function inicializarGraficas() {
    const radarCtx = document.getElementById('radarChart')?.getContext('2d');
    if (radarCtx) {
        estadoEvaluaciones.graficaRadar = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['Flexibilidad', 'Fuerza', 'Técnica', 'Potencia', 'Equilibrio', 'Resistencia'],
                datasets: [{
                    data: [0, 0, 0, 0, 0, 0],
                    fill: true,
                    backgroundColor: 'rgba(226, 27, 35, 0.2)',
                    borderColor: '#E21B23'
                }]
            },
            options: {
                scales: { r: { suggestedMax: 100 } },
                plugins: { legend: { display: false } }
            }
        });
    }
    
    const barCtx = document.getElementById('barChart')?.getContext('2d');
    if (barCtx) {
        estadoEvaluaciones.graficaBarras = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Habilidades', 'Accesorios', 'Posturas', 'Core', 'Tumbling'],
                datasets: [{
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: '#E21B23'
                }]
            },
            options: {
                scales: { y: { max: 100 } },
                plugins: { legend: { display: false } }
            }
        });
    }
}

function actualizarGraficas(progreso) {
    if (!progreso) return;
    
    if (estadoEvaluaciones.graficaRadar) {
        const data = [
            progreso.progreso_por_categoria?.habilidad?.porcentaje || 0,
            60, 70, 50, 80, 65
        ];
        estadoEvaluaciones.graficaRadar.data.datasets[0].data = data;
        estadoEvaluaciones.graficaRadar.update();
    }
    
    if (estadoEvaluaciones.graficaBarras) {
        const data = [
            progreso.progreso_por_categoria?.habilidad?.porcentaje || 0,
            progreso.progreso_por_categoria?.ejercicio_accesorio?.porcentaje || 0,
            progreso.progreso_por_categoria?.postura?.porcentaje || 0,
            65, 55
        ];
        estadoEvaluaciones.graficaBarras.data.datasets[0].data = data;
        estadoEvaluaciones.graficaBarras.update();
    }
}

function configurarEventListeners() {
    document.getElementById('btnFiltrar')?.addEventListener('click', () => {
        const id = document.getElementById('deportistaSeleccionadoId')?.value;
        if (id) seleccionarDeportista(id);
    });
    
    document.getElementById('btnActualizar')?.addEventListener('click', cargarEvaluacionesRecientes);
}

function obtenerNivelLegible(nivel) {
    const niveles = {
        'baby_titans': 'Baby Titans',
        '1_basico': '1 Básico',
        '1_medio': '1 Medio',
        '1_avanzado': '1 Avanzado',
        '2': 'Nivel 2',
        '3': 'Nivel 3',
        '4': 'Nivel 4'
    };
    return niveles[nivel] || nivel;
}

function formatearGrupo(grupo) {
    if (!grupo || grupo === 'sin_equipo') return 'Sin grupo';
    return grupo.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function mostrarCargando(mostrar) {
    document.getElementById('loadingOverlay')?.classList.toggle('hidden', !mostrar);
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
}

function logout() {
    if (confirm('¿Cerrar sesión?')) {
        AdminAPI.logout();
    }
}

window.toggleTheme = toggleTheme;
window.logout = logout;

console.log('✅ Evaluaciones Admin FINAL - Solo habilidades');