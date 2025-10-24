// ============================================
// SCRIPT PRINCIPAL - PORTAFOLIO CARLOS PERALES
// ============================================

// ============================================
// INICIALIZACIÓN DEL DOM
// ============================================
document.addEventListener('DOMContentLoaded', (event) => {
    
    // ============================================
    // BOTONES FLOTANTES - Menú de acciones rápidas
    // ============================================
    const mainButton = document.getElementById('mainButton');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const scrollTopButton = document.getElementById('scrollTopButton');

    // Toggle del menú flotante
    if (mainButton) {
        mainButton.addEventListener('click', () => {
            mainButton.classList.toggle('active');
            const secondaryButtons = document.querySelectorAll('.secondary-button');
            secondaryButtons.forEach(button => {
                button.style.opacity = mainButton.classList.contains('active') ? '1' : '0';
                button.style.transform = mainButton.classList.contains('active') ? 'scale(1)' : 'scale(0)';
            });
        });
    }

    // ============================================
    // MODO OSCURO - Toggle dark/light mode
    // ============================================
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const icon = darkModeToggle.querySelector('ion-icon');
            if (icon) {
                icon.setAttribute('name', document.body.classList.contains('dark-mode') ? 'sunny-outline' : 'moon-outline');
            }
            
            // Guardar preferencia en localStorage
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        });

        // Recuperar preferencia guardada
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'true') {
            document.body.classList.add('dark-mode');
            const icon = darkModeToggle.querySelector('ion-icon');
            if (icon) {
                icon.setAttribute('name', 'sunny-outline');
            }
        }
    }

    // ============================================
    // SCROLL TO TOP - Botón para volver arriba
    // ============================================
    if (scrollTopButton) {
        // Evento click para scroll suave
        scrollTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // Mostrar/ocultar botón según scroll
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 100) {
                scrollTopButton.style.display = 'flex';
            } else {
                scrollTopButton.style.display = 'none';
            }
        });
    }

    // ============================================
    // SECCIONES COLAPSABLES - Expandir/Colapsar contenido
    // ============================================
    const collapsibleSections = document.querySelectorAll('.collapsible-section');

    collapsibleSections.forEach(section => {
        const header = section.querySelector('.section-header');
        if (header) {
            header.addEventListener('click', () => {
                section.classList.toggle('collapsed');
                
                // Actualizar aria-expanded para accesibilidad
                const arrow = header.querySelector('.arrow');
                if (arrow) {
                    const isExpanded = !section.classList.contains('collapsed');
                    arrow.setAttribute('aria-expanded', isExpanded);
                }
                
                // Actualizar aria-hidden del contenido
                const content = section.querySelector('.section-content');
                if (content) {
                    const isHidden = section.classList.contains('collapsed');
                    content.setAttribute('aria-hidden', isHidden);
                }
            });

            // Soporte para navegación por teclado
            const arrow = header.querySelector('.arrow');
            if (arrow) {
                arrow.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        header.click();
                    }
                });
            }
        }
    });

    // ============================================
    // INTERSECTION OBSERVER - Animaciones al hacer scroll
    // ============================================
    
    // Configuración del observer
    const observerOptions = {
        threshold: 0.1,  // Trigger cuando 10% sea visible
        rootMargin: '0px 0px -50px 0px'  // Offset para activar antes
    };

    // Callback cuando elementos entran en viewport
    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                
                // Para barras de progreso, animar el width
                if (entry.target.classList.contains('progress-bar')) {
                    const width = entry.target.style.width;
                    entry.target.style.setProperty('--progress-width', width);
                }
            }
        });
    };

    // Crear el observer
    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observar todos los elementos con clases de animación
    const animatedElements = document.querySelectorAll(
        '.animate-fade-in, .animate-slide-left, .animate-slide-right, .animate-slide-up, .animate-scale-up'
    );
    
    animatedElements.forEach(el => observer.observe(el));

    // Observar barras de progreso
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.setProperty('--progress-width', width);
        observer.observe(bar);
    });

});

// ============================================
// TARJETAS DE PROYECTOS - Flip cards interactivas
// ============================================
function toggleCard(card, url) {
    // Click abre el proyecto directamente
    window.open(url, '_blank');
}

// Agregar eventos hover a las tarjetas de proyectos
document.addEventListener('DOMContentLoaded', () => {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        // Voltear al pasar el cursor
        card.addEventListener('mouseenter', () => {
            card.classList.add('active');
        });
        
        // Volver a la posición original al salir
        card.addEventListener('mouseleave', () => {
            card.classList.remove('active');
        });
    });
});

// ============================================
// GALERÍA DE CERTIFICADOS - Carrusel interactivo
// ============================================
$(function () {
    // Verificar si el elemento existe antes de inicializar
    if ($('.cert-container').length > 0) {
        // Inicialización de la galería
        $('.cert-container').gallery({
            autoplay: false,  // Sin reproducción automática
            interval: 4000    // Intervalo en caso de activarse
        });

        // Navegación con botón anterior
        $('.dg-prev').on('click', function () {
            $('.cert-container').data('gallery')._navigate('prev');
        });

        // Navegación con botón siguiente
        $('.dg-next').on('click', function () {
            $('.cert-container').data('gallery')._navigate('next');
        });

        // Soporte para navegación con teclado
        $(document).on('keydown', function(e) {
            if ($('.cert-container').is(':visible')) {
                if (e.key === 'ArrowLeft') {
                    $('.dg-prev').click();
                } else if (e.key === 'ArrowRight') {
                    $('.dg-next').click();
                }
            }
        });
    }
});
