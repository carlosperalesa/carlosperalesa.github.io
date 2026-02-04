# 📘 Manual del Sistema

Este documento consolida la información técnica, lógica de arquitectura, configuración de entorno y guías de despliegue para el ecosistema de **Carlos Perales Portfolio** y sus sub-proyectos.

---

## 🏗️ 1. Arquitectura del Sistema

El sistema se compone de tres entidades principales que interactúan entre sí:

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
│  ┌─────────────────────┐   ┌─────────────────────┐        │
│  │  Main API (Admin)   │   │  Bruja Teatral      │        │
│  │  Docker :5000       │   │  Docker :3000       │        │
│  │  • Flask            │   │  • Flask + Gunicorn │        │
│  │  • Mayordomo (Jobs) │   │  • SQLite           │        │
│  └─────────────────────┘   └─────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Componentes

1.  **Main System (Frontend Estático)**:
    *   Ubicado en la raíz.
    *   Simula un sistema operativo de escritorio (JS Vanilla).
    *   Se comunica con `Main API` para contacto y administración.
2.  **Main API (Backend & Mayordomo)**:
    *   Ubicado en `api/`.
    *   Maneja formulario de contacto, autenticación y base de datos de mensajes.
    *   **Mayordomo (`system_runner.py`)**: Ejecuta tareas privilegiadas en el host (Deploy, Backup, Check) invocadas desde el panel de admin.
3.  **Bruja Teatral (Sub-proyecto)**:
    *   Ubicado en `other/BT/`.
    *   Sistema CMS independiente para una compañía de teatro.
    *   Tiene su propio contenedor Docker y base de datos.

---

## ⚙️ 2. Configuración de Entorno (Environment)

El sistema utiliza **variables de entorno del sistema** (`/etc/environment`) para seguridad y persistencia, evitando archivos `.env` en el repositorio.

### Variables Requeridas

| Variable | Descripción | Ejemplo / Generación |
|----------|-------------|----------------------|
| `RUNNER_SECRET` | Token para comunicación API ↔ Mayordomo | `openssl rand -hex 32` |
| `SECRET_KEY` | Clave para tokens JWT | `openssl rand -hex 32` |
| `DEPLOY_ROOT` | Ruta raíz del proyecto | `/var/www/html-static` |

### Configuración en Servidor (Ubuntu)

1.  Editar archivo: `sudo nano /etc/environment`
2.  Agregar las variables:
    ```bash
    RUNNER_SECRET="<tu_hash_generado>"
    SECRET_KEY="<tu_hash_generado>"
    DEPLOY_ROOT="/var/www/html-static"
    ```
3.  Reiniciar servidor o recargar variables.

---

## 🚀 3. Despliegue y Scripts

El repositorio incluye scripts automatizados en la raíz para facilitar la operación.

### Scripts Principales

*   **`start.sh`**:
    *   Realiza `git pull`.
    *   Construye y levanta los contenedores (Main API y BT).
    *   **Corrige permisos** automáticamente para asegurar que los contenedores (que corren como usuario 1000) puedan escribir en los volúmenes.
    *   Recarga Nginx.
    *   Ejecuta: `bash start.sh`

*   **`check.sh`**:
    *   Realiza un diagnóstico completo del sistema (Health Check).
    *   Verifica: Nginx, Docker, Contenedores, Permisos, Espacio en disco y Endpoints HTTP.
    *   Ejecuta: `bash check.sh`

### Docker y Seguridad

*   Los contenedores corren como **usuario no-root (UID 1000)** para mayor seguridad.
*   El script `start.sh` se encarga de asignar el ownership correcto (`chown 1000:1000`) a las carpetas de datos persistentes (`api/data`, `other/BT/database.db`, `other/BT/public/uploads`).

---

## 🧠 4. Lógica del Frontend (Main System)

El frontend (`js/`) está construido con JavaScript Vanilla modular.

*   **`app.js`**: Configuración global y detección de entorno.
*   **`modals.js` & `drag.js`**: Gestor de ventanas y sistema de arrastre (Desktop/Mobile logic).
*   **`admin.js`**: Lógica del panel de control. Se comunica con el Mayordomo para ejecutar scripts de servidor.
*   **`contact.js`**: Formulario de contacto con encriptación y validación.

### Integración Backend
El frontend detecta si está en `localhost` o producción para apuntar a la API correcta (Puerto 5000 en local, dominio raíz en prod).

---

## 🔧 5. Troubleshooting Común

**Problema: "Check Health" se queda cargando**
*   Causa: Posible bloqueo de red al intentar consultar el dominio público desde dentro del servidor.
*   Solución: El script `check.sh` ha sido optimizado para probar primero conectividad local.

**Problema: Error de permisos en uploads/db**
*   Causa: Los contenedores no tienen permiso de escritura en el host.
*   Solución: Ejecutar `bash start.sh` nuevamente para reaplicar permisos (`chown 1000:1000`).

**Problema: "Job falló" en panel admin**
*   Causa: El `system_runner` no pudo ejecutar el script bash.
*   Solución: Revisar logs con `journalctl -u mayordomo -f` o verificar `/var/log/mayordomo.log`.
