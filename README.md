# 🚀 Carlos Perales | Portafolio Ecosistema Web

<div align="center">

![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-success?style=for-the-badge&logo=github)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PocketBase](https://img.shields.io/badge/PocketBase-B8DBE8?style=for-the-badge&logo=pocketbase&logoColor=black)

**Portafolio digital profesional estilo Sistema Operativo (macOS Desktop UI) con backend integrado, modales interactivos y micro-servicios.**

[🌐 **Ver Sitio en Vivo**](https://carlosperales.dev/)

</div>

---

## ✨ Características Principales

- 💻 **Sistema Operativo Web (macOS Desktop UI)** — Ventanas arrastrables, controles de ventana, minimización masiva y animaciones dinámicas con transform-origin desde el Dock.
- 🎨 **Diseño Glassmorphism & Neomorphism** — Efectos de cristal esmerilado, desenfoque suave y bordes pulidos.
- 🌌 **Cyber Grid 3D** — Fondo animado e interactivo estilo Retro Wave construido en Three.js (`js/background.js`).
- 🕸️ **Skills Graph Interactivo** — Grafo de habilidades interactivas con física de simulación visual construido en D3.js (`js/skills-graph.js`).
- 📜 **macOS 3D Cover Flow de Certificaciones** — Carrusel 3D de certificados opacos e interactivos con selección por clic/teclado y apertura directa (`js/coverflow.js`).
- 📂 **Modal de Proyectos** — Grilla de aplicaciones con tarjetas interactivas de clientes y demos.
- ✉️ **AutoMail Integrado** — Interfaz web para procesamiento de archivos `.xlsx`, generación asistida de correos y descarga de ZIP (`js/automail.js`).
- 📬 **Formulario de Contacto & Notificaciones** — Integración con PocketBase backend y badge de mensajes en tiempo real (`js/contact.js`).
- 🌗 **Modo Oscuro/Claro** — Alternador global con transiciones visuales cuidadas.
- 📱 **Totalmente Responsive** — Adaptado para dispositivos móviles, tablets y escritorios.

---

## 🛠️ Tecnologías y Stack

| Categoría | Tecnologías |
|-----------|-------------|
| **Frontend Core** | HTML5 Semantic, CSS3 Vanilla, JavaScript ES6+ (Modular) |
| **Librerías 3D & Data** | Three.js (Cyber Grid), D3.js (Force-directed Graph) |
| **Backend & Base de Datos** | PocketBase (Go/SQLite) para mensajes y usuarios |
| **Sub-Servicios Backend** | Python 3.10+, Flask, Pandas, OpenPyXL (AutoMail API) |
| **Tipografía e Iconos** | Google Fonts (Outfit, Inter), Ionicons, Font Awesome 6 |
| **Servidor Web & Proxy** | Nginx, SSL Let's Encrypt, Systemd (Ubuntu Linux) |
| **Despliegue & CI/CD** | GitHub Actions, SSH, Bash Automation |

---

## 🏗️ 1. Arquitectura del Sistema

El ecosistema en producción opera sobre un servidor VPS (DigitalOcean Droplet Linux) compuesto por Nginx como Proxy Reverso y dos servicios backend independientes:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DigitalOcean Droplet                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                            Nginx (443/80)                             │  │
│  │  • SSL / HTTPS (Let's Encrypt)                                        │  │
│  │  • Archivos Estáticos (Raíz portafolio)                               │  │
│  │  • Proxy Reverso                                                      │  │
│  └──────────┬───────────────────────────┬─────────────────────────┬──────┘  │
│             │                           │                         │         │
│             ▼                           ▼                         ▼         │
│  ┌─────────────────────┐   ┌─────────────────────────┐   ┌────────────────┐ │
│  │  PocketBase         │   │  AutoMail Backend       │   │  Backend BT    │ │
│  │  :8090              │   │  :8092                  │   │  :8091         │ │
│  │  • Messages CRUD    │   │  • Microservicio XLSX   │   │  • PocketBase  │ │
│  │  • Mail Notifications│  │  • report.log + ZIP     │   │    secundario  │ │
│  └─────────────────────┘   └─────────────────────────┘   └────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 2. Estructura del Repositorio

```
carlosperalesa.github.io/
├── 📄 index.html              # Estructura principal y modales OS
├── 📂 css/                    # Estilos divididos por componentes
│   ├── style.css              # Estilos base, Neo/Glassmorphism y Dock
│   ├── modal.css              # Sistema de ventanas y modales
│   ├── coverflow.css          # Estilos del macOS 3D Cover Flow
│   └── automail.css           # Estilos del modal interactivo AutoMail
├── 📂 js/                     # Lógica modular de cliente
│   ├── app.js                 # Detección de entorno y configuración
│   ├── background.js          # Fondo 3D (Three.js Cyber Grid)
│   ├── skills-graph.js        # Grafo de habilidades (D3.js)
│   ├── modals.js              # Manejo de aperturas, z-index y animaciones
│   ├── drag.js                # Sistema de arrastre de ventanas
│   ├── coverflow.js           # Lógica 3D Cover Flow de Certificaciones
│   ├── contact.js             # Integración PocketBase mensajes
│   └── automail.js            # Lógica web de subida y polling de AutoMail
├── 📂 img/                    # Assets del sistema
│   ├── avatar.webp            # Foto de perfil
│   ├── cards/                 # Logotipos e imágenes de proyectos
│   └── cert/                  # Certificados e insignias
├── 📂 pb_hooks/               # Hooks en JS para PocketBase (notificación email)
├── 📂 nginx/                  # Configuraciones para el servidor web Nginx
├── 📂 other/                  # Sub-proyectos adicionales
│   ├── cv/                    # Currículum e interfaz interactiva
│   ├── pokedex/               # Aplicación cliente Pokédex
│   └── AutoMail/              # ✉️ Sub-proyecto AutoMail (Backend Python)
│       └── 📄 README.md       # Documentación técnica completa de AutoMail
├── 📄 start.sh                # Script maestro de despliegue en servidor
├── 📄 check.sh                # Script de auditoría y diagnóstico del sistema
├── 📄 pocketbase.service      # Servicio Systemd para PocketBase
├── 📄 automail.service        # Servicio Systemd para AutoMail Backend
└── 📄 README.md               # Manual del sistema unificado
```

---

## ⚙️ 3. Configuración de Entorno (Environment)

El servidor utiliza variables en `/etc/environment` para evitar almacenar secretos en el código fuente.

### Variables del Sistema

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DEPLOY_ROOT` | Ruta raíz del portafolio en servidor | `/var/www/portafolio` |

Para configurar en Ubuntu:
```bash
sudo nano /etc/environment
# Agregar: DEPLOY_ROOT="/var/www/portafolio"
```

---

## 🧾 4. Inventario Backend (PocketBase)

### 1) Backend Principal
- **Instancia**: Ejecutada en el puerto `:8090`.
- **Panel de Administración**: `https://carlosperales.dev/_/`

### 2) Integración con el Formulario de Contacto
- **Creación de Mensajes**: `POST /api/collections/messages/records`
- **Contador de Mensajes (Badge Dock)**: `GET /api/collections/messages/records?page=1&perPage=1`
- **Hooks de Correo (`pb_hooks/messages_notify.pb.js`)**: Notifica por email automáticamente al recibir un nuevo mensaje.

---

## ✉️ 5. Sub-Proyecto AutoMail Web

AutoMail está integrado en el modal `#modal-automail` desde la grilla de proyectos.

- **Frontend**: `js/automail.js` (gestiona la zona de dropzone, barra de progreso, lectura del `report.log` y descarga).
- **Backend HTTP**: Servicio Python/Flask en `:8092` expuesto vía Nginx en `/automail-api/`.
- **Documentación Completa del Sub-proyecto**: Consulta [other/AutoMail/README.md](other/AutoMail/README.md).

---

## 🚀 6. Despliegue Automatizado (CI/CD)

### GitHub Actions Workflow

Cada push a la rama `main` dispara el flujo de integración continua:

```
GitHub Push → Actions Runner → SSH Deployment → Servidor DigitalOcean → start.sh
```

### GitHub Secrets Requeridos

| Secret | Descripción |
|--------|-------------|
| `DEPLOY_KEY` | Llave privada SSH para acceso al droplet |
| `DEPLOY_HOST` | Dirección IP del servidor |
| `DEPLOY_USER` | Usuario SSH (`root` / `ubuntu`) |
| `DEPLOY_DOMAIN` | `carlosperales.dev` |

---

## 🛠️ 7. Operación y Scripts del Servidor

En el servidor, los scripts de la raíz se ejecutan mediante alias o ejecución directa:

```bash
# 1. Despliegue y actualización total (git pull + reinicio servicios systemd + reload nginx):
sudo bash start.sh

# 2. Diagnóstico y Health Check:
sudo bash check.sh
```

### Instalación de PocketBase en Servidor

```bash
# Crear usuario dedicado
sudo useradd -r -s /usr/sbin/nologin pocketbase || true
sudo mkdir -p /opt/pocketbase

# Descargar e instalar binario
PB_VERSION="0.36.5"
cd /opt/pocketbase
sudo curl -L -o pocketbase.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip"
sudo apt-get install -y unzip
sudo unzip pocketbase.zip
sudo rm pocketbase.zip

# Permisos y servicio systemd
sudo chown -R pocketbase:pocketbase /opt/pocketbase
sudo chmod +x /opt/pocketbase/pocketbase
sudo cp /var/www/portafolio/pocketbase.service /etc/systemd/system/pocketbase.service
sudo systemctl daemon-reload
sudo systemctl enable --now pocketbase
```

---

## 💻 8. Desarrollo Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/carlosperalesa/carlosperalesa.github.io.git
cd carlosperalesa.github.io

# 2. Iniciar servidor local de PocketBase (opcional)
./pocketbase serve

# 3. Iniciar backend local de AutoMail (opcional)
cd other/AutoMail
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python server.py

# 4. Abrir index.html con Live Server o navegador web
```

---

## 🔧 9. Troubleshooting

- **Error de permisos en uploads / runtime:**
  Ejecutar `sudo bash start.sh` para reaplicar la propiedad de archivos (`chown -R`).
- **PocketBase no responde:**
  Verificar logs con `sudo journalctl -u pocketbase.service -n 50 -f`.
- **AutoMail backend caído:**
  Verificar logs con `sudo journalctl -u automail.service -n 50 -f`.

---

## 📌 Próximos Pasos (To-Do List)

- [ ] **Apartado "Museo / Index Antiguos":** Crear una sección o modal en el portafolio para consultar y navegar por las versiones históricas anteriores del sitio (`indexV1.html`, `indexV2.html`, etc.).

---

## 📬 Contacto

<div align="center">

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/carlosperalesa)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/carlosperalesa)
[![Website](https://img.shields.io/badge/Website-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://carlosperales.dev/)

**Hecho con 💙 por Carlos Perales**

</div>
