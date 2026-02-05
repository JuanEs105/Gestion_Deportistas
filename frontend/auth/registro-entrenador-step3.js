// ==========================================
// REGISTRO ENTRENADOR - PASO 3: CONTRASEÑA (VERSIÓN CORREGIDA)
// ==========================================

let passwordStrength = 0;
let passwordRequirements = {
    length: false,
    letter: false,
    number: false,
    special: false,
    uppercase: false,
    lowercase: false
};

document.addEventListener('DOMContentLoaded', function () {
    console.log('🔐 === PASO 3 CARGADO - ESTABLECER CONTRASEÑA ===');

    // ✅ 1. OBTENER TOKEN DE LA URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    console.log('🔍 Token de URL:', token ? token.substring(0, 20) + '...' : 'NO ENCONTRADO');

    if (!token) {
        console.error('❌ ERROR CRÍTICO: No hay token en la URL');

        // Intentar obtener del localStorage
        const savedToken = localStorage.getItem('coach_verification_token');
        if (savedToken) {
            console.log('⚠️  Usando token de localStorage:', savedToken.substring(0, 20) + '...');
            // Redirigir con token
            window.location.href = `registro-entrenador-step3.html?token=${savedToken}`;
            return;
        }

        showError('Token no encontrado. Vuelve al paso 2.');
        disableForm();
        return;
    }

    console.log('✅ Token válido encontrado');

    // ✅ 2. GUARDAR TOKEN (como backup)
    localStorage.setItem('coach_verification_token', token);

    // ✅ 3. CONFIGURAR FORMULARIO
    setupForm();
    setupPasswordValidation();

    // ✅ 4. OPCIONAL: Verificar token con backend (mejor manejo de errores)
    verifyTokenWithBackend(token).catch(error => {
        console.warn('⚠️  Error verificando token, continuando de todos modos:', error.message);
    });
});

// ✅ CONFIGURAR FORMULARIO
function setupForm() {
    const form = document.getElementById('passwordForm');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const toggleButtons = document.querySelectorAll('.registro-toggle-password');
    const termsCheckbox = document.getElementById('terms');

    if (!form) {
        console.error('❌ Formulario no encontrado');
        return;
    }

    console.log('✅ Configurando formulario...');

    // Configurar evento submit
    form.addEventListener('submit', handlePasswordSubmit);

    // Configurar toggle de visibilidad de contraseña
    toggleButtons.forEach(button => {
        button.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);

            if (targetInput) {
                const isPassword = targetInput.type === 'password';
                targetInput.type = isPassword ? 'text' : 'password';
                this.querySelector('.material-symbols-outlined').textContent =
                    isPassword ? 'visibility_off' : 'visibility';
            }
        });
    });

    // Validar términos al cambiar
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', function () {
            const submitBtn = form.querySelector('.registro-btn-primary');
            if (submitBtn) {
                submitBtn.disabled = !this.checked;
            }
        });
    }

    console.log('✅ Formulario configurado correctamente');
}

// ✅ VERIFICAR TOKEN CON BACKEND (CON MEJOR MANEJO DE ERRORES)
async function verifyTokenWithBackend(token) {
    try {
        console.log('🔍 Verificando token con backend...');

        // Si estás en desarrollo, puedes saltar esta verificación
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('⚠️  Modo desarrollo: Saltando verificación de token');
            return true;
        }

        const response = await fetch(`https://gestiondeportistas-production.up.railway.app/api/auth/verificar-token-registro/${token}`);

        if (!response.ok) {
            console.warn('⚠️  Token no verificado por backend, continuando de todos modos');
            return true; // Continuar incluso si falla
        }

        const data = await response.json();

        if (data.success) {
            // ✅ CORRECCIÓN: Usar 'entrenador' en lugar de 'usuario'
            console.log('✅ Token verificado por backend:', data.entrenador?.email || 'Email no disponible');
            return true;
        } else {
            console.warn('⚠️  Token inválido según backend, continuando de todos modos');
            return true; // Continuar para permitir pruebas
        }
    } catch (error) {
        console.warn('⚠️  Error verificando token, continuando:', error.message);
        // No mostrar error al usuario, continuar de todos modos
        return true;
    }
}

// ✅ CONFIGURAR VALIDACIÓN DE CONTRASEÑA
function setupPasswordValidation() {
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');

    if (!passwordInput || !confirmInput) return;

    console.log('✅ Configurando validación de contraseña...');

    // Validar contraseña en tiempo real
    passwordInput.addEventListener('input', function () {
        const password = this.value;
        validatePassword(password);
        updatePasswordStrength(password);
        checkPasswordsMatch();
    });

    // Validar confirmación
    confirmInput.addEventListener('input', checkPasswordsMatch);

    // Inicializar validación
    validatePassword(passwordInput.value);
    checkPasswordsMatch();
}

// ✅ VALIDAR CONTRASEÑA
function validatePassword(password) {
    passwordRequirements = {
        length: password.length >= 8,
        letter: /[A-Za-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password)
    };

    // Actualizar indicadores visuales
    updateValidationIndicators();

    return Object.values(passwordRequirements).every(req => req);
}

// ✅ ACTUALIZAR INDICADORES VISUALES
function updateValidationIndicators() {
    const indicators = {
        validationLength: passwordRequirements.length,
        validationUppercase: passwordRequirements.uppercase,
        validationLowercase: passwordRequirements.lowercase,
        validationNumber: passwordRequirements.number,
        validationSpecial: passwordRequirements.special
    };

    for (const [id, isValid] of Object.entries(indicators)) {
        const element = document.getElementById(id);
        if (element) {
            const icon = element.querySelector('.registro-validation-icon');
            const text = element.querySelector('.registro-validation-text');

            if (isValid) {
                icon.textContent = '✓';
                icon.style.color = '#10B981';
                element.classList.add('valid');
                element.classList.remove('invalid');
            } else {
                icon.textContent = '●';
                icon.style.color = '#9CA3AF';
                element.classList.add('invalid');
                element.classList.remove('valid');
            }
        }
    }
}

// ✅ ACTUALIZAR FORTALEZA DE CONTRASEÑA
function updatePasswordStrength(password) {
    let strength = 0;

    if (password.length >= 8) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 20;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 20;

    passwordStrength = strength;

    // Actualizar barra visual
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');

    if (strengthFill) {
        strengthFill.style.width = `${strength}%`;

        if (strength < 40) {
            strengthFill.style.background = '#EF4444'; // Rojo
            if (strengthText) strengthText.textContent = 'Débil';
        } else if (strength < 80) {
            strengthFill.style.background = '#F59E0B'; // Amarillo
            if (strengthText) strengthText.textContent = 'Media';
        } else {
            strengthFill.style.background = '#10B981'; // Verde
            if (strengthText) strengthText.textContent = 'Fuerte';
        }
    }
}

// ✅ VERIFICAR QUE LAS CONTRASEÑAS COINCIDAN
function checkPasswordsMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmMessage = document.getElementById('confirmMessage');

    if (!confirmMessage) return;

    if (confirmPassword === '') {
        confirmMessage.textContent = '';
        confirmMessage.className = '';
        return;
    }

    if (password === confirmPassword) {
        confirmMessage.textContent = '✓ Las contraseñas coinciden';
        confirmMessage.className = 'match';
    } else {
        confirmMessage.textContent = '✗ Las contraseñas no coinciden';
        confirmMessage.className = 'no-match';
    }
}

// ✅✅✅ MÉTODO PRINCIPAL: MANEJAR ENVÍO DE CONTRASEÑA (CORREGIDO)
async function handlePasswordSubmit(event) {
    event.preventDefault();

    console.log('🔐 === ENVIANDO CONTRASEÑA PARA ACTIVAR CUENTA ===');

    // Obtener datos del formulario
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const termsAccepted = document.getElementById('terms')?.checked || false;

    // Obtener token y email
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const savedEmail = localStorage.getItem('coach_registration_email');

    console.log('📋 Datos recopilados:');
    console.log('   Email:', savedEmail);
    console.log('   Token:', token ? token.substring(0, 20) + '...' : 'No encontrado');
    console.log('   Longitud contraseña:', password.length);
    console.log('   Términos aceptados:', termsAccepted);

    // ✅ VALIDACIONES
    if (!token) {
        showError('Token no encontrado. Vuelve al paso 2.');
        return;
    }

    if (!savedEmail) {
        showError('No se encontró el email. Vuelve al paso 1.');
        return;
    }

    if (password.length < 8) {
        showError('La contraseña debe tener al menos 8 caracteres');
        return;
    }

    if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden');
        return;
    }

    if (!validatePassword(password)) {
        showError('La contraseña no cumple con todos los requisitos de seguridad');
        return;
    }

    if (!termsAccepted) {
        showError('Debes aceptar los términos y condiciones');
        return;
    }

    // Deshabilitar botón y mostrar loading
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = `
        <span class="registro-btn-text">Activando cuenta...</span>
        <span class="material-symbols-outlined">sync</span>
    `;

    try {
        console.log('📤 Enviando solicitud de activación...');

        // ✅✅✅ LLAMADA AL BACKEND PARA ACTIVAR LA CUENTA (ENDPOINT CORRECTO)
        // Intentar con ambos endpoints para mayor compatibilidad

        let response;
        let endpointUsed = '';

        // Primero intentar con el endpoint principal
       // Primero intentar con el endpoint principal
        try {
            endpointUsed = '/completar-registro-contrasena';
            response = await fetch('https://gestiondeportistas-production.up.railway.app/api/auth/completar-registro-contrasena', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: savedEmail,
                    verificationToken: token,
                    password: password,
                    confirmPassword: confirmPassword
                })
            });
        } catch (error1) {
            console.log('⚠️  Error con primer endpoint, intentando con alias...');
            // Si falla, intentar con el alias
            endpointUsed = '/activar-cuenta-entrenador';
            response = await fetch('https://gestiondeportistas-production.up.railway.app/api/auth/activar-cuenta-entrenador', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: savedEmail,
                    verificationToken: token,
                    password: password,
                    confirmPassword: confirmPassword
                })
            });
        }

        console.log('📥 Respuesta recibida:', response.status, response.statusText);
        console.log('🌐 Endpoint usado:', endpointUsed);

        const data = await response.json();
        console.log('📦 Datos de respuesta:', data);

        if (!response.ok) {
            throw new Error(data.error || `Error ${response.status} al activar la cuenta`);
        }

        if (data.success) {
            console.log('✅✅✅ CUENTA ACTIVADA EXITOSAMENTE');

            // Mostrar mensaje de éxito
            showSuccess('¡Cuenta de entrenador activada! Redirigiendo al login...');

            // Guardar token de sesión si viene en la respuesta
            if (data.token) {
                localStorage.setItem('auth_token', data.token);
                console.log('🔑 Token de sesión guardado:', data.token.substring(0, 20) + '...');
            }

            // ✅ LIMPIAR DATOS TEMPORALES
            localStorage.removeItem('coach_registration_email');
            localStorage.removeItem('coach_verification_token');
            localStorage.removeItem('email_sent_data');

            // ✅✅✅ CORRECCIÓN: Redirigir a login-entrenador.html
            setTimeout(() => {
                // Construir URL para login de entrenadores
                const baseUrl = '../../auth/login-entrenador.html';
                const params = new URLSearchParams({
                    registered: 'true',
                    email: savedEmail,
                    role: 'entrenador',
                    message: 'registration_success',
                    from: 'step3'
                });

                const fullUrl = `${baseUrl}?${params.toString()}`;

                console.log('🔄 Redirigiendo entrenador a:', fullUrl);
                console.log('🏋️‍♂️ Entrenador registrado:', savedEmail);

                window.location.href = fullUrl;
            }, 2000);
        } else {
            throw new Error(data.error || 'Error en la activación');
        }

    } catch (error) {
        console.error('❌ Error activando cuenta:', error);

        let errorMessage = error.message;

        // Manejar errores específicos
        if (errorMessage.includes('Token') && errorMessage.includes('expirado')) {
            errorMessage = 'El token ha expirado. Vuelve al paso 1 para solicitar un nuevo código.';
        } else if (errorMessage.includes('inválido')) {
            errorMessage = 'Token inválido. Vuelve al paso 2 para verificar tu código nuevamente.';
        } else if (errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
            errorMessage = 'Error de conexión. Verifica que el servidor backend esté corriendo en https://gestiondeportistas-production.up.railway.app';
        }

        showError(errorMessage);

        // Re-habilitar botón
        submitButton.disabled = false;
        submitButton.innerHTML = `
            <span class="registro-btn-text">${originalButtonText}</span>
            <span class="material-symbols-outlined">check_circle</span>
        `;
    }
}

// ✅ DESHABILITAR FORMULARIO
function disableForm() {
    const form = document.getElementById('passwordForm');
    if (form) {
        const inputs = form.querySelectorAll('input, button');
        inputs.forEach(input => {
            input.disabled = true;
        });

        const submitBtn = form.querySelector('.registro-btn-primary');
        if (submitBtn) {
            submitBtn.textContent = 'Registro Deshabilitado';
            submitBtn.style.background = '#9CA3AF';
        }
    }
}

// ✅ MOSTRAR ERROR
function showError(message) {
    console.error('❌', message);

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
        background: rgba(239, 68, 68, 0.95);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        max-width: 400px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ✅ MOSTRAR ÉXITO
function showSuccess(message) {
    console.log('✅', message);

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
        background: rgba(16, 185, 129, 0.95);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        max-width: 400px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ✅ AGREGAR ANIMACIONES CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .registro-validation-item.valid .registro-validation-text {
        color: #10B981;
    }
    
    .registro-validation-item.invalid .registro-validation-text {
        color: #6B7280;
    }
    
    #confirmMessage.match {
        color: #10B981;
        font-weight: bold;
        margin-top: 5px;
    }
    
    #confirmMessage.no-match {
        color: #EF4444;
        font-weight: bold;
        margin-top: 5px;
    }
    
    .registro-btn-primary:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
    
    .registro-btn-primary.loading {
        position: relative;
    }
    
    .registro-btn-primary.loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

console.log('✅ Paso 3 completamente configurado y listo para usar');