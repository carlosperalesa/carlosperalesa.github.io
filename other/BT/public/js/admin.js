const API_URL = '/other/BT/api';
let quill;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initQuill();
    loadPosts();
    loadMessages(); // Load both on init

    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('postForm').addEventListener('submit', handlePostSubmit);
    document.getElementById('imageInput').addEventListener('change', handleImageUpload);
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('welcomeUser').textContent = `Hola, ${localStorage.getItem('user')}`;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function initQuill() {
    quill = new Quill('#editor-container', {
        theme: 'snow',
        placeholder: 'Escribe tu historia aquí...'
    });
}

// Tab switching removed

/* --- POSTS --- */
async function loadPosts() {
    try {
        const res = await fetch(`${API_URL}/posts`);
        const posts = await res.json();
        const tbody = document.getElementById('postsTableBody');
        tbody.innerHTML = posts.map(p => `
            <tr>
                <td>${p.id}</td>
                <td><img src="${p.image_url || 'img/logo_placeholder.png'}" style="height:50px;"></td>
                <td>${p.title}</td>
                <td>${new Date(p.created_at).toLocaleString()}</td>
                <td>
                    <button class="edit-btn" onclick="editPost(${p.id})">Editar</button>
                    <button class="delete-btn" onclick="deletePost(${p.id})">Borrar</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

async function handlePostSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('postId').value;
    const title = document.getElementById('postTitle').value;
    const summary = document.getElementById('postSummary').value;
    const imageUrl = document.getElementById('imageUrl').value;
    const content = quill.root.innerHTML;

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/posts/${id}` : `${API_URL}/posts`;

    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ title, summary, image_url: imageUrl, content })
        });

        if (res.ok) {
            showToast('Post guardado correctamente');
            hidePostForm();
            loadPosts();
        } else {
            showToast('Error al guardar');
        }
    } catch (err) {
        showToast('Error de conexión');
    }
}

async function deletePost(id) {
    if (!confirm('¿Seguro que quieres borrar esta entrada?')) return;
    try {
        await fetch(`${API_URL}/posts/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        loadPosts();
        showToast('Post eliminado');
    } catch (err) {
        showToast('Error al eliminar');
    }
}

async function editPost(id) {
    try {
        const res = await fetch(`${API_URL}/posts/${id}`);
        const post = await res.json();

        document.getElementById('postId').value = post.id;
        document.getElementById('postTitle').value = post.title;
        document.getElementById('postSummary').value = post.summary;
        document.getElementById('imageUrl').value = post.image_url;
        quill.root.innerHTML = post.content;

        if (post.image_url) {
            const preview = document.getElementById('imagePreview');
            preview.src = post.image_url;
            preview.style.display = 'block';
        }

        document.getElementById('formTitle').textContent = 'Editar Entrada';
        document.getElementById('postFormContainer').style.display = 'block';
        document.getElementById('postsTableContainer').style.display = 'none';
        window.scrollTo(0, 0);
    } catch (err) {
        console.error(err);
    }
}

/* --- IMAGE UPLOAD --- */
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
        const res = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });
        const data = await res.json();
        if (data.url) {
            document.getElementById('imageUrl').value = data.url;
            const preview = document.getElementById('imagePreview');
            preview.src = data.url;
            preview.style.display = 'block';
            showToast('Imagen subida');
        }
    } catch (err) {
        showToast('Error subiendo imagen');
    }
}

/* --- MESSAGES --- */
async function loadMessages() {
    try {
        const res = await fetch(`${API_URL}/messages`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const messages = await res.json();
        const tbody = document.getElementById('messagesTableBody');
        tbody.innerHTML = messages.map(m => `
            <tr>
                <td>${new Date(m.created_at).toLocaleString()}</td>
                <td>${m.name}</td>
                <td>${m.phone || '-'}</td>
                <td>${m.email}</td>
                <td>${m.subject || '-'}</td>
                <td>${m.message}</td>
                <td>
                    <button class="delete-btn" onclick="deleteMessage(${m.id})">Borrar</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

async function deleteMessage(id) {
    if (!confirm('¿Borrar mensaje?')) return;
    try {
        await fetch(`${API_URL}/messages/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        loadMessages();
        showToast('Mensaje borrado');
    } catch (err) {
        showToast('Error al borrar');
    }
}

/* --- UI HELPERS --- */
function showPostForm() {
    document.getElementById('postForm').reset();
    document.getElementById('postId').value = '';
    document.getElementById('imageUrl').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    quill.root.innerHTML = '';
    document.getElementById('formTitle').textContent = 'Nueva Entrada';

    document.getElementById('postFormContainer').style.display = 'block';
    document.getElementById('postsTableContainer').style.display = 'none';
}

function hidePostForm() {
    document.getElementById('postFormContainer').style.display = 'none';
    document.getElementById('postsTableContainer').style.display = 'block';
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
