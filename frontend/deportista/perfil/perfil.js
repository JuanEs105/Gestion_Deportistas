// ===================================
// PERFIL DEPORTISTA - JavaScript
// ===================================

console.log('📂 Perfil Deportista cargado');

const API = window.DeportistaAPI;
let deportistaData = null;
let selectedPhoto = null;

// ===================================
// INICIALIZACIÓN
// ===================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando Perfil Deportista');
    
    if (!API.checkAuth()) return;
    
    await cargarPerfil();
    configurarEventListeners();
    cargarTema();
});

// ===================================
// CARGAR PERFIL
// ===================================
async function cargarPerfil() {
    try {
        mostrarCargando(true);
        
        const perfil = await API.getMe();
        
        console.log('🔍 DEBUG - Datos recibidos del perfil:');
        console.log('- Nombre completo:', perfil?.nombre || perfil?.user?.nombre);
        console.log('- Email:', perfil?.user?.email);
        console.log('- Teléfono:', perfil?.telefono);
        console.log('- Dirección:', perfil?.direccion);
        console.log('- EPS:', perfil?.eps);
        console.log('- Contacto emergencia:', perfil?.contacto_emergencia_nombre);
        console.log('- Contacto teléfono:', perfil?.contacto_emergencia_telefono);
        console.log('- Contacto parentesco:', perfil?.contacto_emergencia_parentesco);
        console.log('- Condición médica:', perfil?.condicion_medica);   // ✅ NUEVO
        
        if (!perfil) throw new Error('No se pudo cargar tu perfil');
        
        deportistaData = perfil;
        console.log('✅ Perfil cargado:', perfil);
        
        actualizarSidebar();
        actualizarInfoRapida();
        actualizarInformacionPersonal();
        actualizarContactoEmergencia();
        actualizarInfoDeportiva();
        actualizarCondicionMedica();   // ✅ NUEVO
        
        mostrarCargando(false);
        mostrarContenido(true);
        
    } catch (error) {
        console.error('❌ Error cargando perfil:', error);
        API.showNotification('Error al cargar tu perfil', 'error');
        mostrarCargando(false);
    }
}

// ===================================
// ACTUALIZAR UI
// ===================================
function actualizarSidebar() {
    const user = deportistaData.user || {};
    const nombre = user.nombre || deportistaData.nombre || 'Deportista';
    
    const sidebarName = document.getElementById('sidebarName');
    const sidebarInitial = document.getElementById('sidebarInitial');
    
    if (sidebarName) sidebarName.textContent = nombre;
    if (sidebarInitial) sidebarInitial.textContent = nombre.charAt(0).toUpperCase();
    
    if (deportistaData.foto_perfil) {
        const sidebarAvatar = document.getElementById('sidebarAvatarContainer');
        if (sidebarAvatar) {
            sidebarAvatar.innerHTML = `
                <img src="${deportistaData.foto_perfil}" alt="${nombre}" class="w-full h-full object-cover">
            `;
        }
    }
}

function actualizarInfoRapida() {
    const quickNivel = document.getElementById('quickNivel');
    const quickEquipo = document.getElementById('quickEquipo');
    const quickEstado = document.getElementById('quickEstado');
    
    if (quickNivel) quickNivel.textContent = API.formatNivel(deportistaData.nivel_actual);
    if (quickEquipo) quickEquipo.textContent = API.formatEquipo(deportistaData.equipo_competitivo);
    if (quickEstado) quickEstado.textContent = API.formatEstado(deportistaData.estado);
}

function actualizarInformacionPersonal() {
    const user = deportistaData.user || {};
    const nombre = user.nombre || deportistaData.nombre || '--';
    const email = user.email || '--';
    const telefono = user.telefono || deportistaData.telefono || 'No especificado';
    const fechaNac = deportistaData.fecha_nacimiento ? 
        new Date(deportistaData.fecha_nacimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : 
        'No especificada';
    
    document.getElementById('displayNombre').textContent = nombre;
    document.getElementById('displayEmail').textContent = email;
    document.getElementById('displayTelefono').textContent = telefono;
    document.getElementById('displayDireccion').textContent = deportistaData.direccion || 'No especificada';
    document.getElementById('displayFechaNac').textContent = fechaNac;
    document.getElementById('displayEPS').textContent = deportistaData.eps || 'No especificada';
    
    const profilePhoto = document.getElementById('profilePhoto');
    if (profilePhoto) profilePhoto.src = deportistaData.foto_perfil || 'https://via.placeholder.com/200';
    
    document.getElementById('editTelefono').value = telefono !== 'No especificado' ? telefono : '';
    document.getElementById('editDireccion').value = deportistaData.direccion || '';
    document.getElementById('editEPS').value = deportistaData.eps || '';
    document.getElementById('editTalla').value = deportistaData.talla_camiseta || '';
}

function actualizarContactoEmergencia() {
    const nombre = deportistaData.contacto_emergencia_nombre || 'No especificado';
    const telefono = deportistaData.contacto_emergencia_telefono || 'No especificado';
    const parentesco = deportistaData.contacto_emergencia_parentesco || 'No especificado';
    
    document.getElementById('displayEmergenciaNombre').textContent = nombre;
    document.getElementById('displayEmergenciaTel').textContent = telefono;
    document.getElementById('displayEmergenciaParentesco').textContent = parentesco;
    
    document.getElementById('editEmergenciaNombre').value = nombre !== 'No especificado' ? nombre : '';
    document.getElementById('editEmergenciaTel').value = telefono !== 'No especificado' ? telefono : '';
    document.getElementById('editEmergenciaParentesco').value = parentesco !== 'No especificado' ? parentesco : '';
}

function actualizarInfoDeportiva() {
    const nivelEl = document.getElementById('infoNivel');
    const equipoEl = document.getElementById('infoEquipo');
    const estadoEl = document.getElementById('infoEstado');
    
    if (nivelEl) {
        const nivel = deportistaData.nivel_actual || 'pendiente';
        nivelEl.textContent = API.formatNivel(nivel);
        nivelEl.className = `nivel-badge ${nivel}`;
    }
    if (equipoEl) equipoEl.textContent = API.formatEquipo(deportistaData.equipo_competitivo);
    if (estadoEl) {
        const estado = deportistaData.estado || 'activo';
        estadoEl.textContent = API.formatEstado(estado);
        estadoEl.className = `badge-estado ${estado}`;
    }
}

// ✅ NUEVA FUNCIÓN: Mostrar condición médica (solo lectura)
function actualizarCondicionMedica() {
    const contenedor = document.getElementById('condicionMedicaSection');
    if (!contenedor) return;   // Si el HTML aún no tiene el elemento, no rompe nada

    const condicion = deportistaData.condicion_medica;
    const tieneCondicion = condicion && condicion.trim() !== '';

    if (tieneCondicion) {
        contenedor.innerHTML = `
            <div class="flex items-center gap-3 mb-4">
                <span class="material-symbols-outlined text-2xl text-red-500">medical_information</span>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Información Médica</h3>
                <span class="ml-auto inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded-full">
                    <span class="material-symbols-outlined text-xs">priority_high</span>
                    Registrada
                </span>
            </div>
            <div class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p class="text-sm font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">warning</span>
                    Condición médica, lesión o alergia declarada al momento del registro:
                </p>
                <p class="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">${escapeHTML(condicion)}</p>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1">
                <span class="material-symbols-outlined text-xs">lock</span>
                Esta información solo puede ser modificada por administración. Si cambió algo, contáctanos.
            </p>
        `;
        contenedor.className = 'bg-white dark:bg-zinc-900 rounded-xl shadow border border-gray-100 dark:border-white/5 p-6 mb-6';
    } else {
        contenedor.innerHTML = `
            <div class="flex items-center gap-3 mb-4">
                <span class="material-symbols-outlined text-2xl text-gray-400">medical_information</span>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Información Médica</h3>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">check_circle</span>
                No registraste ninguna condición médica, lesión o alergia al momento del registro.
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1">
                <span class="material-symbols-outlined text-xs">info</span>
                Si tienes alguna condición que debamos conocer, comunícate con administración.
            </p>
        `;
        contenedor.className = 'bg-white dark:bg-zinc-900 rounded-xl shadow border border-gray-100 dark:border-white/5 p-6 mb-6';
    }
}

// Escape seguro para HTML
function escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================================
// CONFIGURAR EVENT LISTENERS
// ===================================
function configurarEventListeners() {
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (confirm('¿Deseas cerrar sesión?')) API.logout();
    });
    
    document.getElementById('toggleTheme')?.addEventListener('click', toggleTheme);
    
    document.getElementById('editInfoBtn')?.addEventListener('click', mostrarEdicionInfo);
    document.getElementById('cancelInfoBtn')?.addEventListener('click', cancelarEdicionInfo);
    document.getElementById('infoEditMode')?.addEventListener('submit', guardarInformacionPersonal);
    
    document.getElementById('editEmergenciaBtn')?.addEventListener('click', mostrarEdicionEmergencia);
    document.getElementById('cancelEmergenciaBtn')?.addEventListener('click', cancelarEdicionEmergencia);
    document.getElementById('emergenciaEditMode')?.addEventListener('submit', guardarContactoEmergencia);
    
    document.getElementById('changePhotoBtn')?.addEventListener('click', () => {
        document.getElementById('photoInput').click();
    });
    document.getElementById('photoContainer')?.addEventListener('click', () => {
        document.getElementById('photoInput').click();
    });
    document.getElementById('photoInput')?.addEventListener('change', seleccionarFoto);
    document.getElementById('uploadPhotoBtn')?.addEventListener('click', subirFoto);
    
    document.getElementById('cambiarPasswordBtn')?.addEventListener('click', abrirModalPassword);
    document.getElementById('closePasswordModal')?.addEventListener('click', cerrarModalPassword);
    document.getElementById('cancelPasswordBtn')?.addEventListener('click', cerrarModalPassword);
    document.getElementById('formCambiarPassword')?.addEventListener('submit', cambiarPassword);
    
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', togglePasswordVisibility);
    });
}

// ===================================
// EDITAR INFORMACIÓN PERSONAL
// ===================================
function mostrarEdicionInfo() {
    document.getElementById('infoReadMode').classList.add('hidden');
    document.getElementById('infoEditMode').classList.remove('hidden');
}

function cancelarEdicionInfo() {
    document.getElementById('infoEditMode').classList.add('hidden');
    document.getElementById('infoReadMode').classList.remove('hidden');
    actualizarInformacionPersonal();
}

async function guardarInformacionPersonal(e) {
    e.preventDefault();
    
    try {
        const datos = {
            telefono: document.getElementById('editTelefono').value,
            direccion: document.getElementById('editDireccion').value,
            eps: document.getElementById('editEPS').value,
            talla_camiseta: document.getElementById('editTalla').value
        };
        
        const response = await API.updatePerfil(datos);
        
        if (response.deportista) {
            deportistaData = { ...deportistaData, ...response.deportista };
        } else {
            deportistaData = { ...deportistaData, ...datos };
        }
        
        actualizarInformacionPersonal();
        actualizarSidebar();
        cancelarEdicionInfo();
        
        API.showNotification('✅ Información actualizada correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error guardando información:', error);
    }
}

// ===================================
// EDITAR CONTACTO DE EMERGENCIA
// ===================================
function mostrarEdicionEmergencia() {
    document.getElementById('emergenciaReadMode').classList.add('hidden');
    document.getElementById('emergenciaEditMode').classList.remove('hidden');
}

function cancelarEdicionEmergencia() {
    document.getElementById('emergenciaEditMode').classList.add('hidden');
    document.getElementById('emergenciaReadMode').classList.remove('hidden');
    actualizarContactoEmergencia();
}

async function guardarContactoEmergencia(e) {
    e.preventDefault();
    
    try {
        const datos = {
            contacto_emergencia_nombre: document.getElementById('editEmergenciaNombre').value,
            contacto_emergencia_telefono: document.getElementById('editEmergenciaTel').value,
            contacto_emergencia_parentesco: document.getElementById('editEmergenciaParentesco').value
        };
        
        const response = await API.updateContactoEmergencia(datos);
        
        if (response.deportista) {
            deportistaData = { ...deportistaData, ...response.deportista };
        } else {
            deportistaData = { ...deportistaData, ...datos };
        }
        
        actualizarContactoEmergencia();
        cancelarEdicionEmergencia();
        
        API.showNotification('✅ Contacto de emergencia actualizado', 'success');
        
    } catch (error) {
        console.error('❌ Error guardando contacto de emergencia:', error);
    }
}

// ===================================
// CAMBIAR FOTO
// ===================================
function seleccionarFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        API.showNotification('Por favor selecciona una imagen válida', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        API.showNotification('La imagen no debe superar los 5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        document.getElementById('profilePhoto').src = event.target.result;
        selectedPhoto = file;
        document.getElementById('uploadPhotoBtn').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

async function subirFoto() {
    if (!selectedPhoto) {
        API.showNotification('No hay foto seleccionada', 'warning');
        return;
    }
    
    try {
        const uploadBtn = document.getElementById('uploadPhotoBtn');
        const originalText = uploadBtn.innerHTML;
        
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div> Subiendo...';
        
        const formData = new FormData();
        formData.append('foto_perfil', selectedPhoto);
        
        const headers = {};
        if (API.token) headers['Authorization'] = `Bearer ${API.token}`;
        
        const response = await fetch(`${API.baseURL}/deportistas/me/photo`, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error || 'Error subiendo foto');
        
        deportistaData.foto_perfil = result.foto_perfil_url || result.deportista?.foto_perfil;
        
        actualizarInformacionPersonal();
        actualizarSidebar();
        
        API.showNotification('✅ Foto actualizada exitosamente', 'success');
        
        selectedPhoto = null;
        uploadBtn.classList.add('hidden');
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = originalText;
        document.getElementById('photoInput').value = '';
        
    } catch (error) {
        console.error('❌ Error subiendo foto:', error);
        document.getElementById('profilePhoto').src = deportistaData.foto_perfil || 'https://via.placeholder.com/200';
        selectedPhoto = null;
        document.getElementById('photoInput').value = '';
        
        const uploadBtn = document.getElementById('uploadPhotoBtn');
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<span class="material-symbols-outlined">upload</span> Subir Foto';
        
        API.showNotification(error.message || 'Error subiendo la foto', 'error');
    }
}

// ===================================
// CAMBIAR CONTRASEÑA
// ===================================
function abrirModalPassword() {
    document.getElementById('modalPassword').classList.remove('hidden');
    document.getElementById('modalPassword').classList.add('flex');
    document.getElementById('formCambiarPassword').reset();
}

function cerrarModalPassword() {
    document.getElementById('modalPassword').classList.add('hidden');
    document.getElementById('modalPassword').classList.remove('flex');
    document.getElementById('formCambiarPassword').reset();
}

async function cambiarPassword(e) {
    e.preventDefault();
    
    const passwordActual = document.getElementById('passwordActual').value;
    const passwordNueva = document.getElementById('passwordNueva').value;
    const passwordConfirmar = document.getElementById('passwordConfirmar').value;
    
    if (passwordNueva !== passwordConfirmar) {
        API.showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (passwordNueva.length < 6) {
        API.showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    try {
        await API.cambiarPassword(passwordActual, passwordNueva);
        API.showNotification('✅ Contraseña cambiada exitosamente', 'success');
        cerrarModalPassword();
    } catch (error) {
        console.error('❌ Error cambiando contraseña:', error);
    }
}

function togglePasswordVisibility(e) {
    const button = e.currentTarget;
    const targetId = button.dataset.target;
    const input = document.getElementById(targetId);
    const icon = button.querySelector('.material-symbols-outlined');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = 'visibility_off';
    } else {
        input.type = 'password';
        icon.textContent = 'visibility';
    }
}

// ===================================
// TEMA
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
// ESTADOS DE UI
// ===================================
function mostrarCargando(mostrar) {
    const loadingEl = document.getElementById('loadingState');
    if (loadingEl) loadingEl.classList.toggle('hidden', !mostrar);
}

function mostrarContenido(mostrar) {
    const contentEl = document.getElementById('mainContent');
    if (contentEl) contentEl.classList.toggle('hidden', !mostrar);
}

console.log('✅ Perfil Deportista JS inicializado');