// URL base de la API
const API_BASE_URL = App.api.getBaseUrl();

/**
 * Abre el modal de login y verifica el estado del servidor
 */
async function openLoginModal() {
    const errorMsg = document.getElementById('login-error');
    const loginTitle = document.querySelector('#modal-login .modal-title');
    const loginBtn = document.querySelector('#modal-login .modal-btn-primary');

    // Resetear campos
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
    if (errorMsg) errorMsg.textContent = '';

    try {
        // Verificar si existe administrador
        const response = await fetch(`${API_BASE_URL}/api/auth/status`);
        const data = await response.json();

        if (data.success) {
            if (!data.has_admin) {
                // Modo Setup Inicial
                if (loginTitle) loginTitle.textContent = 'Configuración Inicial Admin';
                if (loginBtn) {
                    loginBtn.textContent = 'Crear Administrador';
                    loginBtn.onclick = createInitialAdmin;
                }
                if (errorMsg) {
                    errorMsg.style.color = 'var(--accent-color)';
                    errorMsg.textContent = 'No hay administrador. Crea uno para empezar.';
                }
            } else {
                // Modo Login Normal
                if (loginTitle) loginTitle.textContent = 'Admin Login';
                if (loginBtn) {
                    loginBtn.textContent = 'Ingresar';
                    loginBtn.onclick = attemptLogin;
                }
            }
        }
    } catch (error) {
        console.error('Error verificando estado:', error);
    }

    if (typeof openModal === 'function') {
        openModal('login');
    }
}

/**
 * Crea el primer administrador
 */
async function createInitialAdmin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    const errorMsg = document.getElementById('login-error');
    const loginBtn = document.querySelector('#modal-login .modal-btn-primary');

    if (!user || !pass) {
        if (errorMsg) errorMsg.textContent = 'Completa ambos campos';
        return;
    }

    if (pass.length < 6) {
        if (errorMsg) errorMsg.textContent = 'Mínimo 6 caracteres para la clave';
        return;
    }

    try {
        loginBtn.disabled = true;
        const response = await fetch(`${API_BASE_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert('¡Administrador creado con éxito! Ahora puedes ingresar.');
            openLoginModal(); // Recargar modal en modo login
        } else {
            if (errorMsg) errorMsg.textContent = data.message || 'Error al crear admin';
        }
    } catch (error) {
        if (errorMsg) errorMsg.textContent = 'Error de conexión';
    } finally {
        loginBtn.disabled = false;
    }
}

/**
 * Login normal
 */
async function attemptLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    const errorMsg = document.getElementById('login-error');
    const loginBtn = document.querySelector('#modal-login .modal-btn-primary');

    if (!user || !pass) return;

    try {
        if (loginBtn) {
            loginBtn.textContent = 'Verificando...';
            loginBtn.disabled = true;
        }

        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            if (data.token) {
                sessionStorage.setItem('admin_token', data.token);
            }
            if (typeof closeModal === 'function') closeModal('login');
            if (typeof openModal === 'function') openModal('admin');
            loadMessages();
        } else {
            if (errorMsg) {
                errorMsg.style.color = '#ef4444';
                errorMsg.textContent = data.message || 'Credenciales incorrectas';
                errorMsg.style.animation = 'shake 0.3s ease-in-out';
                setTimeout(() => errorMsg.style.animation = '', 300);
            }
        }
    } catch (error) {
        if (errorMsg) errorMsg.textContent = 'Error de conexión';
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
        const headers = { 'Authorization': `Bearer ${token}` };

        const response = await fetch(`${API_BASE_URL}/api/contacts`, { headers });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                if (typeof closeModal === 'function') closeModal('admin');
                openLoginModal();
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

            data.contacts.forEach(msg => {
                const tr = document.createElement('tr');
                const fecha = new Date(msg.fecha).toLocaleString();
                tr.className = 'message-row';
                tr.onclick = (e) => {
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
        }
    } catch (error) {
        console.error('Error cargando mensajes:', error);
        tbody.innerHTML = `<tr><td colspan="7" style="color: #ef4444; text-align:center;">Error de conexión.</td></tr>`;
    }
}

function toggleMessageDetail(id) {
    const detailRow = document.getElementById(`detail-${id}`);
    if (detailRow) {
        detailRow.style.display = detailRow.style.display === 'none' ? 'table-row' : 'none';
    }
}

/**
 * Gestiona el cambio de contraseña
 */
function openChangePasswordModal() {
    document.getElementById('new-pass').value = '';
    document.getElementById('confirm-pass').value = '';
    document.getElementById('pass-error').textContent = '';
    if (typeof openModal === 'function') openModal('change-password');
}

async function updatePassword() {
    const newPass = document.getElementById('new-pass').value;
    const confirmPass = document.getElementById('confirm-pass').value;
    const errorMsg = document.getElementById('pass-error');

    if (!newPass || newPass.length < 6) {
        errorMsg.textContent = 'Mínimo 6 caracteres';
        return;
    }

    if (newPass !== confirmPass) {
        errorMsg.textContent = 'Las contraseñas no coinciden';
        return;
    }

    try {
        const token = sessionStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ password: newPass })
        });

        const data = await response.json();

        if (data.success) {
            alert('Contraseña actualizada correctamente');
            if (typeof closeModal === 'function') closeModal('change-password');
        } else {
            errorMsg.textContent = data.message || 'Error al actualizar';
        }
    } catch (error) {
        errorMsg.textContent = 'Error de conexión';
    }
}

/**
 * Manejo de pestañas en el panel admin
 */
function switchAdminTab(tabName) {
    // Actualizar botones de pestañas
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(tabName));
    });

    // Actualizar contenidos de pestañas
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabName}`);
    });

    if (tabName === 'messages') loadMessages();
}

/**
 * Ejecuta una acción de sistema y muestra el resultado en la consola
 */
async function runSystemAction(action) {
    const consoleBody = document.getElementById('admin-console');
    if (!consoleBody) return;

    // Feedback visual
    const timestamp = new Date().toLocaleTimeString();
    appendConsoleLine(`\n[${timestamp}] 🚀 Iniciando acción: ${action.toUpperCase()}...`, 'command');
    appendConsoleLine('⏳ Procesando, por favor espera...', 'working');

    try {
        const token = sessionStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/api/system/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ action: action })
        });

        const data = await response.json();

        if (data.success) {
            appendConsoleLine(`✅ Éxito: Acción ${action} completada.`, 'command');
            if (data.output) appendConsoleLine(data.output);
        } else {
            appendConsoleLine(`❌ Error: ${data.message || 'Error desconocido'}`, 'error');
            if (data.error) appendConsoleLine(data.error, 'error');
        }
    } catch (error) {
        appendConsoleLine(`❌ Error de conexión con la API: ${error.message}`, 'error');
    }

    // Scroll al final
    consoleBody.scrollTop = consoleBody.scrollHeight;
}

function appendConsoleLine(text, className = '') {
    const consoleBody = document.getElementById('admin-console');
    if (!consoleBody) return;

    const div = document.createElement('div');
    div.className = 'line ' + className;
    div.textContent = text;
    consoleBody.appendChild(div);
    consoleBody.scrollTop = consoleBody.scrollHeight;
}

async function deleteContact(id) {
    if (!confirm(`¿Borrar mensaje #${id}?`)) return;

    try {
        const token = sessionStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (data.success) {
            loadMessages();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error de conexión');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener('DOMContentLoaded', () => {
    const loginPass = document.getElementById('login-pass');
    if (loginPass) {
        loginPass.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const btn = document.querySelector('#modal-login .modal-btn-primary');
                if (btn) btn.click();
            }
        });
    }
});
