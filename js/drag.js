// ============================================
// ARRASTRE DE VENTANAS
// ============================================
let isDragging = false;
let dragModal = null;
let dragOffset = { x: 0, y: 0 };

// Obtener coordenadas del evento (mouse o touch)
function getEventCoords(e) {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
        return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
}

function initDragging(modal, e) {
    const modalEl = modal.closest('.modal');
    const isConfirmModal = modalEl.classList.contains('modal-confirm');

    // En móvil solo permitir arrastre de modales de confirmación
    if (App.isMobile() && !isConfirmModal) return;

    // Prevenir comportamiento por defecto en touch
    if (e.cancelable) {
        e.preventDefault();
    }

    const overlay = modal.closest('.modal-overlay');

    isDragging = true;
    dragModal = modalEl;

    const rect = modalEl.getBoundingClientRect();
    const coords = getEventCoords(e);
    dragOffset.x = coords.x - rect.left;
    dragOffset.y = coords.y - rect.top;

    modalEl.classList.add('dragging');

    // Habilitar posición absoluta para modales de confirmación en móvil
    if (App.isMobile() && isConfirmModal) {
        modalEl.style.position = 'absolute';
        modalEl.style.margin = '0';
        modalEl.style.left = `${rect.left}px`;
        modalEl.style.top = `${rect.top - 44}px`; // Restar top bar height
    }

    // Traer al frente
    overlay.style.zIndex = 2000 + zIndexCounter++;
}

function handleDrag(e) {
    if (!isDragging || !dragModal) return;

    // Prevenir scroll mientras arrastramos
    if (e.cancelable) {
        e.preventDefault();
    }

    const coords = getEventCoords(e);
    let x = coords.x - dragOffset.x;
    let y = coords.y - dragOffset.y;

    // Limitar dentro del viewport
    const modalWidth = dragModal.offsetWidth;
    const modalHeight = dragModal.offsetHeight;
    const minY = App.isMobile() ? 0 : 44;
    const maxY = (App.isMobile() ? window.innerHeight - 80 - 44 : window.innerHeight) - modalHeight;
    const minX = 20 - modalWidth;
    const maxX = window.innerWidth - 20;

    x = Math.max(minX, Math.min(maxX, x));
    y = Math.max(minY, Math.min(maxY, y));

    dragModal.style.left = `${x}px`;
    dragModal.style.top = `${y}px`;
}

function endDrag(e) {
    if (!isDragging || !dragModal) return;

    dragModal.classList.remove('dragging');

    // Guardar posición
    const overlay = dragModal.closest('.modal-overlay');
    const modalId = overlay.id.replace('modal-', '');
    const rect = dragModal.getBoundingClientRect();
    if (modalPositions) {
        modalPositions[modalId] = { x: rect.left, y: rect.top };
    }

    isDragging = false;
    dragModal = null;
}

document.addEventListener('DOMContentLoaded', () => {
    const modalOverlays = document.querySelectorAll('.modal-overlay');

    // Event listeners para arrastre - Mouse
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', endDrag);

    // Event listeners para arrastre - Touch (passive: false para poder preventDefault)
    document.addEventListener('touchmove', handleDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
    document.addEventListener('touchcancel', endDrag);

    // Inicializar arrastre en headers de modales
    modalOverlays.forEach(overlay => {
        const header = overlay.querySelector('.modal-header');

        if (header) {
            // Mouse
            header.addEventListener('mousedown', (e) => {
                if (e.target.closest('.modal-close')) return;
                initDragging(header, e);
            });

            // Touch - passive: false para poder prevenir scroll
            header.addEventListener('touchstart', (e) => {
                if (e.target.closest('.modal-close')) return;
                initDragging(header, e);
            }, { passive: false });
        }
    });
});
