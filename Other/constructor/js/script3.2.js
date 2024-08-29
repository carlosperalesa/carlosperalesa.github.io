document.addEventListener('DOMContentLoaded', function () {
    const anchoDivInput = document.getElementById("anchoDiv");
    const altoDivInput = document.getElementById("altoDiv");
    const margenSuperiorInput = document.getElementById("margenSuperior");
    const margenDerechoInput = document.getElementById("margenDerecho");
    const margenInferiorInput = document.getElementById("margenInferior");
    const margenIzquierdoInput = document.getElementById("margenIzquierdo");
    const paddingSuperiorInput = document.getElementById("paddingSuperior");
    const paddingDerechoInput = document.getElementById("paddingDerecho");
    const paddingInferiorInput = document.getElementById("paddingInferior");
    const paddingIzquierdoInput = document.getElementById("paddingIzquierdo");
    const codigoGeneradoElementos = document.getElementById("codigoGeneradoElementos");

    function actualizarCodigoElementos() {
        const anchoDiv = anchoDivInput.value;
        const altoDiv = altoDivInput.value;
        const margenSuperior = margenSuperiorInput.value;
        const margenDerecho = margenDerechoInput.value;
        const margenInferior = margenInferiorInput.value;
        const margenIzquierdo = margenIzquierdoInput.value;
        const paddingSuperior = paddingSuperiorInput.value;
        const paddingDerecho = paddingDerechoInput.value;
        const paddingInferior = paddingInferiorInput.value;
        const paddingIzquierdo = paddingIzquierdoInput.value;

        let codigoHTML = `<div`;

        if (anchoDiv || altoDiv || margenSuperior || margenDerecho || margenInferior || margenIzquierdo || paddingSuperior || paddingDerecho || paddingInferior || paddingIzquierdo) {
            codigoHTML += ` style="`;
            if (anchoDiv) {
                codigoHTML += `width: ${anchoDiv}; `;
            }
            if (altoDiv) {
                codigoHTML += `height: ${altoDiv}; `;
            }
            if (margenSuperior) {
                codigoHTML += `margin-top: ${margenSuperior}px; `;
            }
            if (margenDerecho) {
                codigoHTML += `margin-right: ${margenDerecho}px; `;
            }
            if (margenInferior) {
                codigoHTML += `margin-bottom: ${margenInferior}px; `;
            }
            if (margenIzquierdo) {
                codigoHTML += `margin-left: ${margenIzquierdo}px; `;
            }
            if (paddingSuperior || paddingDerecho || paddingInferior || paddingIzquierdo) {
                codigoHTML += `padding: `;
                if (paddingSuperior) {
                    codigoHTML += `${paddingSuperior}px `;
                }
                if (paddingDerecho) {
                    codigoHTML += `${paddingDerecho}px `;
                }
                if (paddingInferior) {
                    codigoHTML += `${paddingInferior}px `;
                }
                if (paddingIzquierdo) {
                    codigoHTML += `${paddingIzquierdo}px `;
                }
                codigoHTML = codigoHTML.trim(); // Elimina el espacio extra al final
                codigoHTML += `;`;
            }
            codigoHTML = codigoHTML.trim(); // Elimina posibles espacios extra al final
            codigoHTML += `"`;
        }

        codigoHTML += `></div>\n`;
        codigoGeneradoElementos.textContent = codigoHTML;
    }

    // Event Listeners para todos los inputs
    anchoDivInput.addEventListener("input", actualizarCodigoElementos);
    altoDivInput.addEventListener("input", actualizarCodigoElementos);
    margenSuperiorInput.addEventListener("input", actualizarCodigoElementos);
    margenDerechoInput.addEventListener("input", actualizarCodigoElementos);
    margenInferiorInput.addEventListener("input", actualizarCodigoElementos);
    margenIzquierdoInput.addEventListener("input", actualizarCodigoElementos);
    paddingSuperiorInput.addEventListener("input", actualizarCodigoElementos);
    paddingDerechoInput.addEventListener("input", actualizarCodigoElementos);
    paddingInferiorInput.addEventListener("input", actualizarCodigoElementos);
    paddingIzquierdoInput.addEventListener("input", actualizarCodigoElementos);
});

