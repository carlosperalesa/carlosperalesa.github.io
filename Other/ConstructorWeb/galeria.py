from flask import Blueprint, jsonify, request

import os

from werkzeug.utils import secure_filename


galeria = Blueprint("galeria", __name__)


# Directorio base para los proyectos
BASE_DIR = os.path.join(os.getcwd(), "proyectos")

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "mp4", "webm", "ogg"}


def allowed_file(filename):
    """Verifica si el archivo tiene una extensión permitida."""

    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@galeria.route("/listar_media", methods=["GET"])
def listar_media():
    """Lista los archivos multimedia en la carpeta src/img del proyecto activo."""

    proyecto = request.args.get("proyecto")

    if not proyecto:

        return jsonify({"success": False, "message": "Se requiere el nombre del proyecto."}), 400

    media_dir = os.path.join(BASE_DIR, proyecto, "src", "img")

    if not os.path.exists(media_dir):

        return jsonify({"success": False, "message": "La carpeta de medios no existe."}), 404

    archivos = [archivo for archivo in os.listdir(

        media_dir) if allowed_file(archivo)]

    return jsonify({"success": True, "media_files": archivos})


@galeria.route("/subir_media", methods=["POST"])
def subir_media():
    """Sube archivos multimedia a la carpeta src/img del proyecto activo."""

    proyecto = request.args.get("proyecto")

    file = request.files.get("file")

    if file and hasattr(file, 'mimetype'):

        mime_type = file.mimetype

        if not mime_type.startswith(('image/', 'video/')):

            return jsonify({'success': False, 'message': 'Tipo MIME no permitido.'}), 400

    if not proyecto or not file:

        return jsonify({"success": False, "message": "Faltan datos."}), 400

    media_dir = os.path.join(BASE_DIR, proyecto, "src", "img")

    os.makedirs(media_dir, exist_ok=True)

    filename = secure_filename(file.filename)

    file_path = os.path.join(media_dir, filename)

    # Renombrar si el archivo ya existe
    if os.path.exists(file_path):

        base, ext = os.path.splitext(filename)

        counter = 1

        while os.path.exists(file_path):

            filename = f"{base}({counter}){ext}"

            file_path = os.path.join(media_dir, filename)

            counter += 1

    try:
        file.save(file_path)
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error al guardar archivo: {str(e)}'}), 500

    return jsonify({"success": True, "message": "Archivo subido.", "filename": filename})


@galeria.route("/borrar_media", methods=["DELETE"])
def borrar_media():
    """Borra archivos seleccionados de la carpeta src/img del proyecto activo."""
    proyecto = request.args.get("proyecto")
    data = request.get_json()
    if not proyecto or not data or "files" not in data:
        return jsonify({"success": False, "message": "Faltan datos."}), 400

    media_dir = os.path.join(BASE_DIR, proyecto, "src", "img")
    borrados = []
    for filename in data["files"]:
        file_path = os.path.join(media_dir, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            borrados.append(filename)

    return jsonify({"success": True, "message": "Archivos borrados.", "deleted": borrados})


@galeria.route("/componente/galeria")
def componente_galeria():
    html = """
    <div id='galeria-modal' class='modal'>
        <h2>Galería Multimedia</h2>
        <div id='mediaContainer'></div>
        <div class='botones'>
            <button id='btnSubir'>Subir</button>
            <button id='btnBorrar'>Borrar</button>
            <button id='btnCancelar'>Cancelar</button>
        </div>
    </div>
    """
    return html


@galeria.route("/componente/color")
def componente_color():
    html = """
    <div id='color-modal' class='modal'>
        <h2>Selector de Color</h2>
        <input type='color' id='colorPicker'>
        <input type='range' id='transparencia' min='0' max='100' value='100'>
        <input type='text' id='hex' placeholder='#FFFFFF'>
        <button id='confirmarColor'>Confirmar</button>
        <button id='cancelarColor'>Cancelar</button>
    </div>
    """
    return html
