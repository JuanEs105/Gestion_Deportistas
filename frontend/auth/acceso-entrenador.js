// ==========================================
// ACCESO ENTRENADORES - JavaScript
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Acceso Entrenadores page loaded');
    
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
    
    // Configurar botones
    const buttons = document.querySelectorAll('.btn-acceso-entrenador');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            createRippleEffect(this, event);
        });
        
        // Efecto de clic
        button.addEventListener('click', function(e) {
            // Efecto visual de clic
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // Mostrar loading si no hay href válido
            if (this.getAttribute('href') === '#' || !this.getAttribute('href')) {
                e.preventDefault();
                showLoading(this);
                
                // Simular redirección después de 1.5 segundos
                setTimeout(() => {
                    if (this.classList.contains('btn-register')) {
                        window.location.href = 'registro-entrenador.html';
                    } else {
                        window.location.href = 'login.html?role=entrenador';
                    }
                }, 1500);
            }
        });
    });
    
    // Configurar botón de volver
    const backButton = document.querySelector('.btn-back-entrenadores');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
                window.history.back();
            }
        });
    }
    
    // Verificar estado de autenticación
    checkAuthStatus();
    
    // Añadir efecto parallax
    setupParallax();
    
    // Agregar estilos para efectos
    addDynamicStyles();
    
    // Prevenir recarga en desarrollo
    preventDefaultLinks();
});

// Verificar estado de autenticación
function checkAuthStatus() {
    // En un sistema real, verificaría si el usuario ya está autenticado
    // Por ahora es un placeholder
    const token = localStorage.getItem('coach_token');
    if (token) {
        console.log('Entrenador ya autenticado');
        // Redirigir al dashboard si ya está logueado
        // window.location.href = '../entrenador/dashboard.html';
    }
}

// Mostrar loading en botón
function showLoading(button) {
    const originalText = button.textContent;
    button.innerHTML = '<span class="loading-spinner"></span>';
    button.disabled = true;
    button.classList.add('loading');
    
    // Restaurar después de 1.5 segundos
    setTimeout(() => {
        button.disabled = false;
        button.classList.remove('loading');
        button.textContent = originalText;
    }, 1500);
}

// Configurar efecto parallax
function setupParallax() {
    const backgrounds = document.querySelectorAll('.acceso-section-bg');
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        backgrounds.forEach(bg => {
            const rate = scrolled * 0.3;
            bg.style.transform = `translateY(${rate}px) scale(1.05)`;
        });
    });
    
    // Efecto al mover el mouse
    document.addEventListener('mousemove', function(e) {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        backgrounds.forEach(bg => {
            const moveX = (mouseX - 0.5) * 20;
            const moveY = (mouseY - 0.5) * 20;
            bg.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.05)`;
        });
    });
}

// Efecto ripple para botones
function createRippleEffect(button, event) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    button.appendChild(ripple);
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    setTimeout(() => ripple.remove(), 600);
}

// Agregar estilos dinámicos
function addDynamicStyles() {
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
        
        .loading {
            position: relative;
            color: transparent !important;
        }
        
        .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Animación de entrada para las secciones */
        .acceso-section {
            animation: slideIn 0.8s ease-out;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Animación para el logo */
        .acceso-section-content {
            animation: fadeInScale 0.8s ease-out;
        }
        
        @keyframes fadeInScale {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        
        /* Efecto hover mejorado para secciones */
        .acceso-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, transparent, rgba(226, 27, 35, 0.1), transparent);
            transform: translateX(-100%);
            transition: transform 0.6s ease;
            z-index: 2;
        }
        
        .acceso-section:hover::before {
            transform: translateX(100%);
        }
    `;
    document.head.appendChild(style);
}

// Prevenir comportamiento por defecto en desarrollo
function preventDefaultLinks() {
    const links = document.querySelectorAll('a[href="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Navegando a:', this.textContent);
        });
    });
}

// Manejar errores de imágenes
document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function() {
        console.log('Error cargando imagen:', this.src);
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
        console.warn('⚠️ Sin conexión a internet');
        showOfflineNotification();
    }
    
    window.addEventListener('online', () => {
        console.log('✅ Conexión restablecida');
        showOnlineNotification();
    });
    
    window.addEventListener('offline', () => {
        console.warn('⚠️ Conexión perdida');
        showOfflineNotification();
    });
}

// Mostrar notificación offline
function showOfflineNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #E21B23;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-family: 'Montserrat', sans-serif;
        font-weight: 500;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = '⚠️ Sin conexión a internet';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Mostrar notificación online
function showOnlineNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-family: 'Montserrat', sans-serif;
        font-weight: 500;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = '✅ Conexión restablecida';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Inicializar verificación de conexión
checkConnection();

// Manejar teclado
document.addEventListener('keydown', function(e) {
    // Navegación con teclado
    if (e.key === 'ArrowLeft') {
        const loginBtn = document.querySelector('.btn-login');
        if (loginBtn) loginBtn.focus();
    }
    
    if (e.key === 'ArrowRight') {
        const registerBtn = document.querySelector('.btn-register');
        if (registerBtn) registerBtn.focus();
    }
    
    if (e.key === 'Escape') {
        window.history.back();
    }
    
    if (e.key === 'Enter' && document.activeElement.classList.contains('btn-acceso-entrenador')) {
        document.activeElement.click();
    }
});

// Mejorar accesibilidad
function enhanceAccessibility() {
    // Añadir aria-labels
    const sections = document.querySelectorAll('.acceso-section');
    sections.forEach((section, index) => {
        section.setAttribute('role', 'button');
        section.setAttribute('tabindex', '0');
        section.setAttribute('aria-label', index === 0 ? 
            'Sección de inicio de sesión para entrenadores' : 
            'Sección de registro para nuevos entrenadores');
    });
    
    // Añadir focus styles
    const style = document.createElement('style');
    style.textContent = `
        .acceso-section:focus {
            outline: 2px solid #E21B23;
            outline-offset: 4px;
        }
        
        .btn-acceso-entrenador:focus {
            outline: 2px solid white;
            outline-offset: 4px;
        }
    `;
    document.head.appendChild(style);
}

// Inicializar accesibilidad
enhanceAccessibility();

// Performance: cargar imágenes con lazy loading
document.querySelectorAll('.acceso-section-bg').forEach(bg => {
    bg.style.opacity = '0';
    setTimeout(() => {
        bg.style.transition = 'opacity 0.5s ease';
        bg.style.opacity = '0.3';
    }, 100);
});