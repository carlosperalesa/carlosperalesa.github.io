document.addEventListener('DOMContentLoaded', () => {
    // Force scroll to top on refresh to prevent layout glitches with sticky headers
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // --- HELPER: THROTTLE FUNCTION (Performance) ---
    function throttle(func, limit) {
        let lastFunc;
        let lastRan;
        return function () {
            const context = this;
            const args = arguments;
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function () {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        }
    }

    // --- MAGNETIC CURSOR ---
    const cursorDot = document.querySelector(".cursor-dot");
    const cursorOutline = document.querySelector(".cursor-outline");
    const isDesktop = matchMedia('(hover: hover)').matches;

    if (isDesktop && cursorDot && cursorOutline) {
        // Throttled Mouse Move (16ms = ~60fps)
        window.addEventListener("mousemove", throttle((e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        }, 16));

        const hoverables = document.querySelectorAll('a, button, .tile, .contact-item, .skill-tag, .theme-switch, .social-link, .mobile-menu-toggle, input, .filter-btn');

        hoverables.forEach(el => {
            el.addEventListener('mouseenter', () => { document.body.classList.add('hovering'); });
            el.addEventListener('mouseleave', () => { document.body.classList.remove('hovering'); });
        });
    }



    // --- MOBILE SCROLL EFFECTS (Flip & Scale) ---
    let mobileObserver;

    function initMobileScrollEffects() {
        const isMobile = window.innerWidth <= 768;
        const flipCards = document.querySelectorAll('.tile.flip-card');
        const staticTiles = document.querySelectorAll('.tile:not(.flip-card)');

        // Cleanup previous observer
        if (mobileObserver) {
            mobileObserver.disconnect();
            mobileObserver = null;
        }

        // Reset styles
        flipCards.forEach(card => {
            const cardInner = card.querySelector('.card-inner');
            if (cardInner) cardInner.style.transform = '';
        });
        staticTiles.forEach(tile => {
            tile.style.transform = '';
        });

        if (isMobile) {
            const topBar = document.querySelector('.top-bar'); // Select top bar

            const observerOptions = {
                threshold: 0.6, // Higher threshold for center focus
                rootMargin: "-20% 0px -20% 0px"
            };

            mobileObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const target = entry.target;

                    // Case 1: Flip Card
                    // Case 1: Flip Card - REMOVED AUTO FLIP (User Feedback)
                    // if (target.classList.contains('flip-card')) { ... }

                    // Case 2: Static Tile (Scale Effect) applied to ALL tiles now
                    if (entry.isIntersecting) {
                        target.style.transform = 'scale(1.02)'; // Subtle pop
                    } else {
                        target.style.transform = 'scale(1)';
                    }
                });
            }, observerOptions);

            flipCards.forEach(card => mobileObserver.observe(card));
            staticTiles.forEach(tile => mobileObserver.observe(tile));
            if (topBar) mobileObserver.observe(topBar); // Observe Top Bar
        }
    }

    // Initialize and Listen for Resize
    initMobileScrollEffects();
    window.addEventListener('resize', () => {
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(initMobileScrollEffects, 200);
    });


    // --- SCROLL ANIMATION (Reveal) ---
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

        // --- 3D TILT EFFECT (Desktop Only for Performance) ---
        if (isDesktop && !tile.classList.contains('flip-card')) {
            // Throttled Tilt Effect
            tile.addEventListener('mousemove', throttle((e) => {
                const rect = tile.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                tile.style.setProperty('--mouse-x', `${x}px`);
                tile.style.setProperty('--mouse-y', `${y}px`);

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const percentX = (x - centerX) / centerX;
                const percentY = (y - centerY) / centerY;

                let maxRotate = 2; // Production Value (Repel)

                // REPEL Logic: Inverted Directions
                const rotateY = percentX * maxRotate;
                const rotateX = percentY * maxRotate * -1;

                tile.style.transform = `
                    perspective(1000px)
                    rotateX(${rotateX}deg) 
                    rotateY(${rotateY}deg)
                    scale3d(1.01, 1.01, 1.01)
                `;
            }, 16));

            tile.addEventListener('mouseleave', () => {
                tile.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            });
        }
    });

    // --- DARK MODE LOGIC ---
    const themeCheckbox = document.getElementById('checkbox');
    const body = document.body;

    // Check local storage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        if (themeCheckbox) themeCheckbox.checked = true;
    }

    if (themeCheckbox) {
        // Sync initial state
        themeCheckbox.setAttribute('aria-pressed', themeCheckbox.checked);

        themeCheckbox.addEventListener('change', () => {
            // Update ARIA state
            themeCheckbox.setAttribute('aria-pressed', themeCheckbox.checked);

            if (themeCheckbox.checked) {
                body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // --- MOBILE MENU LOGIC ---
    const topBar = document.querySelector('.top-bar');
    const overlay = document.querySelector('.mobile-menu-overlay');

    if (topBar && overlay) {
        topBar.addEventListener('click', (e) => {
            // Only trigger if clicking mobile menu icon specifically, 
            // OR if clicking blank space in top bar (but not links/switch)
            if (window.innerWidth <= 768) {
                if (e.target.closest('.theme-switch-wrapper') || e.target.closest('a')) return;

                // If clicked toggle or empty space
                if (e.target.closest('.mobile-menu-toggle') || e.target === topBar || e.target.closest('.brand')) {
                    overlay.classList.add('active');
                }
            }
        });

        overlay.addEventListener('transitionend', () => {
            if (overlay.classList.contains('active')) {
                // Focus Trap Logic
                const focusableElements = overlay.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (firstElement) firstElement.focus();

                overlay.addEventListener('keydown', function (e) {
                    if (e.key === 'Tab') {
                        if (e.shiftKey) { /* shift + tab */
                            if (document.activeElement === firstElement) {
                                e.preventDefault();
                                lastElement.focus();
                            }
                        } else { /* tab */
                            if (document.activeElement === lastElement) {
                                e.preventDefault();
                                firstElement.focus();
                            }
                        }
                    }
                    if (e.key === 'Escape') {
                        overlay.classList.remove('active');
                    }
                });
            }
        });

        overlay.addEventListener('click', () => {
            overlay.classList.remove('active');
        });
    }

    // --- KEYBOARD ACCESSIBILITY FOR FLIP CARDS ---
    const accessibleFlipCards = document.querySelectorAll('.tile.flip-card');
    accessibleFlipCards.forEach(card => {
        // Toggle on click (for unified behavior)
        card.addEventListener('click', () => {
            card.classList.toggle('flipped');
        });

        // Toggle on Enter/Space
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); // Prevent scrolling for space
                card.classList.toggle('flipped');
            }
        });

        // Remove flipped state on blur (optional but good for focus flow)
        // Remove flipped state on blur (optional but good for focus flow)
        card.addEventListener('blur', () => {
            card.classList.remove('flipped');
        });
    });

    // --- BACK TO TOP BUTTON ---
    const backToTopBtn = document.querySelector('.back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > window.innerHeight) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

});
