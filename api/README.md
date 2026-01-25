# 🚀 Portfolio Contact API

Backend API para el formulario de contacto de carlosperales.dev

## 📋 Características

- ✅ API REST con Flask
- ✅ Base de datos SQLite
- ✅ Dockerizado para fácil deployment
- ✅ CORS habilitado para comunicación con frontend
- ✅ Validación de datos
- ✅ Notificaciones por email (opcional)
- ✅ Endpoint de salud para monitoreo

## 🏗️ Arquitectura

```
Frontend (index.html)
    ↓
JavaScript (contact.js)
    ↓
Backend API (Flask en Docker)
    ↓
SQLite Database
```

## 🚀 Inicio Rápido

### Local (Windows con Docker Desktop)

1. **Asegúrate de tener Docker Desktop corriendo**

2. **Navega a la carpeta api:**
```powershell
cd c:\Users\carlo\OneDrive\GitHub\carlosperalesa.github.io\api
```

3. **Construir y levantar el contenedor:**
```powershell
docker compose up -d --build
```

4. **Verificar que funciona:**
```powershell
# En PowerShell
curl http://localhost:5000/api/health

# O abre en tu navegador:
# http://localhost:5000/api/health
```

Deberías ver:
```json
{
  "status": "ok",
  "message": "Contact API is running",
  "timestamp": "2026-01-25T12:00:00"
}
```

5. **Probar el frontend:**
- Abre `index.html` en tu navegador
- Haz clic en el ícono de Contacto
- Llena el formulario y envía
- El mensaje se guardará en `api/data/contactos.db`

## 📡 Endpoints

### `GET /api/health`
Verifica que la API está funcionando

**Respuesta:**
```json
{
  "status": "ok",
  "message": "Contact API is running",
  "timestamp": "2026-01-25T12:00:00"
}
```

### `POST /api/contact`
Recibe un mensaje del formulario de contacto

**Request Body:**
```json
{
  "name": "Juan Pérez",
  "phone": "+56912345678",
  "email": "juan@example.com",
  "subject": "Consulta de proyecto",
  "message": "Hola, me gustaría trabajar contigo..."
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Mensaje recibido correctamente",
  "id": 1
}
```

### `GET /api/contacts`
Obtiene todos los mensajes guardados

**Respuesta:**
```json
{
  "success": true,
  "count": 5,
  "contacts": [
    {
      "id": 1,
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "mensaje": "Hola...",
      "fecha": "2026-01-25 12:00:00",
      "leido": 0
    }
  ]
}
```

⚠️ **Nota:** Este endpoint debe protegerse con autenticación en producción

## 🌐 Deployment en DigitalOcean

### 1. Conectar al droplet

```bash
ssh root@138.197.215.59
```

### 2. Crear directorio para la API

```bash
mkdir -p /var/www/portfolio-api
cd /var/www/portfolio-api
```

### 3. Copiar archivos desde local

En tu **máquina local (Windows)**:

```powershell
cd c:\Users\carlo\OneDrive\GitHub\carlosperalesa.github.io

# Copiar carpeta api completa
scp -r api/* root@138.197.215.59:/var/www/portfolio-api/
```

### 4. Construir y levantar en el droplet

Vuelve al SSH del droplet:

```bash
cd /var/www/portfolio-api

# Construir imagen
sudo docker compose build

# Levantar contenedor
sudo docker compose up -d

# Verificar que está corriendo
sudo docker compose ps
sudo docker compose logs -f
```

### 5. Configurar Nginx

Edita tu configuración de Nginx:

```bash
sudo nano /etc/nginx/sites-available/carlosperales.dev
```

Agrega el bloque de la API:

```nginx
server {
    server_name carlosperales.dev www.carlosperales.dev;

    # Frontend (archivos estáticos)
    location / {
        root /var/www/html;
        try_files $uri $uri/ =404;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/carlosperales.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/carlosperales.dev/privkey.pem;
}
```

Recargar Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Probar en producción

```bash
# Desde el droplet
curl https://carlosperales.dev/api/health

# O desde tu navegador
https://carlosperales.dev/api/health
```

## 📧 Configurar Notificaciones por Email (Opcional)

Si quieres recibir un email cada vez que alguien te contacte:

1. **Crear archivo `.env`:**

```bash
cd /var/www/portfolio-api
nano .env
```

2. **Agregar configuración de Gmail:**

```env
PORT=5000
FLASK_ENV=production

# Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_contraseña_de_aplicacion
NOTIFICATION_EMAIL=donde_recibir_notificaciones@gmail.com
```

3. **Obtener contraseña de aplicación de Gmail:**
   - Ve a https://myaccount.google.com/apppasswords
   - Genera una nueva contraseña para "Correo"
   - Úsala en `SMTP_PASSWORD`

4. **Actualizar docker-compose.yml:**

```yaml
services:
  contact-api:
    # ... resto de configuración
    env_file:
      - .env
```

5. **Reiniciar contenedor:**

```bash
sudo docker compose down
sudo docker compose up -d
```

## 🗄️ Ver Mensajes Guardados

### Opción 1: Via API

```bash
curl http://localhost:5000/api/contacts
# O en producción:
curl https://carlosperales.dev/api/contacts
```

### Opción 2: Directo en SQLite

```bash
# Entrar al contenedor
docker compose exec contact-api /bin/bash

# Abrir SQLite
apt update && apt install -y sqlite3
sqlite3 data/contactos.db

# Query
SELECT * FROM contactos ORDER BY fecha DESC;

# Salir
.quit
exit
```

### Opción 3: Copiar DB a local

```powershell
# En Windows
docker cp portfolio-contact-api:/app/data/contactos.db ./contactos.db

# Abrir con DB Browser for SQLite u otro visor
```

## 🔧 Comandos Útiles

### Local (Windows)

```powershell
cd c:\Users\carlo\OneDrive\GitHub\carlosperalesa.github.io\api

# Ver logs
docker compose logs -f

# Reiniciar
docker compose restart

# Detener
docker compose down

# Reconstruir después de cambios
docker compose up -d --build

# Ver estado
docker compose ps

# Entrar al contenedor
docker compose exec contact-api /bin/bash
```

### Producción (DigitalOcean)

```bash
cd /var/www/portfolio-api

# Todo igual pero con sudo
sudo docker compose logs -f
sudo docker compose restart
sudo docker compose down
sudo docker compose up -d --build
sudo docker compose ps
```

## 🐛 Troubleshooting

### El contenedor no inicia

```bash
# Ver logs detallados
docker compose logs

# Verificar que Docker está corriendo
docker ps
```

### Error de CORS en el frontend

Verifica que `contact.js` esté usando la URL correcta:
- Local: `http://localhost:5000/api/contact`
- Producción: `https://carlosperales.dev/api/contact`

### No llegan los emails

1. Verifica las credenciales SMTP en `.env`
2. Asegúrate de usar "Contraseña de aplicación" de Gmail
3. Revisa los logs: `docker compose logs -f`

### Puerto 5000 ya en uso

```bash
# Ver qué proceso usa el puerto
netstat -ano | findstr :5000

# Cambiar puerto en docker-compose.yml
ports:
  - "5001:5000"  # Usa 5001 en lugar de 5000
```

## 📊 Estructura de la Base de Datos

### Tabla: `contactos`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER | ID autoincremental (PK) |
| `nombre` | TEXT | Nombre del contacto |
| `telefono` | TEXT | Teléfono (opcional) |
| `email` | TEXT | Email del contacto |
| `asunto` | TEXT | Asunto del mensaje |
| `mensaje` | TEXT | Contenido del mensaje |
| `fecha` | TIMESTAMP | Fecha/hora de creación |
| `leido` | BOOLEAN | Estado de lectura (0 = no leído) |

## 🔒 Seguridad

### Para producción, considera:

1. **Proteger `/api/contacts` con autenticación**
2. **Rate limiting** (limitar requests por IP)
3. **Sanitización de inputs** (ya implementada básicamente)
4. **HTTPS obligatorio** (ya configurado con Let's Encrypt)
5. **Honeypot** o **reCAPTCHA** para prevenir spam

## 📝 TODO

- [ ] Dashboard admin para ver mensajes
- [ ] Autenticación para `/api/contacts`
- [ ] Rate limiting con Redis
- [ ] Respuestas automáticas
- [ ] Estadísticas de mensajes

## 📞 Soporte

Si tienes problemas, verifica:
1. Logs del contenedor: `docker compose logs -f`
2. Consola del navegador (F12)
3. Estado de la API: `curl http://localhost:5000/api/health`

---

**Creado por**: Carlos Perales  
**Fecha**: Enero 2026  
**Stack**: Python, Flask, Docker, SQLite
