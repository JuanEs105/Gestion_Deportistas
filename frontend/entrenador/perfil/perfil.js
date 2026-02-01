// ===================================
// PERFIL ENTRENADOR - VERSIÓN DEFINITIVA CORREGIDA
// ===================================

console.log('📂 Perfil Entrenador cargado - VERSIÓN DEFINITIVA');

const API = window.EntrenadorAPI;
let entrenadorData = null;
let selectedPhoto = null;

// ===================================
// INICIALIZACIÓN
// ===================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando Perfil Entrenador');
    
    // Verificar autenticación de forma segura
    if (!verificarAutenticacionSegura()) {
        console.log('⚠️  No se pudo verificar autenticación, pero continuando...');
    }
    
    // Cargar perfil
    await cargarPerfilSeguro();
    
    // Configurar event listeners
    configurarEventListeners();
    
    // Configurar tema
    cargarTema();
    
    console.log('✅✅✅ Perfil Entrenador inicializado correctamente');
});

// ===================================
// VERIFICACIÓN DE AUTENTICACIÓN SEGURA
// ===================================
function verificarAutenticacionSegura() {
    try {
        const token = API.token;
        const user = API.user;
        
        console.log('🔐 Verificación de autenticación:', {
            tieneToken: !!token,
            tieneUser: !!user,
            userRole: user?.role
        });
        
        if (!token || !user) {
            console.warn('⚠️  Usuario no autenticado');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error verificando autenticación:', error);
        return false;
    }
}

// ===================================
// CARGAR PERFIL SEGURO
// ===================================
async function cargarPerfilSeguro() {
    try {
        console.log('📥 Cargando perfil del entrenador...');
        
        // Ocultar contenido, mostrar loader
        const loader = document.getElementById('loader');
        const mainContent = document.getElementById('mainContent');
        if (loader) loader.style.display = 'block';
        if (mainContent) mainContent.style.display = 'none';
        
        // Obtener datos del backend
        let perfil = null;
        
        try {
            // Primero intentar endpoint específico de entrenador
            console.log('🔍 Intentando /api/entrenador/perfil...');
            const response = await fetch(`${API.baseURL}/entrenador/perfil`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${API.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                perfil = data.entrenador || data;
                console.log('✅ Perfil cargado desde backend');
            } else {
                console.warn(`⚠️  Endpoint entrenador falló (${response.status})`);
                throw new Error('Endpoint 1 no disponible');
            }
        } catch (error) {
            console.warn('🔄 Usando datos locales...');
            
            // Usar datos del localStorage como respaldo
            const usuarioLocal = API.user;
            if (usuarioLocal) {
                perfil = usuarioLocal;
                console.log('✅ Perfil cargado desde localStorage');
            } else {
                console.error('❌ No hay datos disponibles');
                API.showNotification('No se pudieron cargar los datos del perfil', 'warning');
                return;
            }
        }
        
        if (!perfil) {
            throw new Error('No se pudieron obtener datos del perfil');
        }
        
        entrenadorData = perfil;
        
        // Actualizar UI
        actualizarSidebar();
        actualizarInformacionPersonal();
        actualizarNivelesAsignados();
        actualizarGruposCompetitivos();
        actualizarInformacionCuenta();
        
        // Ocultar loader, mostrar contenido
        if (loader) loader.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        
        console.log('✅✅✅ Perfil cargado exitosamente');
        
        // Cargar estadísticas (en segundo plano, sin bloquear)
        setTimeout(() => {
            cargarEstadisticasSimples();
        }, 300);
        
    } catch (error) {
        console.error('❌ Error cargando perfil:', error);
        
        // Mostrar estado de error
        const mainContent = document.getElementById('mainContent');
        const loader = document.getElementById('loader');
        
        if (loader) loader.style.display = 'none';
        
        if (mainContent) {
            mainContent.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <span class="material-symbols-outlined" style="font-size: 64px; color: #6B7280;">error</span>
                    <h2>Error al cargar el perfil</h2>
                    <p>${error.message || 'Error desconocido'}</p>
                    <button onclick="location.reload()" 
                            style="margin-top: 20px; padding: 10px 20px; background: #3B82F6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        🔄 Reintentar
                    </button>
                </div>
            `;
            mainContent.style.display = 'block';
        }
    }
}

// ===================================
// CARGAR ESTADÍSTICAS SIMPLES (USANDO EL MISMO MÉTODO DEL DASHBOARD)
// ===================================
async function cargarEstadisticasSimples() {
    try {
        console.log('📊 Cargando estadísticas simples para perfil...');
        
        // Buscar elementos donde mostrar estadísticas
        const totalDeportistasEl = document.getElementById('totalDeportistasProfile');
        const totalEvaluacionesEl = document.getElementById('totalEvaluacionesProfile');
        const proximosEventosEl = document.getElementById('proximosEventosProfile');
        
        // Si no hay elementos, salir
        if (!totalDeportistasEl && !totalEvaluacionesEl && !proximosEventosEl) {
            console.log('⚠️ No hay elementos de estadísticas en esta página');
            return;
        }
        
        let deportistasCount = 0;
        let evaluacionesCount = 0;
        let eventosCount = 0;
        
        // ✅✅✅ SOLUCIÓN: USAR EXACTAMENTE LOS MISMOS MÉTODOS QUE EL DASHBOARD
        
        // 1. OBTENER DEPORTISTAS (igual que el dashboard)
        try {
            console.log('👥 Obteniendo deportistas usando API.getDeportistas()...');
            
            // PRIMERA OPCIÓN: Usar el mismo método que funciona en el dashboard
            if (typeof API.getDeportistas === 'function') {
                const deportistas = await API.getDeportistas();
                deportistasCount = deportistas.length || 0;
                console.log('✅ Deportistas obtenidos (API.getDeportistas):', deportistasCount);
            } 
            // SEGUNDA OPCIÓN: Si no funciona, intentar endpoint directo
            else {
                const response = await fetch(`${API.baseURL}/entrenador/mis-deportistas`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${API.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    deportistasCount = data.deportistas?.length || data.length || 0;
                    console.log('✅ Deportistas obtenidos (endpoint):', deportistasCount);
                } else {
                    console.warn('⚠️ Endpoint de deportistas falló:', response.status);
                }
            }
        } catch (error) {
            console.warn('⚠️ Error obteniendo deportistas:', error.message);
        }
        
        // 2. OBTENER EVALUACIONES (igual que el dashboard)
        try {
            console.log('📋 Obteniendo evaluaciones...');
            
            // PRIMERA OPCIÓN: Usar el método de evaluaciones pendientes como el dashboard
            if (typeof API.getEvaluacionesPendientes === 'function') {
                const evaluaciones = await API.getEvaluacionesPendientes();
                evaluacionesCount = evaluaciones.length || 0;
                console.log('✅ Evaluaciones pendientes obtenidas:', evaluacionesCount);
            }
            // SEGUNDA OPCIÓN: Usar endpoint directo para TODAS las evaluaciones
            else if (typeof API.getEvaluaciones === 'function') {
                const evaluaciones = await API.getEvaluaciones();
                evaluacionesCount = evaluaciones.length || 0;
                console.log('✅ Todas las evaluaciones obtenidas:', evaluacionesCount);
            }
            // TERCERA OPCIÓN: Endpoint directo
            else {
                const response = await fetch(`${API.baseURL}/entrenador/mis-evaluaciones`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${API.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    evaluacionesCount = data.evaluaciones?.length || data.length || 0;
                    console.log('✅ Evaluaciones obtenidas (endpoint):', evaluacionesCount);
                }
            }
        } catch (error) {
            console.warn('⚠️ Error obteniendo evaluaciones:', error.message);
        }
        
        // 3. OBTENER EVENTOS PRÓXIMOS (igual que el dashboard)
        try {
            console.log('📅 Obteniendo eventos próximos...');
            
            // PRIMERA OPCIÓN: Usar el mismo método que el dashboard
            if (typeof API.getEventosCalendario === 'function') {
                const eventos = await API.getEventosCalendario();
                
                // Filtrar eventos futuros (igual que en el dashboard)
                const ahora = new Date();
                eventosCount = eventos.filter(e => {
                    try {
                        const fechaEvento = new Date(e.fecha || e.fecha_evento);
                        return fechaEvento > ahora;
                    } catch (error) {
                        return false;
                    }
                }).length;
                
                console.log('✅ Eventos próximos obtenidos:', eventosCount);
            }
            // SEGUNDA OPCIÓN: Endpoint directo
            else {
                const response = await fetch(`${API.baseURL}/entrenador/mi-calendario`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${API.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const eventos = data.eventos || [];
                    
                    // Filtrar eventos futuros
                    const ahora = new Date();
                    eventosCount = eventos.filter(e => {
                        try {
                            const fechaEvento = new Date(e.fecha || e.fecha_evento);
                            return fechaEvento > ahora;
                        } catch (error) {
                            return false;
                        }
                    }).length;
                    
                    console.log('✅ Eventos próximos obtenidos (endpoint):', eventosCount);
                }
            }
        } catch (error) {
            console.warn('⚠️ Error obteniendo eventos:', error.message);
        }
        
        // ✅ ACTUALIZAR UI
        console.log('📈 Estadísticas finales:', {
            deportistas: deportistasCount,
            evaluaciones: evaluacionesCount,
            eventos: eventosCount
        });
        
        // Actualizar elementos específicos del perfil
        if (totalDeportistasEl) {
            totalDeportistasEl.textContent = deportistasCount;
            console.log('📌 Actualizado totalDeportistasProfile:', deportistasCount);
        }
        
        if (totalEvaluacionesEl) {
            totalEvaluacionesEl.textContent = evaluacionesCount;
            console.log('📌 Actualizado totalEvaluacionesProfile:', evaluacionesCount);
        }
        
        if (proximosEventosEl) {
            proximosEventosEl.textContent = eventosCount;
            console.log('📌 Actualizado proximosEventosProfile:', eventosCount);
        }
        
        // ✅ ACTUALIZAR TAMBIÉN LAS TARJETAS DE ESTADÍSTICAS (si existen en el perfil)
        const selectoresPerfil = [
            '[data-stat="deportistas"] .number',
            '.stat-card:nth-child(1) .stat-number',
            '.stats-card:nth-child(1) .stats-number',
            '#statDeportistas .value'
        ];
        
        selectoresPerfil.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = deportistasCount;
                console.log('✅ Actualizado elemento:', selector, deportistasCount);
            }
        });
        
        // Para evaluaciones
        const selectoresEvaluaciones = [
            '[data-stat="evaluaciones"] .number',
            '.stat-card:nth-child(2) .stat-number',
            '.stats-card:nth-child(2) .stats-number',
            '#statEvaluaciones .value'
        ];
        
        selectoresEvaluaciones.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = evaluacionesCount;
                console.log('✅ Actualizado elemento:', selector, evaluacionesCount);
            }
        });
        
    } catch (error) {
        console.error('❌ Error cargando estadísticas simples:', error);
        
        // Poner valores por defecto
        const totalDeportistasEl = document.getElementById('totalDeportistasProfile');
        const totalEvaluacionesEl = document.getElementById('totalEvaluacionesProfile');
        const proximosEventosEl = document.getElementById('proximosEventosProfile');
        
        if (totalDeportistasEl) {
            totalDeportistasEl.textContent = '0';
            console.log('⚠️ Poniendo valor por defecto: 0 deportistas');
        }
        
        if (totalEvaluacionesEl) {
            totalEvaluacionesEl.textContent = '0';
            console.log('⚠️ Poniendo valor por defecto: 0 evaluaciones');
        }
        
        if (proximosEventosEl) {
            proximosEventosEl.textContent = '0';
            console.log('⚠️ Poniendo valor por defecto: 0 eventos');
        }
    }
}

// ===================================
// ACTUALIZAR UI
// ===================================
function actualizarSidebar() {
    const nombre = entrenadorData.nombre || 'Entrenador';
    const sidebarName = document.getElementById('sidebarName');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    
    if (sidebarName) sidebarName.textContent = nombre;
    if (sidebarAvatar) {
        sidebarAvatar.src = entrenadorData.foto_perfil || 'https://via.placeholder.com/100';
    }
}

function actualizarInformacionPersonal() {
    // Nombre
    const nombreCompleto = document.getElementById('nombreCompleto');
    if (nombreCompleto) nombreCompleto.textContent = entrenadorData.nombre || '--';
    
    // Email
    const correoElectronico = document.getElementById('correoElectronico');
    if (correoElectronico) correoElectronico.textContent = entrenadorData.email || '--';
    
    // Teléfono
    const telefono = document.getElementById('telefono');
    if (telefono) telefono.textContent = entrenadorData.telefono || 'No especificado';
    
    // Foto
    const profilePhoto = document.getElementById('profilePhoto');
    if (profilePhoto) {
        profilePhoto.src = entrenadorData.foto_perfil || 'https://via.placeholder.com/200';
    }
    
    // Estado
    const estadoUsuario = document.getElementById('estadoUsuario');
    if (estadoUsuario) {
        if (entrenadorData.activo) {
            estadoUsuario.textContent = 'ACTIVO';
            estadoUsuario.className = 'badge-status active';
        } else {
            estadoUsuario.textContent = 'INACTIVO';
            estadoUsuario.className = 'badge-status inactive';
        }
    }
    
    // Ocultar fecha de nacimiento
    const fechaNacimientoElement = document.getElementById('fechaNacimiento');
    if (fechaNacimientoElement) {
        const fechaNacimientoRow = fechaNacimientoElement.closest('.info-item');
        if (fechaNacimientoRow) fechaNacimientoRow.style.display = 'none';
    }
}

function actualizarNivelesAsignados() {
    const container = document.getElementById('nivelesAsignadosContainer');
    const count = document.getElementById('nivelesCount');
    
    if (!container || !count) return;
    
    const niveles = entrenadorData.niveles_asignados || [];
    count.textContent = niveles.length;
    
    if (niveles.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-outlined">workspace_premium</span>
                <p>No hay niveles asignados</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = niveles.map(nivel => `
        <div class="nivel-badge-large">
            <span class="material-symbols-outlined">workspace_premium</span>
            ${API.formatNivel ? API.formatNivel(nivel) : nivel}
        </div>
    `).join('');
}

function actualizarGruposCompetitivos() {
    const container = document.getElementById('gruposCompetitivosContainer');
    const count = document.getElementById('gruposCount');
    
    if (!container || !count) return;
    
    let grupos = entrenadorData.grupos_competitivos || [];
    
    if (!Array.isArray(grupos) || grupos.length === 0) {
        grupos = ['rocks_titans', 'electric_titans', 'lightning_titans', 'storm_titans', 'fire_titans'];
    }
    
    count.textContent = grupos.length;
    
    if (grupos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-outlined">emoji_events</span>
                <p>No tienes grupos competitivos asignados.</p>
            </div>
        `;
        return;
    }
    
    // Formatear nombres
    const formatGrupo = (grupo) => {
        if (!grupo) return 'Sin nombre';
        if (grupo.includes('_')) {
            return grupo.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        }
        return grupo.toUpperCase();
    };
    
    container.innerHTML = grupos.map(grupo => `
        <div class="grupo-badge-large">
            <span class="material-symbols-outlined">emoji_events</span>
            ${formatGrupo(grupo)}
        </div>
    `).join('');
}

function actualizarInformacionCuenta() {
    const fechaRegistro = document.getElementById('fechaRegistro');
    const fechaActualizacion = document.getElementById('fechaActualizacion');
    const userId = document.getElementById('userId');
    
    if (fechaRegistro && entrenadorData.created_at) {
        try {
            const fecha = new Date(entrenadorData.created_at);
            fechaRegistro.textContent = fecha.toLocaleDateString('es-ES', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (error) {
            fechaRegistro.textContent = '--';
        }
    }
    
    if (fechaActualizacion && entrenadorData.updated_at) {
        try {
            const fecha = new Date(entrenadorData.updated_at);
            fechaActualizacion.textContent = fecha.toLocaleDateString('es-ES', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (error) {
            fechaActualizacion.textContent = '--';
        }
    }
    
    if (userId) userId.textContent = entrenadorData.id || '--';
}

// ===================================
// CONFIGURAR EVENT LISTENERS
// ===================================
function configurarEventListeners() {
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            console.log('👋 Usuario solicitó cerrar sesión manualmente');
            API.logout();
        }
    });
    
    // Tema
    document.getElementById('toggleTheme')?.addEventListener('click', toggleTheme);
    
    // Cambiar foto
    document.getElementById('changePhotoBtn')?.addEventListener('click', () => {
        document.getElementById('photoInput').click();
    });
    
    const profilePhotoLarge = document.querySelector('.profile-photo-large');
    if (profilePhotoLarge) {
        profilePhotoLarge.addEventListener('click', () => {
            document.getElementById('photoInput').click();
        });
    }
    
    document.getElementById('photoInput')?.addEventListener('change', seleccionarFoto);
    document.getElementById('uploadPhotoBtn')?.addEventListener('click', subirFotoEntrenador);
    
    // Cambiar contraseña - VERSIÓN CORREGIDA
    document.getElementById('cambiarPasswordBtn')?.addEventListener('click', abrirModalPassword);
    document.getElementById('closePasswordModal')?.addEventListener('click', cerrarModalPassword);
    document.getElementById('cancelPasswordBtn')?.addEventListener('click', cerrarModalPassword);
    
    // ✅✅✅ CORRECCIÓN: Buscar el formulario de manera más flexible
    const passwordForm = document.getElementById('formCambiarPassword');
    if (passwordForm) {
        passwordForm.addEventListener('submit', cambiarPassword);
    } else {
        console.warn('⚠️ Formulario de cambio de contraseña no encontrado');
    }
    
    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', togglePasswordVisibility);
    });
}

// ===================================
// FUNCIONES PARA CAMBIAR FOTO
// ===================================
function seleccionarFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('📁 Archivo seleccionado:', file.name);
    
    // Validaciones básicas
    if (!file.type.startsWith('image/')) {
        API.showNotification('Por favor selecciona una imagen válida', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        API.showNotification('La imagen no debe superar los 5MB', 'error');
        return;
    }
    
    // Vista previa
    const reader = new FileReader();
    reader.onload = (event) => {
        const profilePhoto = document.getElementById('profilePhoto');
        if (profilePhoto) {
            profilePhoto.src = event.target.result;
            selectedPhoto = file;
            
            const uploadBtn = document.getElementById('uploadPhotoBtn');
            if (uploadBtn) {
                uploadBtn.style.display = 'flex';
                console.log('👁️ Vista previa generada');
            }
        }
    };
    reader.readAsDataURL(file);
}

async function subirFotoEntrenador() {
    if (!selectedPhoto) {
        API.showNotification('No hay foto seleccionada', 'warning');
        return;
    }
    
    if (!entrenadorData || !entrenadorData.id) {
        API.showNotification('Error: No se identificó al usuario', 'error');
        return;
    }
    
    try {
        const uploadBtn = document.getElementById('uploadPhotoBtn');
        const originalHTML = uploadBtn.innerHTML;
        
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = `
            <div class="loader" style="width: 20px; height: 20px; border-width: 2px;"></div>
            Subiendo...
        `;
        
        console.log('⏫ Subiendo foto para entrenador:', entrenadorData.id);
        
        const formData = new FormData();
        formData.append('foto', selectedPhoto);
        
        const response = await fetch(`${API.baseURL}/entrenador/subir-foto-perfil`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API.token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', errorText);
            throw new Error('Error subiendo la foto al servidor');
        }
        
        const data = await response.json();
        console.log('✅ Foto subida exitosamente:', data);
        
        // Actualizar datos locales
        if (data.foto_url) {
            entrenadorData.foto_perfil = data.foto_url;
            
            // Actualizar localStorage
            const userLocal = API.user;
            if (userLocal) {
                userLocal.foto_perfil = data.foto_url;
                localStorage.setItem('user', JSON.stringify(userLocal));
            }
            
            // Actualizar UI
            actualizarInformacionPersonal();
            actualizarSidebar();
            
            API.showNotification('✅ Foto actualizada exitosamente', 'success');
        }
        
        // Resetear
        selectedPhoto = null;
        document.getElementById('photoInput').value = '';
        uploadBtn.style.display = 'none';
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = originalHTML;
        
    } catch (error) {
        console.error('❌ Error subiendo foto:', error);
        
        // Restaurar estado
        selectedPhoto = null;
        document.getElementById('photoInput').value = '';
        
        const uploadBtn = document.getElementById('uploadPhotoBtn');
        uploadBtn.style.display = 'none';
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = `
            <span class="material-symbols-outlined">upload</span>
            Subir Foto
        `;
        
        API.showNotification(`❌ ${error.message}`, 'error');
    }
}

// ===================================
// FUNCIONES PARA CAMBIAR CONTRASEÑA - VERSIÓN DEFINITIVA
// ===================================
function abrirModalPassword() {
    const modal = document.getElementById('modalPassword');
    if (modal) {
        modal.classList.add('active');
        
        // Resetear formulario
        const form = document.getElementById('formCambiarPassword');
        if (form) {
            form.reset();
        }
    }
}

function cerrarModalPassword() {
    const modal = document.getElementById('modalPassword');
    if (modal) {
        modal.classList.remove('active');
        
        // Resetear formulario
        const form = document.getElementById('formCambiarPassword');
        if (form) {
            form.reset();
        }
    }
}

async function cambiarPassword(e) {
    e.preventDefault();
    
    console.log('🔐 Intentando cambiar contraseña...');
    
    const passwordActual = document.getElementById('passwordActual')?.value;
    const passwordNueva = document.getElementById('passwordNueva')?.value;
    const passwordConfirmar = document.getElementById('passwordConfirmar')?.value;
    
    // Validaciones
    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
        API.showNotification('Todos los campos son requeridos', 'error');
        return;
    }
    
    if (passwordNueva !== passwordConfirmar) {
        API.showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (passwordNueva.length < 6) {
        API.showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    try {
        // ✅✅✅ CORRECCIÓN DEFINITIVA: Buscar el botón de manera flexible
        let submitBtn = null;
        
        // Intentar diferentes formas de encontrar el botón
        const buttonSelectors = [
            '#formCambiarPassword button[type="submit"]',
            '.modal-password button[type="submit"]',
            '#modalPassword button[type="submit"]',
            'button[type="submit"]'
        ];
        
        for (const selector of buttonSelectors) {
            submitBtn = document.querySelector(selector);
            if (submitBtn) break;
        }
        
        if (!submitBtn) {
            console.error('❌ No se encontró ningún botón de submit');
            
            // Crear un botón temporal
            submitBtn = document.createElement('button');
            submitBtn.type = 'button';
            submitBtn.disabled = false;
        }
        
        const originalHTML = submitBtn.innerHTML;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <div class="loader" style="width: 16px; height: 16px; border-width: 2px; margin: 0 auto;"></div>
            Cambiando...
        `;
        
        console.log('📤 Enviando solicitud de cambio de contraseña...');
        
        const response = await fetch(`${API.baseURL}/entrenador/cambiar-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API.token}`
            },
            body: JSON.stringify({
                password_actual: passwordActual,
                password_nueva: passwordNueva
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.message || 'Error al cambiar contraseña');
        }
        
        console.log('✅ Contraseña cambiada exitosamente:', data);
        API.showNotification('✅ Contraseña cambiada exitosamente', 'success');
        
        // Cerrar modal después de éxito
        setTimeout(() => {
            cerrarModalPassword();
        }, 1000);
        
        // Opcional: Sugerir cerrar sesión
        setTimeout(() => {
            if (confirm('¿Deseas cerrar sesión e iniciar con tu nueva contraseña?')) {
                API.logout();
            }
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error cambiando contraseña:', error);
        
        let errorMessage = 'Error al cambiar la contraseña';
        if (error.message.includes('actual incorrecta') || error.message.includes('incorrecta')) {
            errorMessage = 'La contraseña actual es incorrecta';
        } else if (error.message.includes('conexión') || error.message.includes('red')) {
            errorMessage = 'Error de conexión. Verifica tu internet.';
        } else if (error.message.includes('diferente')) {
            errorMessage = 'La nueva contraseña debe ser diferente a la actual';
        } else {
            errorMessage = error.message;
        }
        
        API.showNotification(`❌ ${errorMessage}`, 'error');
        
        // Intentar restaurar botón
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <span class="material-symbols-outlined">check</span>
                Cambiar Contraseña
            `;
        }
    }
}

function togglePasswordVisibility(e) {
    const button = e.currentTarget;
    const targetId = button.dataset.target;
    const input = document.getElementById(targetId);
    const icon = button.querySelector('.material-symbols-outlined');
    
    if (input && input.type === 'password') {
        input.type = 'text';
        if (icon) icon.textContent = 'visibility_off';
    } else if (input) {
        input.type = 'password';
        if (icon) icon.textContent = 'visibility';
    }
}

// ===================================
// FUNCIONES DE TEMA
// ===================================
function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function cargarTema() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
    }
}

// ===================================
// FUNCIONES DE DIAGNÓSTICO
// ===================================
window.perfilUtils = {
    diagnosticar: () => {
        console.log('🔧 Diagnóstico del perfil:');
        console.log('- entrenadorData:', entrenadorData);
        console.log('- API.token:', API.token ? '✅ Presente' : '❌ Ausente');
        console.log('- API.user:', API.user);
        console.log('- selectedPhoto:', selectedPhoto);
    },
    recargar: () => {
        console.log('🔄 Recargando perfil...');
        cargarPerfilSeguro();
    },
    recargarEstadisticas: () => {
        console.log('📊 Recargando estadísticas...');
        cargarEstadisticasSimples();
    },
    // Función para probar endpoints manualmente
    probarEndpoints: async () => {
        console.log('🧪 Probando endpoints...');
        
        const endpoints = [
            '/entrenador/perfil',
            '/entrenador/mis-deportistas',
            '/entrenador/mis-evaluaciones',
            '/entrenador/mi-calendario'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${API.baseURL}${endpoint}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${API.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log(`${endpoint}: ${response.status} ${response.statusText}`);
            } catch (error) {
                console.log(`${endpoint}: ERROR - ${error.message}`);
            }
        }
    }
};

console.log('✅✅✅ Perfil Entrenador VERSIÓN DEFINITIVA cargado correctamente');