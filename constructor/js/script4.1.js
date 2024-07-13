document.addEventListener('DOMContentLoaded', function () {
    const tipoContenidoSelect = document.getElementById("tipoContenido");
    const opcionesContenidoDiv = document.getElementById("opcionesContenido");
    const codigoGeneradoContenido = document.getElementById("codigoGeneradoContenido");
    const btnCopiarContenido = document.getElementById("btnCopiarContenido");
    const mensajeCopiadoContenido = document.getElementById("mensajeCopiadoContenido");

    function actualizarCodigoVideo() {
        const srcVideo = document.getElementById("srcVideo").value;
        const anchoVideo = document.getElementById("anchoVideo").value;
        const altoVideo = document.getElementById("altoVideo").value;
        const autoplay = document.getElementById("autoplay").checked;
        const loop = document.getElementById("loop").checked;
        const muted = document.getElementById("muted").checked;
        const poster = document.getElementById("poster").value;
        const controls = document.getElementById("controls").checked;

        let codigoHTML = `<video`;
        if (autoplay) codigoHTML += ` autoplay`;
        if (loop) codigoHTML += ` loop`;
        if (muted) codigoHTML += ` muted`;
        if (poster) codigoHTML += ` poster="${poster}"`;
        if (controls) codigoHTML += ` controls`;
        if (anchoVideo) codigoHTML += ` width="${anchoVideo}"`;
        if (altoVideo) codigoHTML += ` height="${altoVideo}"`;
        codigoHTML += `><source src="${srcVideo}" type="video/mp4"></video>`;

        codigoGeneradoContenido.textContent = codigoHTML;
    }

    function mostrarOpcionesVideo() {
        opcionesContenidoDiv.innerHTML = `
        <label for="srcVideo">URL del video (MP4):</label>
        <input type="text" id="srcVideo" class="border rounded w-full p-2 mb-2" value="">
        <label for="anchoVideo">Ancho:</label>
        <input type="text" id="anchoVideo" class="border rounded w-full p-2 mb-2" placeholder="px o %">
        <label for="altoVideo">Alto:</label>
        <input type="text" id="altoVideo" class="border rounded w-full p-2 mb-2" placeholder="px o auto">
        <div class="flex items-center mb-2">
          <input type="checkbox" id="autoplay" class="mr-2">
          <label for="autoplay">Autoplay</label>
        </div>
        <div class="flex items-center mb-2">
          <input type="checkbox" id="loop" class="mr-2">
          <label for="loop">Loop</label>
        </div>
        <div class="flex items-center mb-2">
          <input type="checkbox" id="muted" class="mr-2">
          <label for="muted">Muted</label>
        </div>
        <label for="poster">Poster:</label>
        <input type="text" id="poster" class="border rounded w-full p-2 mb-2">
        <div class="flex items-center mb-2">
          <input type="checkbox" id="controls" class="mr-2" checked>
          <label for="controls">Controles</label>
        </div>
      `;

        // Event listeners para video
        document.getElementById("srcVideo").addEventListener("input", actualizarCodigoVideo);
        document.getElementById("anchoVideo").addEventListener("input", actualizarCodigoVideo);
        document.getElementById("altoVideo").addEventListener("input", actualizarCodigoVideo);
        document.getElementById("autoplay").addEventListener("change", actualizarCodigoVideo);
        document.getElementById("loop").addEventListener("change", actualizarCodigoVideo);
        document.getElementById("muted").addEventListener("change", actualizarCodigoVideo);
        document.getElementById("poster").addEventListener("input", actualizarCodigoVideo);
        document.getElementById("controls").addEventListener("change", actualizarCodigoVideo);

        // Actualizar el código al cargar las opciones
        actualizarCodigoVideo();
    }

    tipoContenidoSelect.addEventListener("change", mostrarOpcionesVideo);
    mostrarOpcionesVideo(); // Mostrar opciones iniciales al cargar

    btnCopiarContenido.addEventListener("click", () => {
        const codigo = codigoGeneradoContenido.textContent;
        copiarAlPortapapeles(codigo, mensajeCopiadoContenido);
    });
});

