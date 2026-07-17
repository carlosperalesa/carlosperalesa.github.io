// ============================================
// MACOS 3D COVER FLOW FOR PROJECTS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const stage = document.getElementById('coverflow-stage');
    const viewport = document.getElementById('coverflow-viewport');
    
    if (!stage || !viewport) return;

    const cards = Array.from(document.querySelectorAll('.coverflow-card'));
    const infoPanel = document.getElementById('coverflow-info');
    const infoTitle = document.getElementById('cf-title');
    const infoDesc = document.getElementById('cf-desc');
    const infoLink = document.getElementById('cf-link');

    let activeIndex = Math.floor(cards.length / 2); // Start at the center project
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    const dragThreshold = 50; // pixels of movement required to switch cards

    // 1. Core calculation of 3D rotations & translations
    function updateCoverflow() {
        cards.forEach((card, index) => {
            const offset = index - activeIndex;
            const absOffset = Math.abs(offset);
            
            let transform = '';
            let zIndex = 100 - absOffset;
            let opacity = 1;
            
            if (offset === 0) {
                // Center active card
                transform = 'translate3d(0, 0, 150px) rotateY(0deg)';
                opacity = 1;
                card.classList.add('active');
            } else {
                // Side cards
                card.classList.remove('active');
                const direction = offset > 0 ? 1 : -1;
                
                // Rotations and horizontal offsets
                const rotateY = -direction * 40;
                const translateX = offset * 90 + direction * 40;
                const translateZ = 0 - absOffset * 65;
                
                transform = `translate3d(${translateX}px, 0, ${translateZ}px) rotateY(${rotateY}deg)`;
                
                // Fade out cards further away
                opacity = 1 - Math.min(0.85, absOffset * 0.25);
            }
            
            card.style.transform = transform;
            card.style.zIndex = zIndex;
            card.style.opacity = opacity;
            // Enable pointer interactions on all cards so they can be selected
            card.style.pointerEvents = 'auto';
        });

        // Update active project info panel
        const activeCard = cards[activeIndex];
        if (activeCard && infoPanel) {
            infoPanel.classList.remove('visible');
            
            // Short timeout to allow fade-out before changing content
            setTimeout(() => {
                infoTitle.innerText = activeCard.dataset.title;
                infoDesc.innerText = activeCard.dataset.desc;
                const isAutomail = activeCard.dataset.kind === 'automail';
                infoLink.href = isAutomail ? '#' : activeCard.dataset.url;
                infoLink.dataset.action = isAutomail ? 'open-automail' : 'open-link';
                infoLink.textContent = isAutomail ? 'Abrir AutoMail' : 'Ir al proyecto';
                infoPanel.classList.add('visible');
            }, 150);
        }
    }

    // 2. Event Listeners for Navigation

    // A. Clicking a background card directly to center it
    // Note: Since card.style.pointerEvents is 'none' for side cards, we attach the listener to the viewport
    // and use document.elementFromPoint or target detection, or simply click capturing.
    // However, pointer-events: none prevents clicking. Let's make an overlay click detector or:
    // We can enable pointer-events: auto on all cards, but prevent standard link navigations (handled in JS).
    // Let's keep pointer-events: auto on all cards so they can be clicked to select, but handle it!
    cards.forEach((card, index) => {
        card.addEventListener('click', (e) => {
            if (activeIndex !== index) {
                e.preventDefault();
                e.stopPropagation();
                activeIndex = index;
                updateCoverflow();
            } else if (card.dataset.kind === 'automail' && typeof window.openAutoMailModal === 'function') {
                e.preventDefault();
                e.stopPropagation();
                window.openAutoMailModal();
            }
            // If it is the activeIndex, standard navigation (href link) occurs naturally!
        });
    });

    // B. Mouse Wheel scroll
    let scrollTimeout = null;
    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (scrollTimeout) return;
        
        // Throttling wheel events for smooth transitions
        scrollTimeout = setTimeout(() => {
            scrollTimeout = null;
        }, 150);

        if (e.deltaY > 0 || e.deltaX > 0) {
            if (activeIndex < cards.length - 1) activeIndex++;
        } else {
            if (activeIndex > 0) activeIndex--;
        }
        updateCoverflow();
    }, { passive: false });

    // C. Touch/Mouse drag gesture
    viewport.addEventListener('pointerdown', (e) => {
        isDragging = true;
        startX = e.clientX;
        viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        currentX = e.clientX;
        const deltaX = currentX - startX;

        if (Math.abs(deltaX) > dragThreshold) {
            if (deltaX > 0 && activeIndex > 0) {
                activeIndex--;
                startX = currentX; // Reset base to enable continuous dragging
            } else if (deltaX < 0 && activeIndex < cards.length - 1) {
                activeIndex++;
                startX = currentX;
            }
            updateCoverflow();
        }
    });

    viewport.addEventListener('pointerup', (e) => {
        isDragging = false;
        viewport.releasePointerCapture(e.pointerId);
    });
    
    viewport.addEventListener('pointercancel', (e) => {
        isDragging = false;
        try {
            viewport.releasePointerCapture(e.pointerId);
        } catch (err) {}
    });

    // D. Keyboard accessibility (Left/Right arrow keys)
    document.addEventListener('keydown', (e) => {
        // Only run keyboard navigation if the Projects modal is active/open
        const projectsModal = document.getElementById('modal-proyectos');
        if (!projectsModal || !projectsModal.classList.contains('active')) return;

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (activeIndex > 0) activeIndex--;
            updateCoverflow();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (activeIndex < cards.length - 1) activeIndex++;
            updateCoverflow();
        }
    });

    // E. Hook into system modal opening events
    document.addEventListener('modal:opened', (e) => {
        if (e.detail.id === 'proyectos') {
            // Recalculate/update layouts in case modal bounds changed or initialized hidden
            setTimeout(updateCoverflow, 50);
        }
    });

    // Initialize layout
    updateCoverflow();
});
