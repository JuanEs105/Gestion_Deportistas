// assets/js/historia.js - JavaScript específico para Historia
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Módulo Historia - Titanes Evolution');
    
    // Contadores de estadísticas
    function initCounters() {
        const counters = document.querySelectorAll('.counter');
        if (!counters.length) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = +entry.target.getAttribute('data-target');
                    animateCounter(entry.target, target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => observer.observe(counter));
    }
    
    function animateCounter(element, target) {
        let current = 0;
        const increment = target / 100;
        const duration = 1500;
        const stepTime = duration / 100;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.ceil(current);
            }
        }, stepTime);
    }
    
    // Efectos hover para galería
    function initGalleryHover() {
        const galleryItems = document.querySelectorAll('.masonry-item');
        galleryItems.forEach(item => {
            const img = item.querySelector('img');
            if (!img) return;
            
            item.addEventListener('mouseenter', () => {
                img.style.transform = 'scale(1.05)';
            });
            
            item.addEventListener('mouseleave', () => {
                img.style.transform = 'scale(1)';
            });
        });
    }
    
    // Animación de entrada para timeline
    function initTimelineAnimation() {
        const timelineItems = document.querySelectorAll('.flex.flex-col.md\\:flex-row, .flex.flex-col.md\\:flex-row-reverse');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    entry.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                }
            });
        }, { threshold: 0.1 });
        
        timelineItems.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px)';
            observer.observe(item);
        });
    }
    
    // Inicializar todo
    initCounters();
    initGalleryHover();
    initTimelineAnimation();
    
    // Mobile menu (si se necesita específico)
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            this.classList.toggle('active');
        });
    }
});