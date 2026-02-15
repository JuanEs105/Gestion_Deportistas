// ===================================
// DASHBOARD DEPORTISTA - VERSIÓN CORREGIDA
// Titanes Evolution
// MUESTRA PROGRESO REAL: Total habilidades del nivel vs evaluadas
// ===================================

console.log('📂 Dashboard Deportista CORREGIDO cargado');

// ===================================
// ESTADO GLOBAL
// ===================================
let deportistaData = null;
let habilidadesTotalesDelNivel = []; // TODAS las habilidades del nivel (sin filtrar)
let evaluacionesDelNivel = []; // Evaluaciones del deportista en ese nivel
let chartEvolucion = null;
let tabActualAnalisis = 'mejores';

// ===================================
// INICIALIZACIÓN
// ===================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando Dashboard Deportista CORREGIDO');
    
    // Verificar autenticación
    const autenticado = await DeportistaAPI.checkAuth();
    if (!autenticado) {
        return;
    }
    
    // Configurar event listeners
    configurarEventListeners();
    
    // Cargar tema guardado
    cargarTema();
    
    // Cargar datos
    await cargarDashboard();
});

// ===================================
// CONFIGURACIÓN DE EVENT LISTENERS
// ===================================
function configurarEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Deseas cerrar sesión?')) {
                DeportistaAPI.logout();
            }
        });
    }
    
    // Toggle tema
    const toggleThemeBtn = document.getElementById('toggleTheme');
    if (toggleThemeBtn) {
        toggleThemeBtn.addEventListener('click', toggleTheme);
    }
}

// ===================================
// CARGA DE DATOS
// ===================================
async function cargarDashboard() {
    try {
        mostrarEstadoCarga(true);
        ocultarError();
        
        console.log('📥 Cargando datos del dashboard...');
        
        // 1. Cargar perfil
        const perfil = await DeportistaAPI.getMe();
        if (!perfil) {
            throw new Error('No se pudo cargar tu perfil');
        }
        
        deportistaData = perfil;
        const nivelActual = perfil.nivel_actual;
        console.log('✅ Perfil cargado:', perfil.nombre || perfil.user?.nombre, '| Nivel actual:', nivelActual);
        
        // 2. Cargar TODAS las habilidades del nivel actual
        console.log(`📚 Obteniendo TODAS las habilidades del nivel ${nivelActual}...`);
        
        const habilidadesResponse = await fetch(`${DeportistaAPI.baseURL}/habilidades/nivel/${nivelActual}`, {
            headers: DeportistaAPI.getHeaders()
        });
        
        if (!habilidadesResponse.ok) {
            throw new Error('No se pudieron cargar las habilidades del nivel');
        }
        
        const habilidadesData = await habilidadesResponse.json();
        const todasLasHabilidades = habilidadesData.habilidades || habilidadesData || [];
        
        // Filtrar solo habilidades (categoría = 'habilidad')
        habilidadesTotalesDelNivel = todasLasHabilidades.filter(h => h.categoria === 'habilidad');
        
        console.log(`📊 Total de habilidades en el nivel ${nivelActual}: ${habilidadesTotalesDelNivel.length}`);
        console.log('   Habilidades:', habilidadesTotalesDelNivel.map(h => h.nombre).join(', '));
        
        // 3. Cargar TODAS las evaluaciones del deportista
        const todasEvaluaciones = await DeportistaAPI.getEvaluaciones();
        console.log(`📋 Total evaluaciones del deportista: ${todasEvaluaciones.length}`);
        
        // 4. Filtrar evaluaciones del nivel actual
        evaluacionesDelNivel = todasEvaluaciones.filter(e => {
            const habilidad = e.habilidad || e.Habilidad || {};
            return habilidad.nivel === nivelActual && habilidad.categoria === 'habilidad';
        });
        
        console.log(`🎯 Evaluaciones del nivel ${nivelActual}: ${evaluacionesDelNivel.length}`);
        console.log('   Evaluadas:', evaluacionesDelNivel.map(e => e.habilidad?.nombre).join(', '));
        
        // 5. Renderizar dashboard CON DATOS CORRECTOS
        renderizarDashboard();
        
        mostrarEstadoCarga(false);
        mostrarContenido(true);
        
    } catch (error) {
        console.error('❌ Error cargando dashboard:', error);
        mostrarError(error.message || 'Error al cargar datos');
        mostrarEstadoCarga(false);
    }
}

// ===================================
// RENDERIZADO
// ===================================
function renderizarDashboard() {
    const deportista = deportistaData;
    
    console.log('🎨 Renderizando dashboard...');
    console.log(`📊 Total habilidades del nivel: ${habilidadesTotalesDelNivel.length}`);
    console.log(`📊 Evaluaciones realizadas: ${evaluacionesDelNivel.length}`);
    
    // Datos del perfil
    const user = deportista.user || {};
    const nombre = user.nombre || deportista.nombre || 'Deportista';
    const nivelActual = deportista.nivel_actual || 'pendiente';
    const estado = deportista.estado || 'activo';
    const equipoCompetitivo = deportista.equipo_competitivo || 'sin_equipo';
    const peso = deportista.peso;
    const altura = deportista.altura;
    
    // Actualizar sidebar
    actualizarSidebar(nombre);
    
    // Actualizar stats cards (CON CÁLCULO CORRECTO)
    actualizarPromedioGeneral(evaluacionesDelNivel);
    actualizarTotalEvaluaciones(evaluacionesDelNivel, habilidadesTotalesDelNivel.length);
    actualizarNivelActual(nivelActual, evaluacionesDelNivel, habilidadesTotalesDelNivel.length);
    actualizarEquipoCompetitivo(equipoCompetitivo);
    
    // Actualizar info personal
    actualizarInformacionPersonal(estado, peso, altura);
    
    // Renderizar análisis de evaluaciones
    renderizarAnalisisEvaluaciones(evaluacionesDelNivel);
    
    // Renderizar gráfico de evolución
    renderizarGraficoEvolucion(evaluacionesDelNivel);
    
    // Actualizar progreso (CON CÁLCULO CORRECTO)
    actualizarProgreso(evaluacionesDelNivel, habilidadesTotalesDelNivel.length);
    
    console.log('✅ Dashboard renderizado correctamente');
}

// ===================================
// ACTUALIZACIÓN DE STATS
// ===================================
function actualizarSidebar(nombre) {
    const profileNameEl = document.getElementById('profileName');
    const profileInitialEl = document.getElementById('profileInitial');
    
    if (profileNameEl) {
        profileNameEl.textContent = nombre;
    }
    
    if (profileInitialEl) {
        profileInitialEl.textContent = nombre.charAt(0).toUpperCase();
    }
    
    // Si hay foto de perfil, mostrarla
    const foto = deportistaData?.foto_perfil;
    if (foto) {
        const avatarContainer = document.getElementById('profileAvatarContainer');
        if (avatarContainer) {
            avatarContainer.innerHTML = `
                <img src="${foto}" alt="${nombre}" class="w-full h-full object-cover">
            `;
        }
    }
}

function actualizarPromedioGeneral(evaluaciones) {
    const promedioEl = document.getElementById('promedioGeneral');
    const promedioTextoEl = document.getElementById('promedioTexto');
    
    if (!evaluaciones || evaluaciones.length === 0) {
        if (promedioEl) promedioEl.textContent = '0.0';
        if (promedioTextoEl) promedioTextoEl.textContent = 'Sin evaluaciones';
        return;
    }
    
    // Calcular promedio de las evaluaciones realizadas
    const suma = evaluaciones.reduce((acc, e) => acc + (e.puntuacion || 0), 0);
    const promedio = (suma / evaluaciones.length).toFixed(1);
    
    if (promedioEl) {
        promedioEl.textContent = promedio;
    }
    
    let texto = 'Necesita mejorar';
    if (promedio >= 4.5) texto = 'Sobresaliente';
    else if (promedio >= 4) texto = 'Excelente';
    else if (promedio >= 3) texto = 'Bueno';
    else if (promedio >= 2) texto = 'Regular';
    
    if (promedioTextoEl) {
        promedioTextoEl.textContent = texto;
    }
}

function actualizarTotalEvaluaciones(evaluaciones, totalHabilidades) {
    const totalEl = document.getElementById('totalEvaluaciones');
    const completadasEl = document.getElementById('evaluacionesCompletadas');
    
    const evaluadas = evaluaciones.length;
    const completadas = evaluaciones.filter(e => e.completado).length;
    
    console.log(`📊 STATS: ${evaluadas} evaluadas de ${totalHabilidades} totales | ${completadas} completadas`);
    
    if (totalEl) {
        totalEl.textContent = evaluadas;
    }
    
    if (completadasEl) {
        completadasEl.textContent = `${completadas} completadas de ${totalHabilidades} totales`;
    }
}

function actualizarNivelActual(nivel, evaluaciones, totalHabilidades) {
    const nivelEl = document.getElementById('nivelActual');
    const nivelSubtituloEl = document.getElementById('nivelSubtitulo');
    
    const nivelNombre = DeportistaAPI.formatNivel(nivel);
    
    if (nivelEl) {
        nivelEl.textContent = nivelNombre;
    }
    
    // Calcular progreso en el nivel
    const completadas = evaluaciones.filter(e => e.completado).length;
    const porcentaje = totalHabilidades > 0 ? Math.round((completadas / totalHabilidades) * 100) : 0;
    
    console.log(`📊 NIVEL: ${completadas}/${totalHabilidades} = ${porcentaje}%`);
    
    if (nivelSubtituloEl) {
        nivelSubtituloEl.textContent = totalHabilidades > 0 
            ? `${porcentaje}% completado (${completadas}/${totalHabilidades})`
            : 'Sin habilidades en este nivel';
    }
}

function actualizarEquipoCompetitivo(equipo) {
    const equipoEl = document.getElementById('equipoNombre');
    
    const nombreEquipo = DeportistaAPI.formatEquipo(equipo);
    
    if (equipoEl) {
        equipoEl.textContent = nombreEquipo;
    }
}

function actualizarInformacionPersonal(estado, peso, altura) {
    const estadoEl = document.getElementById('estadoDeportista');
    const pesoEl = document.getElementById('pesoDeportista');
    const alturaEl = document.getElementById('alturaDeportista');
    const imcEl = document.getElementById('imcDeportista');
    
    // Estado
    const estadoTexto = DeportistaAPI.formatEstado(estado);
    if (estadoEl) {
        estadoEl.innerHTML = `<span class="badge-estado ${estado}">${estadoTexto}</span>`;
    }
    
    // Peso y Altura
    if (pesoEl) {
        pesoEl.textContent = peso ? `${peso} kg` : 'No registrado';
    }
    
    if (alturaEl) {
        alturaEl.textContent = altura ? `${altura} m` : 'No registrado';
    }
    
    // IMC
    const imc = DeportistaAPI.calcularIMC(peso, altura);
    if (imcEl) {
        if (imc) {
            let clasificacion = '';
            const imcNum = parseFloat(imc);
            
            if (imcNum < 18.5) clasificacion = 'Bajo peso';
            else if (imcNum < 25) clasificacion = 'Normal';
            else if (imcNum < 30) clasificacion = 'Sobrepeso';
            else clasificacion = 'Obesidad';
            
            imcEl.innerHTML = `${imc} <span class="text-xs text-gray-500">(${clasificacion})</span>`;
        } else {
            imcEl.textContent = 'No disponible';
        }
    }
}

// ===================================
// ANÁLISIS DE EVALUACIONES
// ===================================
function renderizarAnalisisEvaluaciones(evaluaciones) {
    console.log('📊 Renderizando análisis de evaluaciones...');
    console.log(`📍 Evaluaciones realizadas: ${evaluaciones.length}`);
    
    if (!evaluaciones || evaluaciones.length === 0) {
        renderizarSinEvaluaciones('mejores');
        renderizarSinEvaluaciones('mejorar');
        renderizarSinEvaluaciones('recientes');
        return;
    }
    
    // Renderizar cada tab
    renderizarMejoresEvaluaciones(evaluaciones);
    renderizarEvaluacionesPorMejorar(evaluaciones);
    renderizarEvaluacionesRecientes(evaluaciones);
}

function renderizarMejoresEvaluaciones(evaluaciones) {
    const container = document.getElementById('contenidoMejores');
    if (!container) return;
    
    // Ordenar por puntuación descendente y tomar las 5 mejores
    const mejores = [...evaluaciones]
        .sort((a, b) => (b.puntuacion || 0) - (a.puntuacion || 0))
        .slice(0, 5);
    
    if (mejores.length === 0) {
        container.innerHTML = renderizarSinEvaluaciones('mejores');
        return;
    }
    
    container.innerHTML = mejores.map((evaluacion, index) => {
        return generarCardEvaluacion(evaluacion, index + 1, 'mejor');
    }).join('');
}

function renderizarEvaluacionesPorMejorar(evaluaciones) {
    const container = document.getElementById('contenidoMejorar');
    if (!container) return;
    
    // Ordenar por puntuación ascendente (las más bajas)
    const porMejorar = [...evaluaciones]
        .filter(e => e.puntuacion < 3) // Solo las que necesitan mejora
        .sort((a, b) => (a.puntuacion || 0) - (b.puntuacion || 0))
        .slice(0, 5);
    
    if (porMejorar.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <span class="material-symbols-outlined text-6xl text-green-500 mb-4">task_alt</span>
                <h4 class="font-bold text-lg text-gray-700 dark:text-gray-300 mb-2">
                    ¡Excelente trabajo!
                </h4>
                <p class="text-gray-500 dark:text-gray-400">
                    No tienes habilidades que necesiten mejora inmediata
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = porMejorar.map((evaluacion, index) => {
        return generarCardEvaluacion(evaluacion, index + 1, 'mejorar');
    }).join('');
}

function renderizarEvaluacionesRecientes(evaluaciones) {
    const container = document.getElementById('contenidoRecientes');
    if (!container) return;
    
    // Ordenar por fecha descendente y tomar las 5 más recientes
    const recientes = [...evaluaciones]
        .sort((a, b) => {
            const fechaA = new Date(a.fecha_evaluacion || 0);
            const fechaB = new Date(b.fecha_evaluacion || 0);
            return fechaB - fechaA;
        })
        .slice(0, 5);
    
    if (recientes.length === 0) {
        container.innerHTML = renderizarSinEvaluaciones('recientes');
        return;
    }
    
    container.innerHTML = recientes.map((evaluacion, index) => {
        return generarCardEvaluacion(evaluacion, index + 1, 'reciente');
    }).join('');
}

function generarCardEvaluacion(evaluacion, posicion, tipo) {
    const habilidad = evaluacion.habilidad || evaluacion.Habilidad || {};
    const puntuacion = evaluacion.puntuacion || 0;
    const fecha = evaluacion.fecha_evaluacion ? 
        DeportistaAPI.formatFecha(evaluacion.fecha_evaluacion) : 'Sin fecha';
    const completado = evaluacion.completado;
    
    const iconoCategoria = 'sports_gymnastics';
    
    // Colores según puntuación (escala 1-5)
    let colorPuntuacion = 'text-red-600 dark:text-red-400';
    let bgPuntuacion = 'bg-red-100 dark:bg-red-900/30';
    
    if (puntuacion >= 4.5) {
        colorPuntuacion = 'text-green-600 dark:text-green-400';
        bgPuntuacion = 'bg-green-100 dark:bg-green-900/30';
    } else if (puntuacion >= 4) {
        colorPuntuacion = 'text-blue-600 dark:text-blue-400';
        bgPuntuacion = 'bg-blue-100 dark:bg-blue-900/30';
    } else if (puntuacion >= 3) {
        colorPuntuacion = 'text-yellow-600 dark:text-yellow-400';
        bgPuntuacion = 'bg-yellow-100 dark:bg-yellow-900/30';
    } else if (puntuacion >= 2) {
        colorPuntuacion = 'text-orange-600 dark:text-orange-400';
        bgPuntuacion = 'bg-orange-100 dark:bg-orange-900/30';
    }
    
    const iconoPosicion = tipo === 'mejor' ? '🏆' : 
                          tipo === 'mejorar' ? '⚠️' : '🕐';
    
    const borderColor = tipo === 'mejor' ? 'border-green-500' : 
                        tipo === 'mejorar' ? 'border-red-500' : 
                        'border-blue-500';
    
    return `
        <div class="bg-white dark:bg-zinc-900 p-4 border-l-4 ${borderColor} flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center gap-4 flex-1">
                <div class="flex items-center gap-2">
                    <span class="text-2xl">${iconoPosicion}</span>
                    <span class="text-xs font-bold text-gray-400">#${posicion}</span>
                </div>
                <div class="bg-gray-100 dark:bg-black/20 p-3 rounded flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary text-2xl">${iconoCategoria}</span>
                </div>
                <div class="flex-1">
                    <h5 class="font-bold text-gray-800 dark:text-white mb-1">${habilidad.nombre || 'Habilidad'}</h5>
                    <p class="text-xs text-gray-500 uppercase tracking-widest font-semibold">
                        📅 ${fecha}
                    </p>
                </div>
            </div>
            <div class="text-right flex items-center gap-3">
                <div class="text-center">
                    <div class="text-3xl font-display font-bold ${colorPuntuacion}">${puntuacion}</div>
                    <div class="text-xs text-gray-500">de 5</div>
                </div>
                <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase ${bgPuntuacion} ${colorPuntuacion}">
                    ${completado ? '✅' : '🔄'}
                </span>
            </div>
        </div>
    `;
}

function renderizarSinEvaluaciones(tipo) {
    const iconos = {
        'mejores': 'grade',
        'mejorar': 'trending_down',
        'recientes': 'history'
    };
    
    const mensajes = {
        'mejores': 'No tienes evaluaciones registradas',
        'mejorar': 'No hay evaluaciones por mejorar',
        'recientes': 'No tienes evaluaciones recientes'
    };
    
    return `
        <div class="text-center py-12 text-gray-400">
            <span class="material-symbols-outlined text-5xl mb-2">${iconos[tipo]}</span>
            <p>${mensajes[tipo]}</p>
            <p class="text-xs mt-2">Tu entrenador registrará aquí tus evaluaciones</p>
        </div>
    `;
}

// ===================================
// CAMBIAR TAB DE ANÁLISIS
// ===================================
function cambiarTabAnalisis(tab) {
    console.log(`📑 Cambiando a tab: ${tab}`);
    
    tabActualAnalisis = tab;
    
    // Actualizar botones
    const tabs = {
        'mejores': document.getElementById('tabMejores'),
        'mejorar': document.getElementById('tabMejorar'),
        'recientes': document.getElementById('tabRecientes')
    };
    
    const contenidos = {
        'mejores': document.getElementById('contenidoMejores'),
        'mejorar': document.getElementById('contenidoMejorar'),
        'recientes': document.getElementById('contenidoRecientes')
    };
    
    // Resetear todos los tabs
    Object.keys(tabs).forEach(key => {
        const tabBtn = tabs[key];
        const contenido = contenidos[key];
        
        if (tabBtn) {
            if (key === tab) {
                tabBtn.classList.add('border-primary', 'text-primary', 'bg-primary/5');
                tabBtn.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
            } else {
                tabBtn.classList.remove('border-primary', 'text-primary', 'bg-primary/5');
                tabBtn.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
            }
        }
        
        if (contenido) {
            contenido.classList.toggle('hidden', key !== tab);
        }
    });
}

// ===================================
// GRÁFICO DE EVOLUCIÓN
// ===================================
function renderizarGraficoEvolucion(evaluaciones) {
    const canvas = document.getElementById('chartEvolucion');
    if (!canvas) return;
    
    if (!evaluaciones || evaluaciones.length === 0) {
        canvas.parentElement.innerHTML = `
            <div class="text-center py-12 text-gray-400">
                <span class="material-symbols-outlined text-5xl mb-2">show_chart</span>
                <p>No hay datos suficientes para mostrar el gráfico</p>
                <p class="text-xs mt-2">Las evaluaciones aparecerán aquí</p>
            </div>
        `;
        return;
    }
    
    // Ordenar evaluaciones por fecha
    const evaluacionesOrdenadas = [...evaluaciones].sort((a, b) => {
        const fechaA = new Date(a.fecha_evaluacion || 0);
        const fechaB = new Date(b.fecha_evaluacion || 0);
        return fechaA - fechaB;
    });
    
    // Preparar datos para el gráfico
    const labels = evaluacionesOrdenadas.map(e => {
        const habilidad = e.habilidad || e.Habilidad || {};
        return habilidad.nombre || 'Habilidad';
    });
    
    const puntuaciones = evaluacionesOrdenadas.map(e => e.puntuacion || 0);
    
    // Destruir gráfico anterior si existe
    if (chartEvolucion) {
        chartEvolucion.destroy();
    }
    
    // Crear nuevo gráfico
    const ctx = canvas.getContext('2d');
    chartEvolucion = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Puntuación',
                data: puntuaciones,
                borderColor: '#E21B23',
                backgroundColor: 'rgba(226, 27, 35, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#E21B23',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Montserrat',
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        family: 'Oswald',
                        size: 14
                    },
                    bodyFont: {
                        family: 'Montserrat',
                        size: 12
                    },
                    padding: 12,
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        font: {
                            family: 'Montserrat',
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Montserrat',
                            size: 10
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
}

// ===================================
// ACTUALIZACIÓN DE PROGRESO (CORRECTO)
// ===================================
function actualizarProgreso(evaluaciones, totalHabilidades) {
    const porcentajeEl = document.getElementById('porcentajeProgreso');
    const barraEl = document.getElementById('barraProgreso');
    const mensajeEl = document.getElementById('mensajeMotivacion');
    
    if (!evaluaciones || evaluaciones.length === 0 || totalHabilidades === 0) {
        if (porcentajeEl) porcentajeEl.textContent = '0%';
        if (barraEl) barraEl.style.width = '0%';
        if (mensajeEl) {
            mensajeEl.textContent = '"Tu viaje está por comenzar. ¡Dale con todo!"';
        }
        console.log('📊 PROGRESO: 0% (0 completadas de 0 totales)');
        return;
    }
    
    const completadas = evaluaciones.filter(e => e.completado).length;
    const porcentaje = Math.round((completadas / totalHabilidades) * 100);
    
    console.log(`📊 PROGRESO CALCULADO: ${completadas}/${totalHabilidades} = ${porcentaje}%`);
    
    if (porcentajeEl) {
        porcentajeEl.textContent = `${porcentaje}%`;
    }
    
    if (barraEl) {
        barraEl.style.width = `${porcentaje}%`;
    }
    
    // Mensaje motivacional
    let mensaje = '"La disciplina es el puente entre las metas y el logro. ¡Sigue así!"';
    
    if (porcentaje >= 90) {
        mensaje = '"¡Increíble! Estás muy cerca de dominar tu nivel. ¡No te detengas!"';
    } else if (porcentaje >= 70) {
        mensaje = '"¡Excelente progreso! Mantén el ritmo y llegarás lejos."';
    } else if (porcentaje >= 50) {
        mensaje = '"Vas por buen camino. La constancia es la clave del éxito."';
    } else if (porcentaje >= 30) {
        mensaje = '"Cada paso cuenta. ¡Sigue trabajando con dedicación!"';
    } else if (porcentaje > 0) {
        mensaje = '"Todo campeón empezó desde cero. ¡Tú puedes lograrlo!"';
    } else {
        mensaje = '"Tu viaje está por comenzar. ¡Dale con todo!"';
    }
    
    if (mensajeEl) {
        mensajeEl.textContent = mensaje;
    }
}

// ===================================
// ESTADOS DE UI
// ===================================
function mostrarEstadoCarga(mostrar) {
    const loadingEl = document.getElementById('loadingState');
    if (loadingEl) {
        loadingEl.classList.toggle('hidden', !mostrar);
    }
}

function mostrarContenido(mostrar) {
    const contentEl = document.getElementById('mainContent');
    if (contentEl) {
        contentEl.classList.toggle('hidden', !mostrar);
    }
}

function mostrarError(mensaje) {
    const errorEl = document.getElementById('errorState');
    const messageEl = document.getElementById('errorMessage');
    
    if (errorEl && messageEl) {
        messageEl.textContent = mensaje;
        errorEl.classList.remove('hidden');
    }
}

function ocultarError() {
    const errorEl = document.getElementById('errorState');
    if (errorEl) {
        errorEl.classList.add('hidden');
    }
}

// ===================================
// TEMA
// ===================================
function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    const btnText = document.querySelector('#toggleTheme .font-semibold');
    if (btnText) {
        btnText.textContent = isDark ? 'Modo Claro' : 'Modo Oscuro';
    }
}

function cargarTema() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        const btnText = document.querySelector('#toggleTheme .font-semibold');
        if (btnText) {
            btnText.textContent = 'Modo Claro';
        }
    }
}

// ===================================
// EXPORTAR FUNCIONES GLOBALES
// ===================================
window.cambiarTabAnalisis = cambiarTabAnalisis;

console.log('✅ Dashboard Deportista JS CORREGIDO - Muestra total real de habilidades');