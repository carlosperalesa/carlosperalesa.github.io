document.addEventListener('DOMContentLoaded', function () {
    const codigoGeneradoFlex = document.getElementById("codigoGeneradoFlex");
    const direccionFlexSelect = document.getElementById("direccionFlex");
    const flexWrapSelect = document.getElementById("flexWrap");
    const alineacionHorizontalSelect = document.getElementById("alineacionHorizontal");
    const alineacionVerticalSelect = document.getElementById("alineacionVertical");
    const btnCopiarFlex = document.getElementById("btnCopiarFlex");
    const mensajeCopiadoFlex = document.getElementById("mensajeCopiadoFlex");

    // Función para actualizar el código generado (para el contenedor Flexbox)
    function actualizarCodigoFlex() {
        const direccion = direccionFlexSelect.value;
        const flexWrap = flexWrapSelect.value;
        const alineacionHorizontal = alineacionHorizontalSelect.value;
        const alineacionVertical = alineacionVerticalSelect.value;

        let clases = "container";
        if (direccion) clases += ` flex-${direccion}`;
        if (flexWrap) clases += ` flex-${flexWrap}`;
        if (alineacionHorizontal) clases += ` justify-${alineacionHorizontal}`;
        if (alineacionVertical) clases += ` items-${alineacionVertical}`;

        let codigoHTML = `<div class="${clases}"></div>\n`;
        codigoGeneradoFlex.textContent = codigoHTML;
    }

    // Event listeners para los selects
    direccionFlexSelect.addEventListener("change", actualizarCodigoFlex);
    flexWrapSelect.addEventListener("change", actualizarCodigoFlex);
    alineacionHorizontalSelect.addEventListener("change", actualizarCodigoFlex);
    alineacionVerticalSelect.addEventListener("change", actualizarCodigoFlex);

    // Llamar a actualizarCodigoFlex al cargar la página para generar el código inicial
    actualizarCodigoFlex();

    // Evento de clic para copiar el código (del contenedor Flexbox)
    btnCopiarFlex.addEventListener("click", () => {
        const codigo = tarjetaCodigoFlex.querySelector("pre").textContent;
        copiarAlPortapapeles(codigo, mensajeCopiadoFlex);
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
