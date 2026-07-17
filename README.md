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
- ✉️ **AutoMail en modal** — Carga de XLSX, ejecución de correos, vista de `report.log` y descarga del ZIP desde Proyectos

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
├── 📂 other/              # Proyectos adicionales
│   ├── cv/                # Currículum en diferentes formatos
│   ├── pokedex/           # Proyecto Pokédex
│   └── AutoMail/          # Generador web de correos desde XLSX
├── 📄 start.sh            # Deploy y recarga servicios
├── 📄 check.sh            # Health check del sistema
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
│  ┌─────────────────────┐                                  │
│  │  PocketBase         │                                  │
│  │  :8090              │                                  │
│  │  • Auth + Admin UI  │                                  │
│  │  • Messages (CRUD)  │                                  │
│  │  • REST API         │                                  │
│  └─────────────────────┘                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧾 Inventario Backend Actual (PocketBase)

### 1) Backend activo

- **PocketBase** sirve como backend para CRUD de usuarios y mensajes.
- **Admin UI**: `https://carlosperales.dev/_/` (acceso a gestion de usuarios y mensajes).

### 2) Consumo desde el frontend

**Formulario de contacto**
- `POST /api/collections/messages/records` (crea mensaje)

**Badge de notificaciones**
- `GET /api/collections/messages/records?page=1&perPage=1` (usa `totalItems` para contar)

Implementacion en [js/contact.js](js/contact.js) y base URL en [js/app.js](js/app.js).

### 3) Colecciones y reglas minimas

**Coleccion `messages`**
- Campos sugeridos: `name`, `phone`, `email`, `subject`, `message`
- Reglas publicas necesarias:
	- Create rule: `@request.auth.id != "" || @request.auth.id = ""`
	- List rule: `@request.auth.id != "" || @request.auth.id = ""` (para el badge)

> El CRUD de usuarios se gestiona desde el Admin UI de PocketBase.

---

## ✉️ AutoMail Web

AutoMail está integrado como un modal grande dentro de la sección **Proyectos**.

- Permite subir un archivo `.xlsx`.
- Ejecuta `other/AutoMail/generate_emails.py` en el servidor.
- Muestra el contenido de `report.log` dentro del modal.
- Expone la descarga de `mail_generados.zip` al finalizar.

Endpoints del servicio:

- `GET /automail-api/health`
- `POST /automail-api/jobs`
- `GET /automail-api/jobs/<id>`
- `GET /automail-api/jobs/<id>/report`
- `GET /automail-api/jobs/<id>/download`

El backend de AutoMail vive en Python/Flask y corre separado de PocketBase.

---

## 🚀 Deployment

### Deployment Automático (CI/CD)

El sitio se despliega automáticamente con cada push a `main`:

```
GitHub Push → GitHub Actions → SSH → DigitalOcean → Deploy
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
# Deploy completo (reinicia PocketBase y AutoMail via systemd)
start

# Health check del sistema
check
```

### Setup Inicial del Servidor

Requisitos: Ubuntu 22.04+, Nginx, Certbot, PocketBase

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

### PocketBase (instalacion sugerida)

```bash
sudo useradd -r -s /usr/sbin/nologin pocketbase || true
sudo mkdir -p /opt/pocketbase

PB_VERSION="0.22.12"
cd /opt/pocketbase
sudo curl -L -o pocketbase.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip"
sudo apt-get install -y unzip
sudo unzip pocketbase.zip
sudo rm pocketbase.zip

sudo chown -R pocketbase:pocketbase /opt/pocketbase
sudo chmod +x /opt/pocketbase/pocketbase

sudo cp /var/www/html-static/pocketbase.service /etc/systemd/system/pocketbase.service
sudo systemctl daemon-reload
sudo systemctl enable pocketbase
sudo systemctl restart pocketbase
```

### Deploy Manual

```bash
# En el servidor
cd /var/www/html-static
git pull origin main
sudo bash start.sh
```

---

## 🔧 Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/carlosperalesa/carlosperalesa.github.io.git
cd carlosperalesa.github.io

# Levantar PocketBase (default :8090)
# Descarga binario desde https://pocketbase.io/docs/
./pocketbase serve

# Admin UI (crear coleccion messages)
# http://127.0.0.1:8090/_/

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
