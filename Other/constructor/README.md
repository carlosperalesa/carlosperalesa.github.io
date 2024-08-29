# Generador de Código HTML Gráfico

Este proyecto te permite crear código HTML de manera visual, ajustando diferentes propiedades de un elemento `div` y viendo el código generado en tiempo real.

## Estructura del Proyecto

El proyecto está organizado en los siguientes archivos y carpetas:

*   **index.html:** El archivo principal HTML que contiene la estructura de la página y las secciones para cada grupo de propiedades.
<!-- *   **css/style.css:** Archivo CSS personalizado para estilos adicionales (puedes agregar tus propios estilos aquí). -->
*   **js/**
    *   **script1.js:** Maneja la selección de elementos externos (Bootstrap, Tailwind CSS, etc.) y el título de la página.
    *   **script2.js:** Maneja la creación del contenedor Flexbox.
    *   **script3.1.js:** Maneja los estilos de borde del div (estilo, ancho, color, redondeado).
    *   **script3.2.js:** Maneja las dimensiones (ancho, alto) y los márgenes del div.
    *   **script3.3.js:** Maneja el color de fondo, sombra, visibilidad y opacidad del div.

## Secciones

### Sección 1: Elementos Externos y Título

*   Permite seleccionar qué elementos externos incluir en el `<head>` del HTML (Bootstrap, Tailwind CSS, etc.).
*   Permite ingresar el título de la página.

### Sección 2: Contenedor Flexbox

*   Permite configurar las propiedades de un contenedor Flexbox (dirección, ajuste, alineación, etc.).
*   Genera el código HTML correspondiente al contenedor Flexbox.

### Sección 3: Estilos del Div

*   **Borde:** Permite configurar el estilo, ancho, color y redondeado del borde del div.
*   **Dimensiones:** Permite configurar el ancho y alto del div.
*   **Márgenes:** Permite configurar los márgenes superior, derecho, inferior e izquierdo del div.
*   **Paddings:** Permite configurar los paddings superior, derecho, inferior e izquierdo del div.
*   **Fondo:** Permite configurar el color de fondo del div.
*   **Sombra:** Permite configurar los valores de la sombra (X, Y, difuminado, extendido) y el color de la sombra del div.
*   **Visibilidad:** Permite configurar la visibilidad del div (visible, oculto, colapsado).
*   **Opacidad:** Permite configurar la opacidad del div (valor entre 0 y 1).

## Cómo usar

1.  Abre el archivo `index.html` en tu navegador.
2.  Utiliza los controles en cada sección para configurar las propiedades del div.
3.  El código HTML generado se mostrará en la tarjeta correspondiente a cada sección.
4.  Puedes copiar el código generado haciendo clic en el botón "Copiar".

## Próximos pasos

*   Agregar más propiedades de estilo para el div (por ejemplo, fuentes, alineación de texto, etc.).
*   Permitir la creación de elementos HTML adicionales (párrafos, imágenes, etc.).
*   Implementar una interfaz gráfica más intuitiva con arrastrar y soltar.
*   Agregar la funcionalidad para guardar y cargar diseños.
