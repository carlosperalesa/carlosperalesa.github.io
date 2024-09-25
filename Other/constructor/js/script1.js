document.addEventListener('DOMContentLoaded', function () {
    const listaElementos = document.getElementById("listaElementos");
    const codigoGenerado = document.getElementById("codigoGenerado");
    const btnCopiar = document.getElementById("btnCopiar");
    const mensajeCopiado = document.getElementById("mensajeCopiado");
    const tarjetaCodigo = document.getElementById("tarjetaCodigo");
    const inputTitulo = document.getElementById("inputTitulo");
    const btnAgregarTitulo = document.getElementById("btnAgregarTitulo");

    const elementos = {
        "Bootstrap": '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">',
        "Tailwind CSS": '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">',
        "Ionicons": '<script type="module" src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"></script><script nomodule src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"></script>',
        "FontAwesome": '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">',
        "Google Fonts": '<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">',
        "CSS Personalizado": '<link rel="stylesheet" href="./css/style.css">'
    };

    // Código base inicial en el pre (HEAD)
    codigoGenerado.textContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Carlos Perales Ayala">
</head>`;

    // Generar la lista de elementos (HEAD)
    for (const [nombre, codigo] of Object.entries(elementos)) {
        const li = document.createElement("li");
        li.classList.add("list-group-item");

        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = nombre;
        input.addEventListener("change", actualizarCodigo);
        input.classList.add("mr-2");

        const label = document.createElement("label");
        label.htmlFor = nombre;
        label.textContent = nombre;

        li.appendChild(input);
        li.appendChild(label);
        listaElementos.appendChild(li);
    }

    // Función para actualizar el código generado (HEAD)
    function actualizarCodigo(titulo = "") {
        const codigosSeleccionados = [];
        for (const [nombre, codigo] of Object.entries(elementos)) {
            const checkbox = document.getElementById(nombre);
            if (checkbox.checked) {
                codigosSeleccionados.push(codigo);
            }
        }

        codigoGenerado.textContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Carlos Perales Ayala">
    <title>${titulo}</title> 
    ${codigosSeleccionados.join("\n    ")}
</head>`;
    }

    // Evento de tecla en el input de título
    inputTitulo.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            actualizarCodigo(inputTitulo.value);
        }
    });

    // Evento de clic para copiar el código (del <head>)
    btnCopiar.addEventListener("click", () => {
        const codigo = tarjetaCodigo.querySelector("pre").textContent;
        copiarAlPortapapeles(codigo, mensajeCopiado);
    });

    // Función para copiar al portapapeles (reutilizable)
    function copiarAlPortapapeles(codigo, mensajeElemento) {
        navigator.clipboard.writeText(codigo)
            .then(() => {
                mensajeElemento.classList.remove("hidden");
                setTimeout(() => {
                    mensajeElemento.classList.add("hidden");
                }, 3000);
            })
            .catch(err => {
                console.error('Error al copiar al portapapeles:', err);
            });
    }

});
