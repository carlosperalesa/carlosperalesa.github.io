import os
import sqlite3
import time
import secrets
import hashlib
import logging
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

# Configurar logging para ver errores en Docker logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='public', static_url_path='')
CORS(app) 
app.config['UPLOAD_FOLDER'] = os.path.join('public', 'uploads')
app.config['DATABASE'] = 'database.db'
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'bruja_teatral_secret_key_2024_CHANGE_IN_PRODUCTION')
app.config['TOKEN_EXPIRATION_HOURS'] = 24

# Ensure upload dir exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def get_db():
    conn = sqlite3.connect(app.config['DATABASE'])
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

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

        cursor.execute('SELECT * FROM users WHERE username = ?', ('admin',))
        if not cursor.fetchone():
            hashed_pw = generate_password_hash('admin')
            cursor.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', ('admin', hashed_pw))
            logger.info("Admin user created.")

        conn.commit()
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
    finally:
        if conn:
            conn.close()

def check_auth(req):
    token = req.headers.get('Authorization')
    if not token or not token.startswith('Bearer '):
        return False
    
    token_value = token.split(' ')[1]
    
    try:
        parts = token_value.split(':')
        if len(parts) != 3:
            if len(parts) == 2:
                username, signature = parts
                expected_signature = hashlib.sha256((username + app.config['SECRET_KEY']).encode()).hexdigest()
                return signature == expected_signature
            return False
        
        username, timestamp_str, signature = parts
        timestamp = int(timestamp_str)
        
        expiration_seconds = app.config['TOKEN_EXPIRATION_HOURS'] * 3600
        if time.time() - timestamp > expiration_seconds:
            return False
        
        expected_signature = hashlib.sha256(
            (username + timestamp_str + app.config['SECRET_KEY']).encode()
        ).hexdigest()
        return signature == expected_signature
    except:
        return False

@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('public', path)

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        conn = get_db()
        user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        conn.close()

        if user and check_password_hash(user['password_hash'], password):
            timestamp = str(int(time.time()))
            signature = hashlib.sha256(
                (username + timestamp + app.config['SECRET_KEY']).encode()
            ).hexdigest()
            token = f"{username}:{timestamp}:{signature}"
            expires_at = int(time.time()) + (app.config['TOKEN_EXPIRATION_HOURS'] * 3600)
            
            return jsonify({
                'token': token, 
                'username': username,
                'expires_at': expires_at,
                'expires_in_hours': app.config['TOKEN_EXPIRATION_HOURS']
            })
        
        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'Bruja Teatral API',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/posts', methods=['GET'])
def get_posts():
    try:
        conn = get_db()
        posts = conn.execute('SELECT * FROM posts ORDER BY created_at DESC').fetchall()
        conn.close()
        return jsonify([dict(p) for p in posts])
    except Exception as e:
        logger.error(f"Error fetching posts: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    try:
        conn = get_db()
        post = conn.execute('SELECT * FROM posts WHERE id = ?', (post_id,)).fetchone()
        conn.close()
        if post:
            return jsonify(dict(post))
        return jsonify({'error': 'Not found'}), 404
    except Exception as e:
        logger.error(f"Error fetching post {post_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts', methods=['POST'])
def create_post():
    if not check_auth(request): return jsonify({'error': 'Unauthorized'}), 401
    try:
        data = request.json
        conn = get_db()
        conn.execute('INSERT INTO posts (title, summary, content, image_url) VALUES (?, ?, ?, ?)',
                     (data['title'], data['summary'], data['content'], data['image_url']))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error creating post: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts/<int:post_id>', methods=['PUT'])
def update_post(post_id):
    if not check_auth(request): return jsonify({'error': 'Unauthorized'}), 401
    try:
        data = request.json
        conn = get_db()
        conn.execute('UPDATE posts SET title=?, summary=?, content=?, image_url=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
                     (data['title'], data['summary'], data['content'], data['image_url'], post_id))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error updating post {post_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    if not check_auth(request): return jsonify({'error': 'Unauthorized'}), 401
    try:
        conn = get_db()
        conn.execute('DELETE FROM posts WHERE id = ?', (post_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error deleting post {post_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/messages', methods=['POST'])
def create_message():
    try:
        data = request.json
        conn = get_db()
        conn.execute('INSERT INTO messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
                     (data['name'], data['email'], data['phone'], data['subject'], data['message']))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error creating message: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/messages', methods=['GET'])
def get_messages():
    if not check_auth(request): return jsonify({'error': 'Unauthorized'}), 401
    try:
        conn = get_db()
        msgs = conn.execute('SELECT * FROM messages ORDER BY created_at DESC').fetchall()
        conn.close()
        return jsonify([dict(m) for m in msgs])
    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/messages/<int:msg_id>', methods=['DELETE'])
def delete_message(msg_id):
    if not check_auth(request): return jsonify({'error': 'Unauthorized'}), 401
    try:
        conn = get_db()
        conn.execute('DELETE FROM messages WHERE id = ?', (msg_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error deleting message {msg_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if not check_auth(request): return jsonify({'error': 'Unauthorized'}), 401
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        filename = secure_filename(file.filename)
        unique_name = f"{secrets.token_hex(8)}_{filename}"
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_name))
        return jsonify({'url': f'/uploads/{unique_name}'})
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/images', methods=['GET'])
def get_images():
    if not check_auth(request): return jsonify({'error': 'Unauthorized'}), 401
    try:
        upload_folder = app.config['UPLOAD_FOLDER']
        if not os.path.exists(upload_folder):
            return jsonify([])
        
        images = []
        for filename in os.listdir(upload_folder):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                images.append({
                    'filename': filename,
                    'url': f'/uploads/{filename}'
                })
        return jsonify(images)
    except Exception as e:
        logger.error(f"Error fetching images: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/images/<filename>', methods=['DELETE'])
def delete_image(filename):
    if not check_auth(request): return jsonify({'error': 'Unauthorized'}), 401
    try:
        if '..' in filename or '/' in filename or '\\' in filename:
            return jsonify({'error': 'Invalid filename'}), 400
        
        upload_folder = app.config['UPLOAD_FOLDER']
        filepath = os.path.join(upload_folder, filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        os.remove(filepath)
        return jsonify({'success': True, 'message': 'Image deleted'})
    except Exception as e:
        logger.error(f"Error deleting image {filename}: {e}")
        return jsonify({'error': str(e)}), 500

# Initialize DB
init_db()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    flask_env = os.environ.get('FLASK_ENV', 'development')
    debug = flask_env == 'development'
    
    logger.info("Database Initialized")
    logger.info(f"Starting Flask Server on http://localhost:{port}")
    logger.info(f"Environment: {flask_env}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
