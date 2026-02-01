// Sistema de Evaluaciones para Entrenadores - VERSIÓN DEFINITIVA
// Variables globales
let deportistas = [];
let deportistaSeleccionado = null;
let habilidadesPorNivel = {};
let evaluacionesHistorial = [];
let evaluacionActual = null;

// Configuración
const ITEMS_PER_PAGE = 12;
let currentPage = 1;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM cargado - Inicializando sistema de evaluaciones');
    
    // Verificar autenticación
    if (window.EntrenadorAPI && EntrenadorAPI.checkAuth) {
        if (!EntrenadorAPI.checkAuth()) {
            return;
        }
        // Actualizar información del usuario
        const sidebarName = document.getElementById('sidebarName');
        if (sidebarName && EntrenadorAPI.user) {
            sidebarName.textContent = EntrenadorAPI.user.nombre || EntrenadorAPI.user.email || 'Entrenador';
        }
    }
    
    // Configurar listeners para filtros
    const searchInput = document.getElementById('searchInput');
    const filtroNivel = document.getElementById('filtroNivel');
    const filtroEquipo = document.getElementById('filtroEquipo');
    
    if (searchInput) searchInput.addEventListener('input', filtrarDeportistas);
    if (filtroNivel) filtroNivel.addEventListener('change', filtrarDeportistas);
    if (filtroEquipo) filtroEquipo.addEventListener('change', filtrarDeportistas);
    
    // Toggle theme
    document.getElementById('toggleTheme')?.addEventListener('click', toggleTheme);
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    
    // Cargar deportistas inicialmente
    cargarDeportistas();
    
    // Cargar tema
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }
});

// ===========================================
// FUNCIONES PRINCIPALES
// ===========================================

// Función para cargar deportistas
async function cargarDeportistas() {
    try {
        mostrarLoading(true);
        
        console.log('📥 Cargando deportistas para evaluaciones...');
        
        const deportistasData = await EntrenadorAPI.getDeportistas();
        
        deportistas = deportistasData.map(d => {
            console.log(`🔍 Procesando: ${d.nombre} | Nivel: "${d.nivel_actual}" | Posición: "${d.posicion}"`);
            
            return {
                id: d.id,
                nombre: d.nombre || 'Sin nombre',
                email: d.email || '',
                telefono: d.telefono || '',
                nivel_actual: d.nivel_actual || 'pendiente',
                estado: d.estado || 'activo',
                equipo_competitivo: d.equipo_competitivo || 'sin_equipo',
                peso: d.peso || null,
                altura: d.altura || null,
                talla: d.talla || d.talla_camiseta || null,
                fecha_nacimiento: d.fecha_nacimiento || null,
                foto_perfil: d.foto_perfil || d.foto || null,
                fecha_ingreso: d.fecha_ingreso || d.created_at || null,
                posicion: d.posicion || null // 🔥 NO convertir a "Sin definir" aquí
            };
        });
        
        deportistas.sort((a, b) => a.nombre.localeCompare(b.nombre));
        
        console.log(`✅ ${deportistas.length} deportistas cargados`);
        
        mostrarDeportistas();
        
        if (deportistas.length > 0) {
            EntrenadorAPI.showNotification(`✅ ${deportistas.length} deportistas listos para evaluar`, 'success');
        }
        
    } catch (error) {
        console.error('❌ Error cargando deportistas:', error);
        EntrenadorAPI.showNotification('Error al cargar deportistas', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Mostrar deportistas en la grid
function mostrarDeportistas() {
    const container = document.getElementById('deportistasContainer');
    if (!container) return;
    
    // Filtrar deportistas
    let deportistasFiltrados = filtrarDeportistasArray();
    
    // Mostrar/ocultar mensaje de no resultados
    const noResults = document.getElementById('noResults');
    if (noResults) {
        noResults.classList.toggle('hidden', deportistasFiltrados.length > 0);
    }
    
    if (deportistasFiltrados.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    // Calcular paginación
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, deportistasFiltrados.length);
    const deportistasParaMostrar = deportistasFiltrados.slice(startIndex, endIndex);
    
    // Generar HTML
    container.innerHTML = deportistasParaMostrar.map(deportista => {
        const equipoNombre = getEquipoNombre(deportista.equipo_competitivo);
        const inicialNombre = deportista.nombre?.charAt(0)?.toUpperCase() || '?';
        
        // Nivel
        const nivelRaw = deportista.nivel_actual;
        const nivelEsValido = nivelRaw && nivelRaw !== '' && nivelRaw !== 'pendiente';
        
        const mostrarNivel = nivelEsValido ? getNivelAbreviatura(nivelRaw) : 'PEND';
        const mostrarClase = nivelEsValido ? getNivelBadgeClase(nivelRaw) : 'nivel-pendiente';
        
        // 🔥 CORRECCIÓN: Mostrar posición solo si existe
        const posicionTexto = deportista.posicion || getNivelNombreCompleto(deportista.nivel_actual);
        
        console.log(`🎨 ${deportista.nombre}: Nivel="${nivelRaw}" | Posición="${deportista.posicion}" | Mostrará="${posicionTexto}"`);
        
        return `
            <button onclick="seleccionarParaEvaluar('${escapeJS(deportista.id)}')" 
                    class="athlete-card group">
                <div class="athlete-photo-container">
                    ${deportista.foto_perfil ? 
                        `<img src="${escapeHTML(deportista.foto_perfil)}" alt="${escapeHTML(deportista.nombre)}" class="athlete-photo">` : 
                        `<div class="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-6xl font-bold">
                            ${inicialNombre}
                        </div>`
                    }
                    <div class="athlete-badge ${mostrarClase}">
                        ${mostrarNivel}
                    </div>
                </div>
                <div class="athlete-info">
                    <h3 class="athlete-name group-hover:text-primary transition-colors">
                        ${escapeHTML(deportista.nombre)}
                    </h3>
                    <div class="athlete-details">
                        <span class="athlete-dot"></span>
                        <span class="athlete-meta">
                            ${escapeHTML(equipoNombre)} / ${escapeHTML(posicionTexto)}
                        </span>
                    </div>
                </div>
            </button>
        `;
    }).join('');
    
    // Mostrar paginación si es necesario
    mostrarPaginacion(deportistasFiltrados.length);
}

// Filtrar deportistas localmente
function filtrarDeportistasArray() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filtroNivel = document.getElementById('filtroNivel')?.value || '';
    const filtroEquipo = document.getElementById('filtroEquipo')?.value || '';
    
    return deportistas.filter(deportista => {
        const matchBusqueda = searchTerm === '' || 
            deportista.nombre.toLowerCase().includes(searchTerm) ||
            deportista.email.toLowerCase().includes(searchTerm) ||
            deportista.telefono.includes(searchTerm);
        
        const matchNivel = !filtroNivel || deportista.nivel_actual === filtroNivel;
        const matchEquipo = !filtroEquipo || deportista.equipo_competitivo === filtroEquipo;
        
        return matchBusqueda && matchNivel && matchEquipo;
    });
}

// Función para filtrar deportistas
function filtrarDeportistas() {
    currentPage = 1;
    mostrarDeportistas();
}

// Mostrar paginación
function mostrarPaginacion(totalDeportistas) {
    const container = document.getElementById('deportistasContainer');
    const totalPages = Math.ceil(totalDeportistas / ITEMS_PER_PAGE);
    
    if (totalPages <= 1) return;
    
    container.insertAdjacentHTML('beforeend', `
        <div class="col-span-full mt-8">
            <div class="flex items-center justify-between">
                <div class="text-sm text-gray-500 dark:text-gray-400">
                    Mostrando ${Math.min(currentPage * ITEMS_PER_PAGE, totalDeportistas)} de ${totalDeportistas} deportistas
                </div>
                <div class="flex gap-2">
                    <button onclick="cambiarPagina(-1)" 
                            ${currentPage === 1 ? 'disabled' : ''}
                            class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        ← Anterior
                    </button>
                    <span class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        ${currentPage} / ${totalPages}
                    </span>
                    <button onclick="cambiarPagina(1)" 
                            ${currentPage === totalPages ? 'disabled' : ''}
                            class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        Siguiente →
                    </button>
                </div>
            </div>
        </div>
    `);
}

// Cambiar página
function cambiarPagina(delta) {
    const deportistasFiltrados = filtrarDeportistasArray();
    const totalPages = Math.ceil(deportistasFiltrados.length / ITEMS_PER_PAGE);
    
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        mostrarDeportistas();
    }
}

// ===========================================
// SELECCIÓN DE DEPORTISTA
// ===========================================

// Función para seleccionar deportista para evaluar
async function seleccionarParaEvaluar(deportistaId) {
    try {
        mostrarLoading(true);
        
        deportistaSeleccionado = deportistas.find(d => d.id === deportistaId);
        if (!deportistaSeleccionado) {
            throw new Error('Deportista no encontrado');
        }
        
        console.log('========================================');
        console.log('🎯 DEPORTISTA SELECCIONADO:');
        console.log('Nombre:', deportistaSeleccionado.nombre);
        console.log('Nivel:', deportistaSeleccionado.nivel_actual);
        console.log('Posición:', deportistaSeleccionado.posicion);
        console.log('========================================');
        
        // Guardar en localStorage
        localStorage.setItem('deportistaParaEvaluar', JSON.stringify({
            id: deportistaSeleccionado.id,
            nombre: deportistaSeleccionado.nombre,
            email: deportistaSeleccionado.email,
            telefono: deportistaSeleccionado.telefono,
            nivel_actual: deportistaSeleccionado.nivel_actual,
            equipo_competitivo: deportistaSeleccionado.equipo_competitivo,
            foto_perfil: deportistaSeleccionado.foto_perfil,
            fecha_nacimiento: deportistaSeleccionado.fecha_nacimiento,
            posicion: deportistaSeleccionado.posicion
        }));
        
        // Obtener habilidades
        const habilidadesData = await EntrenadorAPI.getHabilidadesPorNivel(
            deportistaSeleccionado.nivel_actual,
            deportistaSeleccionado.id
        );
        habilidadesPorNivel = habilidadesData;
        
        // Obtener evaluaciones
        const evaluacionesData = await EntrenadorAPI.getEvaluacionesDeportista(deportistaId);
        evaluacionesHistorial = evaluacionesData;
        
        // Redirigir
        window.location.href = `evaluacion.html?deportista=${deportistaId}`;
        
    } catch (error) {
        console.error('❌ Error:', error);
        EntrenadorAPI.showNotification(`Error: ${error.message}`, 'error');
    } finally {
        mostrarLoading(false);
    }
}

// ===========================================
// FUNCIONES AUXILIARES
// ===========================================

function getNivelNombre(nivel) {
    if (!nivel || nivel === 'pendiente') return 'Pendiente';
    
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

function getNivelNombreCompleto(nivel) {
    return getNivelNombre(nivel);
}

function getNivelAbreviatura(nivel) {
    const abreviaturas = {
        'pendiente': 'PEND',
        'baby_titans': 'BABY',
        '1_basico': 'L1B',
        '1_medio': 'L1M',
        '1_avanzado': 'L1A',
        '2': 'L2',
        '3': 'L3',
        '4': 'L4'
    };
    return abreviaturas[nivel] || nivel?.substring(0, 3).toUpperCase() || 'N/A';
}

function getNivelBadgeClase(nivel) {
    if (!nivel || nivel === 'pendiente') return 'nivel-pendiente';
    if (nivel === 'baby_titans') return 'nivel-baby';
    if (nivel.includes('1_')) return 'nivel-1';
    if (nivel === '2') return 'nivel-2';
    if (nivel === '3') return 'nivel-3';
    if (nivel === '4') return 'nivel-4';
    return 'nivel-pendiente';
}

function getEquipoNombre(equipo) {
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

function mostrarLoading(mostrar) {
    const container = document.getElementById('deportistasContainer');
    if (!container) return;
    
    if (mostrar) {
        container.innerHTML = `
            <div class="text-center py-12 col-span-full">
                <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p class="text-gray-500 dark:text-gray-400">Cargando deportistas...</p>
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

function escapeJS(text) {
    if (!text) return '';
    return text.toString()
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}

// Exportar funciones globales
window.cargarDeportistas = cargarDeportistas;
window.filtrarDeportistas = filtrarDeportistas;
window.toggleTheme = toggleTheme;
window.logout = logout;
window.seleccionarParaEvaluar = seleccionarParaEvaluar;
window.cambiarPagina = cambiarPagina;

console.log('✅ Script de selección cargado (VERSIÓN DEFINITIVA)');