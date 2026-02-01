// Variables globales
let deportistas = [];
let deportistasFiltrados = [];
let deportistaSeleccionado = null;
let currentPage = 1;
const itemsPerPage = 10;

// Opciones para los menús
const opcionesEquipos = [
    { value: 'sin_equipo', label: '🚫 Sin equipo' },
    { value: 'rocks_titans', label: '🪨 Rocks Titans' },
    { value: 'lightning_titans', label: '⚡ Lightning Titans' },
    { value: 'storm_titans', label: '🌪️ Storm Titans' },
    { value: 'fire_titans', label: '🔥 Fire Titans' },
    { value: 'electric_titans', label: '⚡ Electric Titans' }
];

const opcionesEstados = [
    { value: 'activo', label: '✅ Activo' },
    { value: 'lesionado', label: '🤕 Lesionado' },
    { value: 'descanso', label: '🏝️ Descanso' },
    { value: 'inactivo', label: '❌ Inactivo' },
    { value: 'pendiente', label: '⏳ Pendiente' },
    { value: 'pendiente_de_pago', label: '💰 Pendiente de Pago' }
];

const opcionesNiveles = [
    { value: 'pendiente', label: '⏳ Pendiente' },
    { value: 'baby_titans', label: '👶 Baby Titans' },
    { value: '1_basico', label: '🥉 1 Básico' },
    { value: '1_medio', label: '🥈 1 Medio' },
    { value: '1_avanzado', label: '🥇 1 Avanzado' },
    { value: '2', label: '⭐ Nivel 2' },
    { value: '3', label: '🌟🌟 Nivel 3' },
    { value: '4', label: '🌟🌟🌟 Nivel 4' }
];

// Opciones de tallas (incluyendo 10, 12, 14, 16)
const opcionesTalla = [
    { value: '8', label: '8 (Extra Small)' },
    { value: '10', label: '10 (Small)' },
    { value: '12', label: '12 (Medium)' },
    { value: '14', label: '14 (Large)' },
    { value: '16', label: '16 (Extra Large)' },
    { value: 'XS', label: 'XS (Extra Small)' },
    { value: 'S', label: 'S (Small)' },
    { value: 'M', label: 'M (Medium)' },
    { value: 'L', label: 'L (Large)' },
    { value: 'XL', label: 'XL (Extra Large)' },
    { value: 'XXL', label: 'XXL (2X Large)' },
    { value: 'XXXL', label: 'XXXL (3X Large)' }
];

// Configuración Cloudinary
const CLOUDINARY_UPLOAD_PRESET = 'deportistas_fotos';
const CLOUDINARY_CLOUD_NAME = 'drch2xmrk';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM cargado - Inicializando sistema de deportistas (Entrenador)');
    
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
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroEquipo = document.getElementById('filtroEquipo');
    
    if (searchInput) searchInput.addEventListener('input', filtrarDeportistas);
    if (filtroNivel) filtroNivel.addEventListener('change', filtrarDeportistas);
    if (filtroEstado) filtroEstado.addEventListener('change', filtrarDeportistas);
    if (filtroEquipo) filtroEquipo.addEventListener('change', filtrarDeportistas);
    
    // Botón limpiar filtros
    document.getElementById('btnLimpiarFiltros')?.addEventListener('click', limpiarFiltros);
    
    // Botón de ayuda
    document.querySelector('.floating-help-btn')?.addEventListener('click', mostrarAyuda);
    
    // Paginación
    document.getElementById('prevBtn')?.addEventListener('click', paginaAnterior);
    document.getElementById('nextBtn')?.addEventListener('click', paginaSiguiente);
    
    // Toggle theme
    document.getElementById('toggleTheme')?.addEventListener('click', toggleTheme);
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    
    // Perfil click
    document.getElementById('coachProfile')?.addEventListener('click', () => {
        window.location.href = '../perfil/perfil.html';
    });
    
    // Cargar deportistas inicialmente
    setTimeout(cargarDeportistas, 100);
    
    // Cargar tema
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }
});

// Función para cargar deportistas
async function cargarDeportistas() {
    try {
        setLoading(true);
        limpiarMensajes();
        
        console.log('📥 Cargando deportistas desde la base de datos (Entrenador)...');
        
        const deportistasData = await EntrenadorAPI.getDeportistas();
        
        procesarDatosDeportistas(deportistasData);
        
        await updateServerStatus();
        
    } catch (error) {
        console.error('❌ Error cargando deportistas:', error);
        mostrarError('Error al cargar deportistas');
    } finally {
        setLoading(false);
    }
}

function procesarDatosDeportistas(data) {
    let deportistasData = data;
    
    if (!Array.isArray(deportistasData)) {
        deportistasData = [];
    }
    
    deportistas = deportistasData.map(d => ({
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
        // Nuevos campos solicitados
        eps: d.eps || d.eps_seguro || null,
        direccion: d.direccion || d.domicilio || null,
        contacto_emergencia_nombre: d.contacto_emergencia_nombre || d.contacto_emergencia || null,
        contacto_emergencia_telefono: d.contacto_emergencia_telefono || d.telefono_emergencia || null,
        parentesco: d.parentesco || d.parentesco_emergencia || null
    }));
    
    deportistas.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    console.log(`✅ ${deportistas.length} deportistas procesados`);
    
    mostrarDeportistas();
    actualizarEstadisticas();
    if (deportistas.length > 0) {
        mostrarMensaje(`✅ ${deportistas.length} deportistas cargados`, 'success');
    }
}

// Mostrar deportistas en la tabla
function mostrarDeportistas() {
    const tbody = document.getElementById('deportistasTableBody');
    if (!tbody) {
        console.error('❌ No se encontró el tbody');
        return;
    }
    
    deportistasFiltrados = filtrarDeportistasLocal();
    
    if (deportistasFiltrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center p-12">
                    <div class="flex flex-col items-center justify-center gap-4">
                        <span class="material-symbols-outlined text-6xl text-gray-400">sports_handball</span>
                        <div>
                            <p class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No hay deportistas encontrados</p>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Intenta cambiar los filtros de búsqueda</p>
                        </div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Remover fila de carga si existe
    const loadingRow = document.getElementById('loadingRow');
    if (loadingRow) loadingRow.remove();
    
    // Calcular índices para paginación
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, deportistasFiltrados.length);
    const deportistasParaMostrar = deportistasFiltrados.slice(startIndex, endIndex);
    
    tbody.innerHTML = deportistasParaMostrar.map(deportista => {
        const imc = calcularIMC(deportista.peso, deportista.altura);
        const debePagar = deportista.estado === 'pendiente_de_pago';
        const inicialNombre = deportista.nombre?.charAt(0)?.toUpperCase() || '?';
        
        // Verificar si está bloqueado por pago
        const bloqueado = verificarBloqueoPago(deportista);
        
        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors ${bloqueado ? 'opacity-75' : ''}">
                <td class="p-6">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full ${debePagar ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'} flex items-center justify-center font-semibold overflow-hidden">
                            ${deportista.foto_perfil ? 
                                `<img src="${escapeHTML(deportista.foto_perfil)}" alt="${escapeHTML(deportista.nombre)}" class="w-full h-full object-cover">` : 
                                inicialNombre}
                        </div>
                        <div>
                            <div class="font-semibold text-gray-900 dark:text-white">${escapeHTML(deportista.nombre)}</div>
                            ${imc ? `<div class="text-xs text-gray-500 dark:text-gray-400">IMC: ${imc}</div>` : ''}
                            ${debePagar ? `
                            <div class="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 font-medium mt-1">
                                <span class="material-symbols-outlined text-sm">warning</span>
                                Debe pagar
                            </div>` : ''}
                        </div>
                    </div>
                </td>
                <td class="p-6">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">${escapeHTML(deportista.email)}</div>
                    ${deportista.telefono ? `<div class="text-xs text-gray-500 dark:text-gray-400">${escapeHTML(deportista.telefono)}</div>` : ''}
                </td>
                <td class="p-6">
                    <button onclick="abrirMenuNivel('${escapeJS(deportista.id)}')" class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getNivelClaseCSS(deportista.nivel_actual)} hover:opacity-80 transition-opacity dropdown-btn">
                        ${getNivelNombre(deportista.nivel_actual)}
                        <span class="material-symbols-outlined text-xs">expand_more</span>
                    </button>
                </td>
                <td class="p-6">
                    <button onclick="abrirMenuEquipo('${escapeJS(deportista.id)}')" class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getEquipoClaseCSS(deportista.equipo_competitivo)} hover:opacity-80 transition-opacity dropdown-btn">
                        ${getEquipoNombre(deportista.equipo_competitivo)}
                        <span class="material-symbols-outlined text-xs">expand_more</span>
                    </button>
                </td>
                <td class="p-6">
                    <button onclick="abrirMenuEstado('${escapeJS(deportista.id)}')" class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getEstadoClaseCSS(deportista.estado)} hover:opacity-80 transition-opacity dropdown-btn">
                        ${getEstadoNombre(deportista.estado)}
                        <span class="material-symbols-outlined text-xs">expand_more</span>
                    </button>
                </td>
                <td class="p-6">
                    <div class="flex items-center gap-2">
                        <button onclick="verDetallesCompletos('${escapeJS(deportista.id)}')" class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors ${debePagar ? 'opacity-50 cursor-not-allowed' : ''}" title="Ver detalles" ${debePagar ? 'disabled' : ''}>
                            <span class="material-symbols-outlined text-sm">visibility</span>
                        </button>
                        <button onclick="editarDeportistaCompleto('${escapeJS(deportista.id)}')" class="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors ${debePagar ? 'opacity-50 cursor-not-allowed' : ''}" title="Editar" ${debePagar ? 'disabled' : ''}>
                            <span class="material-symbols-outlined text-sm">edit</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    actualizarPaginacion();
}

// ============================================
// FUNCIONALIDADES SOLICITADAS
// ============================================

// 1. FUNCIÓN: Verificar bloqueo por pago pendiente
function verificarBloqueoPago(deportista) {
    if (deportista.estado === 'pendiente_de_pago') {
        // Mostrar notificación solo una vez al cargar
        if (!deportista.notificacionMostrada) {
            setTimeout(() => {
                mostrarNotificacionPago(deportista);
            }, 1000);
            deportista.notificacionMostrada = true;
        }
        return true;
    }
    return false;
}

// 2. FUNCIÓN: Mostrar notificación de pago pendiente
function mostrarNotificacionPago(deportista) {
    // Verificar si ya hay una notificación activa para este deportista
    const existingNotification = document.getElementById(`notificacion-pago-${deportista.id}`);
    if (existingNotification) return;
    
    const notification = document.createElement('div');
    notification.id = `notificacion-pago-${deportista.id}`;
    notification.className = 'fixed top-4 right-4 z-50 bg-yellow-500 text-white p-4 rounded-lg shadow-lg max-w-md animate-fadeIn';
    notification.innerHTML = `
        <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-2xl flex-shrink-0">warning</span>
            <div class="flex-1">
                <div class="flex justify-between items-start">
                    <h4 class="font-bold">⚠️ Pago Pendiente</h4>
                    <button onclick="cerrarNotificacionPago('${escapeJS(deportista.id)}')" 
                            class="text-white hover:text-gray-200 ml-2">
                        <span class="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
                <p class="text-sm mt-1"><strong>${escapeHTML(deportista.nombre)}</strong> tiene un pago pendiente.</p>
                <p class="text-sm mt-1">Acceso restringido hasta que se regularice la situación.</p>
                <div class="mt-3 flex items-center gap-2 text-xs">
                    <span class="material-symbols-outlined text-xs">phone</span>
                    <span>${escapeHTML(deportista.telefono || 'Sin teléfono registrado')}</span>
                </div>
                <div class="mt-2 flex items-center gap-2 text-xs">
                    <span class="material-symbols-outlined text-xs">email</span>
                    <span>${escapeHTML(deportista.email)}</span>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Auto-remover después de 15 segundos
    setTimeout(() => {
        cerrarNotificacionPago(deportista.id);
    }, 15000);
}

function cerrarNotificacionPago(deportistaId) {
    const notification = document.getElementById(`notificacion-pago-${deportistaId}`);
    if (notification) {
        notification.remove();
    }
}

// Funciones auxiliares
function getNivelNombre(nivel) {
    const nivelObj = opcionesNiveles.find(n => n.value === nivel);
    return nivelObj ? nivelObj.label : nivel;
}

function getNivelClaseCSS(nivel) {
    if (nivel === 'pendiente') return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
    if (nivel.includes('avanzado')) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
    if (nivel.includes('medio') || nivel === '2' || nivel === '3' || nivel === '4') return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
    return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
}

function getEquipoNombre(equipo) {
    const equipoObj = opcionesEquipos.find(e => e.value === equipo);
    return equipoObj ? equipoObj.label : equipo;
}

function getEquipoClaseCSS(equipo) {
    if (equipo === 'sin_equipo') return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400';
    return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
}

function getEstadoNombre(estado) {
    const estadoObj = opcionesEstados.find(e => e.value === estado);
    return estadoObj ? estadoObj.label : estado;
}

function getEstadoClaseCSS(estado) {
    switch (estado) {
        case 'activo': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
        case 'lesionado': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
        case 'descanso': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
        case 'inactivo': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
        case 'pendiente': return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400';
        case 'pendiente_de_pago': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400';
        default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400';
    }
}

function calcularIMC(peso, altura) {
    if (!peso || !altura || altura <= 0) return null;
    return (peso / (altura * altura)).toFixed(1);
}

function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad;
}

// ============================================
// MENÚS DESPLEGABLES MEJORADOS
// ============================================

let menuAbierto = false;
let timeoutId = null;

function abrirMenuNivel(deportistaId) {
    const deportista = deportistas.find(d => d.id === deportistaId);
    if (!deportista) return;
    
    // Verificar si está bloqueado por pago
    if (deportista.estado === 'pendiente_de_pago') {
        mostrarNotificacionPago(deportista);
        mostrarMensaje('⚠️ No se puede cambiar el nivel. Pago pendiente.', 'warning');
        return;
    }
    
    const opcionesMenu = opcionesNiveles.map(opcion => ({
        ...opcion,
        seleccionado: opcion.value === deportista.nivel_actual
    }));
    
    mostrarMenuSeleccion('nivel', deportistaId, deportista.nombre, opcionesMenu, 'Seleccionar nivel');
}

function abrirMenuEquipo(deportistaId) {
    const deportista = deportistas.find(d => d.id === deportistaId);
    if (!deportista) return;
    
    // Verificar si está bloqueado por pago
    if (deportista.estado === 'pendiente_de_pago') {
        mostrarNotificacionPago(deportista);
        mostrarMensaje('⚠️ No se puede cambiar el equipo. Pago pendiente.', 'warning');
        return;
    }
    
    const opcionesMenu = opcionesEquipos.map(opcion => ({
        ...opcion,
        seleccionado: opcion.value === deportista.equipo_competitivo
    }));
    
    mostrarMenuSeleccion('equipo', deportistaId, deportista.nombre, opcionesMenu, 'Seleccionar equipo');
}

function abrirMenuEstado(deportistaId) {
    const deportista = deportistas.find(d => d.id === deportistaId);
    if (!deportista) return;
    
    const opcionesMenu = opcionesEstados.map(opcion => ({
        ...opcion,
        seleccionado: opcion.value === deportista.estado
    }));
    
    mostrarMenuSeleccion('estado', deportistaId, deportista.nombre, opcionesMenu, 'Seleccionar estado');
}

function mostrarMenuSeleccion(tipo, deportistaId, nombreDeportista, opciones, titulo) {
    // Cerrar menús existentes
    cerrarMenuSeleccion();
    
    // Evitar abrir múltiples menús
    if (menuAbierto) return;
    menuAbierto = true;
    
    // Obtener botón clickeado
    const target = event.target.closest('.dropdown-btn') || event.target;
    const rect = target.getBoundingClientRect();
    
    // Crear overlay para cerrar al hacer clic fuera
    const overlay = document.createElement('div');
    overlay.id = 'dropdownOverlay';
    overlay.className = 'fixed inset-0 z-40 cursor-default';
    overlay.onclick = cerrarMenuSeleccion;
    
    // Crear contenedor del menú
    const menu = document.createElement('div');
    menu.id = 'dropdownMenu';
    menu.className = 'fixed z-50 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 w-80 max-h-96 overflow-y-auto';
    
    // Calcular posición (asegurar que no se salga de la pantalla)
    let left = rect.left;
    let top = rect.bottom + 5;
    
    // Ajustar si se sale por la derecha
    const menuWidth = 320;
    if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 10;
    }
    
    // Ajustar si se sale por abajo
    const menuHeight = Math.min(400, opciones.length * 44 + 120);
    if (top + menuHeight > window.innerHeight) {
        top = Math.max(10, rect.top - menuHeight);
    }
    
    // Asegurar posición mínima
    if (top < 10) top = 10;
    if (left < 10) left = 10;
    
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.style.maxHeight = `${menuHeight}px`;
    
    // Contenido del menú
    menu.innerHTML = `
        <div class="sticky top-0 bg-white dark:bg-zinc-900 p-4 border-b border-gray-200 dark:border-white/10 z-10">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="font-semibold text-gray-900 dark:text-white text-sm">${titulo}</h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">${nombreDeportista}</p>
                </div>
                <button onclick="cerrarMenuSeleccion()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-symbols-outlined text-sm">close</span>
                </button>
            </div>
        </div>
        <div class="p-2">
            ${opciones.map(opcion => `
                <button onclick="seleccionarOpcion('${tipo}', '${deportistaId}', '${opcion.value}')"
                    class="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-left transition-colors mb-1 ${opcion.seleccionado ? 'text-primary font-semibold bg-primary/5' : 'text-gray-700 dark:text-gray-300'}">
                    <span>${opcion.label}</span>
                    ${opcion.seleccionado ? '<span class="material-symbols-outlined text-sm text-primary">check</span>' : ''}
                </button>
            `).join('')}
        </div>
    `;
    
    // Añadir al DOM
    document.body.appendChild(overlay);
    document.body.appendChild(menu);
    
    // Animar entrada
    menu.style.opacity = '0';
    menu.style.transform = 'translateY(-10px)';
    setTimeout(() => {
        menu.style.opacity = '1';
        menu.style.transform = 'translateY(0)';
        menu.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    }, 10);
    
    // Limpiar timeout anterior
    if (timeoutId) clearTimeout(timeoutId);
}

function cerrarMenuSeleccion() {
    const overlay = document.getElementById('dropdownOverlay');
    const menu = document.getElementById('dropdownMenu');
    
    if (menu) {
        menu.style.opacity = '0';
        menu.style.transform = 'translateY(-10px)';
        menu.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
        
        timeoutId = setTimeout(() => {
            if (overlay) overlay.remove();
            if (menu) menu.remove();
            menuAbierto = false;
        }, 150);
    } else {
        if (overlay) overlay.remove();
        menuAbierto = false;
    }
}

async function seleccionarOpcion(tipo, deportistaId, valor) {
    const deportista = deportistas.find(d => d.id === deportistaId);
    if (!deportista) return;
    
    let titulo, valorActual, nuevoNombre, campo;
    
    if (tipo === 'nivel') {
        titulo = 'Cambiar nivel';
        valorActual = getNivelNombre(deportista.nivel_actual);
        nuevoNombre = getNivelNombre(valor);
        campo = 'nivel_actual';
    } else if (tipo === 'equipo') {
        titulo = 'Cambiar equipo';
        valorActual = getEquipoNombre(deportista.equipo_competitivo);
        nuevoNombre = getEquipoNombre(valor);
        campo = 'equipo_competitivo';
    } else {
        titulo = 'Cambiar estado';
        valorActual = getEstadoNombre(deportista.estado);
        nuevoNombre = getEstadoNombre(valor);
        campo = 'estado';
    }
    
    if (!confirm(`¿${titulo} de ${deportista.nombre}?\n\nDe: ${valorActual}\nA: ${nuevoNombre}`)) {
        cerrarMenuSeleccion();
        return;
    }
    
    try {
        setLoading(true);
        
        // Usar el método de la API para entrenadores
        console.log(`⚡ Usando EntrenadorAPI.updateDeportistaCampo para ${campo}...`);
        
        await EntrenadorAPI.updateDeportistaCampo(deportistaId, campo, valor);
        
        // Actualizar localmente
        const index = deportistas.findIndex(d => d.id === deportistaId);
        if (index !== -1) {
            deportistas[index][campo] = valor;
        }
        
        // Si se cambia a "pendiente_de_pago", mostrar notificación
        if (campo === 'estado' && valor === 'pendiente_de_pago') {
            setTimeout(() => {
                mostrarNotificacionPago(deportistas[index]);
            }, 500);
        }
        
        // Actualizar vista
        mostrarDeportistas();
        actualizarEstadisticas();
        cerrarMenuSeleccion();
        
    } catch (error) {
        console.error(`❌ Error actualizando ${tipo}:`, error);
        mostrarError(`Error al actualizar ${tipo}: ${error.message}`);
    } finally {
        setLoading(false);
    }
}

// ============================================
// FUNCIÓN: Ver detalles completos del deportista
// ============================================

function verDetallesCompletos(deportistaId) {
    deportistaSeleccionado = deportistas.find(d => d.id === deportistaId);
    if (!deportistaSeleccionado) {
        mostrarError('Deportista no encontrado');
        return;
    }
    
    // Verificar si está bloqueado por pago
    if (deportistaSeleccionado.estado === 'pendiente_de_pago') {
        mostrarNotificacionPago(deportistaSeleccionado);
        mostrarMensaje('⚠️ Este deportista tiene un pago pendiente. Acceso restringido.', 'warning');
    }
    
    const imc = calcularIMC(deportistaSeleccionado.peso, deportistaSeleccionado.altura);
    const edad = calcularEdad(deportistaSeleccionado.fecha_nacimiento);
    const inicialNombre = deportistaSeleccionado.nombre?.charAt(0)?.toUpperCase() || '?';
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    modal.id = 'modalDetallesDeportista';
    
    modal.innerHTML = `
        <div class="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white">👤 Detalles del Deportista</h3>
                <button onclick="cerrarModal()" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">&times;</button>
            </div>
            
            <div class="p-6">
                <!-- Información Principal -->
                <div class="flex flex-col md:flex-row gap-6 mb-8">
                    <!-- Foto de Perfil -->
                    <div class="flex-shrink-0">
                        <div class="relative">
                            <div class="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-zinc-800 shadow-lg" id="fotoPerfilContainer">
                                ${deportistaSeleccionado.foto_perfil ? 
                                    `<img src="${escapeHTML(deportistaSeleccionado.foto_perfil)}" alt="${escapeHTML(deportistaSeleccionado.nombre)}" class="w-full h-full object-cover" id="fotoPerfilImg">` : 
                                    `<div class="w-full h-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-4xl font-bold text-blue-800 dark:text-blue-400">
                                        ${inicialNombre}
                                    </div>`
                                }
                            </div>
                        </div>
                    </div>
                    
                    <!-- Información Básica -->
                    <div class="flex-1">
                        <div class="flex items-start justify-between">
                            <div>
                                <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">${escapeHTML(deportistaSeleccionado.nombre)}</h2>
                                <p class="text-gray-600 dark:text-gray-400 mb-4">${escapeHTML(deportistaSeleccionado.email)}</p>
                            </div>
                            ${deportistaSeleccionado.estado === 'pendiente_de_pago' ? `
                                <div class="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                                    <span class="material-symbols-outlined text-sm">warning</span>
                                    Pago Pendiente
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="flex flex-wrap gap-3 mb-4">
                            <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getEstadoClaseCSS(deportistaSeleccionado.estado)}">
                                ${getEstadoNombre(deportistaSeleccionado.estado)}
                            </span>
                            <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getNivelClaseCSS(deportistaSeleccionado.nivel_actual)}">
                                ${getNivelNombre(deportistaSeleccionado.nivel_actual)}
                            </span>
                            <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getEquipoClaseCSS(deportistaSeleccionado.equipo_competitivo)}">
                                ${getEquipoNombre(deportistaSeleccionado.equipo_competitivo)}
                            </span>
                        </div>
                        
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Teléfono</p>
                                <p class="font-medium">${escapeHTML(deportistaSeleccionado.telefono || 'No registrado')}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Edad</p>
                                <p class="font-medium">${edad ? `${edad} años` : 'No registrada'}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">F. Ingreso</p>
                                <p class="font-medium">${deportistaSeleccionado.fecha_ingreso ? new Date(deportistaSeleccionado.fecha_ingreso).toLocaleDateString('es-ES') : 'No registrada'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Datos Físicos -->
                <div class="bg-gray-50 dark:bg-zinc-800 rounded-xl p-6 mb-6">
                    <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">📊 Datos Físicos</h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Peso</p>
                            <p class="font-medium text-lg">${deportistaSeleccionado.peso ? `${deportistaSeleccionado.peso} kg` : 'No registrado'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Altura</p>
                            <p class="font-medium text-lg">${deportistaSeleccionado.altura ? `${deportistaSeleccionado.altura} m` : 'No registrado'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">IMC</p>
                            <p class="font-medium text-lg">${imc || 'No calculable'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Talla</p>
                            <p class="font-medium text-lg">${escapeHTML(deportistaSeleccionado.talla || 'No registrada')}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Información Adicional -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div class="bg-gray-50 dark:bg-zinc-800 rounded-xl p-6">
                        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">📝 Información Personal</h4>
                        <div class="space-y-3">
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Fecha de Nacimiento</p>
                                <p class="font-medium">${deportistaSeleccionado.fecha_nacimiento ? new Date(deportistaSeleccionado.fecha_nacimiento).toLocaleDateString('es-ES') : 'No registrada'}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Fecha de Ingreso</p>
                                <p class="font-medium">${deportistaSeleccionado.fecha_ingreso ? new Date(deportistaSeleccionado.fecha_ingreso).toLocaleDateString('es-ES') : 'No registrada'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- NUEVA SECCIÓN: Información Médica y Contacto -->
                    <div class="bg-gray-50 dark:bg-zinc-800 rounded-xl p-6">
                        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">🏥 Información Médica y Contacto</h4>
                        <div class="space-y-3">
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">EPS / Seguro Médico</p>
                                <p class="font-medium">${escapeHTML(deportistaSeleccionado.eps || 'No registrada')}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Dirección</p>
                                <p class="font-medium">${escapeHTML(deportistaSeleccionado.direccion || 'No registrada')}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Contacto de Emergencia</p>
                                <p class="font-medium">${escapeHTML(deportistaSeleccionado.contacto_emergencia_nombre || 'No registrado')}</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">${escapeHTML(deportistaSeleccionado.contacto_emergencia_telefono || '')}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Parentesco</p>
                                <p class="font-medium">${escapeHTML(deportistaSeleccionado.parentesco || 'No especificado')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="p-6 border-t border-gray-200 dark:border-white/5 flex flex-col sm:flex-row gap-3">
                <button onclick="editarDeportistaCompleto('${escapeJS(deportistaSeleccionado.id)}')" 
                        class="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors ${deportistaSeleccionado.estado === 'pendiente_de_pago' ? 'opacity-50 cursor-not-allowed' : ''}" 
                        ${deportistaSeleccionado.estado === 'pendiente_de_pago' ? 'disabled' : ''}>
                    <span class="material-symbols-outlined">edit</span>
                    Editar Datos
                </button>
                <button onclick="cerrarModal()" 
                        class="flex-1 flex items-center justify-center gap-2 bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors">
                    <span class="material-symbols-outlined">close</span>
                    Cerrar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ============================================
// FUNCIÓN: Editar deportista completo
// ============================================

function editarDeportistaCompleto(deportistaId) {
    deportistaSeleccionado = deportistas.find(d => d.id === deportistaId);
    if (!deportistaSeleccionado) {
        mostrarError('Deportista no encontrado');
        return;
    }
    
    // Verificar si está bloqueado por pago
    if (deportistaSeleccionado.estado === 'pendiente_de_pago') {
        mostrarNotificacionPago(deportistaSeleccionado);
        mostrarMensaje('❌ No se puede editar. El deportista tiene un pago pendiente.', 'error');
        return;
    }
    
    // Cerrar modal de detalles si está abierto
    cerrarModal();
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    modal.id = 'modalEditarDeportista';
    
    modal.innerHTML = `
        <div class="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white">✏️ Editar Datos Físicos</h3>
                <button onclick="cerrarModal()" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">&times;</button>
            </div>
            
            <form id="formEditarDeportista" class="p-6">
                <!-- Información de solo lectura -->
                <div class="mb-6 p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                    <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">📋 Información del Deportista</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Nombre</p>
                            <p class="font-medium">${escapeHTML(deportistaSeleccionado.nombre)}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Email</p>
                            <p class="font-medium">${escapeHTML(deportistaSeleccionado.email)}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Teléfono</p>
                            <p class="font-medium">${escapeHTML(deportistaSeleccionado.telefono || 'No registrado')}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Fecha Nacimiento</p>
                            <p class="font-medium">${deportistaSeleccionado.fecha_nacimiento ? new Date(deportistaSeleccionado.fecha_nacimiento).toLocaleDateString('es-ES') : 'No registrada'}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Campos editables: PESO, ALTURA, TALLA -->
                <div class="space-y-6">
                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">📊 Datos Físicos Editables</h4>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <!-- Peso -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Peso (kg)
                                </label>
                                <input type="number" step="0.1" id="editPeso" 
                                       value="${deportistaSeleccionado.peso || ''}" 
                                       class="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                                       placeholder="70.5">
                            </div>
                            
                            <!-- Altura -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Altura (m)
                                </label>
                                <input type="number" step="0.01" id="editAltura" 
                                       value="${deportistaSeleccionado.altura || ''}" 
                                       class="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                                       placeholder="1.75">
                            </div>
                            
                            <!-- Talla (menú desplegable con opciones 10, 12, 14, 16) -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Talla
                                </label>
                                <select id="editTalla" 
                                        class="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
                                    <option value="">Seleccionar talla...</option>
                                    ${opcionesTalla.map(opcion => `
                                        <option value="${opcion.value}" ${deportistaSeleccionado.talla === opcion.value ? 'selected' : ''}>
                                            ${opcion.label}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <!-- Nota informativa -->
                        <div class="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p class="text-sm text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                                <span class="material-symbols-outlined text-sm">info</span>
                                <span>Solo puedes editar el peso, altura y talla. Los demás datos son información base del sistema.</span>
                            </p>
                        </div>
                    </div>
                </div>
                
                <div class="mt-8 pt-6 border-t border-gray-200 dark:border-white/5 flex justify-between gap-3">
                    <button type="button" onclick="cerrarModal()" 
                            class="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" 
                            class="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors">
                        <span class="material-symbols-outlined">save</span>
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configurar el submit del formulario
    document.getElementById('formEditarDeportista').addEventListener('submit', async function(e) {
        e.preventDefault();
        await guardarCambiosDeportista();
    });
}

// FUNCIÓN: Guardar cambios del deportista (peso, altura, talla)
async function guardarCambiosDeportista() {
    if (!deportistaSeleccionado) return;
    
    try {
        setLoading(true);
        
        // Obtener solo los campos editables
        const pesoInput = document.getElementById('editPeso');
        const alturaInput = document.getElementById('editAltura');
        const tallaInput = document.getElementById('editTalla');
        
        if (!pesoInput || !alturaInput || !tallaInput) {
            mostrarError('Error: No se encontraron los campos de edición');
            setLoading(false);
            return;
        }
        
        const peso = pesoInput.value;
        const altura = alturaInput.value;
        const talla = tallaInput.value;
        
        // Validaciones
        const cambios = {};
        
        if (peso !== '') {
            const pesoNum = parseFloat(peso);
            if (isNaN(pesoNum) || pesoNum <= 0 || pesoNum > 300) {
                mostrarError('El peso debe ser un número válido entre 1 y 300 kg');
                setLoading(false);
                return;
            }
            cambios.peso = pesoNum;
        }
        
        if (altura !== '') {
            const alturaNum = parseFloat(altura);
            if (isNaN(alturaNum) || alturaNum <= 0 || alturaNum > 3) {
                mostrarError('La altura debe ser un número válido entre 0.5 y 3 metros');
                setLoading(false);
                return;
            }
            cambios.altura = alturaNum;
        }
        
        if (talla !== '') {
            cambios.talla = talla;
        }
        
        // Verificar si hay cambios
        if (Object.keys(cambios).length === 0) {
            mostrarError('No hay cambios para guardar');
            setLoading(false);
            return;
        }
        
        console.log('💾 Guardando cambios usando EntrenadorAPI...', cambios);
        
        // Usar el método de la API para entrenadores
        await EntrenadorAPI.updateDeportista(deportistaSeleccionado.id, cambios);
        
        // Actualizar localmente
        const index = deportistas.findIndex(d => d.id === deportistaSeleccionado.id);
        if (index !== -1) {
            Object.assign(deportistas[index], cambios);
        }
        
        // Actualizar la tabla
        mostrarDeportistas();
        cerrarModal();
        
        // Mostrar mensaje de éxito
        mostrarMensaje('✅ Datos físicos actualizados correctamente', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al guardar los cambios: ' + error.message);
    } finally {
        setLoading(false);
    }
}

// ============================================
// FUNCIONES DE FILTRADO
// ============================================

function filtrarDeportistas() {
    currentPage = 1;
    mostrarDeportistas();
    actualizarEstadisticas();
}

function filtrarDeportistasLocal() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filtroNivel = document.getElementById('filtroNivel')?.value || 'todos';
    const filtroEstado = document.getElementById('filtroEstado')?.value || 'todos';
    const filtroEquipo = document.getElementById('filtroEquipo')?.value || 'todos';
    
    return deportistas.filter(deportista => {
        const matchBusqueda = searchTerm === '' || 
            deportista.nombre.toLowerCase().includes(searchTerm) ||
            deportista.email.toLowerCase().includes(searchTerm) ||
            deportista.telefono.includes(searchTerm);
        
        const matchNivel = filtroNivel === 'todos' || deportista.nivel_actual === filtroNivel;
        const matchEstado = filtroEstado === 'todos' || deportista.estado === filtroEstado;
        const matchEquipo = filtroEquipo === 'todos' || deportista.equipo_competitivo === filtroEquipo;
        
        return matchBusqueda && matchNivel && matchEstado && matchEquipo;
    });
}

function limpiarFiltros() {
    if (document.getElementById('searchInput')) document.getElementById('searchInput').value = '';
    if (document.getElementById('filtroNivel')) document.getElementById('filtroNivel').value = 'todos';
    if (document.getElementById('filtroEstado')) document.getElementById('filtroEstado').value = 'todos';
    if (document.getElementById('filtroEquipo')) document.getElementById('filtroEquipo').value = 'todos';
    filtrarDeportistas();
}

// ============================================
// ESTADÍSTICAS
// ============================================

function actualizarEstadisticas() {
    const total = deportistas.length;
    const activos = deportistas.filter(d => d.estado === 'activo').length;
    const lesionados = deportistas.filter(d => d.estado === 'lesionado').length;
    const pendientesPago = deportistas.filter(d => d.estado === 'pendiente_de_pago').length;
    const sinEquipo = deportistas.filter(d => d.equipo_competitivo === 'sin_equipo').length;
    const filtrados = deportistasFiltrados.length;
    
    document.getElementById('totalDeportistas').textContent = total;
    document.getElementById('activosDeportistas').textContent = activos;
    document.getElementById('lesionadosDeportistas').textContent = lesionados;
    document.getElementById('pendientesPagoDeportistas').textContent = pendientesPago;
    document.getElementById('sinEquipoDeportistas').textContent = sinEquipo;
    document.getElementById('filtradosDeportistas').textContent = filtrados;
    
    // Actualizar porcentaje de activos
    const porcentajeActivos = total > 0 ? Math.round((activos / total) * 100) : 0;
    document.getElementById('activosPercentage').textContent = `${porcentajeActivos}%`;
}

// ============================================
// PAGINACIÓN
// ============================================

function actualizarPaginacion() {
    const totalPages = Math.ceil(deportistasFiltrados.length / itemsPerPage);
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const showingText = document.getElementById('showingText');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
        prevBtn.classList.toggle('opacity-50', currentPage === 1);
        prevBtn.classList.toggle('cursor-not-allowed', currentPage === 1);
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages || totalPages === 0;
        nextBtn.classList.toggle('opacity-50', currentPage === totalPages || totalPages === 0);
        nextBtn.classList.toggle('cursor-not-allowed', currentPage === totalPages || totalPages === 0);
    }
    
    if (showingText) {
        const startIndex = (currentPage - 1) * itemsPerPage + 1;
        const endIndex = Math.min(currentPage * itemsPerPage, deportistasFiltrados.length);
        showingText.textContent = `Mostrando ${startIndex}-${endIndex} de ${deportistasFiltrados.length} deportistas`;
    }
}

function paginaAnterior() {
    if (currentPage > 1) {
        currentPage--;
        mostrarDeportistas();
    }
}

function paginaSiguiente() {
    const totalPages = Math.ceil(deportistasFiltrados.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        mostrarDeportistas();
    }
}

// ============================================
// UI HELPERS
// ============================================

function setLoading(loading) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('hidden', !loading);
    }
}

function mostrarMensaje(mensaje, tipo = 'info') {
    EntrenadorAPI.showNotification(mensaje, tipo);
}

function mostrarError(mensaje) {
    mostrarMensaje(mensaje, 'error');
}

function limpiarMensajes() {
    const container = document.getElementById('notificationContainer');
    if (container) container.innerHTML = '';
}

function cerrarModal() {
    const modales = document.querySelectorAll('#modalDetallesDeportista, #modalEditarDeportista');
    modales.forEach(modal => modal?.remove());
}

// ============================================
// FUNCIONES DEL SIDEBAR
// ============================================

function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    mostrarMensaje(`Modo ${isDark ? 'oscuro' : 'claro'} activado`, 'info');
}

function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        EntrenadorAPI.logout();
    }
}

function mostrarAyuda() {
    mostrarMensaje(
        'Sistema de Gestión de Deportistas\n\n' +
        '• Usa los filtros para buscar\n' +
        '• Haz clic en Ver Detalles para más información\n' +
        '• Haz clic en Editar para modificar datos físicos\n' +
        '• Los deportistas con pago pendiente están bloqueados',
        'info'
    );
}

// ============================================
// SERVIDOR Y UTILIDADES
// ============================================

async function updateServerStatus() {
    try {
        const isOnline = await EntrenadorAPI.checkServerStatus();
        
        document.getElementById('serverStatus').textContent = isOnline ? 'ONLINE' : 'OFFLINE';
        
        const dot = document.getElementById('statusDot');
        if (dot) {
            dot.className = isOnline ? 
                'w-2 h-2 rounded-full bg-green-500' : 
                'w-2 h-2 rounded-full bg-red-500';
        }
        
    } catch (error) {
        console.error('❌ Error verificando estado del servidor:', error);
    }
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

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

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================

window.cargarDeportistas = cargarDeportistas;
window.limpiarFiltros = limpiarFiltros;
window.toggleTheme = toggleTheme;
window.logout = logout;
window.mostrarAyuda = mostrarAyuda;
window.verDetallesCompletos = verDetallesCompletos;
window.editarDeportistaCompleto = editarDeportistaCompleto;
window.cerrarModal = cerrarModal;
window.abrirMenuNivel = abrirMenuNivel;
window.abrirMenuEquipo = abrirMenuEquipo;
window.abrirMenuEstado = abrirMenuEstado;
window.cerrarMenuSeleccion = cerrarMenuSeleccion;
window.seleccionarOpcion = seleccionarOpcion;
window.cerrarNotificacionPago = cerrarNotificacionPago;

console.log('✅ Script de deportistas (Entrenador) cargado correctamente con TODAS las funcionalidades');