from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import sqlite3
import os
import jwt
import bcrypt
import secrets
from functools import wraps
from datetime import datetime, timedelta
from cryptography.fernet import Fernet

app = Flask(__name__)
# Permitir CORS para desarrollo local y producción
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# =============================================
# RATE LIMITING - Protección contra spam
# =============================================
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Configuración
DB_PATH = 'data/contactos.db'
DATA_DIR = 'data'
ENCRYPTION_KEY_FILE = 'data/.encryption_key'
# Secret key para JWT (se lee de .env o se genera una aleatoria)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(32))

# =============================================
# ENCRIPTACIÓN DE MENSAJES (DATOS DEL FORM)
# =============================================
def get_or_create_encryption_key():
    """Obtiene o genera una clave de encriptación persistente"""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
    
    if os.path.exists(ENCRYPTION_KEY_FILE):
        with open(ENCRYPTION_KEY_FILE, 'rb') as f:
            return f.read()
    else:
        key = Fernet.generate_key()
        with open(ENCRYPTION_KEY_FILE, 'wb') as f:
            f.write(key)
        print("🔐 Nueva clave de encriptación generada")
        return key

# Inicializar encriptación
ENCRYPTION_KEY = get_or_create_encryption_key()
cipher = Fernet(ENCRYPTION_KEY)

def encrypt_text(text):
    if not text: return text
    return cipher.encrypt(text.encode()).decode()

def decrypt_text(encrypted_text):
    if not encrypted_text: return encrypted_text
    try:
        return cipher.decrypt(encrypted_text.encode()).decode()
    except Exception:
        return encrypted_text

# =============================================
# BASE DE DATOS E INICIALIZACIÓN
# =============================================
def init_db():
    """Inicializa la base de datos SQLite con tablas de mensajes y usuarios"""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Tabla de contactos
    c.execute('''CREATE TABLE IF NOT EXISTS contactos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        telefono TEXT,
        email TEXT NOT NULL,
        asunto TEXT,
        mensaje TEXT NOT NULL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        leido BOOLEAN DEFAULT 0
    )''')
    
    # Tabla de usuarios (Administradores)
    c.execute('''CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    conn.commit()
    conn.close()
    print(f"✅ Base de datos inicializada en {DB_PATH}")

# =============================================
# DECORADOR PARA AUTENTICACIÓN JWT
# =============================================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'success': False, 'message': 'Token ausente'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Sesión expirada'}), 401
        except Exception:
            return jsonify({'success': False, 'message': 'Token inválido'}), 401
            
        return f(*args, **kwargs)
    return decorated

# =============================================
# ENDPOINTS DE AUTENTICACIÓN
# =============================================

@app.route('/api/auth/status', methods=['GET'])
@limiter.exempt
def auth_status():
    """Verifica si existe al menos un administrador configurado"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT COUNT(*) FROM usuarios')
        count = c.fetchone()[0]
        conn.close()
        
        return jsonify({
            'success': True,
            'has_admin': count > 0
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/register', methods=['POST'])
@limiter.limit("5 per hour")
def register():
    """Permite crear el primer usuario administrador"""
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'success': False, 'message': 'Faltan campos'}), 400
            
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Verificar si ya existe algún usuario
        c.execute('SELECT COUNT(*) FROM usuarios')
        if c.fetchone()[0] > 0:
            conn.close()
            return jsonify({'success': False, 'message': 'Ya existe un administrador'}), 403
            
        # Hashear password
        pwd_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        c.execute('INSERT INTO usuarios (username, password_hash) VALUES (?, ?)', (username, pwd_hash))
        conn.commit()
        conn.close()
        
        print(f"👤 Primer administrador creado: {username}")
        return jsonify({'success': True, 'message': 'Administrador creado correctamente'}), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
@limiter.limit("20 per hour")
def login():
    """Valida credenciales y devuelve un token JWT"""
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT * FROM usuarios WHERE username = ?', (username,))
        user = c.fetchone()
        conn.close()
        
        if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            token = jwt.encode({
                'user_id': user['id'],
                'user': user['username'],
                'exp': datetime.utcnow() + timedelta(hours=8)
            }, app.config['SECRET_KEY'], algorithm="HS256")
            
            return jsonify({
                'success': True,
                'token': token,
                'user': user['username']
            })
            
        return jsonify({'success': False, 'message': 'Credenciales inválidas'}), 401
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/profile', methods=['PUT'])
@token_required
def update_profile():
    """Permite cambiar la contraseña del usuario logueado"""
    try:
        data = request.json
        new_password = data.get('password')
        if not new_password:
            return jsonify({'success': False, 'message': 'Nueva contraseña requerida'}), 400
            
        pwd_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('UPDATE usuarios SET password_hash = ?', (pwd_hash,))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Contraseña actualizada'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/system/execute', methods=['POST'])
@token_required
def execute_system_action():
    data = request.json
    action = data.get('action')
    
    if not action:
        return jsonify({'success': False, 'message': 'Acción no especificada'}), 400
        
    try:
        # Hablar con el corredor externo (Mayordomo) en el host
        import json
        import urllib.request
        
        runner_url = "http://host.docker.internal:5001"
        payload = {
            "secret": os.getenv("RUNNER_SECRET"),
            "action": action
        }
        
        req = urllib.request.Request(
            runner_url, 
            data=json.dumps(payload).encode(),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode())
            return jsonify(result)
            
    except Exception as e:
        return jsonify({
            'success': False, 
            'message': f"Error conectando con el mayordomo: {str(e)}"
        }), 500

# =============================================
# ENDPOINTS DE MENSAJES (PROTEGIDOS)
# =============================================

@app.route('/api/health', methods=['GET'])
@limiter.exempt
def health():
    return jsonify({
        'status': 'ok',
        'message': 'Contact API is running',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/contact', methods=['POST'])
@limiter.limit("10 per minute")
def contact():
    try:
        data = request.json
        if not data.get('name') or not data.get('email') or not data.get('message'):
            return jsonify({'success': False, 'error': 'Faltan campos obligatorios'}), 400
        
        encrypted_phone = encrypt_text(data.get('phone', ''))
        encrypted_email = encrypt_text(data.get('email'))
        encrypted_message = encrypt_text(data.get('message'))
        
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''INSERT INTO contactos (nombre, telefono, email, asunto, mensaje)
                     VALUES (?, ?, ?, ?, ?)''',
                  (data.get('name'), encrypted_phone, encrypted_email, 
                   data.get('subject', 'Sin asunto'), encrypted_message))
        contact_id = c.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Mensaje recibido', 'id': contact_id}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': 'Error interno'}), 500

@app.route('/api/contacts/count', methods=['GET'])
def count_contacts():
    # Este se mantiene público para el badge
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT COUNT(*) FROM contactos')
        count = c.fetchone()[0]
        conn.close()
        return jsonify({'success': True, 'count': count})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/contacts', methods=['GET'])
@token_required
def get_contacts():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT * FROM contactos ORDER BY fecha DESC')
        raw_contacts = [dict(row) for row in c.fetchall()]
        conn.close()
        
        contacts = []
        for contact in raw_contacts:
            contacts.append({
                'id': contact['id'],
                'nombre': contact['nombre'],
                'telefono': decrypt_text(contact['telefono']),
                'email': decrypt_text(contact['email']),
                'asunto': contact['asunto'],
                'mensaje': decrypt_text(contact['mensaje']),
                'fecha': contact['fecha'],
                'leido': contact['leido']
            })
        
        return jsonify({'success': True, 'count': len(contacts), 'contacts': contacts})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/contacts/<int:id>', methods=['DELETE'])
@token_required
def delete_contact(id):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('DELETE FROM contactos WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Contacto eliminado'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        'success': False,
        'error': 'Demasiadas solicitudes. Por favor espera.',
        'retry_after': e.description
    }), 429

# Inicializar DB y App
try:
    init_db()
except Exception as e:
    print(f"DB init failed: {e}")

if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    app.run(host='0.0.0.0', port=port, debug=False)
