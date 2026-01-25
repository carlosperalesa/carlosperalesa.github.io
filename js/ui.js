// ============================================
// UI GENERAL: TEMA
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        if (themeToggle) themeToggle.checked = true;
    }

    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            if (typeof playTap === 'function') playTap();

            if (themeToggle.checked) {
                body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // Minimizar todo al hacer clic en el nombre
    document.getElementById('minimizeAll')?.addEventListener('click', () => {
        if (typeof minimizeAll === 'function') minimizeAll();
    });
});
