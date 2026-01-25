# 🎭 Bruja Teatral - Backend API

Backend Flask con SQLite para el sitio web de Bruja Teatral. Proporciona una API REST para gestión de posts, mensajes y autenticación de administradores.

## 🚀 Instalación con Docker (Recomendado)

### Requisitos
- Docker
- Docker Compose

### Inicio Rápido

```bash
# 1. Navegar al directorio
cd other/BT

# 2. Construir la imagen
docker compose build

# 3. Iniciar el contenedor
docker compose up -d

# 4. Verificar que está corriendo
docker compose ps

# 5. Ver logs
docker compose logs -f web
```

La API estará disponible en `http://localhost:3000`

### Comandos Útiles

```bash
# Detener el contenedor
docker compose down

# Reiniciar
docker compose restart

# Ver logs en tiempo real
docker compose logs -f

# Reconstruir después de cambios
docker compose up -d --build

# Acceder al shell del contenedor
docker compose exec web /bin/bash
```

## ⚙️ Configuración

### Variables de Entorno

Puedes crear un archivo `.env` en el directorio `other/BT/` para configurar:

```env
# Puerto (default: 3000)
PORT=3000

# Entorno (development/production)
FLASK_ENV=production

# Clave secreta (¡CAMBIAR EN PRODUCCIÓN!)
SECRET_KEY=tu_clave_secreta_super_segura_aqui
```

### Credenciales por Defecto

> ⚠️ **IMPORTANTE**: Cambia estas credenciales en producción

- **Usuario**: `admin`
- **Password**: `admin`

Para cambiar el password, puedes:
1. Acceder al shell del contenedor: `docker compose exec web /bin/bash`
2. Usar Python para generar un nuevo hash y actualizar la base de datos

## 📦 Instalación Local (Sin Docker)

### Requisitos
- Python 3.11+
- pip

### Pasos

```bash
# 1. Navegar al directorio
cd other/BT

# 2. Crear entorno virtual
python -m venv .venv

# 3. Activar entorno virtual
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# 4. Instalar dependencias
pip install -r requirements.txt

# 5. Ejecutar
python app.py
```

## 📡 API Endpoints

### Públicos (No requieren autenticación)

- `GET /` - Página principal
- `GET /api/posts` - Listar todos los posts
- `GET /api/posts/<id>` - Obtener un post específico
- `POST /api/login` - Login de administrador
- `POST /api/messages` - Enviar mensaje de contacto

### Protegidos (Requieren token de autenticación)

- `POST /api/posts` - Crear nuevo post
- `PUT /api/posts/<id>` - Actualizar post
- `DELETE /api/posts/<id>` - Eliminar post
- `GET /api/messages` - Listar mensajes
- `DELETE /api/messages/<id>` - Eliminar mensaje
- `POST /api/upload` - Subir imagen

### Ejemplo de Uso

```javascript
// Login
const response = await fetch('http://localhost:3000/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin' })
});
const { token } = await response.json();

// Crear post (autenticado)
await fetch('http://localhost:3000/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Mi Post',
    summary: 'Resumen',
    content: 'Contenido completo',
    image_url: '/uploads/imagen.jpg'
  })
});
```

## 💾 Persistencia de Datos

### Con Docker

Los datos se persisten automáticamente usando volúmenes de Docker:
- **Base de datos**: `./database.db` (en el host)
- **Uploads**: `./public/uploads/` (en el host)

Esto significa que puedes detener y reiniciar el contenedor sin perder datos.

### Backup

```bash
# Backup de la base de datos
cp database.db database.backup.db

# Backup de uploads
tar -czf uploads-backup.tar.gz public/uploads/
```

## 🔧 Desarrollo

### Estructura del Proyecto

```
BT/
├── app.py              # Aplicación Flask principal
├── database.db         # Base de datos SQLite
├── requirements.txt    # Dependencias Python
├── Dockerfile          # Configuración Docker
├── docker-compose.yml  # Orquestación Docker  
├── .dockerignore       # Exclusiones de build
├── .gitignore          # Exclusiones de Git
├── README.md           # Esta documentación
├── DOCKER-SETUP.md     # Guía de instalación
└── public/             # Frontend estático
    ├── index.html
    ├── admin.html
    ├── post.html
    ├── css/
    ├── js/
    └── uploads/        # Uploads de usuarios
```

## 🐛 Troubleshooting

### El contenedor no inicia

```bash
# Ver logs detallados
docker compose logs web

# Verificar que el puerto 3000 no está en uso
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/Mac
```

### Reiniciar base de datos

```bash
# Detener contenedor
docker compose down

# Eliminar base de datos existente
rm database.db

# Reiniciar (se creará nueva BD)
docker compose up -d
```

### Permisos de archivos (Linux/Mac)

```bash
# Si tienes problemas de permisos con uploads
chmod -R 755 public/uploads
```

## 📄 Licencia

Proyecto privado - Bruja Teatral © 2024
