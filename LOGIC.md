# 🧠 Lógica del Sitio & Arquitectura Frontend

Este documento detalla la estructura lógica del frontend del portafolio. El sitio utiliza una arquitectura basada en módulos de JavaScript Vanilla para mantener el código limpio, ligero y sin dependencias de frameworks pesados (como React o Vue), logrando una alta performance.

## 1. Núcleo (`js/app.js`)
El archivo `app.js` actúa como el **Single Source of Truth** para la configuración global.
- **Configuración de API (`App.api`)**: Centraliza las URLs para desarrollo local (`localhost`) vs producción (`window.location.origin`).
- **Detección de Dispositivo (`App.isMobile`)**: Lógica centralizada para determinar si el usuario está en móvil (<= 768px).
- **Inicialización**: Bootstrap del sitio.

## 2. Sistema de Ventanas (`js/modals.js` & `js/drag.js`)
El sitio simula un sistema operativo de escritorio (Desktop metaphor).
- **Gestión de Estado (`modals.js`)**:
  - Controla qué modales están abiertos (`openModals` array).
  - Maneja el `zIndex` dinámico para traer ventanas al frente al hacer click.
  - Implementa la lógica de "minimizar todo".
- **Sistema de Arrastre (`drag.js`)**:
  - Permite mover las ventanas en Desktop.
  - **Móvil**: Restringe el arrastre solo a modales pequeños de confirmación (WhatsApp, Teléfono) para mejorar la UX.
  - Utiliza `touch-action: none` en CSS para evitar conflicto con el scroll del navegador.

## 3. Integraciones de Backend
Aunque es un sitio estático, se comunica con microservicios backend:
- **Formulario de Contacto (`js/contact.js`)**: Envía datos a `/api/contact`. Maneja validación frontend y feedback visual (Toasts).
- **Panel de Administración (`js/admin.js`)**:
  - Autenticación vía `/api/login` (JWT/Session).
  - Gestión de mensajes recibidos.
  - **Seguridad**: Las credenciales NO se almacenan en el frontend.

## 4. UI/UX Components
- **Tiempo Real (`js/time.js`)**: Reloj sincronizado usando `Intl.DateTimeFormat` para formateo local correcto.
- **Sonido (`js/sound.js`)**: Feedback auditivo sutil al interactuar con elementos (tap sounds).
- **Notificaciones (`js/toast.js`)**: Sistema de alertas no intrusivas.

## 5. Estructura de Directorios
```
/
├── index.html        # Entry point
├── css/
│   └── style.css     # Estilos globales + Glassmorphism + Responsive rules
├── js/
│   ├── app.js        # Core Logic (Config)
│   ├── modals.js     # Window Manager
│   ├── drag.js       # Drag & Drop engine
│   ├── contact.js    # Form Logic
│   └── ...           # Módulos específicos
└── other/            # Sub-proyectos independientes
```

## 6. Flujo de Carga
1. `index.html` carga `style.css`.
2. Scripts se cargan al final del body.
3. `App.init()` se dispara en `DOMContentLoaded`.
4. Módulos individuales se inicializan y suscriben a eventos.
