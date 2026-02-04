# 🚀 Carlos Perales | Portfolio

<div align="center">

![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-success?style=for-the-badge&logo=github)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

**Portafolio digital premium con diseño glassmorphism y animaciones fluidas**

[🌐 **Ver Sitio en Vivo**](https://carlosperales.dev/)

</div>

---

## ✨ Características

- 🎨 **Diseño Glassmorphism + Neomorphism** — Interfaz moderna con efectos de cristal, blur y relieve suave
- 🌌 **Cyber Grid 3D** — Fondo animado interactivo estilo Retro Wave (Three.js)
- 🕸️ **Skills Graph Interactivo** — Visualización de red de habilidades con física (D3.js)
- ⌨️ **Efecto Typewriter** — Presentación dinámica de roles
- 🌗 **Modo Oscuro/Claro** — Toggle de tema con transiciones suaves
- 🎭 **Animaciones Premium** — Orbs flotantes, efectos de hover y micro-animaciones
- 📱 **Totalmente Responsive** — Optimizado para desktop, tablet y móvil
- 🃏 **Flip Cards Interactivas** — Tarjetas con animación 3D al hacer hover
- ⚡ **Performance Optimizada** — Carga rápida con assets optimizados
- ♿ **Accesibilidad** — Indicadores de foco y navegación por teclado

---

## 🛠️ Tecnologías

| Categoría | Tecnologías |
|-----------|-------------|
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla) |
| **Gráficos & Data** | Three.js, D3.js |
| **Tipografía** | Google Fonts (Outfit, Calibri) |
| **Iconos** | Ionicons, Font Awesome 6 |
| **Hosting** | GitHub Pages |
| **CI/CD** | GitHub Actions |

---

## 📁 Estructura del Proyecto

```
carlosperalesa.github.io/
├── 📄 index.html          # Página principal del portafolio
├── 📄 index_v1.html       # Versión alternativa
├── 📂 img/                # Assets e imágenes
│   ├── avatar.webp        # Foto de perfil
│   ├── favicon.svg        # Favicon del sitio
│   ├── cards/             # Imágenes de proyectos
│   ├── cert/              # Certificaciones
│   └── lenguajes/         # Iconos de tecnologías
├── 📂 api/                # Backend Contact API (Docker)
│   ├── app.py             # Flask API
│   ├── docker-compose.yml # Docker config
│   └── nginx.conf         # Nginx site config
├── 📂 other/              # Proyectos adicionales
│   ├── BT/                # Bruja Teatral (Docker)
│   ├── cv/                # Currículum en diferentes formatos
│   ├── pokedex/           # Proyecto Pokédex
│   └── hootiehoo/         # Proyecto HootieHoo
├── 📄 deploy.sh           # Script de deploy automático
├── 📄 start.sh            # Deploy + rebuild de contenedores
├── 📄 check.sh            # Health check del sistema
├── 📄 backup.sh           # Script de backup
├── 📄 robots.txt          # Configuración para crawlers
├── 📄 sitemap.xml         # Mapa del sitio para SEO
├── 📄 SYSTEM_MANUAL.md    # 📘 Manual técnico y de despliegue
└── 📄 README.md           # Este archivo
```

> **Nota:** Para detalles profundos sobre arquitectura, configuración de servidores y scripts, consulta el [**Manual del Sistema**](SYSTEM_MANUAL.md).

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    DigitalOcean Droplet                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Nginx (443)                       │   │
│  │  • SSL/HTTPS (Let's Encrypt)                        │   │
│  │  • Rate Limiting                                     │   │
│  │  • Static Files + Reverse Proxy                      │   │
│  └───────────┬─────────────────────────┬───────────────┘   │
│              │                         │                    │
│              ▼                         ▼                    │
│  ┌─────────────────────┐   ┌─────────────────────┐        │
│  │  Contact API        │   │  Bruja Teatral      │        │
│  │  Docker :5000       │   │  Docker :3000       │        │
│  │  • Flask            │   │  • Flask + Gunicorn │        │
│  │  • SQLite + Encrypt │   │  • SQLite           │        │
│  │  • Rate Limiting    │   │  • JWT Auth         │        │
│  └─────────────────────┘   └─────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment

### Deployment Automático (CI/CD)

El sitio se despliega automáticamente con cada push a `main`:

```
GitHub Push → GitHub Actions → SSH → DigitalOcean → Docker Rebuild
```

### GitHub Secrets Requeridos

| Secret | Descripción |
|--------|-------------|
| `DEPLOY_KEY` | SSH private key |
| `DEPLOY_HOST` | IP del servidor |
| `DEPLOY_USER` | Usuario SSH (root) |
| `DEPLOY_DOMAIN` | carlosperales.dev |

### Scripts de Servidor

Los scripts están en la raíz del repo y se copian a `/bin/` en el servidor:

```bash
# Deploy completo + rebuild contenedores
start

# Health check del sistema
check

# Backup de bases de datos y uploads
bash /var/www/html-static/backup.sh
```

### Setup Inicial del Servidor

Requisitos: Ubuntu 22.04+, Docker, Nginx, Certbot

```bash
# 1. Clonar repo
cd /var/www
git clone https://github.com/carlosperalesa/carlosperalesa.github.io.git html-static

# 2. Copiar scripts a /bin/
cp html-static/start.sh /bin/start
cp html-static/check.sh /bin/check
chmod +x /bin/start /bin/check

# 3. Configurar SSL
certbot --nginx -d carlosperales.dev -d www.carlosperales.dev

# 4. Deploy inicial
start
```

### Deploy Manual

```bash
# En el servidor
cd /var/www/html-static
git pull origin main
bash deploy.sh
```

### Backups

```bash
# Ejecutar backup manual
bash /var/www/html-static/backup.sh

# Programar backup diario (agregar a crontab)
0 2 * * * /var/www/html-static/backup.sh >> /var/log/backup.log 2>&1
```

---

## 🔧 Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/carlosperalesa/carlosperalesa.github.io.git
cd carlosperalesa.github.io

# Levantar Contact API
cd api
docker-compose up -d

# Levantar Bruja Teatral
cd ../other/BT
docker-compose up -d

# Abrir index.html en navegador o usar Live Server
```

---

## 📬 Contacto

<div align="center">

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/carlosperalesa)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/carlosperalesa)
[![Website](https://img.shields.io/badge/Website-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://carlosperales.dev/)

</div>

---

<div align="center">

**Hecho con 💙 por Carlos Perales**

</div>
