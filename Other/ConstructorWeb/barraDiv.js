import { proyectoActivo, setProyecto } from './estado.js'; // Variable para almacenar el nombre del proyecto activo

// Función para cambiar la vista
let vistaActual = "full";
function cambiarVista() {
    if (vistaActual === "full") {
        vistaActual = "medium";
        document.body.style.maxWidth = "800px";
        document.body.style.margin = "0 auto";
    } else if (vistaActual === "medium") {
        vistaActual = "small";
        document.body.style.maxWidth = "500px";
        document.body.style.margin = "0 auto";
    } else {
        vistaActual = "full";
        document.body.style.maxWidth = "none";
        document.body.style.margin = "0";
    }
    console.log("Vista actual:", vistaActual);
}

// Alternar la visualización de bordes
function toggleGrid() {
    const iframe = document.querySelector("iframe");
    if (!iframe) {
        alert("No hay un proyecto cargado.");
        return;
    }
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    const elementos = iframeDocument.querySelectorAll("*");
    elementos.forEach(elemento => {
        if (elemento.style.border === "1px solid red") {
            elemento.style.border = ""; // Quitar bordes
        } else {
            elemento.style.border = "1px solid red"; // Mostrar bordes
        }
    });
    console.log("Bordes alternados dentro del proyecto activo.");
}
// Activar y salir del modo prueba
function activarModoPrueba() {
    document.querySelector(".barra-superior").style.display = "none";
    document.querySelector(".barra-div-principal").style.display = "none";
    document.querySelector(".barra-div-secundario").style.display = "none";
    document.querySelector(".modo-prueba").style.display = "block";
    console.log("Modo prueba activado");
}

function salirModoPrueba() {
    document.querySelector(".barra-superior").style.display = "flex";
    document.querySelector(".barra-div-principal").style.display = "flex";
    document.querySelector(".barra-div-secundario").style.display = "flex";
    document.querySelector(".modo-prueba").style.display = "none";
    console.log("Modo prueba desactivado");
}

// Alternar capas
function toggleCapas() {
    const capas = document.querySelector(".tarjeta-capas");
    capas.style.display = capas.style.display === "none" ? "block" : "none";
    console.log("Capas toggled, current display:", capas.style.display);
}

// Crear proyecto
document.getElementById("crear-proyecto").addEventListener("click", async () => {
    const nombre = prompt("Ingresa el nombre del nuevo proyecto:");
    if (!nombre || !/^[a-zA-Z0-9_-]+$/.test(nombre)) {
        alert("Nombre inválido. Usa solo letras, números, guiones o guiones bajos.");
        return;
    }
    try {
        const respuesta = await fetch("http://127.0.0.1:5000/crear_proyecto", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nombre })
        });
        const data = await respuesta.json();
        if (data.success) {
            setProyecto(nombre);
            cargarProyectoEnIframe(proyectoActivo);
            alert(`Proyecto "${nombre}" creado exitosamente.`);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error al crear proyecto:", error);
        alert("Error en la comunicación con el servidor.");
    }
});
// Abrir proyecto
document.getElementById("abrir-proyecto").addEventListener("click", async () => {
    try {
        const respuesta = await fetch("http://127.0.0.1:5000/listar_proyectos");
        const data = await respuesta.json();
        if (data.projects.length === 0) {
            alert("No hay proyectos disponibles.");
            return;
        }
        const proyecto = prompt(
            "Proyectos disponibles:\n" + data.projects.join("\n") + "\n\nIngresa el nombre del proyecto a abrir:"
        );
        if (!proyecto) {
            alert("No se seleccionó ningún proyecto.");
            return;
        }
        setProyecto(proyecto);
        cargarProyectoEnIframe(proyectoActivo);
    } catch (error) {
        console.error("Error al abrir proyecto:", error);
        alert("Error en la comunicación con el servidor.");
    }
});

// Borrar proyecto
document.getElementById("borrar-proyecto").addEventListener("click", async () => {
    try {
        const respuesta = await fetch("http://127.0.0.1:5000/listar_proyectos");
        const data = await respuesta.json();
        if (data.projects.length === 0) {
            alert("No hay proyectos disponibles para borrar.");
            return;
        }
        const proyecto = prompt(
            "Proyectos disponibles:\n" + data.projects.join("\n") + "\n\nIngresa el nombre del proyecto a borrar:"
        );
        if (!proyecto) {
            alert("No se seleccionó ningún proyecto.");
            return;
        }
        if (!confirm(`¿Estás seguro de que deseas eliminar el proyecto "${proyecto}"?`)) {
            return;
        }
        const respuestaBorrar = await fetch("http://127.0.0.1:5000/borrar_proyecto", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nombre: proyecto })
        });
        const dataBorrar = await respuestaBorrar.json();
        if (dataBorrar.success) {
            alert(`Proyecto "${proyecto}" eliminado exitosamente.`);
            if (proyectoActivo === proyecto) {
                setProyecto(null);
                limpiarIframe();
            }
        } else {
            alert(dataBorrar.message);
        }
    } catch (error) {
        console.error("Error al eliminar proyecto:", error);
        alert("Error en la comunicación con el servidor.");
    }
});
// Función para cargar el proyecto en el iframe
function cargarProyectoEnIframe(nombreProyecto) {
    let iframe = document.querySelector("iframe");
    if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.style.width = "100%";
        iframe.style.height = "500px";
        document.body.appendChild(iframe);
    }
    iframe.src = `http://127.0.0.1:5000/abrir_proyecto?nombre=${encodeURIComponent(nombreProyecto)}`;
}

// Función para limpiar el iframe
function limpiarIframe() {
    const iframe = document.querySelector("iframe");
    if (iframe) {
        iframe.src = "";
    }
}


});

// Historial de acciones
let historial = [];
let indiceHistorial = -1;

// Registrar una acción en el historial
function registrarAccion(accion) {
    if (indiceHistorial < historial.length - 1) {
        historial = historial.slice(0, indiceHistorial + 1);
    }
    historial.push(accion);
    if (historial.length > 20) {
        historial.shift(); // Mantener un máximo de 20 acciones
    }
    indiceHistorial = historial.length - 1;
    guardarLog(`Acción registrada: ${accion.tipo}`);
}

// Deshacer la última acción
function deshacer() {
    if (indiceHistorial >= 0) {
        const accion = historial[indiceHistorial];
        ejecutarAccionInversa(accion);
        indiceHistorial--;
        guardarLog(`Acción deshecha: ${accion.tipo}`);
    } else {
        alert("No hay acciones para deshacer.");
    }
}

// Rehacer la última acción deshecha
function rehacer() {
    if (indiceHistorial < historial.length - 1) {
        indiceHistorial++;
        const accion = historial[indiceHistorial];
        ejecutarAccion(accion);
        guardarLog(`Acción rehecha: ${accion.tipo}`);
    } else {
        alert("No hay acciones para rehacer.");
    }
}
// Ejecutar acción
function ejecutarAccion(accion) {
    console.log("Ejecutando acción:", accion);
    if (accion.tipo === 'crearDiv') {
        const nuevoDiv = document.createElement('div');
        nuevoDiv.id = accion.id;
        nuevoDiv.textContent = accion.contenido || 'Nuevo Div';
        document.body.appendChild(nuevoDiv);
    }
    // Agrega más tipos si es necesario
}

// Ejecutar acción inversa
function ejecutarAccionInversa(accion) {
    console.log("Ejecutando acción inversa:", accion);
    if (accion.tipo === 'crearDiv') {
        const div = document.getElementById(accion.id);
        if (div) div.remove();
    }
    // Agrega más tipos si es necesario
}

// Guardar logs en log.txt
function guardarLog(mensaje) {
    fetch(`http://127.0.0.1:5000/guardar_log?proyecto=${encodeURIComponent(proyectoActivo)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje })
    }).catch(error => console.error("Error al guardar log:", error));
}
