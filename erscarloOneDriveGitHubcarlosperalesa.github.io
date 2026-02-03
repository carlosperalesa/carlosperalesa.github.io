[1mdiff --git a/api/app.py b/api/app.py[m
[1mindex 399f2df..4712984 100644[m
[1m--- a/api/app.py[m
[1m+++ b/api/app.py[m
[36m@@ -39,11 +39,13 @@[m [mapp.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(32))[m
 # =============================================[m
 # ENCRIPTACIÓN DE MENSAJES (DATOS DEL FORM)[m
 # =============================================[m
[32m+[m
[32m+[m
 def get_or_create_encryption_key():[m
     """Obtiene o genera una clave de encriptación persistente"""[m
     if not os.path.exists(DATA_DIR):[m
         os.makedirs(DATA_DIR)[m
[31m-    [m
[32m+[m
     if os.path.exists(ENCRYPTION_KEY_FILE):[m
         with open(ENCRYPTION_KEY_FILE, 'rb') as f:[m
             return f.read()[m
[36m@@ -54,16 +56,21 @@[m [mdef get_or_create_encryption_key():[m
         print("🔐 Nueva clave de encriptación generada")[m
         return key[m
 [m
[32m+[m
 # Inicializar encriptación[m
 ENCRYPTION_KEY = get_or_create_encryption_key()[m
 cipher = Fernet(ENCRYPTION_KEY)[m
 [m
[32m+[m
 def encrypt_text(text):[m
[31m-    if not text: return text[m
[32m+[m[32m    if not text:[m
[32m+[m[32m        return text[m
     return cipher.encrypt(text.encode()).decode()[m
 [m
[32m+[m
 def decrypt_text(encrypted_text):[m
[31m-    if not encrypted_text: return encrypted_text[m
[32m+[m[32m    if not encrypted_text:[m
[32m+[m[32m        return encrypted_text[m
     try:[m
         return cipher.decrypt(encrypted_text.encode()).decode()[m
     except Exception:[m
[36m@@ -72,14 +79,16 @@[m [mdef decrypt_text(encrypted_text):[m
 # =============================================[m
 # BASE DE DATOS E INICIALIZACIÓN[m
 # =============================================[m
[32m+[m
[32m+[m
 def init_db():[m
     """Inicializa la base de datos SQLite con tablas de mensajes y usuarios"""[m
     if not os.path.exists(DATA_DIR):[m
         os.makedirs(DATA_DIR)[m
[31m-    [m
[32m+[m
     conn = sqlite3.connect(DB_PATH)[m
     c = conn.cursor()[m
[31m-    [m
[32m+[m
     # Tabla de contactos[m
     c.execute('''CREATE TABLE IF NOT EXISTS contactos ([m
         id INTEGER PRIMARY KEY AUTOINCREMENT,[m
[36m@@ -91,7 +100,7 @@[m [mdef init_db():[m
         fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,[m
         leido BOOLEAN DEFAULT 0[m
     )''')[m
[31m-    [m
[32m+[m
     # Tabla de usuarios (Administradores)[m
     c.execute('''CREATE TABLE IF NOT EXISTS usuarios ([m
         id INTEGER PRIMARY KEY AUTOINCREMENT,[m
[36m@@ -99,7 +108,7 @@[m [mdef init_db():[m
         password_hash TEXT NOT NULL,[m
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP[m
     )''')[m
[31m-    [m
[32m+[m
     conn.commit()[m
     conn.close()[m
     print(f"✅ Base de datos inicializada en {DB_PATH}")[m
[36m@@ -107,6 +116,8 @@[m [mdef init_db():[m
 # =============================================[m
 # DECORADOR PARA AUTENTICACIÓN JWT[m
 # =============================================[m
[32m+[m
[32m+[m
 def token_required(f):[m
     @wraps(f)[m
     def decorated(*args, **kwargs):[m
[36m@@ -115,17 +126,18 @@[m [mdef token_required(f):[m
             auth_header = request.headers['Authorization'][m
             if auth_header.startswith('Bearer '):[m
                 token = auth_header.split(" ")[1][m
[31m-        [m
[32m+[m
         if not token:[m
             return jsonify({'success': False, 'message': 'Token ausente'}), 401[m
[31m-        [m
[32m+[m
         try:[m
[31m-            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])[m
[32m+[m[32m            data = jwt.decode([m
[32m+[m[32m                token, app.config['SECRET_KEY'], algorithms=["HS256"])[m
         except jwt.ExpiredSignatureError:[m
             return jsonify({'success': False, 'message': 'Sesión expirada'}), 401[m
         except Exception:[m
             return jsonify({'success': False, 'message': 'Token inválido'}), 401[m
[31m-            [m
[32m+[m
         return f(*args, **kwargs)[m
     return decorated[m
 [m
[36m@@ -133,6 +145,7 @@[m [mdef token_required(f):[m
 # ENDPOINTS DE AUTENTICACIÓN[m
 # =============================================[m
 [m
[32m+[m
 @app.route('/api/auth/status', methods=['GET'])[m
 @limiter.exempt[m
 def auth_status():[m
[36m@@ -143,7 +156,7 @@[m [mdef auth_status():[m
         c.execute('SELECT COUNT(*) FROM usuarios')[m
         count = c.fetchone()[0][m
         conn.close()[m
[31m-        [m
[32m+[m
         return jsonify({[m
             'success': True,[m
             'has_admin': count > 0[m
[36m@@ -151,6 +164,7 @@[m [mdef auth_status():[m
     except Exception as e:[m
         return jsonify({'success': False, 'error': str(e)}), 500[m
 [m
[32m+[m
 @app.route('/api/register', methods=['POST'])[m
 @limiter.limit("5 per hour")[m
 def register():[m
[36m@@ -159,32 +173,35 @@[m [mdef register():[m
         data = request.json[m
         username = data.get('username')[m
         password = data.get('password')[m
[31m-        [m
[32m+[m
         if not username or not password:[m
             return jsonify({'success': False, 'message': 'Faltan campos'}), 400[m
[31m-            [m
[32m+[m
         conn = sqlite3.connect(DB_PATH)[m
         c = conn.cursor()[m
[31m-        [m
[32m+[m
         # Verificar si ya existe algún usuario[m
         c.execute('SELECT COUNT(*) FROM usuarios')[m
         if c.fetchone()[0] > 0:[m
             conn.close()[m
             return jsonify({'success': False, 'message': 'Ya existe un administrador'}), 403[m
[31m-            [m
[32m+[m
         # Hashear password[m
[31m-        pwd_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')[m
[31m-        [m
[31m-        c.execute('INSERT INTO usuarios (username, password_hash) VALUES (?, ?)', (username, pwd_hash))[m
[32m+[m[32m        pwd_hash = bcrypt.hashpw(password.encode([m
[32m+[m[32m            'utf-8'), bcrypt.gensalt()).decode('utf-8')[m
[32m+[m
[32m+[m[32m        c.execute([m
[32m+[m[32m            'INSERT INTO usuarios (username, password_hash) VALUES (?, ?)', (username, pwd_hash))[m
         conn.commit()[m
         conn.close()[m
[31m-        [m
[32m+[m
         print(f"👤 Primer administrador creado: {username}")[m
         return jsonify({'success': True, 'message': 'Administrador creado correctamente'}), 201[m
[31m-        [m
[32m+[m
     except Exception as e:[m
         return jsonify({'success': False, 'error': str(e)}), 500[m
 [m
[32m+[m
 @app.route('/api/login', methods=['POST'])[m
 @limiter.limit("20 per hour")[m
 def login():[m
[36m@@ -193,32 +210,33 @@[m [mdef login():[m
         data = request.json[m
         username = data.get('username')[m
         password = data.get('password')[m
[31m-        [m
[32m+[m
         conn = sqlite3.connect(DB_PATH)[m
         conn.row_factory = sqlite3.Row[m
         c = conn.cursor()[m
         c.execute('SELECT * FROM usuarios WHERE username = ?', (username,))[m
         user = c.fetchone()[m
         conn.close()[m
[31m-        [m
[32m+[m
         if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):[m
             token = jwt.encode({[m
                 'user_id': user['id'],[m
                 'user': user['username'],[m
                 'exp': datetime.utcnow() + timedelta(hours=8)[m
             }, app.config['SECRET_KEY'], algorithm="HS256")[m
[31m-            [m
[32m+[m
             return jsonify({[m
                 'success': True,[m
                 'token': token,[m
                 'user': user['username'][m
             })[m
[31m-            [m
[32m+[m
         return jsonify({'success': False, 'message': 'Credenciales inválidas'}), 401[m
[31m-        [m
[32m+[m
     except Exception as e:[m
         return jsonify({'success': False, 'error': str(e)}), 500[m
 [m
[32m+[m
 @app.route('/api/auth/profile', methods=['PUT'])[m
 @token_required[m
 def update_profile():[m
[36m@@ -228,6