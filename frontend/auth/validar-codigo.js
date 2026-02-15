// ==========================================
// VALIDAR CÓDIGO - JavaScript MODIFICADO
// ==========================================

// Configuración
const CONFIG = {
    FORGOT_PASSWORD_URL: 'https://gestiondeportistas-production.up.railway.app/api/auth/forgot-password',
    VERIFY_CODE_URL: 'https://gestiondeportistas-production.up.railway.app/api/auth/verify-code'
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Validar Código page loaded');
    
    // Obtener email del localStorage
    const recoveryEmail = localStorage.getItem('recovery_email');
    
    if (!recoveryEmail) {
        // Si no hay email, redirigir al paso 1
        window.location.href = 'recuperar-contrasena.html';
        return;
    }
    
    // Mostrar email en la página
    const emailInfo = document.getElementById('emailInfo');
    if (emailInfo) {
        emailInfo.textContent = recoveryEmail;
    }
    
    // Inicializar funcionalidad
    initCodeInputs();
    initValidarForm();
    initResendButton();
    
    // Iniciar temporizador para reenviar
    startResendTimer();
});

// Inicializar inputs de código
function initCodeInputs() {
    const inputs = document.querySelectorAll('.code-input');
    
    inputs.forEach((input, index) => {
        // Manejar entrada de caracteres
        input.addEventListener('input', function(e) {
            const value = this.value.replace(/[^0-9]/g, '');
            this.value = value;
            
            if (value) {
                this.classList.add('filled');
                this.classList.remove('error');
                
                // Mover al siguiente input
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            } else {
                this.classList.remove('filled');
            }
            
            updateFullCode();
        });
        
        // Manejar pegado de código completo
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text');
            const numbers = pastedData.replace(/[^0-9]/g, '');
            
            if (numbers.length === 6) {
                inputs.forEach((input, i) => {
                    input.value = numbers[i] || '';
                    input.classList.add('filled');
                    input.classList.remove('error');
                });
                
                inputs[5].focus();
                updateFullCode();
            }
        });
        
        // Manejar teclas especiales
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value && index > 0) {
                // Ir al input anterior y borrar
                inputs[index - 1].focus();
                inputs[index - 1].value = '';
                inputs[index - 1].classList.remove('filled');
                updateFullCode();
            } else if (e.key === 'ArrowLeft' && index > 0) {
                inputs[index - 1].focus();
            } else if (e.key === 'ArrowRight' && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });
    });
}

// Actualizar código completo
function updateFullCode() {
    const inputs = document.querySelectorAll('.code-input');
    const fullCode = Array.from(inputs).map(input => input.value).join('');
    document.getElementById('fullCode').value = fullCode;
    
    // Validar si el código está completo
    if (fullCode.length === 6) {
        document.getElementById('btnValidar').disabled = false;
    } else {
        document.getElementById('btnValidar').disabled = true;
    }
}

// Inicializar formulario de validación
function initValidarForm() {
    const form = document.getElementById('validarForm');
    const btnValidar = document.getElementById('btnValidar');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (form && btnValidar) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const code = document.getElementById('fullCode').value;
            const email = localStorage.getItem('recovery_email');
            
            // Validar que el código tenga 6 dígitos
            if (code.length !== 6) {
                showError('errorCode', 'El código debe tener 6 dígitos');
                highlightErrorInputs();
                return;
            }
            
            // Mostrar loading
            btnValidar.disabled = true;
            if (loadingSpinner) loadingSpinner.classList.remove('hidden');
            
            try {
                console.log('🔐 Verificando código para:', email);
                
                // PRIMERO: Solo verificar el código (sin cambiar contraseña)
                const response = await fetch(CONFIG.VERIFY_CODE_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        email, 
                        code
                    })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    console.log('✅ Código verificado correctamente');
                    
                    // Guardar el código verificado en localStorage para el siguiente paso
                    localStorage.setItem('verified_code', code);
                    localStorage.setItem('verification_token', data.token || 'verified');
                    
                    // Mostrar mensaje de éxito
                    showSuccess('successCode', '✅ Código verificado correctamente');
                    
                    // Redirigir a la página de nueva contraseña después de 1 segundo
                    setTimeout(() => {
                        window.location.href = 'cambiar-contrasena.html';
                    }, 1000);
                    
                } else {
                    throw new Error(data.error || data.message || 'Código inválido o expirado');
                }
                
            } catch (error) {
                console.error('❌ Error:', error);
                
                // Mostrar error
                showError('errorCode', error.message || 'Error al verificar el código. Intenta nuevamente.');
                highlightErrorInputs();
                
                // Limpiar inputs
                setTimeout(() => {
                    clearCodeInputs();
                }, 2000);
                
            } finally {
                // Ocultar loading
                btnValidar.disabled = false;
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
            }
        });
    }
}

// Inicializar botón de reenviar
function initResendButton() {
    const btnResend = document.getElementById('btnResend');
    
    if (btnResend) {
        btnResend.addEventListener('click', async function() {
            const email = localStorage.getItem('recovery_email');
            
            // Deshabilitar botón temporalmente
            this.disabled = true;
            
            try {
                console.log('🔄 Reenviando código a:', email);
                
                // USAR FORGOT-PASSWORD para reenviar
                const response = await fetch(CONFIG.FORGOT_PASSWORD_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    console.log('✅ Código reenviado');
                    
                    // Mostrar mensaje de éxito
                    showSuccess('successCode', '✅ Nuevo código enviado a tu email');
                    
                    // Reiniciar temporizador
                    startResendTimer();
                    
                    // Limpiar inputs
                    clearCodeInputs();
                    
                } else {
                    throw new Error(data.error || data.message || 'Error al reenviar');
                }
                
            } catch (error) {
                console.error('❌ Error:', error);
                showError('errorCode', error.message || 'Error al reenviar el código');
                
                // Rehabilitar botón
                this.disabled = false;
            }
        });
    }
}

// Iniciar temporizador para reenviar
function startResendTimer() {
    let timeLeft = 60;
    const btnResend = document.getElementById('btnResend');
    const countdownElement = document.getElementById('countdown');
    const timerElement = document.getElementById('timer');
    
    if (!btnResend || !countdownElement) return;
    
    // Deshabilitar botón inicialmente
    btnResend.disabled = true;
    timerElement.style.display = 'block';
    
    const timer = setInterval(() => {
        timeLeft--;
        countdownElement.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            btnResend.disabled = false;
            timerElement.style.display = 'none';
        }
    }, 1000);
}

// Resaltar inputs con error
function highlightErrorInputs() {
    const inputs = document.querySelectorAll('.code-input');
    inputs.forEach(input => {
        input.classList.add('error');
    });
    
    // Quitar el error después de 2 segundos
    setTimeout(() => {
        inputs.forEach(input => {
            input.classList.remove('error');
        });
    }, 2000);
}

// Limpiar inputs de código
function clearCodeInputs() {
    const inputs = document.querySelectorAll('.code-input');
    inputs.forEach(input => {
        input.value = '';
        input.classList.remove('filled', 'error');
    });
    
    document.getElementById('fullCode').value = '';
    document.getElementById('btnValidar').disabled = true;
    
    // Enfocar primer input
    if (inputs[0]) {
        inputs[0].focus();
    }
}

// Mostrar error
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');
        
        // Ocultar mensaje de éxito si existe
        const successElement = document.getElementById('successCode');
        if (successElement) {
            successElement.classList.remove('show');
        }
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            element.classList.remove('show');
        }, 5000);
    }
}

// Mostrar éxito
function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');
        
        // Ocultar mensaje de error si existe
        const errorElement = document.getElementById('errorCode');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            element.classList.remove('show');
        }, 5000);
    }
}