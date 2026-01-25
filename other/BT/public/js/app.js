// Detectar entorno local
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocal ? 'http://localhost:3000/api' : '/bt/api';
const ASSETS_BASE = isLocal ? 'http://localhost:3000' : '/bt';  // Base para assets (imágenes)

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
});

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

    btn.onclick = () => modal.style.display = 'flex';
    close.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    }

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
                showToast(`Login exitoso. Sesión válida por ${hoursRemaining} horas.`);
                setTimeout(() => window.location.href = 'admin.html', 1000);
            } else {
                showToast(data.error || 'Error de login');
            }
        } catch (err) {
            showToast('Error de conexión');
        }
    };
}

// --- CONTACT FORM ---
function setupContactForm() {
    const form = document.getElementById('contactForm');
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
                showToast('¡Mensaje enviado con éxito!');
                form.reset();
            } else {
                showToast('Error al enviar el mensaje.');
            }
        } catch (err) {
            showToast('Error al conectar con el servidor.');
        }
    };
}

// --- UTILS ---
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
