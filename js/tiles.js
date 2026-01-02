document.addEventListener('DOMContentLoaded', () => {

    // --- SCROLL ANIMATION (Intersection Observer) ---
    const tiles = document.querySelectorAll('.tile');

    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 50);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    tiles.forEach(tile => {
        observer.observe(tile);

        // --- 3D TILT & GLARE EFFECT ---
        if (!tile.classList.contains('flip-card')) {
            tile.addEventListener('mousemove', (e) => {
                const rect = tile.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Spotlight vars
                tile.style.setProperty('--mouse-x', `${x}px`);
                tile.style.setProperty('--mouse-y', `${y}px`);

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const percentX = (x - centerX) / centerX;
                const percentY = (y - centerY) / centerY;

                // --- PHYSICS COMPENSATION ---
                // "Compensar experiencia": Wide/Large cards need LESS rotation 
                // to avoid excessive Z-movement at the edges.
                // Small cards can handle MORE rotation for a "tactile" feel.

                let maxRotate = 5; // Default for small cards (Level 5)

                // If width is > 400 (Wide tiles like Experience), reduce rotation
                if (rect.width > 400) {
                    maxRotate = 2.5; // Reduced opacity/intensity for large surfaces
                }

                const rotateY = percentX * maxRotate * -1;
                const rotateX = percentY * maxRotate;

                tile.style.transform = `
                    perspective(1000px)
                    rotateX(${rotateX}deg) 
                    rotateY(${rotateY}deg)
                    scale3d(1.02, 1.02, 1.02)
                `;
            });

            tile.addEventListener('mouseleave', () => {
                tile.style.transform = `
                    perspective(1000px)
                    rotateX(0deg) 
                    rotateY(0deg)
                    scale3d(1, 1, 1)
                `;
            });
        } else {
            // Flip cards: just spotlight
            tile.addEventListener('mousemove', (e) => {
                const rect = tile.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                tile.style.setProperty('--mouse-x', `${x}px`);
                tile.style.setProperty('--mouse-y', `${y}px`);
            });
        }
    });


    // --- DARK MODE TOGGLE (SLIDER) ---
    const themeCheckbox = document.getElementById('checkbox');
    const body = document.body;

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        themeCheckbox.checked = true;
    }

    themeCheckbox.addEventListener('change', () => {
        if (themeCheckbox.checked) {
            body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });

    // --- MOBILE MENU LOGIC ---
    const topBar = document.querySelector('.top-bar');
    const overlay = document.querySelector('.mobile-menu-overlay');

    if (topBar && overlay) {
        topBar.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (e.target.closest('.theme-switch-wrapper')) return;
                overlay.classList.add('active');
            }
        });

        overlay.addEventListener('click', () => {
            overlay.classList.remove('active');
        });
    }

});
