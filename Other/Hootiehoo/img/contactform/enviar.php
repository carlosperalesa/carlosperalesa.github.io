<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Recopila los datos del formulario
    $nombre = $_POST["name"];
    $correo = $_POST["email"];
    $asunto = $_POST["subject"];
    $mensaje = $_POST["message"];

    // Dirección de correo a la que se enviará el mensaje
    $destinatario = "contacto@hootiehoo.cl";

    // Crea el mensaje de correo
    $contenido = "Nombre: $nombre\n";
    $contenido .= "Correo: $correo\n";
    $contenido .= "Asunto: $asunto\n";
    $contenido .= "Mensaje:\n$mensaje";

    // Cabeceras del correo
    $headers = "From: $correo";

    // Envía el correo
    if (mail($destinatario, "Mensaje de contacto", $contenido, $headers)) {
        echo "El mensaje se envió con éxito.";
    } else {
        echo "Hubo un problema al enviar el mensaje.";
    }
} else {
    // Si alguien intenta acceder al script directamente, redirigir o mostrar un mensaje de error.
    echo "Acceso no autorizado.";
}
?>
