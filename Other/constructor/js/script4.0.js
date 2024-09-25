// Importar la función de script4.1.js
import { mostrarOpcionesVideo } from './script4.1.js';

document.addEventListener('DOMContentLoaded', function () {
    const tipoContenidoSelect = document.getElementById("tipoContenido");
    const opcionesContenidoDiv = document.getElementById("opcionesContenido");
    const codigoGeneradoContenido = document.getElementById("codigoGeneradoContenido");

    function actualizarCodigoContenido() {
        const tipoContenido = tipoContenidoSelect.value;

        // Limpiar opciones y código generado antes de mostrar nuevas opciones
        opcionesContenidoDiv.innerHTML = "";
        codigoGeneradoContenido.textContent = "";

        if (tipoContenido === "video") {
            mostrarOpcionesVideo(); // Llama a la función para mostrar opciones de video
        }
    }

    // Event listener para el cambio de opción en el desplegable
    tipoContenidoSelect.addEventListener("change", actualizarCodigoContenido);

    // Inicializar con "Ninguno" seleccionado y tarjeta vacía
    actualizarCodigoContenido();
});
