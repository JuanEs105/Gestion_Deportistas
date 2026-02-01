// ==========================================
// ACCESO DEPORTISTA - JavaScript
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Acceso Deportista page loaded');
    
    // Inicializar AuthAPI
    if (typeof AuthAPI !== 'undefined') {
        AuthAPI.init();
    }
    
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
    const buttons = document.querySelectorAll('.btn-acceso-deportista');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
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
        
        // Efecto de clic
        button.addEventListener('click', function(e) {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // Si hay un loader, mostrarlo
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
                showLoading(this);
            }
        });
    });
    
    // Agregar estilos para ripple effect
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
        
        .loading::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            margin: -10px 0 0 -10px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    // Verificar si el usuario ya está autenticado
    checkAuthStatus();
    
    // Añadir efecto parallax
    setupParallax();
});

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

// Mostrar loading en botón
function showLoading(button) {
    const originalText = button.textContent;
    button.classList.add('loading');
    button.disabled = true;
    
    setTimeout(() => {
        button.classList.remove('loading');
        button.disabled = false;
        button.textContent = originalText;
    }, 2000);
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