// ==========================================
// CAMBIAR CONTRASEÑA - JavaScript COMPLETO
// ==========================================

// Configuración
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://gestiondeportistas-production.up.railway.app';

const CONFIG = {
    RESET_PASSWORD_URL: `${API_BASE_URL}/api/auth/reset-password`
};
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Cambiar Contraseña page loaded');
    
    // Verificar que tenemos los datos necesarios
    const recoveryEmail = localStorage.getItem('recovery_email');
    const verifiedCode = localStorage.getItem('verified_code');
    
    if (!recoveryEmail || !verifiedCode) {
        // Si no hay datos, redirigir al inicio
        console.warn('❌ Datos faltantes, redirigiendo...');
        alert('❌ Sesión expirada. Serás redirigido para iniciar el proceso nuevamente.');
        setTimeout(() => {
            window.location.href = 'recuperar-contrasena.html';
        }, 2000);
        return;
    }
    
    console.log('📧 Email en recuperación:', recoveryEmail);
    console.log('🔑 Código verificado:', verifiedCode);
    
    // Mostrar email
    displayRecoveryEmail();
    
    // Inicializar funciones
    initPasswordToggle();
    initPasswordValidation();
    initCambiarForm();
});

// Mostrar email de recuperación
function displayRecoveryEmail() {
    const recoveryEmail = localStorage.getItem('recovery_email');
    const emailText = document.getElementById('emailText');
    
    if (emailText && recoveryEmail) {
        // Ocultar parte del email para privacidad
        const [username, domain] = recoveryEmail.split('@');
        const hiddenUsername = username.substring(0, 3) + '***';
        emailText.textContent = `${hiddenUsername}@${domain}`;
    }
}

// Inicializar toggle para mostrar/ocultar contraseña
function initPasswordToggle() {
    console.log('👁️ Inicializando toggle de contraseña...');
    
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('.material-symbols-outlined');
            
            if (input && icon) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.textContent = 'visibility_off';
                } else {
                    input.type = 'password';
                    icon.textContent = 'visibility';
                }
            }
        });
    });
}

// Inicializar validación de contraseña
function initPasswordValidation() {
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    // Validar contraseña en tiempo real
    if (newPassword) {
        newPassword.addEventListener('input', validatePassword);
        newPassword.addEventListener('input', validatePasswordConfirmation);
    }
    
    // Validar confirmación en tiempo real
    if (confirmPassword) {
        confirmPassword.addEventListener('input', validatePasswordConfirmation);
    }
}

// Validar requisitos de contraseña
function validatePassword() {
    const password = document.getElementById('newPassword').value;
    
    // Validar cada requisito
    const requirements = document.querySelectorAll('.requirement');
    
    let allValid = true;
    
    requirements.forEach(req => {
        const type = req.getAttribute('data-req');
        let isValid = false;
        
        switch(type) {
            case 'length':
                isValid = password.length >= 8;
                break;
            case 'uppercase':
                isValid = /[A-Z]/.test(password);
                break;
            case 'lowercase':
                isValid = /[a-z]/.test(password);
                break;
            case 'number':
                isValid = /\d/.test(password);
                break;
            case 'special':
                isValid = /[!@#$%^&*]/.test(password);
                break;
        }
        
        if (isValid) {
            req.classList.add('valid');
            req.classList.remove('invalid');
        } else {
            req.classList.remove('valid');
            req.classList.add('invalid');
            allValid = false;
        }
    });
    
    return allValid;
}

// Validar confirmación de contraseña
function validatePasswordConfirmation() {
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorConfirm = document.getElementById('errorConfirm');
    
    if (confirmPassword && password !== confirmPassword) {
        showError('errorConfirm', 'Las contraseñas no coinciden');
        return false;
    } else {
        hideError('errorConfirm');
        return true;
    }
}

// Validar todos los requisitos
function validateAllRequirements() {
    const password = document.getElementById('newPassword').value;
    const requirements = document.querySelectorAll('.requirement.valid');
    
    return requirements.length === 5 && password.length >= 8;
}

// Obtener el rol del usuario desde donde vino
function getUserRoleFromRecovery() {
    // 1. Intentar obtener el rol específico para recuperación
    const recoveryRole = localStorage.getItem('user_role_before_recovery');
    
    if (recoveryRole) {
        console.log(`📋 Rol obtenido de recuperación: ${recoveryRole}`);
        // Limpiar después de usar
        localStorage.removeItem('user_role_before_recovery');
        return recoveryRole;
    }
    
    // 2. Intentar obtener el rol general
    const userRole = localStorage.getItem('user_role');
    
    if (userRole) {
        console.log(`📋 Rol obtenido de localStorage: ${userRole}`);
        return userRole;
    }
    
    // 3. Si no hay rol, usar 'deportista' como predeterminado
    console.log('📋 Usando rol predeterminado: deportista');
    return 'deportista';
}

// Inicializar formulario de cambio de contraseña
function initCambiarForm() {
    const form = document.getElementById('cambiarForm');
    const btnCambiar = document.getElementById('btnCambiar');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (form && btnCambiar) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Obtener valores
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const email = localStorage.getItem('recovery_email');
            const code = localStorage.getItem('verified_code');
            
            console.log('🔐 Validando contraseña...');
            
            // Validar contraseña
            if (!validateAllRequirements()) {
                showError('errorPassword', 'La contraseña no cumple con todos los requisitos');
                return;
            }
            
            // Validar confirmación
            if (!validatePasswordConfirmation()) {
                return;
            }
            
            // Cambiar texto del botón y mostrar loading
            const originalText = btnCambiar.innerHTML;
            btnCambiar.innerHTML = '<span>RESTABLECIENDO...</span>';
            btnCambiar.disabled = true;
            
            if (loadingSpinner) {
                loadingSpinner.classList.remove('hidden');
            }
            
            try {
                console.log('🔐 Enviando solicitud de cambio de contraseña...');
                
                // Enviar solicitud al backend
                const response = await fetch(CONFIG.RESET_PASSWORD_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        email, 
                        code,
                        newPassword
                    })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    console.log('✅ Contraseña cambiada exitosamente');
                    
                    // Mostrar mensaje de éxito
                    showSuccess('successMessage', '✅ Contraseña restablecida exitosamente. Redirigiendo...');
                    
                    // Obtener el rol original del usuario
                    const userRole = getUserRoleFromRecovery();
                    console.log(`🎯 Redirigiendo a login con rol: ${userRole}`);
                    
                    // Limpiar localStorage de recuperación
                    localStorage.removeItem('recovery_email');
                    localStorage.removeItem('verified_code');
                    
                    // Redirigir al login con el rol original después de 2 segundos
                    setTimeout(() => {
                        const redirectUrl = `login.html?role=${userRole}`;
                        console.log(`🔄 Redirigiendo a: ${redirectUrl}`);
                        window.location.href = redirectUrl;
                    }, 2000);
                    
                } else {
                    throw new Error(data.message || 'Error al cambiar la contraseña');
                }
                
            } catch (error) {
                console.error('❌ Error:', error);
                
                // Mostrar error
                showError('errorPassword', 'Error: ' + error.message);
                
                // Restaurar botón
                btnCambiar.innerHTML = originalText;
                btnCambiar.disabled = false;
                
            } finally {
                // Ocultar loading spinner
                if (loadingSpinner) {
                    loadingSpinner.classList.add('hidden');
                }
            }
        });
    }
}

// Funciones auxiliares
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            hideError(elementId);
        }, 5000);
    }
}

function hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove('show');
        setTimeout(() => {
            element.textContent = '';
        }, 300);
    }
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');
    }
}

// Función para validar que el botón de ojo funciona
function testTogglePassword() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    console.log(`🔍 Encontrados ${toggleButtons.length} botones de toggle`);
    
    toggleButtons.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            console.log(`👁️ Botón ${index + 1} clickeado`);
        });
    });
}

// Llamar test al cargar
setTimeout(testTogglePassword, 1000);