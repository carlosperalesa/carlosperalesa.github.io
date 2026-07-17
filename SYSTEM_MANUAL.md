# 📘 Manual del Sistema

Este documento consolida la información técnica, lógica de arquitectura, configuración de entorno y guías de despliegue para el ecosistema de **Carlos Perales Portfolio** y sus sub-proyectos.

---

## 🏗️ 1. Arquitectura del Sistema

El sistema se compone de dos entidades principales que interactúan entre sí:

```
┌─────────────────────────────────────────────────────────────┐
│                    DigitalOcean Droplet                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Nginx (443)                       │   │
│  │  • SSL/HTTPS (Let's Encrypt)                        │   │
│  │  • Proxy Reverso                                     │   │
│  └───────────┬─────────────────────────┬───────────────┘   │
│              │                         │                    │
│              ▼                         ▼                    │
│  ┌─────────────────────┐                                  │
│  │  PocketBase         │                                  │
│  │  :8090              │                                  │
│  │  • Auth + Admin UI  │                                  │
│  │  • Messages (CRUD)  │                                  │
│  └─────────────────────┘                                  │
└─────────────────────────────────────────────────────────────┘
```

### Componentes

1.  **Main System (Frontend Estático)**:
    *   Ubicado en la raíz.
    *   Simula un sistema operativo de escritorio (JS Vanilla).
    *   Se comunica con **PocketBase** para el CRUD de mensajes.
2.  **PocketBase (Backend)**:
    *   Backend para mensajes y usuarios.
    *   Admin UI disponible en `/_/`.
3.  **AutoMail (Backend Python)**:
    *   Servicio dedicado para subir `.xlsx`, ejecutar `generate_emails.py` y servir `report.log` + ZIP.
    *   Se expone por Nginx en `/automail-api/`.

---

## ⚙️ 2. Configuración de Entorno (Environment)

El sistema utiliza **variables de entorno del sistema** (`/etc/environment`) para seguridad y persistencia, evitando archivos `.env` en el repositorio.

### Variables Requeridas

| Variable | Descripción | Ejemplo / Generación |
|----------|-------------|----------------------|
| `DEPLOY_ROOT` | Ruta raíz del proyecto | `/var/www/html-static` |

### Configuración en Servidor (Ubuntu)

1.  Editar archivo: `sudo nano /etc/environment`
2.  Agregar las variables:
    ```bash
    DEPLOY_ROOT="/var/www/html-static"
    ```
3.  Reiniciar servidor o recargar variables.

---

## 🚀 3. Despliegue y Scripts

El repositorio incluye scripts automatizados en la raíz para facilitar la operación.

### Scripts Principales

*   **`start.sh`**:
*   Realiza `git pull`.
*   Instala dependencias de AutoMail.
*   Reinicia los servicios `pocketbase` y `automail` (systemd).
*   Recarga Nginx.
*   Ejecuta: `bash start.sh`

*   **`check.sh`**:
*   Realiza un diagnóstico básico del sistema (Health Check).
*   Verifica: Nginx, Permisos y Espacio en disco.
*   Ejecuta: `bash check.sh`

---

## 🧩 3.1 PocketBase (Instalacion en servidor)

Recomendado: instalar en `/opt/pocketbase` y correrlo con un usuario dedicado `pocketbase`.

```bash
# Crear usuario sin login
sudo useradd -r -s /usr/sbin/nologin pocketbase || true

# Crear directorio
sudo mkdir -p /opt/pocketbase

# Descargar binario (elige version)
PB_VERSION="0.22.12"
cd /opt/pocketbase
sudo curl -L -o pocketbase.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip"
sudo apt-get install -y unzip
sudo unzip pocketbase.zip
sudo rm pocketbase.zip

# Permisos
sudo chown -R pocketbase:pocketbase /opt/pocketbase
sudo chmod +x /opt/pocketbase/pocketbase

# Instalar servicio
sudo cp /var/www/html-static/pocketbase.service /etc/systemd/system/pocketbase.service
sudo systemctl daemon-reload
sudo systemctl enable pocketbase
sudo systemctl restart pocketbase
```

Nginx debe tener proxy para `/_/` y `/api/` apuntando a `http://127.0.0.1:8090`.

---

## 🧠 4. Lógica del Frontend (Main System)

El frontend (`js/`) está construido con JavaScript Vanilla modular.

*   **`app.js`**: Configuración global y detección de entorno.
*   **`background.js`**: Renderizado de fondo animado (Cyber Grid) usando Three.js.
*   **`skills-graph.js`**: Visualización de grafo de habilidades usando D3.js con simulación de fuerzas.
*   **`modals.js` & `drag.js`**: Gestor de ventanas y sistema de arrastre (Desktop/Mobile logic).
*   **`contact.js`**: Formulario de contacto y badge de notificaciones (PocketBase).
*   **`automail.js`**: UI del modal AutoMail, subida de archivo, polling del job y descarga del ZIP.

### AutoMail Web

AutoMail no abre una página nueva: se renderiza dentro de un modal grande desde la sección **Proyectos**.

Flujo operativo:

1. El usuario abre el modal AutoMail desde Proyectos.
2. Sube un archivo `.xlsx`.
3. El frontend hace `POST /automail-api/jobs`.
4. El backend guarda el archivo en un job temporal y ejecuta `generate_emails.py`.
5. El frontend consulta `GET /automail-api/jobs/<id>` hasta que finaliza.
6. Al terminar, se muestran el `report.log` y el enlace de descarga del ZIP.

### Servicio AutoMail

- Unit file: [automail.service](automail.service)
- Script HTTP: [other/AutoMail/server.py](other/AutoMail/server.py)
- Pipeline reutilizable: [other/AutoMail/generate_emails.py](other/AutoMail/generate_emails.py)

### Despliegue AutoMail

- Nginx publica `/automail-api/` hacia `127.0.0.1:8092`.
- `start.sh` instala `automail.service`, aplica permisos al runtime y reinstala dependencias de AutoMail.
- El runtime por job vive en `other/AutoMail/runtime/` y se usa sólo de forma temporal.

### Integración Backend
El frontend detecta si está en `localhost` o producción para apuntar a PocketBase (Puerto 8090 en local, dominio raíz en prod).

---

## 🔧 5. Troubleshooting Común

**Problema: Error de permisos en uploads/db**
*   Causa: Los contenedores no tienen permiso de escritura en el host.
*   Solución: Ejecutar `bash start.sh` nuevamente para reaplicar permisos (`chown 1000:1000`).
