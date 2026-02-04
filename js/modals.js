// ============================================
// SISTEMA DE MODALES
// ============================================
let openModals = [];
let zIndexCounter = 1;
const modalPositions = {};

document.addEventListener('DOMContentLoaded', () => {
    const dockItems = document.querySelectorAll('.dock-item');
    const modalOverlays = document.querySelectorAll('.modal-overlay');

    // Click en dock items
    dockItems.forEach(item => {
        item.addEventListener('click', () => {
            const modalId = item.dataset.modal;

            // Si el modal ya está abierto, cerrarlo
            if (openModals.includes(modalId)) {
                closeModal(modalId);
            } else {
                openModal(modalId);
            }
        });
    });

    // Click en botón cerrar de modales y overlay
    modalOverlays.forEach(overlay => {
        const closeBtn = overlay.querySelector('.modal-close');
        const maximizeBtn = overlay.querySelector('.modal-maximize');
        const cancelBtn = overlay.querySelector('[data-action="cancel"]');

        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', (e) => {
                const modal = overlay.querySelector('.modal');
                modal.classList.toggle('maximized');
                // Al maximizar/restaurar, evitar propagación
                e.preventDefault();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal(overlay.id.replace('modal-', '')));
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => closeModal(overlay.id.replace('modal-', '')));
        }

        // Click fuera del modal para cerrar (SOLO en móvil)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && App.isMobile()) {
                closeModal(overlay.id.replace('modal-', ''));
            }
        });

        // Traer al frente al hacer click
        const modal = overlay.querySelector('.modal');
        if (modal) {
            modal.addEventListener('mousedown', () => {
                if (!App.isMobile()) {
                    overlay.style.zIndex = 2000 + zIndexCounter++;
                }
            });
        }
    });

    // Tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && openModals.length > 0) {
            closeModal(openModals[openModals.length - 1]);
        }
    });

    // Manejo de clicks en proyectos para abrir detalle
    document.querySelectorAll('.project-app').forEach(app => {
        app.addEventListener('click', (e) => {
            e.preventDefault();

            const title = app.querySelector('.project-name').innerText;
            const iconHtml = app.querySelector('.project-icon').innerHTML;
            const description = app.dataset.description;
            const url = app.href;

            // Rellenar modal
            document.getElementById('p-title').innerText = title;
            document.getElementById('p-icon').innerHTML = iconHtml;
            document.getElementById('p-desc').innerText = description;
            const linkBtn = document.getElementById('p-link');
            if (linkBtn) {
                linkBtn.href = url;
            }

            openModal('proyecto-detalle');
        });
    });
});

// Obtener posición del icono del dock
function getDockIconPosition(modalId) {
    const dockItem = document.querySelector(`.dock-item[data-modal="${modalId}"]`);
    if (!dockItem) return null;

    const icon = dockItem.querySelector('.dock-icon');
    const rect = icon.getBoundingClientRect();

    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

function openModal(modalId) {
    const overlay = document.getElementById(`modal-${modalId}`);
    if (!overlay) return;

    const modal = overlay.querySelector('.modal');

    if (typeof playTap === 'function') playTap();

    // En móvil, cerrar modal anterior
    if (App.isMobile() && openModals.length > 0) {
        closeModal(openModals[openModals.length - 1], false);
    }

    // Obtener posición del icono para transform-origin
    const iconPos = getDockIconPosition(modalId);

    if (!App.isMobile() && iconPos) {
        // Calcular posición central (usamos tamaño fijo conocido del modal)
        const modalWidth = 600;
        const modalHeight = 400;

        let targetX, targetY;
        if (modalPositions[modalId]) {
            targetX = modalPositions[modalId].x;
            targetY = modalPositions[modalId].y;
        } else {
            // Centrar horizontal y verticalmente
            targetX = Math.max(20, (window.innerWidth - modalWidth) / 2);
            targetY = Math.max(60, (window.innerHeight - modalHeight) / 2);
        }

        // Calcular transform-origin relativo al modal
        const originX = iconPos.x - targetX;
        const originY = iconPos.y - targetY;

        modal.style.transformOrigin = `${originX}px ${originY}px`;
        modal.style.left = `${targetX}px`;
        modal.style.top = `${targetY}px`;
    }

    // Activar modal con z-index dinámico
    overlay.classList.remove('closing');
    overlay.classList.add('active');
    overlay.style.zIndex = 2000 + zIndexCounter++;

    // Dispatch event for other scripts (e.g., Skills Graph)
    document.dispatchEvent(new CustomEvent('modal:opened', { detail: { id: modalId } }));

    // Agregar a lista de modales abiertos
    if (!openModals.includes(modalId)) {
        openModals.push(modalId);
    }

    // Activar indicador en dock
    const dockItem = document.querySelector(`.dock-item[data-modal="${modalId}"]`);
    if (dockItem) {
        dockItem.classList.add('active');
    }
}

function closeModal(modalId, withSound = true) {
    const overlay = document.getElementById(`modal-${modalId}`);
    if (!overlay) return;

    const modal = overlay.querySelector('.modal');

    if (withSound && typeof playTap === 'function') playTap();

    // Guardar posición actual en desktop
    if (!App.isMobile()) {
        const rect = modal.getBoundingClientRect();
        modalPositions[modalId] = {
            x: rect.left,
            y: rect.top
        };

        // Actualizar transform-origin para animación de cierre
        const iconPos = getDockIconPosition(modalId);
        if (iconPos) {
            const originX = iconPos.x - rect.left;
            const originY = iconPos.y - rect.top;
            modal.style.transformOrigin = `${originX}px ${originY}px`;
        }
    }

    // Animación de cierre
    overlay.classList.add('closing');

    // Esperar que termine la animación
    setTimeout(() => {
        overlay.classList.remove('active', 'closing');

        // Remover de lista
        openModals = openModals.filter(id => id !== modalId);

        // Desactivar indicador en dock
        const dockItem = document.querySelector(`.dock-item[data-modal="${modalId}"]`);
        if (dockItem) {
            dockItem.classList.remove('active');
        }
    }, 300);
}

function minimizeAll() {
    if (typeof playTap === 'function') playTap();

    // Cerrar todos con animación escalonada
    openModals.forEach((modalId, index) => {
        setTimeout(() => {
            const overlay = document.getElementById(`modal-${modalId}`);
            if (overlay) {
                const modal = overlay.querySelector('.modal');

                // Guardar posición
                if (!App.isMobile()) {
                    const rect = modal.getBoundingClientRect();
                    modalPositions[modalId] = { x: rect.left, y: rect.top };

                    const iconPos = getDockIconPosition(modalId);
                    if (iconPos) {
                        const originX = iconPos.x - rect.left;
                        const originY = iconPos.y - rect.top;
                        modal.style.transformOrigin = `${originX}px ${originY}px`;
                    }
                }

                overlay.classList.add('closing');

                setTimeout(() => {
                    overlay.classList.remove('active', 'closing');
                }, 300);
            }

            const dockItem = document.querySelector(`.dock-item[data-modal="${modalId}"]`);
            if (dockItem) {
                dockItem.classList.remove('active');
            }
        }, index * 50);
    });

    openModals = [];
    zIndexCounter = 1;
}
