/**
 * Contact Form Handler
 * Maneja el envío del formulario de contacto al backend API
 */

// API URL - Configuración para Local (Dev) y DigitalOcean (Prod)
// En Local: localhost:5000 (Python API directa)
// En DO: Misma URL de origen (Nginx maneja el proxy reverso)
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const CONTACT_API_BASE = IS_LOCAL ? 'http://localhost:5000' : window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
    const contactModal = document.getElementById('modal-contacto');
    if (!contactModal) return;

    const form = contactModal.querySelector('.modal-body');
    const submitBtn = form.querySelector('.modal-btn-primary');
    const clearBtn = form.querySelector('.modal-btn-secondary');

    const API_URL = `${CONTACT_API_BASE}/api/contact`;

    /**
     * Obtiene los valores del formulario
     */
    function getFormData() {
        const inputs = form.querySelectorAll('.form-input');
        const textarea = form.querySelector('.form-textarea');

        return {
            name: inputs[0].value.trim(),
            phone: inputs[1].value.trim(),
            email: inputs[2].value.trim(),
            subject: inputs[3].value.trim(),
            message: textarea.value.trim()
        };
    }

    /**
     * Valida los campos del formulario
     */
    function validateForm(data) {
        const errors = [];

        if (!data.name) {
            errors.push('El nombre es obligatorio');
        }

        if (!data.email) {
            errors.push('El email es obligatorio');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push('El email no es válido');
        }

        if (!data.message) {
            errors.push('El mensaje es obligatorio');
        }

        return errors;
    }

    /**
     * Limpia el formulario
     */
    function clearForm() {
        form.querySelectorAll('.form-input').forEach(input => input.value = '');
        form.querySelector('.form-textarea').value = '';
    }

    /**
     * Muestra un toast de notificación
     */
    function showToast(message, type = 'success') {
        const toast = document.getElementById('welcomeToast');
        if (!toast) return;

        toast.textContent = message;
        toast.style.background = type === 'success'
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    /**
     * Deshabilita/habilita los botones durante el envío
     */
    function setButtonsState(disabled) {
        submitBtn.disabled = disabled;
        clearBtn.disabled = disabled;
        submitBtn.style.opacity = disabled ? '0.5' : '1';
        submitBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
        submitBtn.textContent = disabled ? 'Enviando...' : 'Enviar';
    }

    /**
     * Envía el formulario al backend
     */
    async function submitForm(e) {
        e.preventDefault();

        const formData = getFormData();
        const errors = validateForm(formData);

        // Validación
        if (errors.length > 0) {
            showToast(errors.join(', '), 'error');
            return;
        }

        // Deshabilitar botones
        setButtonsState(true);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showToast('✅ Mensaje enviado correctamente. Te contactaré pronto!', 'success');
                clearForm();

                // Cerrar modal después de 2 segundos
                setTimeout(() => {
                    const closeBtn = contactModal.querySelector('.modal-close');
                    if (closeBtn) closeBtn.click();
                }, 2000);
            } else {
                throw new Error(result.error || 'Error al enviar el mensaje');
            }

        } catch (error) {
            console.error('Error al enviar formulario:', error);
            showToast(
                '❌ Error al enviar el mensaje. Por favor, intenta nuevamente o contáctame por WhatsApp.',
                'error'
            );
        } finally {
            setButtonsState(false);
        }
    }

    // Event Listeners
    submitBtn.addEventListener('click', submitForm);
    clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        clearForm();
        showToast('Formulario limpiado', 'success');
    });

    // Enviar con Enter en campos de texto (excepto textarea)
    form.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitBtn.click();
            }
        });
    });

    console.log('✅ Contact form handler initialized');
});

/* =================================
   BADGE NOTIFICACIONES
   ================================= */
function updateContactBadge() {
    const url = `${CONTACT_API_BASE}/api/contacts/count`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const badge = document.getElementById('contact-badge');
                if (badge) {
                    if (data.count > 0) {
                        badge.textContent = data.count > 99 ? '99+' : data.count;
                        badge.style.display = 'flex';
                        badge.classList.remove('popIn');
                        void badge.offsetWidth; // Trigger reflow
                        badge.style.animation = 'none';
                        badge.style.animation = 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    } else {
                        badge.style.display = 'none';
                    }
                }
            }
        })
        .catch(err => console.log('Silently ignoring badge error:', err));
}

// Check al iniciar y cada 30 segundos
document.addEventListener('DOMContentLoaded', () => {
    updateContactBadge();
    setInterval(updateContactBadge, 30000);
});

// Actualizar badge cuando se envía un mensaje exitoso
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    // Si es un POST a /contact exitoso, actualizar badge
    if (args[0].includes && args[0].includes('/contact') && args[1] && args[1].method === 'POST' && response.ok) {
        setTimeout(updateContactBadge, 1000);
    }
    return response;
};
