// ============================================
// SONIDO
// ============================================
let tapSound;

document.addEventListener('DOMContentLoaded', () => {
    tapSound = document.getElementById('tapSound');
    if (tapSound) {
        tapSound.volume = 0.3;
    }

    // Sonido en items de proyecto
    const projectApps = document.querySelectorAll('.project-app');
    projectApps.forEach(app => {
        app.addEventListener('click', playTap);
    });
});

function playTap() {
    if (tapSound) {
        tapSound.currentTime = 0;
        tapSound.play().catch(() => { }); // Ignorar errores de autoplay
    }
}
