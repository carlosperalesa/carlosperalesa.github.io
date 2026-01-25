// ============================================
// TOAST DE BIENVENIDA
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const toast = document.getElementById('welcomeToast');

    if (toast) {
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 2000);
        }, 500);
    }
});
