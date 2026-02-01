// ==========================================
// SCRIPT PARA SELECCIÓN DE ROL - TITANES EVOLUTION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Página de selección de rol cargada');
    
    // Elementos principales
    const roleCards = document.querySelectorAll('.acceso-role-card');
    const helpButton = document.querySelector('.acceso-help-button');
    
    // Efectos hover para las cards
    roleCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('acceso-role-card-active')) {
                this.style.transform = 'translateY(-0.5rem)';
                this.style.borderBottomColor = '#E21B23';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('acceso-role-card-active')) {
                this.style.transform = 'translateY(0)';
                this.style.borderBottomColor = 'transparent';
            }
        });
    });
    
    // Efecto para el botón de ayuda
    if (helpButton) {
        // Efecto hover
        helpButton.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1) rotate(12deg)';
        });
        
        helpButton.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0)';
        });
        
        // Click en botón de ayuda
        helpButton.addEventListener('click', function() {
            showHelpModal();
        });
    }
    
    // Efecto de carga progresiva
    setTimeout(() => {
        roleCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 300);
    
    // Funcionalidad de ayuda
    function showHelpModal() {
        const modalHtml = `
            <div class="acceso-help-modal">
                <div class="acceso-help-modal-content">
                    <div class="acceso-help-modal-header">
                        <span class="material-symbols-outlined">help</span>
                        <h3>¿Necesitas ayuda?</h3>
                    </div>
                    <div class="acceso-help-modal-body">
                        <p>Elige tu rol según tu función en el club:</p>
                        <ul>
                            <li><strong>Administrador:</strong> Gestión completa del sistema</li>
                            <li><strong>Entrenador:</strong> Seguimiento y evaluación de deportistas</li>
                            <li><strong>Deportista:</strong> Acceso a tu progreso y calendario</li>
                        </ul>
                        <p class="acceso-help-contact">
                            <span class="material-symbols-outlined">support_agent</span>
                            Contacto: soporte@titanesevolution.com
                        </p>
                    </div>
                    <div class="acceso-help-modal-footer">
                        <button class="acceso-help-modal-close">Entendido</button>
                    </div>
                </div>
            </div>
        `;
        
        // Crear y mostrar modal
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        // Estilos del modal
        const modalStyles = `
            <style>
                .acceso-help-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(5px);
                    animation: fadeIn 0.3s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .acceso-help-modal-content {
                    background: rgba(26, 26, 26, 0.95);
                    border: 2px solid #E21B23;
                    border-radius: 12px;
                    padding: 2rem;
                    max-width: 500px;
                    width: 90%;
                    backdrop-filter: blur(10px);
                    animation: slideUp 0.3s ease;
                }
                
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                .acceso-help-modal-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    color: #E21B23;
                }
                
                .acceso-help-modal-header .material-symbols-outlined {
                    font-size: 2.5rem;
                }
                
                .acceso-help-modal-header h3 {
                    font-family: 'Oswald', sans-serif;
                    font-size: 1.5rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    margin: 0;
                }
                
                .acceso-help-modal-body {
                    color: #E5E7EB;
                    line-height: 1.6;
                }
                
                .acceso-help-modal-body ul {
                    margin: 1rem 0;
                    padding-left: 1.5rem;
                }
                
                .acceso-help-modal-body li {
                    margin-bottom: 0.5rem;
                }
                
                .acceso-help-modal-body strong {
                    color: #E21B23;
                }
                
                .acceso-help-contact {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 1.5rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    color: #9CA3AF;
                    font-size: 0.9rem;
                }
                
                .acceso-help-modal-footer {
                    margin-top: 1.5rem;
                    text-align: right;
                }
                
                .acceso-help-modal-close {
                    background: #E21B23;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    font-family: 'Montserrat', sans-serif;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .acceso-help-modal-close:hover {
                    background: #c2171e;
                    transform: translateY(-2px);
                }
            </style>
        `;
        
        // Agregar estilos
        document.head.insertAdjacentHTML('beforeend', modalStyles);
        
        // Cerrar modal
        const closeButton = modalContainer.querySelector('.acceso-help-modal-close');
        closeButton.addEventListener('click', function() {
            document.body.removeChild(modalContainer);
        });
        
        // Cerrar al hacer clic fuera
        modalContainer.querySelector('.acceso-help-modal').addEventListener('click', function(e) {
            if (e.target === this) {
                document.body.removeChild(modalContainer);
            }
        });
        
        // Cerrar con ESC
        document.addEventListener('keydown', function closeOnEsc(e) {
            if (e.key === 'Escape') {
                document.body.removeChild(modalContainer);
                document.removeEventListener('keydown', closeOnEsc);
            }
        });
    }
    
    // Prevenir comportamiento por defecto de enlaces (solo para demo)
    const links = document.querySelectorAll('.acceso-role-card[href="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Navegando a:', this.getAttribute('href'));
        });
    });
    
    // Agregar efecto de clic a las cards
    roleCards.forEach(card => {
        card.addEventListener('click', function() {
            // Agregar efecto visual de clic
            this.style.transform = 'translateY(-2px) scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // Si es card activa (entrenador), mantener el estado
            if (this.classList.contains('acceso-role-card-active')) {
                console.log('Navegando al login de entrenador');
            }
        });
    });
});