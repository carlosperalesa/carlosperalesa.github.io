// Credenciales quemadas en cliente (Temporal/Solicitado)
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin003";

// URL base de la API (ajustar dinámicamente según entorno)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocal ? 'http://localhost:5000/api' : '/api';

/**
 * Abre el modal de login (se llama desde onclick en reloj)
 */
function openLoginModal() {
    // Resetear campos
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
    document.getElementById('login-error').textContent = '';

    // Función global de modals.js
    if (typeof openModal === 'function') {
        openModal('login');
    }
}

/**
 * Intenta realizar login
 */
function attemptLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    const errorMsg = document.getElementById('login-error');

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        // Login exitoso
        if (typeof closeModal === 'function') closeModal('login');
        if (typeof openModal === 'function') openModal('admin');

        // Cargar mensajes
        loadMessages();
    } else {
        errorMsg.textContent = 'Credenciales incorrectas';
        errorMsg.style.animation = 'shake 0.3s ease-in-out';
        setTimeout(() => errorMsg.style.animation = '', 300);
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
        // En docker/producción usar la ruta relativa /api/contacts que pasa por Nginx
        // En desarrollo local si no hay proxy, esto fallará si no se apunta al puerto 5000
        // Asumimos que se prueba via web server que tiene proxy o cors habilitado

        let url = '/api/contacts';
        // Fallback para dev local (soporta localhost, 127.0.0.1 y file://)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
            url = 'http://localhost:5000/api/contacts';
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            tbody.innerHTML = '';

            if (!data.contacts || data.contacts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No hay mensajes registrados</td></tr>';
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
        let url = `/api/contacts/${id}`;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
            url = `http://localhost:5000/api/contacts/${id}`;
        }

        const response = await fetch(url, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            // Mostrar feedback visual
            if (typeof showToast === 'function') showToast('Mensaje eliminado');
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
