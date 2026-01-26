from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import sqlite3
import os
from datetime import datetime
from cryptography.fernet import Fernet

app = Flask(__name__)
# Permitir CORS para desarrollo local y producción
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# =============================================
# RATE LIMITING - Protección contra spam
# =============================================
# Límites:
# - 10 mensajes por minuto por IP
# - 50 mensajes por hora por IP  
# - 200 mensajes por día por IP
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

# =============================================
# ENCRIPTACIÓN DE MENSAJES
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
    """Encripta texto sensible"""
    if not text:
        return text
    return cipher.encrypt(text.encode()).decode()

def decrypt_text(encrypted_text):
    """Desencripta texto"""
    if not encrypted_text:
        return encrypted_text
    try:
        return cipher.decrypt(encrypted_text.encode()).decode()
    except Exception:
        # Si falla la desencriptación, retornar el texto tal cual (legacy data)
        return encrypted_text

def init_db():
    """Inicializa la base de datos SQLite"""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
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
    conn.commit()
    conn.close()
    print(f"✅ Base de datos inicializada en {DB_PATH}")

@app.route('/api/health', methods=['GET'])
@limiter.exempt  # Excluir health check del rate limiting
def health():
    """Endpoint para verificar que la API está funcionando"""
    return jsonify({
        'status': 'ok',
        'message': 'Contact API is running',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/contact', methods=['POST'])
@limiter.limit("10 per minute")  # Máximo 10 mensajes por minuto por IP
def contact():
    """Endpoint para recibir mensajes del formulario de contacto"""
    try:
        data = request.json
        
        # Validación básica
        if not data.get('name') or not data.get('email') or not data.get('message'):
            return jsonify({
                'success': False,
                'error': 'Faltan campos obligatorios (nombre, email, mensaje)'
            }), 400
        
        # Encriptar datos sensibles antes de guardar
        encrypted_phone = encrypt_text(data.get('phone', ''))
        encrypted_email = encrypt_text(data.get('email'))
        encrypted_message = encrypt_text(data.get('message'))
        
        # Guardar en base de datos (datos encriptados)
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''INSERT INTO contactos (nombre, telefono, email, asunto, mensaje)
                     VALUES (?, ?, ?, ?, ?)''',
                  (data.get('name'),  # Nombre no encriptado para identificación
                   encrypted_phone,
                   encrypted_email,
                   data.get('subject', 'Sin asunto'),  # Asunto no encriptado
                   encrypted_message))
        contact_id = c.lastrowid
        conn.commit()
        conn.close()
        
        print(f"✅ Nuevo contacto guardado (encriptado): ID={contact_id}")
        
        return jsonify({
            'success': True,
            'message': 'Mensaje recibido correctamente',
            'id': contact_id
        }), 201
        
    except Exception as e:
        print(f"❌ Error al procesar contacto: {e}")
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor'
        }), 500

@app.route('/api/contacts/count', methods=['GET'])
def count_contacts():
    """Endpoint público para contar mensajes (badge de notificaciones)"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT COUNT(*) FROM contactos')
        count = c.fetchone()[0]
        conn.close()
        
        return jsonify({
            'success': True,
            'count': count
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    """Endpoint para obtener todos los contactos (desencriptados para admin)"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT * FROM contactos ORDER BY fecha DESC')
        raw_contacts = [dict(row) for row in c.fetchall()]
        conn.close()
        
        # Desencriptar datos sensibles para mostrar en admin
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
        
        return jsonify({
            'success': True,
            'count': len(contacts),
            'contacts': contacts
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/contacts/<int:id>', methods=['DELETE'])
def delete_contact(id):
    """Endpoint para eliminar un contacto por ID"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Verificar si existe
        c.execute('SELECT id FROM contactos WHERE id = ?', (id,))
        if not c.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Contacto no encontrado'}), 404
            
        # Borrar
        c.execute('DELETE FROM contactos WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        
        print(f"✅ Contacto eliminado: ID={id}")
        return jsonify({'success': True, 'message': 'Contacto eliminado correctamente'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# =============================================
# HANDLER PARA ERRORES DE RATE LIMIT
# =============================================
@app.errorhandler(429)
def ratelimit_handler(e):
    """Respuesta personalizada cuando se excede el rate limit"""
    return jsonify({
        'success': False,
        'error': 'Demasiadas solicitudes. Por favor espera un momento antes de intentar de nuevo.',
        'retry_after': e.description
    }), 429

# =============================================
# GUNICORN ENTRY POINT
# =============================================
# Initialize DB when running with Gunicorn
try:
    with app.app_context():
        init_db()
except Exception as e:
    print(f"Warning: DB init failed: {e}")

if __name__ == '__main__':
    # init_db() se llama arriba, pero no daña llamarlo aquí también (IF NOT EXISTS)
    init_db()
    port = int(os.getenv('PORT', '5000'))
    print(f"🚀 Iniciando servidor en puerto {port}")
    print("🔐 Encriptación de mensajes: ACTIVA")
    print("🛡️ Rate limiting: 10/min, 50/hora, 200/día por IP")
    app.run(host='0.0.0.0', port=port, debug=False)
