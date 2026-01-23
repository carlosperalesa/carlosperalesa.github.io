document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    setupModal();
    setupContactForm();
});

// --- BLOG LOADING ---
async function loadPosts() {
    const grid = document.getElementById('blogGrid');
    try {
        const res = await fetch('/api/posts');
        const posts = await res.json();

        if (posts.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No hay publicaciones aún.</p>';
            return;
        }

        grid.innerHTML = posts.map(post => `
            <article class="post-card" onclick="window.location.href='post.html?id=${post.id}'">
                <img src="${post.image_url || 'img/logo_placeholder.png'}" alt="${post.title}" class="post-img">
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
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', data.username);
                showToast('Login exitoso. Redirigiendo...');
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
            const res = await fetch('/api/messages', {
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
