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

// ============================================
// TYPEWRITER EFFECT
// ============================================
class Typewriter {
    constructor(elementSelector, phrases, options = {}) {
        this.element = document.querySelector(elementSelector);
        this.phrases = phrases;
        this.loop = options.loop !== false;
        this.typingSpeed = options.typingSpeed || 100;
        this.deletingSpeed = options.deletingSpeed || 50;
        this.pauseDuration = options.pauseDuration || 2000;

        this.phraseIndex = 0;
        this.charIndex = 0;
        this.isDeleting = false;
        this.timeout = null;

        if (this.element) {
            this.start();
        }
    }

    start() {
        const currentPhrase = this.phrases[this.phraseIndex];

        if (this.isDeleting) {
            this.element.textContent = currentPhrase.substring(0, this.charIndex - 1);
            this.charIndex--;
        } else {
            this.element.textContent = currentPhrase.substring(0, this.charIndex + 1);
            this.charIndex++;
        }

        let speed = this.typingSpeed;

        if (this.isDeleting) {
            speed = this.deletingSpeed;
        }

        if (!this.isDeleting && this.charIndex === currentPhrase.length) {
            // Finished typing phrase
            speed = this.pauseDuration;
            this.isDeleting = true;
        } else if (this.isDeleting && this.charIndex === 0) {
            // Finished deleting phrase
            this.isDeleting = false;
            this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
            if (!this.loop && this.phraseIndex === 0) return; // Stop if no loop
            speed = 500; // Pause before typing next
        }

        this.timeout = setTimeout(() => this.start(), speed);
    }
}

// Init Typewriter
document.addEventListener('DOMContentLoaded', () => {
    // Only init if element exists
    if (document.querySelector('.profile-role')) {
        new Typewriter('.profile-role', [
            'Full Stack Developer & Data Engineer',
            'Python Specialist (Django/Flask)',
            'Creative Frontend Developer',
            'Problem Solver & Tech Enthusiast'
        ]);
    }
});
