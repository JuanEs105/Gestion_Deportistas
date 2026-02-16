// ==========================================
// ACCESO DEPORTISTA - JavaScript CON CÓDIGO
// ==========================================

// ✅ CÓDIGO VÁLIDO - CÁMBIALO AQUÍ
const CODIGO_VALIDO = 'TITAN2026';

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Acceso Deportista page loaded');
    
    // Inicializar AuthAPI
    if (typeof AuthAPI !== 'undefined') {
        AuthAPI.init();
    }

    // ✅ CREAR MODAL DE CÓDIGO
    crearModalCodigo();
    
    // Configurar efecto hover para secciones
    const sections = document.querySelectorAll('.acceso-section');
    sections.forEach(section => {
        section.addEventListener('mouseenter', function() {
            this.style.zIndex = '10';
            const bg = this.querySelector('.acceso-section-bg');
            if (bg) {
                bg.style.transform = 'scale(1.05)';
            }
        });
        
        section.addEventListener('mouseleave', function() {
            this.style.zIndex = '1';
            const bg = this.querySelector('.acceso-section-bg');
            if (bg) {
                bg.style.transform = 'scale(1)';
            }
        });
    });
    
    // ✅ INTERCEPTAR CLICK EN BOTÓN DE REGISTRO
    const btnRegistro = document.querySelector('.btn-register');
    if (btnRegistro) {
        btnRegistro.addEventListener('click', function(e) {
            e.preventDefault();
            mostrarModalCodigo();
        });
    }
    
    // Configurar botones
    const buttons = document.querySelectorAll('.btn-acceso-deportista');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function(event) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            this.appendChild(ripple);
            
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            setTimeout(() => ripple.remove(), 600);
        });
        
        // Efecto de clic (solo para botones que NO son de registro)
        if (!button.classList.contains('btn-register')) {
            button.addEventListener('click', function(e) {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            });
        }
    });
    
    // Agregar estilos
    agregarEstilos();
    
    // Verificar si el usuario ya está autenticado
    checkAuthStatus();
    
    // Añadir efecto parallax
    setupParallax();
});

// ✅ AGREGAR ESTILOS
function agregarEstilos() {
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        /* ✅ ESTILOS DEL MODAL DE CÓDIGO */
        .modal-codigo-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s;
        }

        .modal-codigo-overlay.show {
            opacity: 1;
            visibility: visible;
        }

        .modal-codigo-content {
            background: linear-gradient(135deg, #1a1a1a 0%, #000 100%);
            border: 2px solid rgba(226, 27, 35, 0.5);
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 90%;
            text-align: center;
            transform: scale(0.8);
            transition: transform 0.3s;
        }

        .modal-codigo-overlay.show .modal-codigo-content {
            transform: scale(1);
        }

        .modal-codigo-icon {
            width: 80px;
            height: 80px;
            background: rgba(226, 27, 35, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
        }

        .modal-codigo-icon .material-symbols-outlined {
            font-size: 48px;
            color: #E21B23;
        }

        .modal-codigo-title {
            font-family: 'Oswald', sans-serif;
            font-size: 32px;
            font-weight: 700;
            color: white;
            text-transform: uppercase;
            margin-bottom: 10px;
        }

        .modal-codigo-subtitle {
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
            margin-bottom: 30px;
            line-height: 1.5;
        }

        .code-input-wrapper {
            margin-bottom: 30px;
        }

        .code-input {
            width: 100%;
            padding: 18px 24px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: white;
            font-size: 24px;
            font-weight: 700;
            text-align: center;
            letter-spacing: 8px;
            text-transform: uppercase;
            transition: all 0.3s;
        }

        .code-input:focus {
            outline: none;
            border-color: #E21B23;
            background: rgba(226, 27, 35, 0.1);
        }

        .code-input::placeholder {
            color: rgba(255, 255, 255, 0.3);
            letter-spacing: normal;
        }

        .modal-codigo-buttons {
            display: flex;
            gap: 15px;
        }

        .modal-codigo-btn {
            flex: 1;
            padding: 16px;
            border: none;
            border-radius: 50px;
            font-weight: 700;
            font-size: 14px;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.3s;
            font-family: 'Oswald', sans-serif;
        }

        .modal-codigo-btn-cancel {
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }

        .modal-codigo-btn-cancel:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .modal-codigo-btn-submit {
            background: #E21B23;
            color: white;
        }

        .modal-codigo-btn-submit:hover {
            background: #c71820;
            transform: scale(1.05);
        }

        .modal-codigo-btn-submit:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        .codigo-error-message {
            color: #EF4444;
            font-size: 14px;
            margin-top: 10px;
            font-weight: 600;
            display: none;
        }

        .codigo-error-message.show {
            display: block;
            animation: shake 0.5s;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }
    `;
    document.head.appendChild(style);
}

// ✅ CREAR MODAL DE CÓDIGO
function crearModalCodigo() {
    const modal = document.createElement('div');
    modal.id = 'modalCodigo';
    modal.className = 'modal-codigo-overlay';
    modal.innerHTML = `
        <div class="modal-codigo-content">
            <div class="modal-codigo-icon">
                <span class="material-symbols-outlined">lock</span>
            </div>
            <h2 class="modal-codigo-title">Código de Acceso</h2>
            <p class="modal-codigo-subtitle">
                Ingresa el código proporcionado por el club para continuar con el registro
            </p>
            <div class="code-input-wrapper">
                <input 
                    type="text" 
                    id="codigoInput" 
                    class="code-input" 
                    placeholder="CÓDIGO"
                    maxlength="10"
                    autocomplete="off"
                >
                <div class="codigo-error-message" id="errorCodigo">
                    ❌ Código incorrecto. Verifica e intenta nuevamente.
                </div>
            </div>
            <div class="modal-codigo-buttons">
                <button class="modal-codigo-btn modal-codigo-btn-cancel" id="btnCancelarCodigo">
                    Cancelar
                </button>
                <button class="modal-codigo-btn modal-codigo-btn-submit" id="btnValidarCodigo">
                    Continuar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Configurar eventos del modal
    configurarEventosModal();
}

// ✅ CONFIGURAR EVENTOS DEL MODAL
function configurarEventosModal() {
    const modal = document.getElementById('modalCodigo');
    const codigoInput = document.getElementById('codigoInput');
    const errorCodigo = document.getElementById('errorCodigo');
    const btnCancelar = document.getElementById('btnCancelarCodigo');
    const btnValidar = document.getElementById('btnValidarCodigo');

    // Cerrar modal
    btnCancelar.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    // Validar código al presionar Enter
    codigoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            validarCodigo();
        }
    });

    // Limpiar error al escribir
    codigoInput.addEventListener('input', () => {
        errorCodigo.classList.remove('show');
        codigoInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    });

    // Validar código
    btnValidar.addEventListener('click', validarCodigo);

    // Cerrar modal con tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            modal.classList.remove('show');
        }
    });
}

// ✅ MOSTRAR MODAL
function mostrarModalCodigo() {
    const modal = document.getElementById('modalCodigo');
    const codigoInput = document.getElementById('codigoInput');
    const errorCodigo = document.getElementById('errorCodigo');
    
    modal.classList.add('show');
    codigoInput.value = '';
    errorCodigo.classList.remove('show');
    setTimeout(() => codigoInput.focus(), 300);
}

// ✅ VALIDAR CÓDIGO
function validarCodigo() {
    const codigoInput = document.getElementById('codigoInput');
    const errorCodigo = document.getElementById('errorCodigo');
    const codigo = codigoInput.value.trim().toUpperCase();

    if (!codigo) {
        mostrarError('Por favor, ingresa un código');
        return;
    }

    // Verificar si el código es válido
    if (codigo === CODIGO_VALIDO) {
        // ✅ Código correcto
        console.log('✅ Código válido');
        
        // Guardar código en sessionStorage
        sessionStorage.setItem('codigoAcceso', codigo);
        
        // Mostrar animación de éxito
        codigoInput.style.borderColor = '#10B981';
        codigoInput.style.background = 'rgba(16, 185, 129, 0.1)';
        
        // Redirigir a registro
        setTimeout(() => {
            window.location.href = 'registro-deportista.html';
        }, 500);
    } else {
        // ❌ Código incorrecto
        mostrarError('❌ Código incorrecto. Verifica e intenta nuevamente.');
        codigoInput.value = '';
        codigoInput.focus();
    }
}

// ✅ MOSTRAR ERROR
function mostrarError(mensaje) {
    const codigoInput = document.getElementById('codigoInput');
    const errorCodigo = document.getElementById('errorCodigo');
    
    errorCodigo.textContent = mensaje;
    errorCodigo.classList.add('show');
    codigoInput.style.borderColor = '#EF4444';
}

// Verificar estado de autenticación
function checkAuthStatus() {
    if (typeof AuthAPI !== 'undefined' && AuthAPI.isAuthenticated()) {
        const user = AuthAPI.getCurrentUser();
        if (user && user.role === 'deportista') {
            // Si ya está autenticado como deportista, redirigir al dashboard
            setTimeout(() => {
                window.location.href = '../deportista/dashboard.html';
            }, 1000);
        }
    }
}

// Configurar efecto parallax
function setupParallax() {
    const backgrounds = document.querySelectorAll('.acceso-section-bg');
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        backgrounds.forEach(bg => {
            const rate = scrolled * 0.5;
            bg.style.transform = `translateY(${rate}px) scale(1.1)`;
        });
    });
}

// Manejar errores de imágenes
document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function() {
        console.log('Error loading image:', this.src);
        this.style.display = 'none';
        
        // Crear fallback
        const fallback = document.createElement('div');
        fallback.style.cssText = `
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, #E21B23 0%, #1A1A1A 100%);
            opacity: 0.3;
        `;
        this.parentNode.appendChild(fallback);
    });
});

// Verificar conexión
function checkConnection() {
    if (!navigator.onLine) {
        if (typeof Utils !== 'undefined') {
            Utils.showNotification('No hay conexión a internet', 'error');
        } else {
            console.warn('Sin conexión a internet');
        }
    }
    
    window.addEventListener('online', () => {
        if (typeof Utils !== 'undefined') {
            Utils.showNotification('Conexión restablecida', 'success', 2000);
        }
    });
    
    window.addEventListener('offline', () => {
        if (typeof Utils !== 'undefined') {
            Utils.showNotification('Conexión perdida', 'error');
        }
    });
}

// Inicializar verificación de conexión
checkConnection();