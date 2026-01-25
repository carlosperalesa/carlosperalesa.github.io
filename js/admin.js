// URL base de la API
const API_BASE_URL = App.api.getBaseUrl();

/**
 * Abre el modal de login (se llama desde onclick en reloj)
 */
function openLoginModal() {
    // Resetear campos
    const userInput = document.getElementById('login-user');
    const passInput = document.getElementById('login-pass');
    const errorMsg = document.getElementById('login-error');

    if (userInput) userInput.value = '';
    if (passInput) passInput.value = '';
    if (errorMsg) errorMsg.textContent = '';

    // Función global de modals.js
    if (typeof openModal === 'function') {
        openModal('login');
    }
}

/**
 * Intenta realizar login contra el backend
 */
async function attemptLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    const errorMsg = document.getElementById('login-error');
    const loginBtn = document.querySelector('#modal-login .modal-btn-primary');

    if (!user || !pass) {
        if (errorMsg) errorMsg.textContent = 'Por favor completa todos los campos';
        return;
    }

    try {
        if (loginBtn) {
            loginBtn.textContent = 'Verificando...';
            loginBtn.disabled = true;
        }

        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: user, password: pass })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Login exitoso
            // Guardar token si aplica (ej. sessionStorage)
            if (data.token) {
                sessionStorage.setItem('admin_token', data.token);
            }

            if (typeof closeModal === 'function') closeModal('login');
            if (typeof openModal === 'function') openModal('admin');

            // Cargar mensajes
            loadMessages();
        } else {
            if (errorMsg) {
                errorMsg.textContent = data.message || 'Credenciales incorrectas';
                errorMsg.style.animation = 'shake 0.3s ease-in-out';
                setTimeout(() => errorMsg.style.animation = '', 300);
            }
        }
    } catch (error) {
        console.error('Error durante login:', error);
        if (errorMsg) errorMsg.textContent = 'Error de conexión con el servidor';
    } finally {
        if (loginBtn) {
            loginBtn.textContent = 'Ingresar';
            loginBtn.disabled = false;
        }
    }
}

/**
 * Carga mensajes desde la API
 */
async function loadMessages() {
    const tbody = document.getElementById('admin-messages-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">Cargando mensajes...</td></tr>';

    try {
        const token = sessionStorage.getItem('admin_token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const url = `${API_BASE_URL}/api/contacts`;

        const response = await fetch(url, { headers });

        if (!response.ok) {
            // Si es 401 o 403, probablemente expiró la sesión
            if (response.status === 401 || response.status === 403) {
                if (typeof closeModal === 'function') closeModal('admin');
                if (typeof openModal === 'function') openModal('login');
                const errorMsg = document.getElementById('login-error');
                if (errorMsg) errorMsg.textContent = 'Sesión expirada';
                return;
            }
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            tbody.innerHTML = '';

            if (!data.contacts || data.contacts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No hay mensajes registrados</td></tr>';
                return;
            }

            // Renderizar filas
            data.contacts.forEach(msg => {
                // Fila Principal
                const tr = document.createElement('tr');
                const fecha = new Date(msg.fecha).toLocaleString();
                tr.className = 'message-row';
                tr.onclick = (e) => {
                    // Si el click fue en el botón de borrar, no expandir
                    if (e.target.closest('.action-btn')) return;
                    toggleMessageDetail(msg.id);
                };

                tr.innerHTML = `
                    <td>${msg.id}</td>
                    <td>${fecha}</td>
                    <td><strong>${escapeHtml(msg.nombre)}</strong></td>
                    <td>${escapeHtml(msg.telefono || '-')}</td>
                    <td class="selectable-text">${escapeHtml(msg.email)}</td>
                    <td>${escapeHtml(msg.asunto || 'Sin asunto')}</td>
                    <td>
                        <button class="action-btn delete" onclick="deleteContact(${msg.id})" title="Eliminar mensaje">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);

                // Fila Detalle (Oculta)
                const trDetail = document.createElement('tr');
                trDetail.id = `detail-${msg.id}`;
                trDetail.style.display = 'none';
                trDetail.className = 'message-detail';
                trDetail.innerHTML = `
                    <td colspan="7" style="padding: 20px; background: rgba(128, 128, 128, 0.05);">
                        <div style="font-weight: 600; margin-bottom: 8px; color: var(--accent-color);">Mensaje completo:</div>
                        <div style="white-space: pre-wrap; line-height: 1.5;">${escapeHtml(msg.mensaje)}</div>
                    </td>
                `;
                tbody.appendChild(trDetail);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Error API: ${data.message || 'Desconocido'}</td></tr>`;
        }
    } catch (error) {
        console.error('Error cargando mensajes:', error);
        tbody.innerHTML = `<tr><td colspan="7" style="color: #ef4444; text-align:center;">
            Error de conexión. Asegúrate que la API está corriendo.<br>
            <small>${error.message}</small>
        </td></tr>`;
    }
}

function toggleMessageDetail(id) {
    const detailRow = document.getElementById(`detail-${id}`);
    if (detailRow) {
        detailRow.style.display = detailRow.style.display === 'none' ? 'table-row' : 'none';
    }
}

/**
 * Elimina un contacto
 */
async function deleteContact(id) {
    if (!confirm(`¿Estás seguro de eliminar el mensaje ID #${id}? Esta acción no se puede deshacer.`)) return;

    try {
        const token = sessionStorage.getItem('admin_token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const url = `${API_BASE_URL}/api/contacts/${id}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: headers
        });

        const data = await response.json();

        if (data.success) {
            // Mostrar feedback visual
            const toast = document.getElementById('welcomeToast');
            if (toast) {
                toast.textContent = 'Mensaje eliminado';
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3000);
            }
            // Recargar tabla
            loadMessages();
        } else {
            alert('Error al eliminar: ' + (data.error || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error borrando:', error);
        alert('Error de conexión al intentar borrar');
    }
}

// Utilidad para escapar HTML y prevenir XSS
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Event listener para tecla Enter en login
document.addEventListener('DOMContentLoaded', () => {
    const loginPass = document.getElementById('login-pass');
    if (loginPass) {
        loginPass.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') attemptLogin();
        });
    }
});
