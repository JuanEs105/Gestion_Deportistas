// ==========================================
// REGISTRO ENTRENADOR - PASO 2: VALIDACIÓN DE CÓDIGO (CORREGIDO)
// ==========================================

// ✅ VARIABLES GLOBALES (arriba de todo)
let attemptsLeft = 3;
let timerInterval;
let timeLeft = 15 * 60; // 15 minutos en segundos

document.addEventListener('DOMContentLoaded', function () {
    console.log('🔐 Registro Entrenador - Paso 2 cargado (CORREGIDO)');

    // Elementos del DOM
    const codeForm = document.getElementById('codeForm');
    const codeInputs = document.querySelectorAll('.registro-code-input');
    const submitBtn = codeForm?.querySelector('.registro-btn-primary');
    const resendBtn = document.getElementById('resendCodeBtn');
    const changeEmailBtn = document.getElementById('changeEmailBtn');
    const timerElement = document.getElementById('timer');

    // ✅ YA NO DECLARAR AQUÍ LAS VARIABLES, SE USAN LAS GLOBALES

    // Inicializar
    if (codeInputs.length > 0) {
        codeInputs[0].focus();
        setupCodeInputs(codeInputs);
    }

    // Configurar listeners
    if (codeForm && submitBtn) {
        codeForm.addEventListener('submit', handleCodeSubmit);
    }

    if (resendBtn) {
        resendBtn.addEventListener('click', handleResendCode);
    }

    if (changeEmailBtn) {
        changeEmailBtn.addEventListener('click', handleChangeEmail);
    }

    // Iniciar temporizador
    startTimer();

    // Configurar email actual
    setupCurrentEmail();

    // Actualizar intentos
    updateAttemptsDisplay();
});

// Resto del código sigue igual...
// Configurar inputs de código
function setupCodeInputs(inputs) {
    inputs.forEach((input, index) => {
        // Solo permitir números
        input.addEventListener('input', function (e) {
            this.value = this.value.replace(/[^0-9]/g, '');

            // Auto-mover al siguiente input
            if (this.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }

            // Actualizar estado visual
            if (this.value.length === 1) {
                this.classList.add('filled');
            } else {
                this.classList.remove('filled');
            }

            updateFullCode();
        });

        // Manejar tecla borrar/backspace
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Backspace' && this.value.length === 0 && index > 0) {
                inputs[index - 1].focus();
            }
        });

        // Pegar código completo
        input.addEventListener('paste', function (e) {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').trim();

            if (/^\d{6}$/.test(pastedData)) {
                // Distribuir los dígitos en los inputs
                const digits = pastedData.split('');
                inputs.forEach((input, idx) => {
                    if (digits[idx]) {
                        input.value = digits[idx];
                        input.classList.add('filled');
                    }
                });

                // Focus en el último input
                if (inputs.length > 0) {
                    inputs[inputs.length - 1].focus();
                }

                updateFullCode();
            }
        });
    });
}

// Actualizar código completo
function updateFullCode() {
    const codeInputs = document.querySelectorAll('.registro-code-input');
    const codeArray = Array.from(codeInputs).map(input => input.value);
    const fullCode = codeArray.join('');

    const fullCodeInput = document.getElementById('fullCode');
    if (fullCodeInput) {
        fullCodeInput.value = fullCode;
    }

    // Habilitar/deshabilitar botón de enviar
    const submitBtn = document.querySelector('.registro-btn-primary');
    if (submitBtn) {
        submitBtn.disabled = fullCode.length !== 6;
    }
}

// Configurar email actual
function setupCurrentEmail() {
    const savedEmail = localStorage.getItem('coach_registration_email');
    const emailInfo = document.getElementById('currentEmail');

    if (savedEmail && emailInfo) {
        // Ocultar parte del email por seguridad
        const [username, domain] = savedEmail.split('@');
        const hiddenUsername = username.substring(0, 3) + '***';
        emailInfo.textContent = `${hiddenUsername}@${domain}`;
    } else {
        // Redirigir al paso 1 si no hay email
        showError('No se encontró email de registro. Redirigiendo...');
        setTimeout(() => {
            window.location.href = 'registro-entrenador-step1.html';
        }, 2000);
    }
}

// Iniciar temporizador
function startTimer() {
    const timerElement = document.getElementById('timer');

    if (!timerElement) return;

    // Actualizar cada segundo
    timerInterval = setInterval(() => {
        timeLeft--;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleCodeExpired();
            return;
        }

        // Formatear tiempo
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Actualizar elementos
        timerElement.textContent = timeString;

        // Cambiar color cuando queden menos de 5 minutos
        if (timeLeft < 5 * 60) {
            timerElement.style.color = 'var(--warning-color)';
        }

        // Cambiar color cuando queden menos de 1 minuto
        if (timeLeft < 60) {
            timerElement.style.color = 'var(--danger-color)';
        }
    }, 1000);
}

// Manejar código expirado
function handleCodeExpired() {
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = '00:00';
        timerElement.style.color = 'var(--danger-color)';
    }

    // Deshabilitar inputs
    const codeInputs = document.querySelectorAll('.registro-code-input');
    codeInputs.forEach(input => {
        input.disabled = true;
        input.classList.add('error');
    });

    // Deshabilitar botón de enviar
    const submitBtn = document.querySelector('.registro-btn-primary');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Código Expirado';
    }

    // Mostrar mensaje
    showError('El código ha expirado. Solicita uno nuevo.');
}

// ✅ CORREGIDO: Manejar envío del código REAL al backend
async function handleCodeSubmit(event) {
    event.preventDefault();

    const codeInputs = document.querySelectorAll('.registro-code-input');
    const fullCode = document.getElementById('fullCode')?.value ||
        Array.from(codeInputs).map(input => input.value).join('');

    const submitBtn = document.querySelector('.registro-btn-primary');
    const savedEmail = localStorage.getItem('coach_registration_email');

    if (!savedEmail) {
        showError('No se encontró el email. Vuelve al paso 1.');
        setTimeout(() => {
            window.location.href = 'registro-entrenador-step1.html';
        }, 2000);
        return;
    }

    // Validar longitud
    if (fullCode.length !== 6) {
        showError('El código debe tener 6 dígitos');
        return;
    }

    // Mostrar loading
    const originalText = submitBtn.querySelector('.registro-btn-text').textContent;
    submitBtn.querySelector('.registro-btn-text').textContent = 'Verificando...';
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    try {
        console.log('🔍 Verificando código de activación:', fullCode, 'para:', savedEmail);

        // ✅ LLAMADA REAL AL BACKEND
        const response = await verificarCodigoRegistro(savedEmail, fullCode);

        if (response.success) {
            // Guardar token de verificación para el paso 3
            localStorage.setItem('coach_verification_token', response.verificationToken);

            // Mostrar éxito
            showSuccess('✅ Código verificado correctamente');

            console.log('✅ Código verificado. Token guardado');

            // Redirigir al paso 3 después de 1.5 segundos
            setTimeout(() => {
                window.location.href = 'registro-entrenador-step3.html';
            }, 1500);

        } else {
            throw new Error(response.error || 'Error verificando el código');
        }

    } catch (error) {
        console.error('❌ Error verificando código:', error);

        // Reducir intentos
        attemptsLeft--;
        updateAttemptsDisplay();

        if (attemptsLeft <= 0) {
            // Bloquear cuenta
            handleAccountLocked();
        } else {
            // Mostrar error
            showError(`Código incorrecto. Te quedan ${attemptsLeft} intentos.`);

            // Limpiar inputs
            codeInputs.forEach(input => {
                input.value = '';
                input.classList.remove('filled');
            });

            // Focus en el primer input
            if (codeInputs.length > 0) {
                codeInputs[0].focus();
            }

            updateFullCode();
        }

        // Restaurar botón
        submitBtn.querySelector('.registro-btn-text').textContent = originalText;
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
}

// ✅ FUNCIÓN REAL para verificar código en el backend
async function verificarCodigoRegistro(email, code) {
    try {
        console.log('📤 Enviando verificación a /verificar-codigo-registro');

        const response = await fetch('https://gestiondeportistas-production.up.railway.app/api/auth/verificar-codigo-registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                code: code
            })
        });

        const data = await response.json();
        console.log('📥 Respuesta de verificación:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Error del servidor');
        }

        return {
            success: true,
            message: data.message,
            verificationToken: data.verificationToken,
            expiresIn: data.expiresIn
        };

    } catch (error) {
        console.error('❌ Error en verificación:', error);

        // Modo desarrollo: solo aceptar código que empiece con el número correcto
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.warn('⚠️ Modo desarrollo: Verificando contra el código enviado por email...');

            // Obtener el código real que se envió (lo guardamos en localStorage en el paso 1)
            const emailData = localStorage.getItem('email_sent_data');
            if (emailData) {
                const { code: realCode } = JSON.parse(emailData);
                if (code === realCode) {
                    console.log('✅ Código correcto (modo desarrollo)');
                    return {
                        success: true,
                        message: 'Código verificado (modo desarrollo)',
                        verificationToken: 'dev_token_' + Date.now(),
                        expiresIn: 30
                    };
                }
            }

            // Si no hay código guardado, solo aceptar 123456 para pruebas
            if (code === '123456') {
                console.warn('⚠️ Usando código de prueba 123456');
                return {
                    success: true,
                    message: 'Código verificado (modo prueba)',
                    verificationToken: 'test_token_' + Date.now(),
                    expiresIn: 30
                };
            }
        }

        throw error;
    }
}

// ✅ CORREGIDO: Manejar reenvío de código REAL
async function handleResendCode() {
    const resendBtn = document.getElementById('resendCodeBtn');
    const savedEmail = localStorage.getItem('coach_registration_email');

    if (!savedEmail) {
        showError('No se encontró el correo. Vuelve al paso 1.');
        return;
    }

    // Mostrar loading
    const originalText = resendBtn.querySelector('.registro-btn-text').textContent;
    resendBtn.querySelector('.registro-btn-text').textContent = 'Enviando...';
    resendBtn.disabled = true;
    resendBtn.classList.add('loading');

    try {
        console.log('🔄 Reenviando código de activación a:', savedEmail);

        // ✅ LLAMADA REAL AL BACKEND para reenviar
        const response = await reenviarCodigoActivacion(savedEmail);

        if (response.success) {
            // Reiniciar temporizador
            clearInterval(timerInterval);
            timeLeft = 15 * 60;
            startTimer();

            // Reiniciar intentos
            attemptsLeft = 3;
            updateAttemptsDisplay();

            // Limpiar inputs
            const codeInputs = document.querySelectorAll('.registro-code-input');
            codeInputs.forEach(input => {
                input.value = '';
                input.classList.remove('filled', 'error');
                input.disabled = false;
            });

            // Habilitar botón de enviar
            const submitBtn = document.querySelector('.registro-btn-primary');
            if (submitBtn) {
                submitBtn.disabled = true; // Deshabilitar hasta tener código
                submitBtn.textContent = 'Validar Código';
            }

            // Focus en el primer input
            if (codeInputs.length > 0) {
                codeInputs[0].focus();
            }

            updateFullCode();

            // Guardar el código que se envió (para modo desarrollo)
            if (response.testCode) {
                localStorage.setItem('email_sent_data', JSON.stringify({
                    code: response.testCode,
                    timestamp: Date.now()
                }));
            }

            // Mostrar éxito
            showSuccess('✅ Nuevo código enviado correctamente');

        } else {
            throw new Error('Error al reenviar el código');
        }

    } catch (error) {
        console.error('❌ Error reenviando código:', error);
        showError('Error al reenviar el código. Intenta nuevamente.');
    } finally {
        // Restaurar botón
        resendBtn.querySelector('.registro-btn-text').textContent = originalText;
        resendBtn.disabled = false;
        resendBtn.classList.remove('loading');
    }
}

// ✅ FUNCIÓN REAL para reenviar código
async function reenviarCodigoActivacion(email) {
    try {
        const response = await fetch('https://gestiondeportistas-production.up.railway.app/api/auth/solicitar-codigo-registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error del servidor');
        }

        // En modo desarrollo, devolver también un código de prueba
        let testCode = null;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            testCode = '123456'; // Código fijo para pruebas
        }

        return {
            success: true,
            message: data.message || 'Código de activación reenviado exitosamente',
            testCode: testCode
        };

    } catch (error) {
        console.error('❌ Error en reenvío:', error);
        throw error;
    }
}

// Manejar cambio de email
function handleChangeEmail() {
    // Limpiar datos temporales
    localStorage.removeItem('coach_registration_email');
    localStorage.removeItem('coach_verification_token');
    localStorage.removeItem('email_sent_data');

    // Redirigir al paso 1
    window.location.href = 'registro-entrenador-step1.html';
}

// Actualizar display de intentos
function updateAttemptsDisplay() {
    const attemptsCountElement = document.getElementById('attemptsCount');
    const attemptsLeftElement = document.getElementById('attemptsLeft');

    if (attemptsCountElement) {
        attemptsCountElement.textContent = attemptsLeft;
    }

    if (attemptsLeftElement) {
        attemptsLeftElement.textContent = attemptsLeft;
    }

    // Cambiar color cuando queden pocos intentos
    if (attemptsLeft <= 1) {
        if (attemptsCountElement) attemptsCountElement.style.color = 'var(--danger-color)';
        if (attemptsLeftElement) attemptsLeftElement.style.color = 'var(--danger-color)';
    } else if (attemptsLeft <= 2) {
        if (attemptsCountElement) attemptsCountElement.style.color = 'var(--warning-color)';
        if (attemptsLeftElement) attemptsLeftElement.style.color = 'var(--warning-color)';
    }
}

// Manejar cuenta bloqueada
function handleAccountLocked() {
    // Deshabilitar inputs
    const codeInputs = document.querySelectorAll('.registro-code-input');
    codeInputs.forEach(input => {
        input.disabled = true;
        input.classList.add('error');
    });

    // Deshabilitar botones
    const submitBtn = document.querySelector('.registro-btn-primary');
    const resendBtn = document.getElementById('resendCodeBtn');

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Cuenta Bloqueada';
        submitBtn.style.background = 'var(--danger-color)';
    }

    if (resendBtn) {
        resendBtn.disabled = true;
    }

    // Mostrar mensaje
    showError('Demasiados intentos fallidos. Contacta al administrador.');

    // Guardar bloqueo en localStorage
    const blockTime = Date.now();
    localStorage.setItem('coach_account_blocked', blockTime.toString());
}

// Mostrar notificación de éxito
function showSuccess(message) {
    // Limpiar notificaciones anteriores
    const existing = document.querySelectorAll('.registro-notification');
    existing.forEach(el => el.remove());

    const notification = document.createElement('div');
    notification.className = 'registro-notification success';
    notification.innerHTML = `
        <span class="material-symbols-outlined">check_circle</span>
        <span>${message}</span>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(16, 185, 129, 0.9);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Mostrar notificación de error
function showError(message) {
    // Limpiar notificaciones anteriores
    const existing = document.querySelectorAll('.registro-notification');
    existing.forEach(el => el.remove());

    const notification = document.createElement('div');
    notification.className = 'registro-notification error';
    notification.innerHTML = `
        <span class="material-symbols-outlined">error</span>
        <span>${message}</span>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(239, 68, 68, 0.9);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Limpiar al salir
window.addEventListener('beforeunload', function () {
    clearInterval(timerInterval);
});

console.log('✅ Paso 2 cargado - Validación REAL con backend');