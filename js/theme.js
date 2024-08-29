document.addEventListener('DOMContentLoaded', function () {
    const mainButton = document.getElementById('main-button');
    const scrollTopButton = document.getElementById('scroll-top-button');
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const body = document.body;

    let isMenuOpen = false;

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        mainButton.classList.toggle('active', isMenuOpen);
        scrollTopButton.style.opacity = isMenuOpen ? '1' : '0';
        scrollTopButton.style.transform = isMenuOpen ? 'scale(1)' : 'scale(0)';
        themeToggleButton.style.opacity = isMenuOpen ? '1' : '0';
        themeToggleButton.style.transform = isMenuOpen ? 'scale(1)' : 'scale(0)';
    }

    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        toggleMenu(); // Cierra el menú después de hacer scroll
    }

    function toggleTheme() {
        body.classList.toggle('dark-mode');
        const isDarkMode = body.classList.contains('dark-mode');
        themeToggleButton.innerHTML = isDarkMode
            ? '<ion-icon name="sunny-outline"></ion-icon>'
            : '<ion-icon name="moon-outline"></ion-icon>';
    }

    mainButton.addEventListener('click', toggleMenu);
    scrollTopButton.addEventListener('click', scrollToTop);
    themeToggleButton.addEventListener('click', toggleTheme);

    document.addEventListener('click', function (event) {
        if (!event.target.closest('.button-container') && isMenuOpen) {
            toggleMenu();
        }
    });
});