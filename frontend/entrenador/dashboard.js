// ===================================
// DASHBOARD ENTRENADOR - VERSIÓN CORREGIDA
// Titanes Evolution
// ===================================

console.log('🚀 Inicializando Dashboard Entrenador CORREGIDO');

const API = window.EntrenadorAPI;

// Alias para compatibilidad
const getUserData = () => API.user;
const formatNivel = (nivel) => API.formatNivel(nivel);
const formatFecha = (fecha) => API.formatFecha(fecha);
const formatHora = (fecha) => API.formatHora(fecha);

// ===================================
// VERIFICACIÓN DE AUTENTICACIÓN
// ===================================
const verificarAutenticacion = () => {
    return API.checkAuth();
};

// ===================================
// CARGAR PERFIL DEL ENTRENADOR
// ===================================
const cargarPerfilEntrenador = () => {
    const user = getUserData();
    if (!user) return;
    
    document.getElementById('coachName').textContent = user.nombre || 'Entrenador';
    
    const avatar = document.getElementById('coachAvatar');
    if (avatar) {
        avatar.src = user.foto_perfil || 'https://via.placeholder.com/100';
    }
};

// ===================================
// CARGAR NIVELES ASIGNADOS
// ===================================
const cargarNivelesAsignados = () => {
    const user = getUserData();
    const container = document.getElementById('nivelesAsignados');
    
    if (!container) return;
    
    const niveles = user?.niveles_asignados || [];
    
    if (niveles.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No hay niveles asignados</p>';
        return;
    }
    
    container.innerHTML = niveles.map(nivel => `
        <span class="nivel-badge-pill">${formatNivel(nivel)}</span>
    `).join('');
};

// ===================================
// CARGAR ESTADÍSTICAS
// ===================================
const cargarEstadisticas = async () => {
    try {
        console.log('📊 Cargando estadísticas...');
        
        // 1. OBTENER DEPORTISTAS
        let deportistas = [];
        
        try {
            const response = await fetch(`${API.baseURL}/deportistas`, {
                method: 'GET',
                headers: API.getHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                deportistas = data.deportistas || data || [];
                console.log(`✅ Obtenidos ${deportistas.length} deportistas`);
            } else {
                console.warn('⚠️ Usando API.getDeportistas()');
                deportistas = await API.getDeportistas();
            }
        } catch (error) {
            console.error('❌ Error obteniendo deportistas:', error);
        }
        
        // 2. OBTENER EVALUACIONES
        let evaluacionesRealizadas = 0;
        
        try {
            const evaluacionesData = await API.getEvaluaciones();
            evaluacionesRealizadas = evaluacionesData.length || 0;
            console.log(`✅ Evaluaciones realizadas: ${evaluacionesRealizadas}`);
        } catch (error) {
            console.warn('⚠️ No se pudieron obtener evaluaciones');
        }
        
        // Evalua deportistas pendientes (simplificado)
        const evaluacionesPendientes = Math.max(0, deportistas.length - evaluacionesRealizadas);
        
        // 3. ACTUALIZAR UI
        const totalEl = document.getElementById('totalDeportistas');
        const pendientesEl = document.getElementById('evaluacionesPendientes');
        const realizadasEl = document.getElementById('evaluacionesRealizadas');
        
        if (totalEl) totalEl.textContent = deportistas.length;
        if (pendientesEl) pendientesEl.textContent = evaluacionesPendientes;
        if (realizadasEl) realizadasEl.textContent = evaluacionesRealizadas;
        
        console.log('📈 Estadísticas actualizadas');
        
        return deportistas;
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        return [];
    }
};

// ===================================
// CARGAR PRÓXIMO ENTRENAMIENTO
// ===================================
const cargarProximoEntrenamiento = async () => {
    const proximoEl = document.getElementById('proximoEntrenamiento');
    const nivelEl = document.getElementById('nivelProximoEntrenamiento');
    
    if (!proximoEl || !nivelEl) return;
    
    try {
        const eventos = await API.getEventosCalendario();
        
        const ahora = new Date();
        const proximosEventos = eventos
            .filter(e => new Date(e.fecha_evento) > ahora)
            .sort((a, b) => new Date(a.fecha_evento) - new Date(b.fecha_evento));
        
        if (proximosEventos.length > 0) {
            const proximo = proximosEventos[0];
            const fecha = new Date(proximo.fecha_evento);
            
            const esHoy = fecha.toDateString() === ahora.toDateString();
            const texto = esHoy ? `Hoy, ${formatHora(proximo.fecha_evento)}` : formatFecha(proximo.fecha_evento);
            
            proximoEl.textContent = texto;
            nivelEl.textContent = formatNivel(proximo.nivel) || 'Evento General';
        } else {
            proximoEl.textContent = 'Sin eventos';
            nivelEl.textContent = 'próximos';
        }
    } catch (error) {
        console.error('Error cargando próximo entrenamiento:', error);
        proximoEl.textContent = '--';
        nivelEl.textContent = '--';
    }
};

// ===================================
// CARGAR DEPORTISTAS POR NIVEL
// ===================================
const cargarDeportistasPorNivel = (deportistas) => {
    const container = document.getElementById('nivelesChart');
    if (!container) return;
    
    if (deportistas.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--gray-500);">
                <span class="material-symbols-outlined" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">groups</span>
                <p>No se encontraron deportistas</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">
                    <button onclick="window.location.href='deportistas/registrar.html'" 
                            style="background: var(--primary-red); color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.875rem;">
                        Registrar primer deportista
                    </button>
                </p>
            </div>
        `;
        return;
    }
    
    // Agrupar por nivel
    const porNivel = {};
    deportistas.forEach(d => {
        const nivel = d.nivel_actual || 'pendiente';
        porNivel[nivel] = (porNivel[nivel] || 0) + 1;
    });
    
    const datosNiveles = Object.entries(porNivel)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);
    
    const maxValue = Math.max(...datosNiveles.map(([_, count]) => count));
    
    container.innerHTML = datosNiveles.map(([nivel, count]) => {
        const percentage = (count / maxValue) * 100;
        return `
            <div class="nivel-bar">
                <div class="nivel-bar-label">${formatNivel(nivel)}</div>
                <div class="nivel-bar-visual">
                    <div class="nivel-bar-fill" style="width: ${percentage}%">
                        <span class="nivel-bar-value" style="color: white; font-weight: 700;">${count}</span>
                    </div>
                </div>
                <div class="nivel-bar-value">${count}</div>
            </div>
        `;
    }).join('');
};

// ===================================
// CARGAR DEPORTISTAS RECIENTES
// ===================================
const cargarDeportistasRecientes = (deportistas) => {
    const tbody = document.getElementById('deportistasRecientes');
    if (!tbody) return;
    
    if (deportistas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 3rem; color: var(--gray-400);">
                    <span class="material-symbols-outlined" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">groups</span>
                    <p>No hay deportistas registrados</p>
                    <button onclick="window.location.href='deportistas/registrar.html'" 
                            style="background: var(--primary-red); color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-top: 1rem; font-size: 0.875rem;">
                        Registrar primer deportista
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    const recientes = deportistas
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5);
    
    tbody.innerHTML = recientes.map(deportista => {
        return `
            <tr onclick="verDetalleDeportista('${deportista.id}')" style="cursor: pointer;">
                <td>
                    <div class="athlete-cell">
                        <div class="athlete-avatar">
                            <img src="${deportista.foto_perfil || 'https://via.placeholder.com/100'}" 
                                 alt="${deportista.user?.nombre || 'Deportista'}">
                        </div>
                        <div class="athlete-info">
                            <div class="athlete-name">${deportista.user?.nombre || deportista.nombre || 'Sin nombre'}</div>
                            <div class="athlete-role">${formatEquipo(deportista.equipo_competitivo)}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="nivel-badge">${formatNivel(deportista.nivel_actual)}</span>
                </td>
                <td>
                    <span class="text-sm text-gray-500">--</span>
                </td>
                <td style="text-align: right;">
                    <span class="material-symbols-outlined chevron-icon">chevron_right</span>
                </td>
            </tr>
        `;
    }).join('');
};

function formatEquipo(equipo) {
    const equipos = {
        'sin_equipo': 'Sin Equipo',
        'rocks_titans': 'Rocks Titans',
        'lightning_titans': 'Lightning Titans',
        'storm_titans': 'Storm Titans',
        'fire_titans': 'Fire Titans',
        'electric_titans': 'Electric Titans'
    };
    return equipos[equipo] || 'Atleta';
}

// ===================================
// VER DETALLE DE DEPORTISTA
// ===================================
const verDetalleDeportista = (id) => {
    window.location.href = `deportistas/detalle.html?id=${id}`;
};

// ===================================
// CARGAR PRÓXIMAS ACTIVIDADES
// ===================================
const cargarProximasActividades = async () => {
    const container = document.getElementById('proximasActividades');
    if (!container) return;
    
    try {
        const eventos = await API.getEventosCalendario();
        
        const ahora = new Date();
        const enTresDias = new Date();
        enTresDias.setDate(ahora.getDate() + 3);
        
        const proximas = eventos
            .filter(e => {
                try {
                    const fechaEvento = new Date(e.fecha || e.fecha_evento);
                    return fechaEvento > ahora && fechaEvento < enTresDias;
                } catch (error) {
                    return false;
                }
            })
            .slice(0, 3);
        
        if (proximas.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 1rem; color: var(--gray-500);">
                    <span class="material-symbols-outlined" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.3;">event</span>
                    <p style="font-size: 0.875rem;">No hay actividades próximas</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = proximas.map(evento => `
            <div class="notification-item">
                <span class="material-symbols-outlined notification-icon">event</span>
                <div class="notification-content">
                    <p class="notification-text">${evento.titulo || 'Entrenamiento'}</p>
                    <p class="notification-time">${formatFecha(evento.fecha_evento)}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error cargando próximas actividades:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 1rem; color: var(--gray-500);">
                <span class="material-symbols-outlined" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.3;">sync_problem</span>
                <p style="font-size: 0.875rem;">Error cargando actividades</p>
            </div>
        `;
    }
};

// ===================================
// 🔥 CONFIGURAR ACCIONES INMEDIATAS (CORREGIDO)
// ===================================
const configurarAccionesInmediatas = () => {
    const container = document.getElementById('accionesInmediatas');
    if (!container) return;
    
    // 🔥 RUTAS CORREGIDAS
    container.innerHTML = `
        <div class="activity-item" onclick="irAEvaluaciones()" style="cursor: pointer;">
            <div class="activity-text">Crear evaluación rápida</div>
            <div class="activity-time">Selecciona un deportista</div>
        </div>
        <div class="activity-item" onclick="window.location.href='deportistas/index.html'" style="cursor: pointer;">
            <div class="activity-text">Ver lista de deportistas</div>
            <div class="activity-time">Gestionar atletas</div>
        </div>
        <div class="activity-item" onclick="window.location.href='calendario/index.html'" style="cursor: pointer;">
            <div class="activity-text">Ver calendario</div>
            <div class="activity-time">Programar entrenamientos</div>
        </div>
    `;
};

// 🔥 Función para ir a evaluaciones
function irAEvaluaciones() {
    window.location.href = 'evaluaciones/index.html';
}

// ===================================
// THEME TOGGLE
// ===================================
const initThemeToggle = () => {
    const toggleBtn = document.getElementById('toggleTheme');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    document.body.classList.toggle('dark', savedTheme === 'dark');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark');
            document.documentElement.classList.toggle('dark', isDark);
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            
            const icon = toggleBtn.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.textContent = isDark ? 'light_mode' : 'dark_mode';
            }
        });
    }
};

// ===================================
// LOGOUT
// ===================================
const initLogout = () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                API.logout();
            }
        });
    }
};

// ===================================
// INICIALIZACIÓN PRINCIPAL
// ===================================
const init = async () => {
    console.log('🚀 Iniciando dashboard del entrenador...');
    
    // Verificar autenticación
    if (!verificarAutenticacion()) {
        console.warn('⚠️ Usuario no autenticado, redirigiendo...');
        setTimeout(() => {
            window.location.href = '../auth/login-entrenador.html';
        }, 1500);
        return;
    }
    
    // Cargar perfil
    cargarPerfilEntrenador();
    
    // Cargar niveles asignados
    cargarNivelesAsignados();
    
    // 🔥 Configurar acciones inmediatas con rutas correctas
    configurarAccionesInmediatas();
    
    // Inicializar controles
    initThemeToggle();
    initLogout();
    
    try {
        // Cargar datos
        const deportistas = await cargarEstadisticas();
        
        await Promise.all([
            cargarProximoEntrenamiento(),
            cargarProximasActividades()
        ]);
        
        cargarDeportistasPorNivel(deportistas);
        cargarDeportistasRecientes(deportistas);
        
        console.log('✅ Dashboard cargado exitosamente');
        
    } catch (error) {
        console.error('❌ Error al cargar el dashboard:', error);
        
        const nivelesChart = document.getElementById('nivelesChart');
        if (nivelesChart) {
            nivelesChart.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--danger);">
                    <span class="material-symbols-outlined" style="font-size: 3rem; margin-bottom: 1rem;">error</span>
                    <p>Error al cargar los datos</p>
                    <button onclick="location.reload()" 
                            style="background: var(--primary-red); color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-top: 1rem;">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
};

// ===================================
// EJECUTAR AL CARGAR LA PÁGINA
// ===================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Hacer funciones globales
window.verDetalleDeportista = verDetalleDeportista;
window.irAEvaluaciones = irAEvaluaciones;

console.log('✅ Dashboard Entrenador CORREGIDO cargado');