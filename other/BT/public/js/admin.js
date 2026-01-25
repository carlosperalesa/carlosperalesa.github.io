const API_URL = '/api';
let quill;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check auth first (synchronous, redirects if no token)
    checkAuth();

    // 2. Initialize UI elements
    initQuill();

    // 3. Set up event listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('postForm').addEventListener('submit', handlePostSubmit);
    document.getElementById('imageInput').addEventListener('change', handleImageUpload);

    // 4. Load data (these can run in parallel since auth is already checked)
    loadPosts();
    loadMessages();
    loadImageGallery();
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
    // Clear all auth data
    localStorage.clear(); // Clear everything to avoid conflicts
    showToast('Sesión cerrada');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

function initQuill() {
    quill = new Quill('#editor-container', {
        theme: 'snow',
        placeholder: 'Escribe tu historia aquí...',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'align': [] }, { 'align': 'center' }, { 'align': 'right' }, { 'align': 'justify' }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['blockquote', 'code-block'],
                ['link', 'image'],
                ['clean']
            ]
        }
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
    const imageUrl = document.getElementById('imageUrl').value || 'img/logo_placeholder.png'; // Default image
    const content = quill.root.innerHTML;

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/posts/${id}` : `${API_URL}/posts`;

    // DEBUG: Log token status
    const token = localStorage.getItem('token');
    console.log('🔑 Token from localStorage:', token ? 'EXISTS (' + token.substring(0, 10) + '...)' : 'NULL/MISSING');
    console.log('📡 Request:', method, url);

    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, summary, image_url: imageUrl, content })
        });

        console.log('📥 Response status:', res.status, res.statusText);

        if (res.ok) {
            showToast('✅ Post guardado correctamente');
            hidePostForm();
            loadPosts();
        } else {
            const errorData = await res.json();
            console.log('❌ Error data:', errorData);
            showToast(`❌ Error al guardar: ${errorData.error || res.statusText}`);
            console.error('Save error:', errorData);
        }
    } catch (err) {
        console.error('Save exception:', err);
        showToast('❌ Error de conexión: ' + err.message);
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

    // DEBUG: Log token status
    const token = localStorage.getItem('token');
    console.log('🖼️ IMAGE UPLOAD - Token:', token ? 'EXISTS (' + token.substring(0, 10) + '...)' : 'NULL/MISSING');

    try {
        const res = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        console.log('📥 Upload response status:', res.status, res.statusText);

        if (!res.ok) {
            const errorData = await res.json();
            console.log('❌ Upload error data:', errorData);
            showToast(`Error subiendo imagen: ${errorData.error || res.statusText}`);
            console.error('Upload error:', errorData);
            return;
        }

        const data = await res.json();
        console.log('✅ Upload success:', data);
        if (data.url) {
            document.getElementById('imageUrl').value = data.url;
            const preview = document.getElementById('imagePreview');
            preview.src = data.url;
            preview.style.display = 'block';
            showToast('Imagen subida correctamente');
        } else {
            showToast('Error: No se recibió URL de imagen');
        }
    } catch (err) {
        console.error('Upload exception:', err);
        showToast('Error subiendo imagen: ' + err.message);
    }
}

/* --- IMAGE GALLERY --- */
async function loadImageGallery() {
    const gallery = document.getElementById('imageGallery');
    if (!gallery) {
        console.log('Gallery element not found, skipping load');
        return; // Gallery not on this page
    }

    try {
        const res = await fetch(`${API_URL}/images`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (!res.ok) {
            gallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No se pudieron cargar las imágenes</p>';
            return;
        }

        const images = await res.json();

        if (images.length === 0) {
            gallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No hay imágenes subidas aún</p>';
            return;
        }

        gallery.innerHTML = images.map(img => `
            <div style="
                position: relative;
                cursor: pointer;
                border: 2px solid transparent;
                border-radius: 4px;
                overflow: hidden;
                transition: all 0.2s;
            " onmouseover="this.style.borderColor='var(--color-purple)'; this.style.transform='scale(1.05)'" 
               onmouseout="this.style.borderColor='transparent'; this.style.transform='scale(1)'">
                <img src="${img.url}" onclick="selectImage('${img.url}')" style="width: 100%; height: 100px; object-fit: cover; display: block;" title="${img.filename}">
                <button type="button" onclick="event.stopPropagation(); deleteImage('${img.filename}')" style="
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: rgba(255, 0, 0, 0.8);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                " onmouseover="this.style.background='rgba(255, 0, 0, 1)'" 
                   onmouseout="this.style.background='rgba(255, 0, 0, 0.8)'">×</button>
            </div>
        `).join('');
    } catch (err) {
        console.error('Gallery load error:', err);
        if (gallery) {
            gallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Error al cargar galería</p>';
        }
    }
}

function selectImage(url) {
    document.getElementById('imageUrl').value = url;
    const preview = document.getElementById('imagePreview');
    preview.src = url;
    preview.style.display = 'block';
    showToast('✅ Imagen seleccionada');
}

async function deleteImage(filename) {
    if (!confirm(`¿Estás seguro de eliminar "${filename}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const res = await fetch(`${API_URL}/images/${encodeURIComponent(filename)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (res.ok) {
            showToast('🗑️ Imagen eliminada');
            loadImageGallery(); // Reload gallery
        } else {
            const errorData = await res.json();
            showToast(`❌ Error: ${errorData.error || 'No se pudo eliminar'}`);
        }
    } catch (err) {
        console.error('Delete error:', err);
        showToast('❌ Error al eliminar imagen');
    }
}

/* --- MESSAGES --- */
async function loadMessages() {
    const tbody = document.getElementById('messagesTableBody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: var(--color-purple);">⏳ Cargando mensajes, por favor espere...</td></tr>';

    try {
        const res = await fetch(`${API_URL}/messages`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (!res.ok) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #ff6b6b;">❌ Error al cargar mensajes. Intenta hacer logout y login de nuevo.</td></tr>';
            return;
        }

        const messages = await res.json();

        if (messages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #999;">No hay mensajes aún</td></tr>';
            return;
        }

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
        console.error('Error loading messages:', err);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #ff6b6b;">❌ Error de conexión</td></tr>';
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
