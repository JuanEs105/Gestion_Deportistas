// assets/js/ubicacion.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Módulo Ubicación - Titanes Evolution');
    
    // Inicializar mapa interactivo
    initMapInteractions();
    
    // Inicializar efectos de hover en tarjetas
    initCardHoverEffects();
    
    // Inicializar animaciones de scroll
    initScrollAnimations();
    
    // Inicializar funcionalidad de contacto
    initContactFunctionality();
    
    // Inicializar navegación en móvil
    initMobileNavigation();
});

// Función para interacciones con el mapa
function initMapInteractions() {
    const mapContainer = document.querySelector('.ubicacion-map-container');
    const mapIframe = document.querySelector('.ubicacion-map-iframe');
    
    if (!mapContainer || !mapIframe) return;
    
    // Agregar efecto de hover al mapa
    mapContainer.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.02)';
        this.style.transition = 'transform 0.3s ease';
    });
    
    mapContainer.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
    
    // Agregar efecto de clic para abrir en nueva pestaña
    mapContainer.addEventListener('click', function(e) {
        // Evitar abrir nueva pestaña si se hace clic en el iframe directamente
        if (e.target === mapIframe) return;
        
        const mapUrl = 'https://www.google.com/maps/place/Titanes+GYm/@5.8245029,-73.0248761,17z/data=!3m1!4b1!4m6!3m5!1s0x8e6a3fe8fcaa20eb:0x570f6a786702fb13!8m2!3d5.8245029!4d-73.0248761!16s%2Fg%2F11sx7f2yhh?entry=ttu&g_ep=EgoyMDI0MTIwOC4wIKXMDSoASAFQAw%3D%3D';
        
        window.open(mapUrl, '_blank', 'noopener,noreferrer');
    });
    
    // Agregar tooltip informativo
    mapContainer.title = 'Haz clic para abrir en Google Maps';
}

// Función para efectos de hover en tarjetas
function initCardHoverEffects() {
    // Tarjetas de información
    const infoCards = document.querySelectorAll('.ubicacion-info-card');
    
    infoCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.ubicacion-icon');
            if (icon) {
                icon.style.transform = 'rotate(15deg) scale(1.1)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.ubicacion-icon');
            if (icon) {
                icon.style.transform = 'rotate(0) scale(1)';
            }
        });
    });
    
    // Tarjetas de instalaciones
    const instalacionCards = document.querySelectorAll('.instalacion-card');
    
    instalacionCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const title = this.querySelector('h3');
            if (title) {
                title.style.color = 'var(--primary)';
                title.style.transition = 'color 0.3s ease';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const title = this.querySelector('h3');
            if (title) {
                title.style.color = 'white';
            }
        });
    });
}

// Función para animaciones al hacer scroll
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '50px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Agregar delays escalonados para tarjetas
                if (entry.target.classList.contains('ubicacion-info-card')) {
                    const index = Array.from(document.querySelectorAll('.ubicacion-info-card')).indexOf(entry.target);
                    entry.target.style.animationDelay = `${index * 0.1}s`;
                }
                
                // Observar solo una vez
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observar elementos para animación
    const elementsToAnimate = [
        ...document.querySelectorAll('.ubicacion-info-card'),
        ...document.querySelectorAll('.instalacion-card'),
        ...document.querySelectorAll('.instalacion-feature'),
        ...document.querySelectorAll('.transporte-card'),
        document.querySelector('.ubicacion-referencia-card')
    ];
    
    elementsToAnimate.forEach(element => {
        if (element) {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(element);
        }
    });
}

// Función para funcionalidad de contacto
function initContactFunctionality() {
    // Copiar número de teléfono al portapapeles
    const phoneNumbers = document.querySelectorAll('.ubicacion-info-text');
    
    phoneNumbers.forEach(container => {
        if (container.textContent.includes('+57')) {
            container.style.cursor = 'pointer';
            container.title = 'Haz clic para copiar el número';
            
            container.addEventListener('click', function() {
                const text = this.textContent;
                const phoneNumber = text.match(/\+57\s*\d{3}\s*\d{3}\s*\d{4}/)?.[0];
                
                if (phoneNumber) {
                    navigator.clipboard.writeText(phoneNumber)
                        .then(() => {
                            showNotification('Número copiado al portapapeles: ' + phoneNumber);
                        })
                        .catch(err => {
                            console.error('Error al copiar:', err);
                        });
                }
            });
        }
    });
    
    // Funcionalidad para el botón de WhatsApp
    const whatsappBtn = document.querySelector('.ubicacion-whatsapp-btn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        whatsappBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    }
}

// Función para mostrar notificaciones
function showNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'fixed top-24 right-6 bg-primary text-white px-6 py-3 rounded-lg shadow-lg z-[1000] animate-fade-in';
    notification.textContent = message;
    notification.style.fontFamily = "'Montserrat', sans-serif";
    notification.style.fontWeight = '600';
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        notification.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Función para navegación en móvil (si no está en main.js)
function initMobileNavigation() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn && mobileMenu && !document.querySelector('script[src*="main.js"]')) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            
            // Cambiar ícono
            const icon = this.querySelector('.material-symbols-outlined');
            if (icon) {
                if (mobileMenu.classList.contains('hidden')) {
                    icon.textContent = 'menu';
                } else {
                    icon.textContent = 'close';
                }
            }
        });
        
        // Cerrar menú al hacer clic en un enlace
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                const icon = mobileMenuBtn.querySelector('.material-symbols-outlined');
                if (icon) {
                    icon.textContent = 'menu';
                }
            });
        });
        
        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', function(event) {
            if (!mobileMenuBtn.contains(event.target) && !mobileMenu.contains(event.target)) {
                mobileMenu.classList.add('hidden');
                const icon = mobileMenuBtn.querySelector('.material-symbols-outlined');
                if (icon) {
                    icon.textContent = 'menu';
                }
            }
        });
    }
}

// CSS para animaciones (inyectado dinámicamente)
const style = document.createElement('style');
style.textContent = `
    @keyframes fade-in {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animate-in {
        animation: fade-in 0.6s ease forwards;
    }
    
    @keyframes fade-in-notification {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .animate-fade-in {
        animation: fade-in-notification 0.3s ease forwards;
    }
`;
document.head.appendChild(style);