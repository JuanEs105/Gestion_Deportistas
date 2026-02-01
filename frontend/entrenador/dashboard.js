// ===================================
// CONFIGURACIÓN Y UTILIDADES
// ===================================
const API = window.EntrenadorAPI;

// Alias para compatibilidad
const getUserData = () => API.user;
const formatNivel = (nivel) => API.formatNivel(nivel);
const formatFecha = (fecha) => API.formatFecha(fecha);
const formatHora = (fecha) => API.formatHora(fecha);

// ===================================
// FUNCIÓN DE DIAGNÓSTICO
// ===================================
async function diagnosticarDashboard() {
    console.log('🔍 DIAGNÓSTICO DEL DASHBOARD');
    
    try {
        // 1. Verificar usuario
        const user = getUserData();
        console.log('👤 Usuario actual:', {
            id: user?.id,
            nombre: user?.nombre,
            email: user?.email,
            role: user?.role,
            niveles_asignados: user?.niveles_asignados,
            tieneNiveles: user?.niveles_asignados?.length > 0
        });
        
        // 2. Probar API.getDeportistas()
        console.log('📥 Probando API.getDeportistas()...');
        const deportistas = await API.getDeportistas();
        console.log('✅ Resultado getDeportistas():', {
            total: deportistas?.length || 0,
            primeros3: deportistas?.slice(0, 3)
        });
        
        // 3. Probar endpoint directo
        console.log('🌐 Probando endpoint directo...');
        const response = await fetch(`${API.baseURL}/deportistas`, {
            method: 'GET',
            headers: API.getHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            const deportistasDirectos = data.deportistas || data || [];
            console.log('✅ Endpoint directo:', {
                total: deportistasDirectos?.length || 0,
                muestra: deportistasDirectos?.slice(0, 3)
            });
            
            // Comparar
            console.log('📊 COMPARACIÓN:', {
                'API.getDeportistas()': deportistas?.length || 0,
                'Endpoint directo': deportistasDirectos?.length || 0,
                'Diferencia': (deportistasDirectos?.length || 0) - (deportistas?.length || 0)
            });
        } else {
            console.warn('❌ Endpoint falló:', response.status);
        }
        
        return deportistas;
        
    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
        return [];
    }
}

// Ejecutar diagnóstico cuando se presione Ctrl+Shift+D
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        diagnosticarDashboard();
    }
});

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
// CARGAR ESTADÍSTICAS - VERSIÓN CORREGIDA
// ===================================
const cargarEstadisticas = async () => {
    try {
        console.log('📊 Cargando estadísticas...');
        
        // 1. OBTENER DEPORTISTAS SIN FILTRAR
        let deportistas = [];
        
        try {
            // Primero intentar obtener TODOS los deportistas
            console.log('📥 Obteniendo deportistas...');
            
            // Usar endpoint directo para evitar filtrado
            const response = await fetch(`${API.baseURL}/deportistas`, {
                method: 'GET',
                headers: API.getHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                deportistas = data.deportistas || data || [];
                console.log(`✅ Obtenidos ${deportistas.length} deportistas (endpoint directo)`);
            } else {
                // Si falla, usar API con filtro pero mostrar advertencia
                console.warn('⚠️ Endpoint directo falló, usando API.getDeportistas()');
                deportistas = await API.getDeportistas();
                console.log(`✅ Obtenidos ${deportistas.length} deportistas (API filtrado)`);
            }
        } catch (error) {
            console.error('❌ Error obteniendo deportistas:', error);
        }
        
        // Si no hay deportistas, mostrar advertencia
        if (deportistas.length === 0) {
            console.warn('⚠️ NO SE ENCONTRARON DEPORTISTAS');
            console.log('🔄 Verificando si es problema de niveles asignados...');
            
            const user = getUserData();
            if (!user?.niveles_asignados || user.niveles_asignados.length === 0) {
                console.log('⚠️ El entrenador NO tiene niveles asignados en su perfil');
                console.log('💡 Sugerencia: Agrega niveles en /api/entrenador/perfil');
            }
        }
        
        // 2. OBTENER EVALUACIONES
        let evaluacionesPendientes = 0;
        let evaluacionesRealizadas = 0;
        let promedioCalificacion = 0;
        
        try {
            console.log('📋 Obteniendo evaluaciones...');
            const evaluacionesData = await API.getEvaluaciones();
            evaluacionesRealizadas = evaluacionesData.length || 0;
            
            // Calcular promedio de calificación
            if (evaluacionesData.length > 0) {
                const suma = evaluacionesData.reduce((acc, evalu) => {
                    return acc + (evalu.calificacion_total || evalu.puntuacion || 3.5);
                }, 0);
                promedioCalificacion = (suma / evaluacionesData.length).toFixed(1);
            }
            
            console.log(`✅ Evaluaciones realizadas: ${evaluacionesRealizadas}`);
        } catch (error) {
            console.warn('⚠️ No se pudieron obtener evaluaciones:', error.message);
        }
        
        // Obtener evaluaciones pendientes
        try {
            const evaluacionesPend = await API.getEvaluacionesPendientes();
            evaluacionesPendientes = evaluacionesPend.length || 0;
            console.log(`✅ Evaluaciones pendientes: ${evaluacionesPendientes}`);
        } catch (error) {
            console.warn('⚠️ No se pudieron obtener evaluaciones pendientes:', error.message);
        }
        
        // Filtrar deportistas activos
        const deportistasActivos = deportistas.filter(d => d.estado === 'activo' || d.activo === true);
        
        // 3. ACTUALIZAR UI
        document.getElementById('totalDeportistas').textContent = deportistas.length;
        document.getElementById('deportistasActivos').textContent = deportistasActivos.length;
        document.getElementById('evaluacionesPendientes').textContent = evaluacionesPendientes;
        document.getElementById('evaluacionesRealizadas').textContent = evaluacionesRealizadas;
        document.getElementById('promedioCalificacion').textContent = promedioCalificacion;
        document.getElementById('evaluacionesMes').textContent = evaluacionesRealizadas;
        
        console.log('📈 Estadísticas actualizadas:', {
            deportistas: deportistas.length,
            activos: deportistasActivos.length,
            evaluacionesPendientes,
            evaluacionesRealizadas,
            promedioCalificacion
        });
        
        return deportistas;
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        mostrarError('Error al cargar las estadísticas');
        return [];
    }
};

// ===================================
// CARGAR PRÓXIMO ENTRENAMIENTO
// ===================================
const cargarProximoEntrenamiento = async () => {
    try {
        const eventos = await API.getEventosCalendario();
        
        // Buscar el próximo evento
        const ahora = new Date();
        const proximosEventos = eventos
            .filter(e => new Date(e.fecha_evento) > ahora)
            .sort((a, b) => new Date(a.fecha_evento) - new Date(b.fecha_evento));
        
        if (proximosEventos.length > 0) {
            const proximo = proximosEventos[0];
            const fecha = new Date(proximo.fecha_evento);
            
            // Verificar si es hoy
            const esHoy = fecha.toDateString() === ahora.toDateString();
            const texto = esHoy ? `Hoy, ${formatHora(proximo.fecha_evento)}` : formatFecha(proximo.fecha_evento);
            
            document.getElementById('proximoEntrenamiento').textContent = texto;
            document.getElementById('nivelProximoEntrenamiento').textContent = 
                formatNivel(proximo.nivel) || 'Evento General';
        } else {
            document.getElementById('proximoEntrenamiento').textContent = 'Sin eventos';
            document.getElementById('nivelProximoEntrenamiento').textContent = 'próximos';
        }
    } catch (error) {
        console.error('Error cargando próximo entrenamiento:', error);
        document.getElementById('proximoEntrenamiento').textContent = '--';
        document.getElementById('nivelProximoEntrenamiento').textContent = '--';
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
                <span class="material-symbols-outlined" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">
                    groups
                </span>
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
    
    // Ordenar y preparar datos
    const datosNiveles = Object.entries(porNivel)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6); // Top 6 niveles
    
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
                    <span class="material-symbols-outlined" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">
                        groups
                    </span>
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
    
    // Ordenar por fecha de creación y tomar los 5 más recientes
    const recientes = deportistas
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
    
    tbody.innerHTML = recientes.map(deportista => {
        const calificacion = Math.random() * 2 + 3; // Simulado: 3-5
        const estrellas = Math.round(calificacion);
        
        return `
            <tr onclick="verDetalleDeportista('${deportista.id}')">
                <td>
                    <div class="athlete-cell">
                        <div class="athlete-avatar">
                            <img src="${deportista.foto_perfil || 'https://via.placeholder.com/100'}" 
                                 alt="${deportista.user?.nombre || 'Deportista'}">
                        </div>
                        <div class="athlete-info">
                            <div class="athlete-name">${deportista.user?.nombre || 'Sin nombre'}</div>
                            <div class="athlete-role">${deportista.equipo_competitivo || 'Atleta'}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="nivel-badge">${formatNivel(deportista.nivel_actual)}</span>
                </td>
                <td>
                    <div class="rating">
                        <span class="rating-value">${calificacion.toFixed(1)}</span>
                        <div class="stars">
                            ${Array(5).fill(0).map((_, i) => `
                                <span class="material-symbols-outlined" style="${i < estrellas ? 'font-variation-settings: \'FILL\' 1;' : ''}">
                                    star
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </td>
                <td style="text-align: right;">
                    <span class="material-symbols-outlined chevron-icon">chevron_right</span>
                </td>
            </tr>
        `;
    }).join('');
};

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
        
        // Filtrar eventos próximos (próximos 3 días)
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
                    <span class="material-symbols-outlined" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.3;">
                        event
                    </span>
                    <p style="font-size: 0.875rem;">No hay actividades próximas</p>
                    <button onclick="window.location.href='calendario/agregar.html'" 
                            style="background: var(--primary-red); color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-top: 0.5rem; font-size: 0.75rem;">
                        Agregar evento
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = proximas.map(evento => `
            <div class="notification-item">
                <span class="material-symbols-outlined notification-icon">
                    event
                </span>
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
                <span class="material-symbols-outlined" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.3;">
                    sync_problem
                </span>
                <p style="font-size: 0.875rem;">No se pudieron cargar las actividades</p>
            </div>
        `;
    }
};

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
            
            // Actualizar icono
            const icon = toggleBtn.querySelector('.material-symbols-outlined');
            icon.textContent = isDark ? 'light_mode' : 'dark_mode';
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
// PERFIL CLICK
// ===================================
const initProfileClick = () => {
    const profileBtn = document.getElementById('coachProfile');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            window.location.href = 'perfil/index.html';
        });
    }
};

// ===================================
// MOSTRAR ERROR
// ===================================
const mostrarError = (mensaje) => {
    console.error(mensaje);
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
    
    // Inicializar controles
    initThemeToggle();
    initLogout();
    initProfileClick();
    
    try {
        // Cargar datos en paralelo
        const deportistas = await cargarEstadisticas();
        
        // Cargar el resto de datos
        await Promise.all([
            cargarProximoEntrenamiento(),
            cargarProximasActividades()
        ]);
        
        // Cargar gráficas con los deportistas obtenidos
        cargarDeportistasPorNivel(deportistas);
        cargarDeportistasRecientes(deportistas);
        
        console.log('✅ Dashboard cargado exitosamente');
        
    } catch (error) {
        console.error('❌ Error al cargar el dashboard:', error);
        mostrarError('Error al cargar los datos del dashboard');
        
        // Mostrar estado de error en la UI
        const nivelesChart = document.getElementById('nivelesChart');
        if (nivelesChart) {
            nivelesChart.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--danger);">
                    <span class="material-symbols-outlined" style="font-size: 3rem; margin-bottom: 1rem;">
                        error
                    </span>
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