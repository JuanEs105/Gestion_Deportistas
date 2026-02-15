// ==========================================
// RECUPERAR CONTRASEÑA - JavaScript
// ==========================================

// Configuración
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://gestiondeportistas-production.up.railway.app';

const CONFIG = {
    API_URL: `${API_BASE_URL}/api/auth/forgot-password`,
    RESEND_URL: `${API_BASE_URL}/api/auth/resend-code`,
    VERIFY_URL: `${API_BASE_URL}/api/auth/verify-code`,
    RESET_PASSWORD_URL: `${API_BASE_URL}/api/auth/reset-password`
};

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Recuperar Contraseña page loaded');

    // Inicializar formulario
    initRecuperarForm();

    // Cargar email recordado si existe
    loadRememberedEmail();
});

// Inicializar formulario de recuperación
function initRecuperarForm() {
    const form = document.getElementById('recuperarForm');
    const btnRecuperar = document.getElementById('btnRecuperar');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const emailInput = document.getElementById('email');

    if (form && btnRecuperar) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Obtener y limpiar email
            const email = emailInput.value.trim();

            // Validar email
            if (!validateEmail(email)) {
                showError('errorEmail', 'Por favor, ingresa un email válido');
                emailInput.focus();
                return;
            }

            // Limpiar mensajes anteriores
            clearError('errorEmail');
            clearSuccess('successEmail');

            // Mostrar loading
            btnRecuperar.disabled = true;
            if (loadingSpinner) loadingSpinner.classList.remove('hidden');

            try {
                console.log('📧 Enviando código a:', email);

                // Enviar solicitud al backend
                const response = await fetch(CONFIG.API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    console.log('✅ Código enviado exitosamente');

                    // Mostrar mensaje de éxito
                    showSuccess('successEmail', '✅ Código enviado. Revisa tu email.');

                    // Guardar email en localStorage para usar en los siguientes pasos
                    localStorage.setItem('recovery_email', email);

                    // Redirigir a validar código después de 2 segundos
                    setTimeout(() => {
                        window.location.href = 'validar-codigo.html';
                    }, 2000);

                } else {
                    throw new Error(data.error || data.message || 'Error al enviar el código');
                }

            } catch (error) {
                console.error('❌ Error:', error);

                // Mostrar error
                showError('errorEmail', error.message || 'Error al enviar el código. Intenta nuevamente.');

            } finally {
                // Ocultar loading
                btnRecuperar.disabled = false;
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
            }
        });
    }

    // Validación en tiempo real
    if (emailInput) {
        emailInput.addEventListener('input', function () {
            const email = this.value.trim();
            if (email) {
                clearError('errorEmail');
                clearSuccess('successEmail');

                // Validar formato básico
                if (!validateEmail(email)) {
                    showError('errorEmail', 'Email inválido');
                } else {
                    clearError('errorEmail');
                }
            }
        });

        emailInput.addEventListener('blur', function () {
            const email = this.value.trim();
            if (email && !validateEmail(email)) {
                showError('errorEmail', 'Ingresa un email válido (ejemplo@email.com)');
            }
        });
    }
}

// Validar email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Mostrar error
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');
    }
}

// Mostrar éxito
function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');

        // Ocultar después de 5 segundos
        setTimeout(() => {
            element.classList.remove('show');
        }, 5000);
    }
}

// Limpiar errores
function clearError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = '';
        element.classList.remove('show');
    }
}

// Limpiar éxitos
function clearSuccess(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = '';
        element.classList.remove('show');
    }
}

// Cargar email recordado
function loadRememberedEmail() {
    const rememberedEmail = localStorage.getItem('remembered_email');
    const emailInput = document.getElementById('email');

    if (rememberedEmail && emailInput) {
        emailInput.value = rememberedEmail;
    }
}

// Manejar errores de imágenes
document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function () {
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
            font-size: 1rem;
        `;
        fallback.textContent = 'TE';
        this.parentNode.appendChild(fallback);
        this.style.display = 'none';
    });
});

console.log('✅ Recuperar Contraseña.js cargado correctamente');