// Script para la página de evaluación individual - SOLO HABILIDADES - ESCALA 1-5
let deportista = null;
let habilidades = []; // Solo habilidades
let evaluacionesHistorial = [];
let evaluacionActual = {
    deportista_id: null,
    habilidades: {},
    observaciones_generales: '',
    fecha: new Date().toISOString()
};
let chartRadar = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM cargado - Evaluación SOLO HABILIDADES (Escala 1-5)');
    
    if (window.EntrenadorAPI && EntrenadorAPI.checkAuth) {
        if (!EntrenadorAPI.checkAuth()) {
            return;
        }
        const sidebarName = document.getElementById('sidebarName');
        if (sidebarName && EntrenadorAPI.user) {
            sidebarName.textContent = EntrenadorAPI.user.nombre || EntrenadorAPI.user.email || 'Entrenador';
        }
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const deportistaId = urlParams.get('deportista');
    
    console.log('🔍 Deportista ID:', deportistaId);
    
    if (!deportistaId) {
        console.error('❌ No se especificó deportista');
        mostrarError('No se especificó deportista para evaluar');
        setTimeout(() => volverASeleccion(), 2000);
        return;
    }
    
    document.getElementById('toggleTheme')?.addEventListener('click', toggleTheme);
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }
    
    const fechaElement = document.getElementById('fechaEvaluacion');
    if (fechaElement) {
        const fecha = new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        fechaElement.textContent = fecha;
    }
    
    cargarDatosDeportista(deportistaId);
});

async function cargarDatosDeportista(deportistaId) {
    try {
        mostrarLoading(true);
        console.log(`📋 Cargando datos del deportista ${deportistaId}...`);
        
        const deportistaGuardado = localStorage.getItem('deportistaParaEvaluar');
        
        if (deportistaGuardado) {
            try {
                const deportistaData = JSON.parse(deportistaGuardado);
                
                if (deportistaData.id === deportistaId) {
                    console.log('✅ Datos obtenidos de localStorage');
                    
                    deportista = {
                        id: deportistaData.id,
                        nombre: deportistaData.nombre || 'Deportista Sin Nombre',
                        email: deportistaData.email || '',
                        telefono: deportistaData.telefono || '',
                        nivel_actual: deportistaData.nivel_actual,
                        equipo_competitivo: deportistaData.equipo_competitivo || 'sin_equipo',
                        foto_perfil: deportistaData.foto_perfil || 'https://via.placeholder.com/200',
                        fecha_nacimiento: deportistaData.fecha_nacimiento,
                        posicion: deportistaData.posicion || null
                    };
                    
                    console.log('✅ Deportista:', deportista.nombre, '| Nivel:', deportista.nivel_actual);
                    
                    evaluacionActual.deportista_id = deportistaId;
                    
                    actualizarInfoDeportista();
                    
                    await cargarHabilidadesYEvaluaciones(deportistaId);
                    
                    return;
                }
            } catch (e) {
                console.warn('⚠️ Error parseando localStorage:', e);
            }
        }
        
        console.log('⚠️ Llamando a la API...');
        
        const deportistaData = await EntrenadorAPI.getDeportistaById(deportistaId);
        
        if (!deportistaData) {
            throw new Error('Deportista no encontrado en la base de datos');
        }
        
        deportista = {
            id: deportistaData.id,
            nombre: deportistaData.nombre || 'Deportista Sin Nombre',
            email: deportistaData.email || '',
            telefono: deportistaData.telefono || '',
            nivel_actual: deportistaData.nivel_actual,
            equipo_competitivo: deportistaData.equipo_competitivo || 'sin_equipo',
            foto_perfil: deportistaData.foto_perfil || deportistaData.foto || 'https://via.placeholder.com/200',
            fecha_nacimiento: deportistaData.fecha_nacimiento,
            posicion: deportistaData.posicion || null
        };
        
        evaluacionActual.deportista_id = deportistaId;
        
        actualizarInfoDeportista();
        
        await cargarHabilidadesYEvaluaciones(deportistaId);
        
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        EntrenadorAPI.showNotification(`Error: ${error.message}`, 'error');
        setTimeout(() => volverASeleccion(), 3000);
    } finally {
        mostrarLoading(false);
    }
}

async function cargarHabilidadesYEvaluaciones(deportistaId) {
    console.log(`📚 Obteniendo SOLO HABILIDADES para nivel: ${deportista.nivel_actual}`);
    
    let nivelParaHabilidades = deportista.nivel_actual;
    
    if (!nivelParaHabilidades || nivelParaHabilidades === 'pendiente') {
        nivelParaHabilidades = '1_basico';
        console.log(`⚠️ Nivel no definido, usando: ${nivelParaHabilidades}`);
    }
    
    const habilidadesData = await EntrenadorAPI.getHabilidadesPorNivel(nivelParaHabilidades, deportista.id);
    
    // 🔥 FILTRAR SOLO HABILIDADES (categoría = 'habilidad')
    const todasLasHabilidades = habilidadesData.habilidades || habilidadesData || [];
    habilidades = todasLasHabilidades.filter(h => h.categoria === 'habilidad');
    
    console.log(`📊 ${habilidades.length} HABILIDADES cargadas (de ${todasLasHabilidades.length} totales)`);
    
    console.log('📜 Obteniendo historial de evaluaciones...');
    const evaluacionesData = await EntrenadorAPI.getEvaluacionesDeportista(deportistaId);
    evaluacionesHistorial = evaluacionesData || [];
    
    const habilidadesIds = habilidades.map(h => h.id);
    evaluacionesHistorial = evaluacionesHistorial.filter(e => 
        habilidadesIds.includes(e.habilidad_id)
    );
    
    console.log(`📋 ${evaluacionesHistorial.length} evaluaciones históricas de HABILIDADES`);
    
    evaluacionActual.habilidades = {};
    habilidades.forEach(habilidad => {
        const evalPrevia = evaluacionesHistorial.find(e => e.habilidad_id === habilidad.id);
        
        if (evalPrevia && evalPrevia.puntuacion) {
            evaluacionActual.habilidades[habilidad.id] = {
                puntuacion: parseInt(evalPrevia.puntuacion) || 0,
                observaciones: evalPrevia.observaciones || '',
                evaluacion_id: evalPrevia.id,
                fecha_evaluacion: evalPrevia.fecha_evaluacion
            };
        } else {
            evaluacionActual.habilidades[habilidad.id] = {
                puntuacion: 0,
                observaciones: '',
                evaluacion_id: null,
                fecha_evaluacion: null
            };
        }
    });
    
    console.log(`🔄 ${Object.keys(evaluacionActual.habilidades).length} habilidades inicializadas`);
    
    mostrarHabilidades();
    calcularEstadisticas();
    calcularProgresoNivel();
    inicializarGraficas();
    
    console.log('✅ Datos cargados exitosamente');
}

function actualizarInfoDeportista() {
    if (!deportista) return;
    
    console.log('🔄 Actualizando UI del deportista');
    
    const nombreElement = document.getElementById('deportistaNombre');
    if (nombreElement) {
        nombreElement.textContent = deportista.nombre;
    }
    
    const fotoElement = document.getElementById('deportistaFoto');
    if (fotoElement) {
        fotoElement.src = deportista.foto_perfil;
        fotoElement.alt = deportista.nombre;
        fotoElement.onerror = function() {
            this.src = 'https://via.placeholder.com/200';
        };
    }
    
    const nivelBadge = document.getElementById('deportistaNivelBadge');
    if (nivelBadge) {
        const nivel = deportista.nivel_actual;
        const nivelEsValido = nivel && nivel !== 'pendiente' && nivel !== '';
        
        if (!nivelEsValido) {
            nivelBadge.textContent = 'SIN DEF';
            nivelBadge.className = 'absolute -bottom-2 -right-2 px-2 py-1 text-xs font-bold uppercase italic bg-red-600 text-white';
        } else {
            const abreviatura = getNivelAbreviatura(nivel);
            nivelBadge.textContent = abreviatura;
            nivelBadge.className = 'absolute -bottom-2 -right-2 px-2 py-1 text-xs font-bold uppercase italic ' + 
                getNivelBadgeColor(nivel) + ' text-white';
        }
    }
    
    const nombreNivel = document.getElementById('nombreNivelActual');
    if (nombreNivel) {
        const nivel = deportista.nivel_actual;
        const nivelEsValido = nivel && nivel !== 'pendiente' && nivel !== '';
        
        if (!nivelEsValido) {
            nombreNivel.textContent = 'SIN DEFINIR';
            nombreNivel.className = 'text-red-600 dark:text-red-400 font-bold';
        } else {
            const nombreCompleto = getNivelNombreCompleto(nivel);
            nombreNivel.textContent = nombreCompleto;
            nombreNivel.className = 'text-primary font-bold';
        }
    }
    
    const equipoElement = document.getElementById('deportistaEquipo');
    if (equipoElement) {
        equipoElement.textContent = getNombreEquipo(deportista.equipo_competitivo);
    }
    
    const posicionElement = document.getElementById('deportistaPosicion');
    if (posicionElement) {
        const posicionTexto = deportista.posicion || getNivelNombreCompleto(deportista.nivel_actual);
        posicionElement.textContent = posicionTexto;
    }
}

// ===========================================
// FUNCIONES DE UTILIDAD
// ===========================================

function getNivelNombreCompleto(nivel) {
    if (!nivel || nivel === 'pendiente') return 'SIN DEFINIR';
    
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

function getNivelAbreviatura(nivel) {
    if (!nivel || nivel === 'pendiente') return 'SIN DEF';
    
    const abreviaturas = {
        'baby_titans': 'BABY',
        '1_basico': 'L1B',
        '1_medio': 'L1M',
        '1_avanzado': 'L1A',
        '2': 'L2',
        '3': 'L3',
        '4': 'L4'
    };
    
    return abreviaturas[nivel] || nivel.substring(0, 3).toUpperCase();
}

function getNivelBadgeColor(nivel) {
    if (!nivel || nivel === 'pendiente') return 'bg-red-600';
    
    const colores = {
        'baby_titans': 'bg-yellow-600',
        '1_basico': 'bg-blue-600',
        '1_medio': 'bg-blue-700',
        '1_avanzado': 'bg-blue-800',
        '2': 'bg-green-600',
        '3': 'bg-purple-600',
        '4': 'bg-red-600'
    };
    
    return colores[nivel] || 'bg-gray-600';
}

function getSiguienteNivel(nivelActual) {
    if (!nivelActual || nivelActual === 'pendiente') return 'baby_titans';
    
    const orden = ['baby_titans', '1_basico', '1_medio', '1_avanzado', '2', '3', '4'];
    const index = orden.indexOf(nivelActual);
    return index >= 0 && index < orden.length - 1 ? orden[index + 1] : null;
}

function getNombreEquipo(equipo) {
    const equipos = {
        'sin_equipo': 'Sin Equipo',
        'rocks_titans': 'Rocks Titans',
        'lightning_titans': 'Lightning Titans',
        'storm_titans': 'Storm Titans',
        'fire_titans': 'Fire Titans',
        'electric_titans': 'Electric Titans'
    };
    return equipos[equipo] || equipo;
}

function getTextoCalificacion(puntuacion) {
    if (puntuacion >= 5) return 'Excelente';
    if (puntuacion >= 4) return 'Bueno';
    if (puntuacion >= 3) return 'Regular';
    if (puntuacion >= 2) return 'Deficiente';
    if (puntuacion >= 1) return 'Malo';
    return 'SinCalificar';
}

function getClaseCalificacion(puntuacion) {
    if (puntuacion >= 5) return 'excelente';
    if (puntuacion >= 4) return 'bueno';
    if (puntuacion >= 3) return 'regular';
    if (puntuacion >= 2) return 'deficiente';
    if (puntuacion >= 1) return 'malo';
    return 'sincalificar';
}

// ===========================================
// MOSTRAR HABILIDADES
// ===========================================

function mostrarHabilidades() {
    const container = document.getElementById('listaHabilidades');
    if (!container) return;
    
    // Ya tenemos solo habilidades filtradas
    if (habilidades.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500 dark:text-gray-400">
                <span class="material-symbols-outlined text-4xl mb-4">info</span>
                <p class="text-lg font-semibold mb-2">No hay habilidades para evaluar</p>
                <p class="text-sm">Este nivel no tiene habilidades definidas</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = habilidades.map(habilidad => {
        const evaluacion = evaluacionActual.habilidades[habilidad.id] || { puntuacion: 0, observaciones: '' };
        const evaluacionPrevia = evaluacionesHistorial.find(e => e.habilidad_id === habilidad.id);
        
        let fechaFormateada = '';
        if (evaluacionPrevia && evaluacionPrevia.fecha_evaluacion) {
            try {
                fechaFormateada = EntrenadorAPI.formatFecha(evaluacionPrevia.fecha_evaluacion);
            } catch (e) {
                fechaFormateada = 'Fecha no disponible';
            }
        }
        
        return `
            <div class="evaluation-form fade-in mb-6">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div class="flex-1">
                        <h4 class="font-bold uppercase tracking-tight text-lg text-gray-800 dark:text-white mb-2">
                            ${escapeHTML(habilidad.nombre || 'Habilidad')}
                        </h4>
                        ${habilidad.descripcion ? `
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                                ${escapeHTML(habilidad.descripcion)}
                            </p>
                        ` : ''}
                    </div>
                    
                    ${evaluacionPrevia ? `
                        <div class="flex flex-col items-end gap-1 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                            <span class="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">
                                📊 Prev: ${evaluacionPrevia.puntuacion}/5 ⭐
                            </span>
                            ${fechaFormateada ? `
                                <span class="text-xs text-blue-500 dark:text-blue-300">${fechaFormateada}</span>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
                
                <div class="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-4">
                    <div class="rating-container">
                        <div class="rating-stars flex justify-center mb-4">
                            ${[1, 2, 3, 4, 5].map(puntuacion => `
                                <button onclick="calificarHabilidad('${habilidad.id}', ${puntuacion})" 
                                      class="rating-star-btn ${evaluacion.puntuacion >= puntuacion ? 'filled' : ''} p-1 hover:scale-110 transition-transform"
                                      title="${puntuacion} - ${getTextoCalificacion(puntuacion)}">
                                    <span class="material-symbols-outlined text-3xl">
                                        star
                                    </span>
                                </button>
                            `).join('')}
                        </div>
                        
                        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div class="calificacion-actual text-center">
                                <div class="flex items-baseline justify-center gap-1 mb-1">
                                    <span id="valor_${habilidad.id}" class="valor-puntuacion text-3xl font-bold ${getClaseCalificacion(evaluacion.puntuacion)}-text">
                                        ${evaluacion.puntuacion || 0}
                                    </span>
                                    <span class="max-puntuacion text-gray-500 dark:text-gray-400">/5</span>
                                </div>
                                <span id="texto_${habilidad.id}" class="text-sm font-semibold ${getClaseCalificacion(evaluacion.puntuacion)}-text">
                                    ${evaluacion.puntuacion ? getTextoCalificacion(evaluacion.puntuacion) : 'Sin calificar'}
                                </span>
                            </div>
                            
                            <span id="badge_${habilidad.id}" class="rating-badge ${getClaseCalificacion(evaluacion.puntuacion)} px-3 py-1">
                                ${evaluacion.puntuacion ? getTextoCalificacion(evaluacion.puntuacion) : 'Sin calificar'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="evaluation-group">
                    <label class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <span class="material-symbols-outlined text-base">notes</span>
                        Observaciones específicas
                    </label>
                    <textarea id="observaciones_${habilidad.id}" 
                              class="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
                              rows="3"
                              placeholder="Detalles sobre la ejecución, puntos fuertes, áreas de mejora..."
                              oninput="actualizarObservaciones('${habilidad.id}', this.value)">${evaluacion.observaciones || ''}</textarea>
                </div>
            </div>
        `;
    }).join('');
}

function calificarHabilidad(habilidadId, puntuacion) {
    if (puntuacion < 0 || puntuacion > 5) return;
    
    evaluacionActual.habilidades[habilidadId] = {
        ...(evaluacionActual.habilidades[habilidadId] || {}),
        puntuacion: parseInt(puntuacion),
        evaluacion_id: evaluacionActual.habilidades[habilidadId]?.evaluacion_id || null
    };
    
    const starButtons = document.querySelectorAll(`button[onclick*="calificarHabilidad('${habilidadId}'"]`);
    
    starButtons.forEach((button, index) => {
        const starNum = index + 1;
        const starIcon = button.querySelector('.material-symbols-outlined');
        
        if (starIcon) {
            if (starNum <= puntuacion) {
                button.classList.add('filled');
                starIcon.style.fontVariationSettings = "'FILL' 1";
                starIcon.style.color = '#F59E0B';
            } else {
                button.classList.remove('filled');
                starIcon.style.fontVariationSettings = "'FILL' 0";
                starIcon.style.color = '#E5E7EB';
            }
        }
    });
    
    const valorElement = document.getElementById(`valor_${habilidadId}`);
    if (valorElement) {
        valorElement.textContent = puntuacion;
        valorElement.className = `valor-puntuacion text-3xl font-bold ${getClaseCalificacion(puntuacion)}-text`;
    }
    
    const textoElement = document.getElementById(`texto_${habilidadId}`);
    if (textoElement) {
        textoElement.textContent = puntuacion > 0 ? getTextoCalificacion(puntuacion) : 'Sin calificar';
        textoElement.className = `text-sm font-semibold ${getClaseCalificacion(puntuacion)}-text`;
    }
    
    const badgeElement = document.getElementById(`badge_${habilidadId}`);
    if (badgeElement) {
        badgeElement.textContent = puntuacion > 0 ? getTextoCalificacion(puntuacion) : 'Sin calificar';
        badgeElement.className = `rating-badge ${getClaseCalificacion(puntuacion)} px-3 py-1`;
    }
    
    setTimeout(() => {
        calcularEstadisticas();
        calcularProgresoNivel();
        actualizarGraficas();
    }, 100);
}

function actualizarObservaciones(habilidadId, observaciones) {
    if (!evaluacionActual.habilidades[habilidadId]) {
        evaluacionActual.habilidades[habilidadId] = { puntuacion: 0, observaciones };
    } else {
        evaluacionActual.habilidades[habilidadId].observaciones = observaciones;
    }
}

async function guardarEvaluacion() {
    try {
        const btnGuardar = document.getElementById('btnGuardarEvaluacion');
        if (btnGuardar.disabled) return;
        
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> Guardando...';
        
        const obsGenerales = document.getElementById('observacionesGenerales');
        if (obsGenerales) {
            evaluacionActual.observaciones_generales = obsGenerales.value;
        }
        
        const habilidadesAEvaluar = Object.entries(evaluacionActual.habilidades)
            .filter(([_, datos]) => datos.puntuacion > 0);
        
        if (habilidadesAEvaluar.length === 0) {
            EntrenadorAPI.showNotification('⚠️ No hay habilidades calificadas para guardar', 'warning');
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = '<span class="material-symbols-outlined">save</span> Guardar Evaluación';
            return;
        }
        
        const promesas = [];
        const fechaActual = new Date().toISOString();
        
        for (const [habilidadId, datos] of habilidadesAEvaluar) {
            const habilidad = habilidades.find(h => h.id === habilidadId);
            const puntuacionMinima = habilidad?.puntuacion_minima || 3;
            
            const payload = {
                deportista_id: evaluacionActual.deportista_id,
                habilidad_id: habilidadId,
                entrenador_id: EntrenadorAPI.user?.id,
                puntuacion: parseInt(datos.puntuacion),
                observaciones: datos.observaciones || '',
                completado: datos.puntuacion >= puntuacionMinima,
                fecha_evaluacion: fechaActual
            };
            
            promesas.push(
                EntrenadorAPI.createEvaluacion(payload).catch(err => {
                    if (datos.evaluacion_id) {
                        return EntrenadorAPI.updateEvaluacion(datos.evaluacion_id, payload);
                    }
                    throw err;
                })
            );
        }
        
        await Promise.all(promesas);
        
        const mensaje = document.getElementById('mensajeGuardado');
        if (mensaje) {
            mensaje.classList.remove('hidden');
            setTimeout(() => mensaje.classList.add('hidden'), 3000);
        }
        
        EntrenadorAPI.showNotification('✅ Evaluación guardada exitosamente', 'success');
        
        const evaluacionesData = await EntrenadorAPI.getEvaluacionesDeportista(deportista.id);
        evaluacionesHistorial = evaluacionesData || [];
        
        const habilidadesIds = habilidades.map(h => h.id);
        evaluacionesHistorial = evaluacionesHistorial.filter(e => 
            habilidadesIds.includes(e.habilidad_id)
        );
        
        calcularEstadisticas();
        calcularProgresoNivel();
        actualizarGraficas();
        
    } catch (error) {
        console.error('❌ Error guardando evaluación:', error);
        EntrenadorAPI.showNotification(`Error: ${error.message}`, 'error');
    } finally {
        const btnGuardar = document.getElementById('btnGuardarEvaluacion');
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = '<span class="material-symbols-outlined">save</span> Guardar Evaluación';
        }
    }
}

function calcularProgresoNivel() {
    if (!habilidades || habilidades.length === 0) {
        actualizarProgresoUI(0, 0, 0);
        return;
    }
    
    let habilidadesCompletadas = 0;
    
    for (const habilidad of habilidades) {
        const evaluacion = evaluacionActual.habilidades[habilidad.id];
        const puntuacionMinima = habilidad.puntuacion_minima || 3;
        
        if (evaluacion && evaluacion.puntuacion >= puntuacionMinima) {
            habilidadesCompletadas++;
        }
    }
    
    const totalHabilidades = habilidades.length;
    let porcentaje = 0;
    
    if (totalHabilidades > 0) {
        porcentaje = Math.round((habilidadesCompletadas / totalHabilidades) * 100);
    }
    
    if (porcentaje > 100) porcentaje = 100;
    if (porcentaje < 0) porcentaje = 0;
    
    actualizarProgresoUI(porcentaje, habilidadesCompletadas, totalHabilidades);
}

function actualizarProgresoUI(porcentaje, completadas, total) {
    const barraProgreso = document.getElementById('barraProgresoNivel');
    if (barraProgreso) {
        barraProgreso.style.width = `${porcentaje}%`;
    }
    
    const porcentajeElement = document.getElementById('porcentajeNivel');
    if (porcentajeElement) {
        porcentajeElement.textContent = `${porcentaje}%`;
    }
    
    const habilidadesTexto = document.getElementById('habilidadesCompletadasTexto');
    if (habilidadesTexto) {
        habilidadesTexto.textContent = `${completadas} de ${total} habilidades completadas`;
    }
    
    const btnAvanzar = document.getElementById('btnAvanzarNivel');
    if (btnAvanzar) {
        const mostrarBoton = (porcentaje >= 100 && completadas === total);
        
        if (mostrarBoton) {
            btnAvanzar.style.display = 'flex';
            btnAvanzar.style.opacity = '1';
            btnAvanzar.disabled = false;
            btnAvanzar.classList.add('animate-pulse');
        } else {
            btnAvanzar.style.opacity = '0';
            btnAvanzar.disabled = true;
            btnAvanzar.classList.remove('animate-pulse');
            setTimeout(() => {
                if (btnAvanzar.style.opacity === '0') {
                    btnAvanzar.style.display = 'none';
                }
            }, 300);
        }
    }
}

// 🔥🔥🔥 FUNCIÓN CORREGIDA: Avanzar al siguiente nivel
async function avanzarAlSiguienteNivel() {
    try {
        console.log('🎯 Iniciando proceso de avance de nivel...');
        
        // Verificar que TODAS las habilidades estén completadas
        let habilidadesCompletadas = 0;
        for (const habilidad of habilidades) {
            const evaluacion = evaluacionActual.habilidades[habilidad.id];
            const puntuacionMinima = habilidad.puntuacion_minima || 3;
            
            if (evaluacion && evaluacion.puntuacion >= puntuacionMinima) {
                habilidadesCompletadas++;
            }
        }
        
        if (habilidadesCompletadas < habilidades.length) {
            EntrenadorAPI.showNotification('⚠️ El deportista no ha completado todas las habilidades', 'warning');
            return;
        }
        
        const nivelActual = deportista.nivel_actual;
        const siguienteNivel = getSiguienteNivel(nivelActual);
        
        if (!siguienteNivel) {
            EntrenadorAPI.showNotification('Este deportista ya está en el nivel máximo', 'warning');
            return;
        }
        
        const confirmar = confirm(
            `¿Estás seguro de avanzar a ${deportista.nombre} de "${getNivelNombreCompleto(nivelActual)}" a "${getNivelNombreCompleto(siguienteNivel)}"?\n\n` +
            `✅ El deportista ha completado ${habilidadesCompletadas}/${habilidades.length} habilidades.\n` +
            `🎯 En el nuevo nivel, el progreso empezará en 0%.`
        );
        
        if (!confirmar) return;
        
        console.log(`📤 Actualizando nivel de ${nivelActual} a ${siguienteNivel}...`);
        
        // 🔥 LLAMADA AL BACKEND PARA ACTUALIZAR EL NIVEL
        const response = await fetch(`${EntrenadorAPI.baseURL}/deportistas/${deportista.id}`, {
            method: 'PUT',
            headers: EntrenadorAPI.getHeaders(),
            body: JSON.stringify({
                nivel_actual: siguienteNivel
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Respuesta del servidor:', data);
        
        // Actualizar variable local
        deportista.nivel_actual = siguienteNivel;
        
        EntrenadorAPI.showNotification(
            `🎉 ¡${deportista.nombre} avanzó a ${getNivelNombreCompleto(siguienteNivel)}!`,
            'success'
        );
        
        console.log('🔄 Recargando página en 2 segundos...');
        
        // Recargar la página para mostrar el nuevo nivel (con progreso en 0%)
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error avanzando nivel:', error);
        EntrenadorAPI.showNotification(`Error: ${error.message}`, 'error');
    }
}

function calcularEstadisticas() {
    if (!deportista || !habilidades) return;
    
    const puntuaciones = [];
    const conteoPorPuntuacion = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    
    Object.values(evaluacionActual.habilidades).forEach(evalu => {
        const puntuacion = evalu.puntuacion || 0;
        puntuaciones.push(puntuacion);
        conteoPorPuntuacion[puntuacion] = (conteoPorPuntuacion[puntuacion] || 0) + 1;
    });
    
    const totalEvaluaciones = puntuaciones.filter(p => p > 0).length;
    const totalElement = document.getElementById('totalEvaluaciones');
    if (totalElement) {
        totalElement.textContent = totalEvaluaciones;
    }
    
    const puntuacionesPositivas = puntuaciones.filter(p => p > 0);
    const promedio = puntuacionesPositivas.length > 0 
        ? (puntuacionesPositivas.reduce((a, b) => a + b, 0) / puntuacionesPositivas.length).toFixed(1)
        : '0.0';
    
    const promedioElement = document.getElementById('promedioGeneral');
    if (promedioElement) {
        promedioElement.textContent = `${promedio} / 5.0`;
    }
    
    const total = puntuacionesPositivas.length;
    for (let i = 1; i <= 5; i++) {
        const countElement = document.getElementById(`count${getTextoCalificacion(i)}`);
        const progressElement = document.getElementById(`progress${getTextoCalificacion(i)}`);
        
        if (countElement && progressElement) {
            const count = conteoPorPuntuacion[i] || 0;
            const porcentaje = total > 0 ? (count / total * 100) : 0;
            
            countElement.textContent = count;
            progressElement.style.width = `${porcentaje}%`;
        }
    }
}

function inicializarGraficas() {
    const ctxRadar = document.getElementById('chartRadar');
    if (ctxRadar) {
        chartRadar = new Chart(ctxRadar.getContext('2d'), {
            type: 'radar',
            data: {
                labels: ['Técnica', 'Fuerza', 'Flexibilidad', 'Equilibrio', 'Consistencia', 'Velocidad'],
                datasets: [{
                    label: 'Evaluación Actual',
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(226, 27, 35, 0.2)',
                    borderColor: '#E21B23',
                    borderWidth: 2,
                    pointBackgroundColor: '#E21B23'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 5,
                        ticks: { stepSize: 1 }
                    }
                },
                plugins: { legend: { position: 'top' } }
            }
        });
    }
    
    actualizarGraficas();
}

function actualizarGraficas() {
    if (!chartRadar) return;
    
    const puntuacionesActuales = Object.values(evaluacionActual.habilidades)
        .map(e => e.puntuacion || 0)
        .filter(p => p > 0);
    
    const promedioActual = puntuacionesActuales.length > 0 
        ? puntuacionesActuales.reduce((a, b) => a + b, 0) / puntuacionesActuales.length
        : 0;
    
    const datosRadarActual = [
        promedioActual * 0.9,
        promedioActual * 1.1,
        promedioActual * 0.8,
        promedioActual,
        promedioActual * 1.2,
        promedioActual * 0.7
    ].map(v => Math.min(Math.max(v, 0), 5));
    
    chartRadar.data.datasets[0].data = datosRadarActual;
    chartRadar.update();
}

function volverASeleccion() {
    window.location.href = 'index.html';
}

function mostrarLoading(mostrar) {
    const container = document.getElementById('listaHabilidades');
    if (!container) return;
    
    if (mostrar) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p class="text-gray-500 dark:text-gray-400">Cargando habilidades...</p>
            </div>
        `;
    }
}

function mostrarError(mensaje) {
    const container = document.getElementById('listaHabilidades');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-12 text-red-600 dark:text-red-400">
                <span class="material-symbols-outlined text-4xl mb-4">error</span>
                <p class="text-lg font-semibold mb-2">Error</p>
                <p class="text-sm">${mensaje}</p>
                <button onclick="volverASeleccion()" 
                        class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Volver a selección
                </button>
            </div>
        `;
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    EntrenadorAPI.showNotification(`Modo ${isDark ? 'oscuro' : 'claro'} activado`, 'info');
}

function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        EntrenadorAPI.logout();
    }
}

function escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.calificarHabilidad = calificarHabilidad;
window.actualizarObservaciones = actualizarObservaciones;
window.guardarEvaluacion = guardarEvaluacion;
window.volverASeleccion = volverASeleccion;
window.avanzarAlSiguienteNivel = avanzarAlSiguienteNivel;
window.toggleTheme = toggleTheme;
window.logout = logout;

console.log('✅ Script de evaluación SOLO HABILIDADES cargado (Escala 1-5) - VERSIÓN CORREGIDA');