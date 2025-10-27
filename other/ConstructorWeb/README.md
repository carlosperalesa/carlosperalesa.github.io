
# Constructor Web

Este proyecto es una herramienta visual para crear y gestionar proyectos web de forma modular.

## 🚀 Cómo iniciar el servidor

Antes de usar el constructor, asegúrate de iniciar el servidor Flask desde la terminal:

```bash
python gestor_proyectos.py
```

Esto habilita las rutas necesarias para crear, abrir, borrar proyectos y cargar componentes visuales como la galería y el selector de color.

## 📦 Estructura del proyecto

- `gestor_proyectos.py`: Backend principal con Flask.
- `galeria.py`: Blueprint para gestión de archivos multimedia y componentes visuales.
- `main.html`: Interfaz principal del constructor.
- `estado.js`, `utils.js`, `color.js`, `galeria.js`: Módulos JavaScript para frontend modularizado.

## 🧠 Requisitos

- Python 3
- Flask
- Navegador web

## 📝 Uso

1. Inicia el servidor Flask.
2. Abre `main.html` en tu navegador.
3. Usa los botones para crear, abrir o borrar proyectos.
4. Accede a la galería y al selector de color desde el frontend.

