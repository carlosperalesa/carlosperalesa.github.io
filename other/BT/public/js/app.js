// Entorno: Local vs DigitalOcean
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
// En Prod (DO), Nginx debe mapear '/other/BT/api/' al contenedor de BT
const API_URL = isLocal ? 'http://localhost:3000/api' : '/other/BT/api';
const ASSETS_BASE = isLocal ? 'http://localhost:3000' : '/other/BT';

// Helper para resolver URLs de imágenes
function resolveImageUrl(url) {
    if (!url) return 'img/logo_placeholder.png';
    // Si ya es URL absoluta, retornar tal cual
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // Si es ruta relativa, agregar base
    return ASSETS_BASE + url;
}

document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    setupModal();
    setupContactForm();
    checkAuthState(); // New: update navbar based on login
});

// --- AUTH STATE & NAVIGATION ---
function checkAuthState() {
    const token = localStorage.getItem('token');
    const expiresAt = localStorage.getItem('token_expires_at');

    const loginLi = document.getElementById('loginLi');
    const adminLi = document.getElementById('adminLi');
    const logoutLi = document.getElementById('logoutLi');
    const logoutBtn = document.getElementById('logoutBtn');

    // Check if token exists and is not expired
    const isLoggedIn = token && (!expiresAt || Date.now() / 1000 < parseInt(expiresAt));

    if (isLoggedIn) {
        if (loginLi) loginLi.style.display = 'none';
        if (adminLi) adminLi.style.display = 'block';
        if (logoutLi) {
            logoutLi.style.display = 'block';
            if (logoutBtn) logoutBtn.onclick = handleLogout;
        }
    } else {
        if (loginLi) loginLi.style.display = 'block';
        if (adminLi) adminLi.style.display = 'none';
        if (logoutLi) logoutLi.style.display = 'none';
        // If expired, clear it
        if (token) localStorage.clear();
    }
}

function handleLogout() {
    localStorage.clear();
    showToast('Sesión cerrada', 'success');
    setTimeout(() => {
        window.location.reload(); // Refresh to update navbar
    }, 500);
}

// --- BLOG LOADING ---
async function loadPosts() {
    const grid = document.getElementById('blogGrid');
    try {
        const res = await fetch(`${API_URL}/posts`);
        const posts = await res.json();

        if (posts.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No hay publicaciones aún.</p>';
            return;
        }

        grid.innerHTML = posts.map(post => `
            <article class="post-card" onclick="window.location.href='post.html?id=${post.id}'">
                <img src="${resolveImageUrl(post.image_url)}" alt="${post.title}" class="post-img">
                <div class="post-content">
                    <h3>${post.title}</h3>
                    <p>${post.summary}</p>
                </div>
            </article>
        `).join('');

    } catch (err) {
        console.error('Error loading posts:', err);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Error al cargar el blog.</p>';
    }
}

// --- MODAL & LOGIN ---
function setupModal() {
    const modal = document.getElementById('loginModal');
    const btn = document.getElementById('loginBtn');
    const close = document.getElementById('closeLogin');
    const form = document.getElementById('loginForm');

    if (btn) btn.onclick = () => modal.style.display = 'flex';
    if (close) close.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const username = form.username.value;
            const password = form.password.value;

            try {
                const res = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();

                if (res.ok) {
                    // Clear old tokens first
                    localStorage.clear();

                    // Store new token and expiration info
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', data.username);
                    localStorage.setItem('token_expires_at', data.expires_at);

                    const hoursRemaining = data.expires_in_hours || 24;
                    showToast(`¡Bienvenido!`, 'success');
                    checkAuthState(); // Update navbar immediately
                    if (modal) modal.style.display = 'none'; // Close modal
                    // Redirigimos para que el usuario vea el panel de admin si es lo que busca,
                    // pero ahora ya tiene los botones arriba para volver.
                    setTimeout(() => window.location.href = 'admin.html', 1000);
                } else {
                    showToast(data.error || 'Error de login', 'error');
                }
            } catch (err) {
                showToast('Error de conexión', 'error');
            }
        };
    }
}

// --- CONTACT FORM ---
function setupContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const formData = {
            name: form.name.value,
            email: form.email.value,
            phone: form.phone.value,
            subject: form.subject.value,
            message: form.message.value
        };

        try {
            const res = await fetch(`${API_URL}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                showToast('¡Mensaje enviado con éxito!', 'success');
                form.reset();
            } else {
                showToast('Error al enviar el mensaje.', 'error');
            }
        } catch (err) {
            showToast('Error al conectar con el servidor.', 'error');
        }
    };
}

// --- UTILS ---
function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}
