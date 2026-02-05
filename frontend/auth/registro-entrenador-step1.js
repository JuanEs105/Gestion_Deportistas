// ==========================================
// REGISTRO ENTRENADOR - PASO 1: VALIDACIÓN DE CORREO
// ==========================================

// Variables globales
let emailInput;
let emailForm;
let submitBtn;
let timerInterval;
let cooldownTime = 60; // 60 segundos de cooldown después de enviar

document.addEventListener('DOMContentLoaded', function () {
    console.log('📋 Registro Entrenador - Paso 1 cargado (VERSIÓN CORREGIDA)');

    // Inicializar elementos
    initializeElements();

    if (!areElementsValid()) {
        console.error('❌ Elementos del formulario no encontrados');
        return;
    }

    // Configurar event listeners
    setupEventListeners();

    // Limpiar datos previos
    cleanupPreviousData();

    // Verificar si hay cooldown activo
    checkCooldown();

    // Focus en el input
    emailInput.focus();
});

// Inicializar elementos del DOM
function initializeElements() {
    emailForm = document.getElementById('emailForm');
    emailInput = document.getElementById('email');
    submitBtn = emailForm ? emailForm.querySelector('.registro-btn-primary') : null;
}

// Verificar que todos los elementos existan
function areElementsValid() {
    if (!emailForm || !emailInput || !submitBtn) {
        console.error('❌ Elementos faltantes:', {
            emailForm: !!emailForm,
            emailInput: !!emailInput,
            submitBtn: !!submitBtn
        });
        return false;
    }
    return true;
}

// Configurar event listeners
function setupEventListeners() {
    // Validación en tiempo real
    emailInput.addEventListener('input', validateEmail);

    // Manejo de teclas
    emailInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!submitBtn.disabled) {
                handleEmailSubmit();
            }
        }
    });

    // Envío del formulario
    emailForm.addEventListener('submit', function (e) {
        e.preventDefault();
        handleEmailSubmit();
    });

    // Limpiar error al enfocar
    emailInput.addEventListener('focus', function () {
        this.classList.remove('error');
    });
}

// Validar email en tiempo real
function validateEmail() {
    if (!emailInput) return false;

    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email === '') {
        resetEmailValidation();
        return false;
    }

    if (emailRegex.test(email)) {
        showEmailValid();
        return true;
    } else {
        showEmailInvalid();
        return false;
    }
}

// Resetear validación de email
function resetEmailValidation() {
    if (!emailInput || !submitBtn) return;

    emailInput.classList.remove('success', 'error');
    submitBtn.disabled = true;
}

// Mostrar email válido
function showEmailValid() {
    if (!emailInput || !submitBtn) return;

    emailInput.classList.remove('error');
    emailInput.classList.add('success');
    submitBtn.disabled = false;
}

// Mostrar email inválido
function showEmailInvalid() {
    if (!emailInput || !submitBtn) return;

    emailInput.classList.remove('success');
    emailInput.classList.add('error');
    submitBtn.disabled = true;
}

// Manejar envío del formulario
async function handleEmailSubmit() {
    if (!emailInput || !submitBtn) return;

    const email = emailInput.value.trim();

    // Validación básica
    if (!email) {
        showError('Por favor, ingresa tu correo electrónico');
        emailInput.focus();
        return;
    }

    if (!validateEmail()) {
        showError('Por favor, ingresa un correo válido');
        emailInput.focus();
        return;
    }

    // Verificar si está en cooldown
    const cooldownEnd = localStorage.getItem('email_cooldown_end');
    if (cooldownEnd && Date.now() < parseInt(cooldownEnd)) {
        const remaining = Math.ceil((parseInt(cooldownEnd) - Date.now()) / 1000);
        showError(`Espera ${remaining} segundos antes de enviar otro código`);
        return;
    }

    // Mostrar loading
    const originalText = submitBtn.querySelector('.registro-btn-text').textContent;
    submitBtn.querySelector('.registro-btn-text').textContent = 'Enviando código...';
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    try {
        console.log('📧 Enviando código de ACTIVACIÓN a:', email);

        // ✅ Usar SOLO el nuevo endpoint de ACTIVACIÓN
        const response = await enviarCodigoActivacion(email);

        if (response.success) {
            // Guardar email temporalmente para el siguiente paso
            localStorage.setItem('coach_registration_email', email);
            localStorage.setItem('coach_registration_time', Date.now().toString());

            // Establecer cooldown (60 segundos)
            const cooldownEndTime = Date.now() + (cooldownTime * 1000);
            localStorage.setItem('email_cooldown_end', cooldownEndTime.toString());
            startCooldownTimer();

            // Mostrar éxito
            showSuccess('✅ Código de activación enviado');

            // Redirigir al paso 2 después de 1.5 segundos
            setTimeout(() => {
                window.location.href = 'registro-entrenador-step2.html';
            }, 1500);

        } else {
            throw new Error(response.error || 'Error al enviar el código');
        }

    } catch (error) {
        console.error('❌ Error enviando código:', error);

        // Determinar mensaje de error apropiado
        let errorMessage = 'Error al enviar el código de activación';

        if (error.message.includes('No se encontró')) {
            errorMessage = 'No se encontró un entrenador registrado con este correo. Contacta al administrador.';
        } else if (error.message.includes('ya tiene una cuenta activa')) {
            errorMessage = 'Este entrenador ya tiene una cuenta activa. Inicia sesión directamente.';
        } else if (error.message.includes('timeout') || error.message.includes('AbortError')) {
            errorMessage = 'El servidor no respondió a tiempo. Verifica tu conexión e intenta nuevamente.';
        } else if (error.message.includes('network') || error.message.includes('Failed to fetch')) {
            errorMessage = 'Error de conexión. Verifica tu internet y que el servidor esté funcionando.';
        } else {
            errorMessage = 'Error: ' + error.message;
        }

        showError(errorMessage);

        // Restaurar botón
        if (submitBtn) {
            submitBtn.querySelector('.registro-btn-text').textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            validateEmail(); // Re-validar estado
        }
    }
}

// ✅ CORREGIDO: Función para enviar código de ACTIVACIÓN (SOLO el nuevo endpoint)
async function enviarCodigoActivacion(email) {
    try {
        console.log('📤 Enviando solicitud a /solicitar-codigo-registro');

        // Usar timeout para evitar esperas infinitas
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

        const response = await fetch('https://gestiondeportistas-production.up.railway.app/api/auth/solicitar-codigo-registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();
        console.log('📥 Respuesta del servidor:', data);

        if (!response.ok) {
            // Manejar errores específicos del endpoint de ACTIVACIÓN
            let errorMsg = data.error || 'Error del servidor';

            if (data.error && data.error.includes('No se encontró')) {
                errorMsg = 'No se encontró un entrenador registrado con este correo. Contacta al administrador.';
            } else if (data.error && data.error.includes('ya tiene una cuenta activa')) {
                errorMsg = 'Este entrenador ya tiene una cuenta activa. Inicia sesión directamente.';
            }

            throw new Error(errorMsg);
        }

        return {
            success: true,
            message: data.message || 'Código de activación enviado exitosamente',
            expiresIn: data.expiresIn || 15
        };

    } catch (error) {
        console.error('❌ Error en la solicitud de ACTIVACIÓN:', error);

        // NO intentar con /forgot-password porque es de RECUPERACIÓN
        // Mostrar error específico
        if (error.name === 'AbortError') {
            throw new Error('Timeout: El servidor no respondió a tiempo');
        }

        // Modo desarrollo: simular éxito SOLO si es localhost
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.warn('⚠️ Modo desarrollo: Simulando envío de código de ACTIVACIÓN');
            console.warn('⚠️ Asegúrate de que el backend esté corriendo en https://gestiondeportistas-production.up.railway.app');

            // Verificar si el backend está activo
            try {
                const healthCheck = await fetch('https://gestiondeportistas-production.up.railway.app/api/auth/health', {
                    method: 'GET',
                    signal: AbortSignal.timeout(3000)
                });
                console.log('🔍 Estado del backend:', healthCheck.status);
            } catch (healthError) {
                console.error('❌ Backend no disponible:', healthError);
                throw new Error('Backend no disponible. Asegúrate de que el servidor esté corriendo en https://gestiondeportistas-production.up.railway.app');
            }

            // Simular éxito para desarrollo
            return {
                success: true,
                message: '✅ Código de activación simulado: 123456',
                expiresIn: 15
            };
        }

        throw error;
    }
}

// Limpiar datos previos
function cleanupPreviousData() {
    // Mantener el email pero limpiar otros datos
    localStorage.removeItem('coach_verification_token');
    localStorage.removeItem('coach_account_blocked');

    // Limpiar cooldown si ya pasó
    const cooldownEnd = localStorage.getItem('email_cooldown_end');
    if (cooldownEnd && Date.now() > parseInt(cooldownEnd)) {
        localStorage.removeItem('email_cooldown_end');
    }
}

// Verificar cooldown
function checkCooldown() {
    const cooldownEnd = localStorage.getItem('email_cooldown_end');
    if (cooldownEnd && Date.now() < parseInt(cooldownEnd)) {
        startCooldownTimer();
    }
}

// Iniciar timer de cooldown
function startCooldownTimer() {
    const cooldownEnd = localStorage.getItem('email_cooldown_end');
    if (!cooldownEnd) return;

    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const remaining = Math.ceil((parseInt(cooldownEnd) - Date.now()) / 1000);

        if (remaining <= 0) {
            clearInterval(timerInterval);
            localStorage.removeItem('email_cooldown_end');
            updateCooldownDisplay(false);
        } else {
            updateCooldownDisplay(true, remaining);
        }
    }, 1000);
}

// Actualizar display de cooldown
function updateCooldownDisplay(isActive, seconds = 0) {
    const cooldownElement = document.getElementById('cooldownTimer');
    if (!cooldownElement) return;

    if (isActive && seconds > 0) {
        cooldownElement.textContent = `Espera ${seconds}s`;
        cooldownElement.style.display = 'block';

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.querySelector('.registro-btn-text').textContent = `Espera ${seconds}s`;
        }
    } else {
        cooldownElement.style.display = 'none';

        if (submitBtn && validateEmail()) {
            submitBtn.disabled = false;
            submitBtn.querySelector('.registro-btn-text').textContent = 'Enviar Código de Verificación';
        }
    }
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
    }, 4000);
}

// Limpiar intervalos al salir
window.addEventListener('beforeunload', function () {
    clearInterval(timerInterval);
});

// Exportar funciones para uso global
window.validateEmail = validateEmail;
window.handleEmailSubmit = handleEmailSubmit;

console.log('✅ Script del Paso 1 cargado correctamente (USANDO ACTIVACIÓN)');