# 🚀 Guía de Instalación Completa - Docker Local y Producción

Esta guía te ayudará a instalar Docker tanto en tu máquina local (Windows) como en tu servidor DigitalOcean.

---

## 📋 Tabla de Contenidos

1. [Instalación Local (Windows)](#instalación-local-windows)
2. [Instalación en DigitalOcean](#instalación-en-digitalocean)
3. [Verificación](#verificación)
4. [Troubleshooting](#troubleshooting)

---

## 🖥️ Instalación Local (Windows)

### Requisitos Previos
- Windows 10/11 64-bit
- ~4GB de RAM libre
- Permisos de administrador

### Pasos

#### 1. Descargar Docker Desktop

Visita: https://www.docker.com/products/docker-desktop

O descarga directamente: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe

#### 2. Instalar

1. Ejecuta `Docker Desktop Installer.exe`
2. Acepta usar **WSL 2** (recomendado)
3. Sigue el asistente de instalación
4. Reinicia tu computadora cuando termine

#### 3. Iniciar Docker Desktop

1. Busca "Docker Desktop" en el menú inicio
2. Inícialo (puede tardar 1-2 minutos en la primera vez)
3. Espera a que el ícono de la ballena en la barra de tareas deje de animarse

#### 4. Verificar Instalación

Opción A - **Usando el script** (recomendado):
```powershell
cd c:\Users\carlo\OneDrive\GitHub\carlosperalesa.github.io\other\BT
.\test-docker-local.bat
```

Opción B - **Manual**:
```powershell
docker --version
docker compose version
```

Deberías ver algo como:
```
Docker version 24.x.x
Docker Compose version v2.x.x
```

#### 5. Probar la Aplicación Localmente

```powershell
cd c:\Users\carlo\OneDrive\GitHub\carlosperalesa.github.io\other\BT

# Construir imagen
docker compose build

# Iniciar contenedor
docker compose up -d

# Ver logs
docker compose logs -f
```

Accede a: http://localhost:3000

---

## 🌐 Instalación en DigitalOcean

### Requisitos Previos
- Acceso SSH a tu droplet (138.197.215.59)
- Ubuntu/Debian instalado en el droplet

### Método 1: Instalación Manual (Paso a Paso)

#### 1. Conectar al Droplet

```bash

```

#### 2. Transferir Script de Instalación

En **otra terminal local** (sin cerrar el SSH):
```powershell
scp c:\Users\carlo\OneDrive\GitHub\carlosperalesa.github.io\other\BT\install-docker-droplet.sh root@138.197.215.59:/root/
```

#### 3. Ejecutar Script en el Droplet

Vuelve a la terminal SSH y ejecuta:
```bash
chmod +x /root/install-docker-droplet.sh
bash /root/install-docker-droplet.sh
```

El script instalará:
- Docker Engine
- Docker Compose
- Todas las dependencias necesarias

Tomará aproximadamente 2-5 minutos.

#### 4. Desplegar la Aplicación

```bash
# Crear directorio para el proyecto
mkdir -p /var/www/bruja-teatral
cd /var/www/bruja-teatral

# Aquí necesitas copiar los archivos del proyecto
# Opción A: Clonar desde GitHub (si está en un repo)
# git clone https://github.com/tuusuario/repo.git .

# Opción B: Copiar desde local (ver siguiente sección)
```

#### 5. Copiar Archivos desde Local

En tu **terminal local de Windows**:
```powershell
cd c:\Users\carlo\OneDrive\GitHub\carlosperalesa.github.io\other\BT

# Copiar todo el contenido
scp -r * root@138.197.215.59:/var/www/bruja-teatral/
```

#### 6. Configurar Variables de Entorno

Vuelve al SSH del droplet:
```bash
cd /var/www/bruja-teatral

# Crear archivo .env
cat > .env << 'EOF'
PORT=3000
FLASK_ENV=production
SECRET_KEY=CAMBIA_ESTO_POR_UNA_CLAVE_SUPER_SEGURA_RANDOM_123456789
EOF
```

> 💡 **Tip**: Genera un SECRET_KEY seguro:
> ```bash
> openssl rand -hex 32
> ```

#### 7. Construir e Iniciar

```bash
# Construir imagen Docker
sudo docker compose build

# Iniciar contenedor
sudo docker compose up -d

# Verificar que está corriendo
sudo docker compose ps

# Ver logs
sudo docker compose logs -f
```

---

### Método 2: Despliegue Automático (Usando Script)

> ⚠️ **Nota**: Ejecuta esto desde Git Bash o WSL en Windows, NO desde PowerShell

```bash
cd /c/Users/carlo/OneDrive/GitHub/carlosperalesa.github.io/other/BT

# Dar permisos de ejecución
chmod +x deploy-to-droplet.sh

# Ejecutar script de deployment
./deploy-to-droplet.sh
```

El script hará automáticamente:
1. ✅ Conexión al droplet
2. ✅ Creación de directorios
3. ✅ Copia de archivos
4. ✅ Instalación de Docker
5. ✅ Configuración de variables
6. ✅ Build de imagen
7. ✅ Inicio del contenedor

---

## ✅ Verificación

### Local (Windows)

```powershell
# Ver estado del contenedor
docker compose ps

# Debería mostrar algo como:
# NAME            IMAGE        STATUS        PORTS
# bruja-teatral   bt-web       Up 2 minutes  0.0.0.0:3000->3000/tcp
```

Accede a: http://localhost:3000

### Producción (DigitalOcean)

Desde el droplet:
```bash
cd /var/www/bruja-teatral
sudo docker compose ps
```

Accede desde tu navegador a:
- Por IP: http://138.197.215.59:3000
- Por dominio (si configuras Nginx): https://carlosperales.dev/api

---

## 🔧 Comandos Útiles

### Local

```powershell
cd c:\Users\carlo\OneDrive\GitHub\carlosperalesa.github.io\other\BT

# Detener
docker compose down

# Reiniciar
docker compose restart

# Reconstruir después de cambios
docker compose up -d --build

# Ver logs en tiempo real
docker compose logs -f

# Entrar al contenedor
docker compose exec web /bin/bash
```

### Producción

```bash
cd /var/www/bruja-teatral

# Mismo que local pero con sudo
sudo docker compose down
sudo docker compose restart
sudo docker compose up -d --build
sudo docker compose logs -f
sudo docker compose exec web /bin/bash
```

---

## 🐛 Troubleshooting

### Local - "Docker daemon is not running"

**Solución**: 
1. Abre Docker Desktop
2. Espera a que inicie completamente
3. Intenta de nuevo

### Local - "WSL 2 installation is incomplete"

**Solución**:
1. Abre PowerShell como administrador
2. Ejecuta: `wsl --install`
3. Reinicia tu computadora

### Droplet - "Cannot connect to Docker daemon"

**Solución**:
```bash
# Verificar estado de Docker
sudo systemctl status docker

# Si no está corriendo, iniciarlo
sudo systemctl start docker
```

### Droplet - "Port 3000 already in use"

**Solución**:
```bash
# Ver qué está usando el puerto
sudo lsof -i :3000

# Matar el proceso (reemplaza PID con el número mostrado)
sudo kill -9 PID
```

### No puedo conectarme por SSH al droplet

**Solución**:
```bash
# Verifica tu clave SSH
ssh -v root@138.197.215.59

# Si falla, puede que necesites usar la consola de DigitalOcean
# https://cloud.digitalocean.com/droplets
```

---

## 📊 Resumen de URLs

| Entorno | URL | Uso |
|---------|-----|-----|
| Local | http://localhost:3000 | Desarrollo/Testing |
| Producción (IP) | http://138.197.215.59:3000 | Testing directo |
| Producción (Dominio) | https://carlosperales.dev/api | Producción final † |

† Requiere configuración de Nginx como proxy reverso (paso siguiente)

---

## 🎯 Próximos Pasos

Una vez que Docker esté funcionando en ambos lados:

1. ✅ **Probar localmente** - Asegurarte de que todo funciona
2. ✅ **Desplegar a producción** - Copiar al droplet
3. ⏭️ **Configurar Nginx** - Para usar tu dominio carlosperales.dev
4. ⏭️ **Configurar SSL** - HTTPS con Let's Encrypt
5. ⏭️ **Configurar CI/CD** - Deployment automático con git push

---

## 📞 ¿Necesitas Ayuda?

Si encuentras algún problema:
1. Revisa la sección de Troubleshooting
2. Verifica los logs: `docker compose logs -f`
3. Consulta el README.md principal del proyecto
