document.addEventListener('DOMContentLoaded', function () {
    const colorFondoInput = document.getElementById("colorFondo");
    const sombraXInput = document.getElementById("sombraX");
    const sombraYInput = document.getElementById("sombraY");
    const sombraDifuminadoInput = document.getElementById("sombraDifuminado");
    const sombraExtendidoInput = document.getElementById("sombraExtendido");
    const colorSombraInput = document.getElementById("colorSombra");
    const visibilidadSelect = document.getElementById("visibilidad");
    const opacidadInput = document.getElementById("opacidad");
    const codigoGeneradoElementos = document.getElementById("codigoGeneradoElementos");

    function actualizarCodigoElementos() {
        const colorFondo = colorFondoInput.value;
        const sombraX = sombraXInput.value;
        const sombraY = sombraYInput.value;
        const sombraDifuminado = sombraDifuminadoInput.value;
        const sombraExtendido = sombraExtendidoInput.value;
        const colorSombra = colorSombraInput.value;
        const visibilidad = visibilidadSelect.value;
        const opacidad = opacidadInput.value;

        let codigoHTML = `<div`;
        if (colorFondo || sombraX || sombraY || sombraDifuminado || sombraExtendido || colorSombra || visibilidad !== 'visible' || opacidad !== '1') {
            codigoHTML += ` style="`;

            if (colorFondo) {
                codigoHTML += `background-color: ${colorFondo}; `;
            }
            if (sombraX || sombraY || sombraDifuminado || sombraExtendido || colorSombra) {
                codigoHTML += `box-shadow: ${sombraX}px ${sombraY}px ${sombraDifuminado}px ${sombraExtendido}px ${colorSombra}; `;
            }
            if (visibilidad !== 'visible') {
                codigoHTML += `visibility: ${visibilidad}; `;
            }
            if (opacidad !== '1') {
                codigoHTML += `opacity: ${opacidad}; `;
            }
            codigoHTML = codigoHTML.trim();
            codigoHTML += `"`;
        }
        codigoHTML += `></div>\n`;
        codigoGeneradoElementos.textContent = codigoHTML;
    }

    // Event Listeners
    colorFondoInput.addEventListener("input", actualizarCodigoElementos);
    sombraXInput.addEventListener("input", actualizarCodigoElementos);
    sombraYInput.addEventListener("input", actualizarCodigoElementos);
    sombraDifuminadoInput.addEventListener("input", actualizarCodigoElementos);
    sombraExtendidoInput.addEventListener("input", actualizarCodigoElementos);
    colorSombraInput.addEventListener("input", actualizarCodigoElementos);
    visibilidadSelect.addEventListener("change", actualizarCodigoElementos);
    opacidadInput.addEventListener("input", actualizarCodigoElementos);
});

