// ===================================
// DASHBOARD DEPORTISTA - JS
// Titanes Evolution
// ===================================

console.log('📂 Dashboard Deportista cargado');

// ===================================
// ESTADO GLOBAL
// ===================================
let deportistaData = null;
let evaluacionesData = [];

// ===================================
// INICIALIZACIÓN
// ===================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando Dashboard Deportista');
    
    // Verificar autenticación
    if (!DeportistaAPI.checkAuth()) {
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
        console.log('✅ Perfil cargado:', perfil);
        
        // 2. Cargar evaluaciones
        const evaluaciones = await DeportistaAPI.getEvaluaciones();
        evaluacionesData = evaluaciones;
        console.log(`✅ ${evaluaciones.length} evaluaciones cargadas`);
        
        // 3. Renderizar dashboard
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
    const evaluaciones = evaluacionesData;
    
    console.log('🎨 Renderizando dashboard...');
    
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
    
    // Actualizar stats cards
    actualizarPromedioGeneral(evaluaciones);
    actualizarTotalEvaluaciones(evaluaciones);
    actualizarNivelActual(nivelActual, evaluaciones);
    actualizarEquipoCompetitivo(equipoCompetitivo);
    
    // Actualizar info personal
    actualizarInformacionPersonal(estado, peso, altura);
    
    // Renderizar evaluaciones
    renderizarUltimasEvaluaciones(evaluaciones);
    
    // Actualizar progreso
    actualizarProgreso(evaluaciones);
    
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
    
    const suma = evaluaciones.reduce((acc, e) => acc + (e.puntuacion || 0), 0);
    const promedio = (suma / evaluaciones.length).toFixed(1);
    
    if (promedioEl) {
        promedioEl.textContent = promedio;
    }
    
    let texto = 'Necesita mejorar';
    if (promedio >= 9) texto = 'Sobresaliente';
    else if (promedio >= 8) texto = 'Excelente';
    else if (promedio >= 7) texto = 'Bueno';
    else if (promedio >= 6) texto = 'Aceptable';
    
    if (promedioTextoEl) {
        promedioTextoEl.textContent = texto;
    }
}

function actualizarTotalEvaluaciones(evaluaciones) {
    const totalEl = document.getElementById('totalEvaluaciones');
    const completadasEl = document.getElementById('evaluacionesCompletadas');
    
    const total = evaluaciones.length;
    const completadas = evaluaciones.filter(e => e.completado).length;
    
    if (totalEl) {
        totalEl.textContent = total;
    }
    
    if (completadasEl) {
        completadasEl.textContent = `${completadas} completadas`;
    }
}

function actualizarNivelActual(nivel, evaluaciones) {
    const nivelEl = document.getElementById('nivelActual');
    const nivelSubtituloEl = document.getElementById('nivelSubtitulo');
    
    const nivelNombre = DeportistaAPI.formatNivel(nivel);
    
    if (nivelEl) {
        nivelEl.textContent = nivelNombre;
    }
    
    // Calcular progreso en el nivel
    const completadas = evaluaciones.filter(e => e.completado).length;
    const total = evaluaciones.length;
    const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
    
    if (nivelSubtituloEl) {
        nivelSubtituloEl.textContent = total > 0 ? `${porcentaje}% completado` : 'Sin evaluaciones';
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
// RENDERIZADO DE EVALUACIONES
// ===================================
function renderizarUltimasEvaluaciones(evaluaciones) {
    const container = document.getElementById('ultimasEvaluaciones');
    
    if (!container) {
        console.warn('⚠️ Contenedor ultimasEvaluaciones no encontrado');
        return;
    }
    
    if (!evaluaciones || evaluaciones.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <span class="material-symbols-outlined text-5xl mb-2">assignment</span>
                <p>No tienes evaluaciones registradas aún</p>
                <p class="text-xs mt-2">Tu entrenador registrará aquí tus evaluaciones</p>
            </div>
        `;
        return;
    }
    
    // Tomar las últimas 3 evaluaciones
    const ultimas = evaluaciones.slice(0, 3);
    
    container.innerHTML = ultimas.map(evaluacion => {
        const habilidad = evaluacion.habilidad || evaluacion.Habilidad || {};
        const completado = evaluacion.completado;
        const puntuacion = evaluacion.puntuacion || 0;
        const fecha = evaluacion.fecha_evaluacion ? 
            DeportistaAPI.formatFecha(evaluacion.fecha_evaluacion) : 'Sin fecha';
        
        const iconoCategoria = habilidad.categoria === 'habilidad' ? 'sports_gymnastics' :
                               habilidad.categoria === 'ejercicio_accesorio' ? 'fitness_center' :
                               'accessibility';
        
        const estadoBg = completado ? 'border-green-500' : 'border-yellow-500';
        const estadoBadge = completado ? 
            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        
        return `
            <div class="bg-white dark:bg-zinc-900 p-4 border-l-4 ${estadoBg} flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-center gap-4">
                    <div class="bg-gray-100 dark:bg-black/20 p-3 rounded flex items-center justify-center">
                        <span class="material-symbols-outlined text-primary text-2xl">${iconoCategoria}</span>
                    </div>
                    <div>
                        <h5 class="font-bold text-gray-800 dark:text-white">${habilidad.nombre || 'Habilidad'}</h5>
                        <p class="text-xs text-gray-500 uppercase tracking-widest font-semibold mt-1">
                            📅 ${fecha}
                        </p>
                    </div>
                </div>
                <div class="text-right flex items-center gap-3">
                    <div>
                        <div class="text-3xl font-display font-bold text-primary">${puntuacion}</div>
                        <div class="text-xs text-gray-500">de 10</div>
                    </div>
                    <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase ${estadoBadge}">
                        ${completado ? '✅ Aprobada' : '🔄 Pendiente'}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// ===================================
// ACTUALIZACIÓN DE PROGRESO
// ===================================
function actualizarProgreso(evaluaciones) {
    const porcentajeEl = document.getElementById('porcentajeProgreso');
    const barraEl = document.getElementById('barraProgreso');
    const mensajeEl = document.getElementById('mensajeMotivacion');
    
    if (!evaluaciones || evaluaciones.length === 0) {
        if (porcentajeEl) porcentajeEl.textContent = '0%';
        if (barraEl) barraEl.style.width = '0%';
        return;
    }
    
    const completadas = evaluaciones.filter(e => e.completado).length;
    const total = evaluaciones.length;
    const porcentaje = Math.round((completadas / total) * 100);
    
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
    
    // Actualizar texto del botón
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

console.log('✅ Dashboard Deportista JS inicializado');