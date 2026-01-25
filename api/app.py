from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Flask(__name__)
CORS(app)  # Permitir requests desde tu dominio

# Configuración
DB_PATH = 'data/contactos.db'
DATA_DIR = 'data'

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
def health():
    """Endpoint para verificar que la API está funcionando"""
    return jsonify({
        'status': 'ok',
        'message': 'Contact API is running',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/contact', methods=['POST'])
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
        
        # Guardar en base de datos
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''INSERT INTO contactos (nombre, telefono, email, asunto, mensaje)
                     VALUES (?, ?, ?, ?, ?)''',
                  (data.get('name'), 
                   data.get('phone', ''),
                   data.get('email'),
                   data.get('subject', 'Sin asunto'),
                   data.get('message')))
        contact_id = c.lastrowid
        conn.commit()
        conn.close()
        
        print(f"✅ Nuevo contacto guardado: ID={contact_id}, Email={data.get('email')}")
        
        # Opcional: Enviar notificación por email
        try:
            send_notification_email(data)
        except Exception as e:
            print(f"⚠️ No se pudo enviar email de notificación: {e}")
        
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

@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    """Endpoint para obtener todos los contactos (proteger en producción)"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT * FROM contactos ORDER BY fecha DESC')
        contacts = [dict(row) for row in c.fetchall()]
        conn.close()
        
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

def send_notification_email(data):
    """
    Envía un email de notificación cuando llega un nuevo contacto
    Configurar variables de entorno para usar esta función:
    - SMTP_HOST
    - SMTP_PORT
    - SMTP_USER
    - SMTP_PASSWORD
    - NOTIFICATION_EMAIL
    """
    smtp_host = os.getenv('SMTP_HOST')
    smtp_port = os.getenv('SMTP_PORT', 587)
    smtp_user = os.getenv('SMTP_USER')
    smtp_password = os.getenv('SMTP_PASSWORD')
    notification_email = os.getenv('NOTIFICATION_EMAIL', smtp_user)
    
    # Si no hay configuración SMTP, simplemente retornar
    if not all([smtp_host, smtp_user, smtp_password]):
        return
    
    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['To'] = notification_email
    msg['Subject'] = f"Nuevo contacto: {data.get('subject', 'Sin asunto')}"
    
    body = f"""
    Nuevo mensaje de contacto recibido:
    
    Nombre: {data.get('name')}
    Email: {data.get('email')}
    Teléfono: {data.get('phone', 'No proporcionado')}
    Asunto: {data.get('subject', 'Sin asunto')}
    
    Mensaje:
    {data.get('message')}
    
    ---
    Enviado desde: carlosperales.dev
    Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    """
    
    msg.attach(MIMEText(body, 'plain'))
    
    server = smtplib.SMTP(smtp_host, smtp_port)
    server.starttls()
    server.login(smtp_user, smtp_password)
    server.send_message(msg)
    server.quit()
    
    print(f"📧 Email de notificación enviado a {notification_email}")

if __name__ == '__main__':
    init_db()
    port = int(os.getenv('PORT', 5000))
    print(f"🚀 Iniciando servidor en puerto {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
