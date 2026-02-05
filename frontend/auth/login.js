// ==========================================
// LOGIN DINÁMICO POR ROL - VERSIÓN CORREGIDA
// ==========================================

// Configuración
const CONFIG = {
    API_URL: 'https://gestiondeportistas-production.up.railway.app/api/auth/login', // ✅ CAMBIAR AQUÍ
    ROLES: ['deportista', 'entrenador', 'admin'],
    DEFAULT_ROLE: 'deportista'
};

// Estado
let currentRole = CONFIG.DEFAULT_ROLE;

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Login page loaded');
    
    // 1. Obtener rol del parámetro de URL
    detectRoleFromUrl();
    
    // 2. Configurar UI según el rol
    setupLoginForRole(currentRole);
    
    // 3. Inicializar formulario
    initLoginForm();
    initFormValidation();
    loadRememberedCredentials();
    
    // 4. Verificar autenticación (opcional)
    // checkAuthStatus();
    
    setupRecoverPasswordLink();
});

// ==========================================
// DETECCIÓN DE ROL DESDE URL
// ==========================================

function detectRoleFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role');
    
    console.log('🔍 Parámetro role:', roleParam);
    
    // Validar y establecer rol
    if (roleParam && CONFIG.ROLES.includes(roleParam)) {
        currentRole = roleParam;
        console.log(`🎯 Rol detectado: ${currentRole}`);
    } else {
        // Si no hay parámetro válido, usar deportista por defecto
        console.warn('⚠️ No se detectó rol válido, usando deportista por defecto');
        currentRole = CONFIG.DEFAULT_ROLE;
    }
    
    // Guardar en localStorage
    localStorage.setItem('selected_role', currentRole);
    
    // Limpiar URL (opcional)
    cleanUrlParameters();
}

function cleanUrlParameters() {
    if (window.history.replaceState) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }
}

// ==========================================
// CONFIGURAR UI PARA EL ROL
// ==========================================

function setupLoginForRole(role) {
    console.log(`⚙️ Configurando login para: ${role}`);
    
    // 1. Configurar badge del rol
    setupRoleBadge(role);
    
    // 2. Configurar título y subtítulo
    setupLoginHeaders(role);
    
    // 3. Configurar placeholder del email
    setupEmailPlaceholder(role);
    
    // 4. Configurar texto del botón
    setupButtonText(role);
    
    // 5. Configurar botón de volver (DINÁMICO según rol)
    setupBackButton(role);
    
    // 6. Configurar opciones de registro (si aplica)
    setupRegisterOptions(role);
}

function setupRoleBadge(role) {
    const roleBadge = document.getElementById('roleBadge');
    if (!roleBadge) return;
    
    let icon, text;
    
    switch(role) {
        case 'admin':
            icon = 'admin_panel_settings';
            text = 'ADMINISTRADOR';
            break;
        case 'entrenador':
            icon = 'fitness_center';
            text = 'ENTRENADOR';
            break;
        case 'deportista':
        default:
            icon = 'sports_martial_arts';
            text = 'DEPORTISTA';
            break;
    }
    
    roleBadge.innerHTML = `
        <span class="material-symbols-outlined">${icon}</span>
        <span>${text}</span>
    `;
}

function setupLoginHeaders(role) {
    const loginTitle = document.getElementById('loginTitle');
    const loginSubtitle = document.getElementById('loginSubtitle');
    
    if (!loginTitle || !loginSubtitle) return;
    
    let title, subtitle;
    
    switch(role) {
        case 'admin':
            title = 'ACCESO <span class="text-primary">ADMINISTRADOR</span>';
            subtitle = 'Control total del sistema';
            break;
        case 'entrenador':
            title = 'ACCESO <span class="text-primary">ENTRENADOR</span>';
            subtitle = 'Gestiona entrenamientos y equipos';
            break;
        case 'deportista':
        default:
            title = 'ACCESO <span class="text-primary">DEPORTISTA</span>';
            subtitle = 'Accede a tu progreso personal';
            break;
    }
    
    loginTitle.innerHTML = title;
    loginSubtitle.textContent = subtitle;
}

function setupEmailPlaceholder(role) {
    const emailInput = document.getElementById('email');
    if (!emailInput) return;
    
    switch(role) {
        case 'admin':
            emailInput.placeholder = 'admin@titanesevolution.com';
            break;
        case 'entrenador':
            emailInput.placeholder = 'entrenador@titanesevolution.com';
            break;
        case 'deportista':
            emailInput.placeholder = 'deportista@email.com';
            break;
    }
}

function setupButtonText(role) {
    const btnLoginText = document.getElementById('btnLoginText');
    if (!btnLoginText) return;
    
    let roleText = '';
    switch(role) {
        case 'admin': roleText = 'ADMINISTRADOR'; break;
        case 'entrenador': roleText = 'ENTRENADOR'; break;
        case 'deportista': roleText = 'DEPORTISTA'; break;
    }
    
    btnLoginText.textContent = `ACCEDER COMO ${roleText}`;
}

// ==========================================
// BOTÓN VOLVER DINÁMICO
// ==========================================

function setupBackButton(role) {
    const btnBackLogin = document.querySelector('.btn-back-login');
    
    if (!btnBackLogin) return;
    
    // Configurar según el rol
    switch(role) {
        case 'admin':
            btnBackLogin.href = 'acceso.html';
            btnBackLogin.innerHTML = `
                <span class="material-symbols-outlined">arrow_back</span>
                Cambiar de rol
            `;
            break;
            
        case 'entrenador':
            btnBackLogin.href = 'acceso.html';
            btnBackLogin.innerHTML = `
                <span class="material-symbols-outlined">arrow_back</span>
                Cambiar de rol
            `;
            break;
            
        case 'deportista':
            btnBackLogin.href = 'acceso-deportista.html';
            btnBackLogin.innerHTML = `
                <span class="material-symbols-outlined">arrow_back</span>
                Volver
            `;
            break;
            
        default:
            btnBackLogin.href = 'acceso.html';
            btnBackLogin.innerHTML = `
                <span class="material-symbols-outlined">arrow_back</span>
                Volver
            `;
    }
}

// ==========================================
// OPCIONES DE REGISTRO DINÁMICAS
// ==========================================

function setupRegisterOptions(role) {
    const registerLinkContainer = document.querySelector('.register-link');
    if (!registerLinkContainer) return;
    
    switch(role) {
        case 'admin':
            registerLinkContainer.innerHTML = `
                <p>Para acceso administrativo, contacta al superadministrador del sistema.</p>
            `;
            break;
            
        case 'entrenador':
            registerLinkContainer.innerHTML = `
                <p>¿Eres un entrenador certificado? 
                    <a href="solicitud-entrenador.html">
                        <strong>Solicita acceso aquí</strong>
                    </a>
                </p>
                <p style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--gray-400);">
                    Si ya tienes credenciales, inicia sesión arriba.
                </p>
            `;
            break;
            
        case 'deportista':
            registerLinkContainer.innerHTML = `
                <p>¿No tienes una cuenta? 
                    <a href="registro-deportista.html">
                        <strong>Regístrate aquí</strong>
                    </a>
                </p>
            `;
            break;
            
        default:
            registerLinkContainer.innerHTML = `
                <p>¿No tienes una cuenta? 
                    <a href="seleccion-registro.html">
                        <strong>Regístrate aquí</strong>
                    </a>
                </p>
            `;
    }
}

// ==========================================
// FORMULARIO DE LOGIN
// ==========================================

function initLoginForm() {
    const form = document.getElementById('loginForm');
    const btnLogin = document.getElementById('btnLogin');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (form && btnLogin) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validar campos
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            const emailValid = validateEmail(email);
            const passwordValid = validatePassword(password);
            
            if (!emailValid || !passwordValid) {
                showNotification('Por favor, corrige los errores en el formulario', 'error');
                return;
            }
            
            const remember = document.getElementById('remember').checked;
            
            // Mostrar loading
            btnLogin.disabled = true;
            if (loadingSpinner) loadingSpinner.classList.remove('hidden');
            
            try {
                console.log(`🔐 Intentando login como: ${currentRole}`);
                
                // Preparar datos
                const loginData = {
                    email: email,
                    password: password,
                    role: currentRole
                };
                
                console.log('📤 Enviando datos:', { ...loginData, password: '***' });
                
                // Enviar al backend
                const response = await fetch(CONFIG.API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(loginData)
                });
                
                console.log('📥 Respuesta recibida, status:', response.status);
                
                // Intentar parsear la respuesta
                let data;
                try {
                    data = await response.json();
                    console.log('📊 Datos de respuesta:', data);
                } catch (parseError) {
                    console.error('❌ Error parseando respuesta:', parseError);
                    throw new Error('Error en la respuesta del servidor');
                }
                
                if (response.ok && data.success) {
                    console.log('✅ Login exitoso');
                    
                    // Guardar datos CORRECTAMENTE
                    saveAuthData(data, email, remember);
                    
                    // Mostrar mensaje
                    showNotification('¡Inicio de sesión exitoso! Redirigiendo...', 'success');
                    
                    // Redirigir después de un breve delay
                    setTimeout(() => {
                        redirectByRole(data.user?.role || currentRole);
                    }, 1000);
                    
                } else {
                    throw new Error(data.error || data.message || 'Credenciales incorrectas');
                }
                
            } catch (error) {
                console.error('❌ Error en el login:', error);
                showNotification(error.message || 'Error al iniciar sesión. Verifica tus credenciales.', 'error');
                
            } finally {
                // Ocultar loading
                btnLogin.disabled = false;
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
            }
        });
    }
}

function setupRecoverPasswordLink() {
    const forgotLink = document.querySelector('.forgot-link');
    
    if (forgotLink) {
        forgotLink.addEventListener('click', function(e) {
            localStorage.setItem('user_role_before_recovery', currentRole);
            console.log(`📝 Guardando rol para recuperación: ${currentRole}`);
        });
    }
}

// ==========================================
// GUARDAR DATOS DE AUTENTICACIÓN (CORREGIDO)
// ==========================================

function saveAuthData(data, email, remember) {
    console.log('💾 Guardando datos de autenticación...');
    
    if (data.token) {
        // GUARDAR TOKEN CON KEY 'token' (IMPORTANTE)
        localStorage.setItem('token', data.token);
        console.log('✅ Token guardado en localStorage con key "token"');
        
        // GUARDAR USUARIO COMPLETO
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log('✅ Usuario guardado:', data.user);
        }
        
        // También guardar datos específicos para compatibilidad
        if (data.user?.role) {
            localStorage.setItem('user_role', data.user.role);
        }
        
        if (data.user?.nombre || data.user?.name) {
            localStorage.setItem('user_name', data.user.nombre || data.user.name);
        }
        
        if (data.user?.email) {
            localStorage.setItem('user_email', data.user.email);
        }
        
        if (data.user?.id || data.user?.userId) {
            localStorage.setItem('user_id', data.user.id || data.user.userId);
        }
        
        // Guardar también en sessionStorage
        sessionStorage.setItem('token', data.token);
        if (data.user) {
            sessionStorage.setItem('user', JSON.stringify(data.user));
        }
        
        // Manejar "Recordarme"
        if (remember) {
            localStorage.setItem('remembered_email', email);
        } else {
            localStorage.removeItem('remembered_email');
        }
        
        // Verificar que todo se guardó
        console.log('🔍 Verificación de datos guardados:');
        console.log('- token:', localStorage.getItem('token') ? 'OK' : 'FALTANTE');
        console.log('- user:', localStorage.getItem('user') ? 'OK' : 'FALTANTE');
        console.log('- user_role:', localStorage.getItem('user_role') || 'No especificado');
        
    } else {
        console.error('❌ No se recibió token en la respuesta');
    }
}

// ==========================================
// REDIRECCIÓN POR ROL
// ==========================================

function redirectByRole(role) {
    console.log(`🔄 Redirigiendo por rol: ${role}`);
    
    let redirectUrl = '';
    
    switch(role) {
        case 'admin':
            redirectUrl = '../admin/dashboard.html';
            break;
        case 'entrenador':
            redirectUrl = '../entrenador/dashboard.html';
            break;
        case 'deportista':
            redirectUrl = '../deportista/dashboard.html';
            break;
        default:
            redirectUrl = '../deportista/dashboard.html';
    }
    
    console.log(`📍 Redirigiendo a: ${redirectUrl}`);
    window.location.href = redirectUrl;
}

// ==========================================
// VALIDACIÓN Y FORMULARIO
// ==========================================

function initFormValidation() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            validateEmail(this.value.trim());
        });
        
        emailInput.addEventListener('input', function() {
            clearError('errorEmail');
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('blur', function() {
            validatePassword(this.value);
        });
        
        passwordInput.addEventListener('input', function() {
            clearError('errorPassword');
        });
    }
    
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordField = document.getElementById('password');
            const icon = this.querySelector('.material-symbols-outlined');
            
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                icon.textContent = 'visibility_off';
            } else {
                passwordField.type = 'password';
                icon.textContent = 'visibility';
            }
        });
    }
}

function loadRememberedCredentials() {
    const rememberedEmail = localStorage.getItem('remembered_email');
    const emailInput = document.getElementById('email');
    
    if (rememberedEmail && emailInput) {
        emailInput.value = rememberedEmail;
        document.getElementById('remember').checked = true;
    }
}

// ==========================================
// FUNCIONES DE VALIDACIÓN
// ==========================================

function validateEmail(email) {
    if (!email) {
        showError('errorEmail', 'El correo electrónico es obligatorio');
        return false;
    }
    
    if (!isValidEmail(email)) {
        showError('errorEmail', 'Email inválido');
        return false;
    }
    
    clearError('errorEmail');
    return true;
}

function validatePassword(password) {
    if (!password) {
        showError('errorPassword', 'La contraseña es obligatoria');
        return false;
    }
    
    if (password.length < 6) {
        showError('errorPassword', 'Mínimo 6 caracteres');
        return false;
    }
    
    clearError('errorPassword');
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');
    }
}

function clearError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = '';
        element.classList.remove('show');
    }
}

// ==========================================
// NOTIFICACIONES
// ==========================================

function showNotification(message, type = 'info') {
    // Intentar usar Utils si está disponible
    if (typeof Utils !== 'undefined' && Utils.showNotification) {
        Utils.showNotification(message, type);
        return;
    }
    
    // Crear notificación manual
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#E21B23' : '#3B82F6'};
        color: white;
        border-radius: 0.5rem;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-weight: 500;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    // Agregar estilos de animación si no existen
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ==========================================
// MANEJO DE ERRORES DE IMÁGENES
// ==========================================

document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function() {
        console.warn('⚠️ Error cargando imagen:', this.src);
        const fallback = document.createElement('div');
        fallback.style.cssText = `
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #E21B23 0%, #1A1A1A 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: 'Oswald', sans-serif;
            font-weight: 900;
            font-style: italic;
            font-size: 1.5rem;
        `;
        fallback.textContent = 'TE';
        this.parentNode.appendChild(fallback);
        this.style.display = 'none';
    });
});

console.log('✅ Login.js cargado correctamente');