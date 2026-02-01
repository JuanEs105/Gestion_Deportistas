// assets/js/competencias.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Módulo Competencias - Titanes Evolution');
    
    // Inicializar efectos de hover para tarjetas
    initCompetitionCards();
    
    // Inicializar animaciones de timeline
    initTimelineAnimations();
    
    // Contadores de estadísticas
    initStatisticsCounters();
    
    // Efecto parallax sutil para hero
    initHeroParallax();
});

// Función para inicializar efectos de hover en tarjetas
function initCompetitionCards() {
    const cards = document.querySelectorAll('.competition-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.zIndex = '100';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.zIndex = 'auto';
        });
    });
}

// Función para animaciones de timeline
function initTimelineAnimations() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target.querySelector('.timeline-card');
                if (card) {
                    card.classList.add('fade-in-up');
                    card.style.opacity = '1';
                    card.style.transform = 'translateX(0)';
                    
                    // Agregar delay para items alternos
                    if (entry.target.classList.contains('timeline-item-right')) {
                        card.style.transitionDelay = '0.2s';
                    }
                }
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '50px'
    });
    
    timelineItems.forEach(item => {
        const card = item.querySelector('.timeline-card');
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'translateX(30px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            
            if (item.classList.contains('timeline-item-right')) {
                card.style.transform = 'translateX(-30px)';
            }
        }
        observer.observe(item);
    });
}

// Función para contadores de estadísticas
function initStatisticsCounters() {
    const counters = document.querySelectorAll('.font-sport.text-4xl, .font-sport.text-5xl');
    const statsElements = [];
    
    // Filtrar solo los elementos que tienen números
    counters.forEach(counter => {
        if (counter.textContent.match(/\d+/)) {
            statsElements.push(counter);
        }
    });
    
    if (statsElements.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const text = element.textContent;
                const numberMatch = text.match(/(\d+)/);
                
                if (numberMatch) {
                    const target = parseInt(numberMatch[1]);
                    animateCounter(element, target);
                }
                
                observer.unobserve(element);
            }
        });
    }, {
        threshold: 0.5,
        rootMargin: '50px'
    });
    
    statsElements.forEach(element => {
        observer.observe(element);
    });
}

// Función para animar contadores
function animateCounter(element, target) {
    const suffix = element.textContent.includes('+') ? '+' : '';
    const duration = 1500; // ms
    const stepTime = Math.floor(duration / target);
    let current = 0;
    
    const timer = setInterval(() => {
        current++;
        element.textContent = current + suffix;
        
        if (current >= target) {
            clearInterval(timer);
            element.textContent = target + suffix;
        }
    }, stepTime);
}

// Función para efecto parallax sutil en hero
function initHeroParallax() {
    const hero = document.querySelector('.competition-hero');
    if (!hero) return;
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.3;
        
        hero.style.transform = `translate3d(0, ${rate}px, 0)`;
    });
}

// Función para animar badges de posición al hover
function initPositionBadgeAnimation() {
    const badges = document.querySelectorAll('.position-badge');
    
    badges.forEach(badge => {
        badge.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.2) rotate(180deg)';
            this.style.transition = 'transform 0.5s ease';
        });
        
        badge.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0deg)';
        });
    });
}

// Inicializar animaciones de badges
setTimeout(() => {
    initPositionBadgeAnimation();
}, 1000);

// Mobile menu toggle (si no está en main.js)
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileMenuBtn && mobileMenu && !document.querySelector('script[src*="main.js"]')) {
    mobileMenuBtn.addEventListener('click', function() {
        mobileMenu.classList.toggle('hidden');
        this.classList.toggle('active');
    });
    
    // Cerrar menú al hacer clic en un enlace
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    });
}