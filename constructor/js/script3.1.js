document.addEventListener('DOMContentLoaded', function () {
    const estiloBordeSelect = document.getElementById("estiloBorde");
    const anchoBordeInput = document.getElementById("anchoBorde");
    const colorBordeInput = document.getElementById("colorBorde");
    const redondeadoBordeInput = document.getElementById("redondeadoBorde");
    const codigoGeneradoElementos = document.getElementById("codigoGeneradoElementos");
    const btnCopiarElementos = document.getElementById("btnCopiarElementos");
    const mensajeCopiadoElementos = document.getElementById("mensajeCopiadoElementos");

    // Función para actualizar el código generado (para el div)
    function actualizarCodigoElementos() {
        const estiloBorde = estiloBordeSelect.value;
        let anchoBorde = anchoBordeInput.value;
        const colorBorde = colorBordeInput.value;
        let redondeadoBorde = redondeadoBordeInput.value;

        // Agregar "px" si el valor es numérico y no tiene unidades
        if (!isNaN(anchoBorde) && !anchoBorde.includes("px")) {
            anchoBorde += "px";
        }
        if (!isNaN(redondeadoBorde) && !redondeadoBorde.includes("px")) {
            redondeadoBorde += "px";
        }

        let codigoHTML = `<div`;
        if (estiloBorde && estiloBorde !== 'none') {
            codigoHTML += ` style="border-style: ${estiloBorde};`;
            if (anchoBorde) {
                codigoHTML += ` border-width: ${anchoBorde};`;
            }
            if (colorBorde) {
                codigoHTML += ` border-color: ${colorBorde};`;
            }
            if (redondeadoBorde) {
                codigoHTML += ` border-radius: ${redondeadoBorde};`;
            }
            codigoHTML += `"`;
        }
        codigoHTML += `></div>\n`;
        codigoGeneradoElementos.textContent = codigoHTML;
    }

    // Llamar a actualizarCodigoElementos al cargar la página y al cambiar cualquier input
    actualizarCodigoElementos();
    estiloBordeSelect.addEventListener("change", actualizarCodigoElementos);
    anchoBordeInput.addEventListener("input", actualizarCodigoElementos);
    colorBordeInput.addEventListener("input", actualizarCodigoElementos);
    redondeadoBordeInput.addEventListener("input", actualizarCodigoElementos);

    // Evento de clic para copiar el código (de los elementos Div)
    btnCopiarElementos.addEventListener("click", () => {
        const codigo = codigoGeneradoElementos.textContent;
        copiarAlPortapapeles(codigo, mensajeCopiadoElementos); // Llama a tu función copiarAlPortapapeles
    });
});
