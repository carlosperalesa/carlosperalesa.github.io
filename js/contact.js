/**
 * Contact Form Handler
 * Maneja el envío del formulario de contacto al backend API
 */

document.addEventListener('DOMContentLoaded', () => {
    const contactModal = document.getElementById('modal-contacto');
    if (!contactModal) return;

    const form = contactModal.querySelector('.modal-body');
    const submitBtn = form.querySelector('.modal-btn-primary');
    const clearBtn = form.querySelector('.modal-btn-secondary');

    // API URL - Cambiar según el entorno
    const API_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:5000/api/contact'
        : 'https://carlosperales.dev/api/contact';

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
