// ==========================================
// SCRIPTS LANDING PAGE - TITANES EVOLUTION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Landing page cargada - Titanes Evolution');
    
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            this.classList.toggle('active');
        });
        
        // Cerrar menú al hacer clic en un enlace
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                if (mobileMenuBtn) {
                    mobileMenuBtn.classList.remove('active');
                }
            });
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId.startsWith('#!')) return;
            
            // Si es un enlace interno (#) hacer scroll suave
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const navbarHeight = navbar ? navbar.offsetHeight : 0;
                    const targetPosition = targetElement.offsetTop - navbarHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Cerrar menú móvil si está abierto
                    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                        mobileMenu.classList.add('hidden');
                        if (mobileMenuBtn) {
                            mobileMenuBtn.classList.remove('active');
                        }
                    }
                }
            }
        });
    });

    // Gallery images lazy loading
    const galleryImages = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window && galleryImages.length > 0) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                    }
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '100px'
        });

        galleryImages.forEach(img => imageObserver.observe(img));
    }

    // WhatsApp button animation
    const whatsappBtn = document.querySelector('.whatsapp-btn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1) rotate(5deg)';
        });
        
        whatsappBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0deg)';
        });
    }

    // Counter animation for stats (ya está en el HTML inline, pero por si acaso)
    const counters = document.querySelectorAll('.counter');
    
    const startCounter = (counter) => {
        const target = +counter.getAttribute('data-target');
        if (!target) return;
        
        const increment = target / 100;
        let current = 0;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                counter.textContent = Math.ceil(current);
                setTimeout(updateCounter, 20);
            } else {
                counter.textContent = target + '+';
            }
        };
        
        updateCounter();
    };

    // Iniciar contadores cuando son visibles
    if (counters.length > 0 && 'IntersectionObserver' in window) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    startCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.5,
            rootMargin: '50px'
        });

        counters.forEach(counter => counterObserver.observe(counter));
    }

    // Initialize Material Icons
    const materialIcons = document.querySelectorAll('.material-symbols-outlined');
    if (materialIcons.length > 0) {
        materialIcons.forEach(icon => {
            icon.style.fontVariationSettings = "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24";
        });
    }

    // AOS (Animate On Scroll) simple
    const aosElements = document.querySelectorAll('.fade-in');
    
    if (aosElements.length > 0 && 'IntersectionObserver' in window) {
        const aosObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        aosElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            aosObserver.observe(el);
        });
    }

    // Form validation (si hay formularios)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            if (!submitBtn) return;
            
            const originalText = submitBtn.textContent;
            
            // Simular envío
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
            submitBtn.classList.add('opacity-50');
            
            setTimeout(() => {
                alert('¡Mensaje enviado! Te contactaremos pronto.');
                contactForm.reset();
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                submitBtn.classList.remove('opacity-50');
            }, 1500);
        });
    }

    // Fix for video/GIF performance
    const heroVideo = document.querySelector('video[autoplay]');
    if (heroVideo) {
        // Asegurar que el video se reproduce correctamente
        heroVideo.play().catch(e => {
            console.log('Video autoplay prevented:', e);
        });
    }

    console.log('✅ Scripts inicializados correctamente');
});

// Función para cambiar tema (opcional - si decides implementarlo)
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.classList.remove(currentTheme);
    html.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Actualizar icono si existe
    const themeIcon = document.querySelector('#themeIcon');
    if (themeIcon) {
        themeIcon.textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
    }
}

// Cargar tema guardado (opcional)
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
}