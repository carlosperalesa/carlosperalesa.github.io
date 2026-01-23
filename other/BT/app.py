import os
import sqlite3
import datetime
import secrets
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder='public', static_url_path='')
app.config['UPLOAD_FOLDER'] = os.path.join('public', 'uploads')
app.config['DATABASE'] = 'database.db'
app.config['SECRET_KEY'] = 'bruja_teatral_secret_key_2024' # Change in production

# Ensure upload dir exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def get_db():
    conn = sqlite3.connect(app.config['DATABASE'])
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Posts Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            summary TEXT,
            content TEXT,
            image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Messages Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            subject TEXT,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Seed Admin
    cursor.execute('SELECT * FROM users WHERE username = ?', ('admin',))
    if not cursor.fetchone():
        hashed_pw = generate_password_hash('admin')
        cursor.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', ('admin', hashed_pw))
        print("Admin user created.")

    conn.commit()
    conn.close()

# Token check helper (Basic simulation for this scope, real JWT preferred but custom header works for simple Flask)
def check_auth(req):
    token = req.headers.get('Authorization')
    if not token or not token.startswith('Bearer '):
        return False
    # In a real app we decode JWT. Here we just simple-verify against a session logic or simplified check.
    # For simplicity in this "simplest SQLite" port, we'll verify the token string simply IS the username signed (or just a shared secret + user).
    # actually, let's just make the login return a dummy token and we check if it exists.
    # IMPROVEMENT: Use a simple session dictionary or just accept the token returned by login.
    # To keep it robust without extra libs like PyJWT, we will just use a global set of active tokens.
    return token.split(' ')[1] in active_tokens

active_tokens = set()

@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('public', path)

# --- API ---

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()

    if user and check_password_hash(user['password_hash'], password):
        token = secrets.token_hex(16)
        active_tokens.add(token)
        return jsonify({'token': token, 'username': username})
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/posts', methods=['GET'])
def get_posts():
    conn = get_db()
    posts = conn.execute('SELECT * FROM posts ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(p) for p in posts])

@app.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    conn = get_db()
    post = conn.execute('SELECT * FROM posts WHERE id = ?', (post_id,)).fetchone()
    conn.close()
    if post:
        return jsonify(dict(post))
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/posts', methods=['POST'])
def create_post():
    if not check_auth(request): return jsonify({'error': 'Unauthorized'}), 401
    data = request.json
    conn = get_db()
    conn.execute('INSERT INTO posts (title, summary, content, image_url) VALUES (?, ?, ?, ?)',
                 (data['title'], data['summary'], data['content'], data['image_url']))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/posts/<int:post_id>', methods=['PUT'])
def update_post(post_id):
    if not check_auth(request): return jsonify({'error': 'Unauthorized'}), 401
    data = request.json
    conn = get_db()
    conn.execute('UPDATE posts SET title=?, summary=?, content=?, image_url=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
                 (data['title'], data['summary'], data['content'], data['image_url'], post_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    if not check_auth(request): return jsonify({'error': 'Unauthorized'}), 401
    conn = get_db()
    conn.execute('DELETE FROM posts WHERE id = ?', (post_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/messages', methods=['POST'])
def create_message():
    data = request.json
    conn = get_db()
    conn.execute('INSERT INTO messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
                 (data['name'], data['email'], data['phone'], data['subject'], data['message']))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/messages', methods=['GET'])
def get_messages():
    if not check_auth(request): return jsonify({'error': 'Unauthorized'}), 401
    conn = get_db()
    msgs = conn.execute('SELECT * FROM messages ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(m) for m in msgs])

@app.route('/api/messages/<int:msg_id>', methods=['DELETE'])
def delete_message(msg_id):
    if not check_auth(request): return jsonify({'error': 'Unauthorized'}), 401
    conn = get_db()
    conn.execute('DELETE FROM messages WHERE id = ?', (msg_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if not check_auth(request): return jsonify({'error': 'Unauthorized'}), 401
    if 'image' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    filename = secure_filename(file.filename)
    unique_name = f"{secrets.token_hex(8)}_{filename}"
    file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_name))
    return jsonify({'url': f'/uploads/{unique_name}'})

if __name__ == '__main__':
    init_db()
    print("Database Initialized")
    print("Starting Flask Server on http://localhost:3000")
    app.run(port=3000, debug=True)
