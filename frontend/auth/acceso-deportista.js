// ==========================================
// ACCESO DEPORTISTA - JavaScript CON CÓDIGO
// ==========================================

// ✅ CÓDIGO VÁLIDO - CÁMBIALO AQUÍ
const CODIGO_VALIDO = 'TITAN2026';

console.log('📝 Script cargado - Código válido configurado:', CODIGO_VALIDO);

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM cargado - Iniciando configuración...');
    
    // Inicializar AuthAPI
    if (typeof AuthAPI !== 'undefined') {
        AuthAPI.init();
    }

    // ✅ CREAR MODAL DE CÓDIGO PRIMERO
    crearModalCodigo();
    
    // ✅ ESPERAR UN POCO Y LUEGO INTERCEPTAR EL BOTÓN
    setTimeout(() => {
        interceptarBotonRegistro();
    }, 100);
    
    // Configurar resto de funcionalidades
    configurarSeccionesHover();
    agregarEstilos();
    checkAuthStatus();
    setupParallax();
});

// ✅ FUNCIÓN PARA INTERCEPTAR EL BOTÓN DE REGISTRO
function interceptarBotonRegistro() {
    console.log('🔍 Buscando botón de registro...');
    
    // Buscar el botón por múltiples métodos
    const btnRegistro = document.querySelector('.btn-register') || 
                       document.querySelector('a.btn-register') ||
                       document.querySelector('button.btn-register') ||
                       document.querySelector('.acceso-register-section .btn-acceso-deportista');
    
    if (!btnRegistro) {
        console.error('❌ No se encontró el botón de registro');
        // Buscar cualquier elemento con "Crear Cuenta"
        const todosElementos = document.querySelectorAll('a, button');
        todosElementos.forEach(el => {
            if (el.textContent.trim().includes('Crear Cuenta')) {
                console.log('✅ Encontrado por texto:', el);
                setupBotonClick(el);
            }
        });
        return;
    }
    
    console.log('✅ Botón encontrado:', btnRegistro);
    console.log('   Tipo:', btnRegistro.tagName);
    console.log('   Clases:', btnRegistro.className);
    console.log('   Href:', btnRegistro.href);
    
    setupBotonClick(btnRegistro);
}

// ✅ CONFIGURAR EL CLICK DEL BOTÓN
function setupBotonClick(boton) {
    // Si es un enlace, cambiar el href para que no navegue
    if (boton.tagName === 'A') {
        const hrefOriginal = boton.href;
        boton.href = 'javascript:void(0)';
        console.log('🔗 Href modificado de', hrefOriginal, 'a javascript:void(0)');
    }
    
    // Agregar evento click
    boton.addEventListener('click', function(e) {
        console.log('🚀 ¡CLICK DETECTADO!');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        mostrarModalCodigo();
        return false;
    }, true); // Usar capture phase
    
    // También agregar en bubbling phase por si acaso
    boton.addEventListener('click', function(e) {
        console.log('🚀 ¡CLICK DETECTADO (bubbling)!');
        e.preventDefault();
        e.stopPropagation();
        mostrarModalCodigo();
        return false;
    }, false);
    
    console.log('✅ Event listeners configurados');
}

// Configurar hover para secciones
function configurarSeccionesHover() {
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
    
    // Configurar efecto ripple para botones
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
    });
}

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
    console.log('✅ Modal creado y agregado al DOM');

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
        console.log('🚪 Cerrando modal');
        modal.classList.remove('show');
    });

    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            console.log('🚪 Cerrando modal (click fuera)');
            modal.classList.remove('show');
        }
    });

    // Validar código al presionar Enter
    codigoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('⌨️ Enter presionado');
            validarCodigo();
        }
    });

    // Limpiar error al escribir
    codigoInput.addEventListener('input', () => {
        errorCodigo.classList.remove('show');
        codigoInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    });

    // Validar código
    btnValidar.addEventListener('click', () => {
        console.log('🔘 Botón Continuar presionado');
        validarCodigo();
    });

    // Cerrar modal con tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            console.log('🚪 Cerrando modal (ESC)');
            modal.classList.remove('show');
        }
    });
}

// ✅ MOSTRAR MODAL
function mostrarModalCodigo() {
    console.log('📺 Mostrando modal de código');
    const modal = document.getElementById('modalCodigo');
    const codigoInput = document.getElementById('codigoInput');
    const errorCodigo = document.getElementById('errorCodigo');
    
    if (!modal) {
        console.error('❌ Modal no encontrado');
        return;
    }
    
    modal.classList.add('show');
    codigoInput.value = '';
    errorCodigo.classList.remove('show');
    codigoInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    setTimeout(() => codigoInput.focus(), 300);
    console.log('✅ Modal mostrado');
}

// ✅ VALIDAR CÓDIGO
function validarCodigo() {
    const codigoInput = document.getElementById('codigoInput');
    const errorCodigo = document.getElementById('errorCodigo');
    const codigo = codigoInput.value.trim().toUpperCase();

    console.log('🔍 Validando código:', codigo);

    if (!codigo) {
        mostrarError('Por favor, ingresa un código');
        return;
    }

    // Verificar si el código es válido
    if (codigo === CODIGO_VALIDO) {
        // ✅ Código correcto
        console.log('✅ ¡Código válido! Redirigiendo...');
        
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
        console.log('❌ Código incorrecto');
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
    console.log('⚠️ Error mostrado:', mensaje);
}

// Verificar estado de autenticación
function checkAuthStatus() {
    if (typeof AuthAPI !== 'undefined' && AuthAPI.isAuthenticated()) {
        const user = AuthAPI.getCurrentUser();
        if (user && user.role === 'deportista') {
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

console.log('✅ Script completamente cargado y listo');