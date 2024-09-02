document.addEventListener('DOMContentLoaded', (event) => {
    const mainButton = document.getElementById('mainButton');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const scrollTopButton = document.getElementById('scrollTopButton');

    // Función para alternar la visibilidad de los botones secundarios
    mainButton.addEventListener('click', () => {
        mainButton.classList.toggle('active');
        const secondaryButtons = document.querySelectorAll('.secondary-button');
        secondaryButtons.forEach(button => {
            button.style.opacity = mainButton.classList.contains('active') ? '1' : '0';
            button.style.transform = mainButton.classList.contains('active') ? 'scale(1)' : 'scale(0)';
        });
    });

    // Función para alternar el modo oscuro
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const icon = darkModeToggle.querySelector('ion-icon');
        icon.setAttribute('name', document.body.classList.contains('dark-mode') ? 'sunny-outline' : 'moon-outline');
    });

    // Función para desplazarse hacia arriba
    scrollTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Ocultar el botón de desplazamiento hacia arriba cuando se está en la parte superior
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 100) {
            scrollTopButton.style.display = 'flex';
        } else {
            scrollTopButton.style.display = 'none';
        }
    });
});