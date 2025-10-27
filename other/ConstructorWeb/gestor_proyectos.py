from galeria import galeria
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
import shutil

app = Flask(__name__)
CORS(app)  # Habilita CORS para todas las rutas
app.logger.setLevel("DEBUG")  # Habilitar logs de debug
app.register_blueprint(galeria)

# Directorio base para los proyectos
PROJECTS_DIR = os.path.join(os.getcwd(), 'proyectos')


def create_project_structure(project_name):
    app.logger.debug("Iniciando la creación del proyecto: %s", project_name)
    project_path = os.path.join(PROJECTS_DIR, project_name)

    if os.path.exists(project_path):
        app.logger.debug("El proyecto %s ya existe.", project_name)
        return False, "El proyecto ya existe."

    try:
        # Crear estructura de carpetas
        os.makedirs(os.path.join(project_path, "src", "img"), exist_ok=True)
        os.makedirs(os.path.join(project_path, "src", "styles"), exist_ok=True)
        os.makedirs(os.path.join(
            project_path, "src", "scripts"), exist_ok=True)
        os.makedirs(os.path.join(project_path, "src", "temp"), exist_ok=True)

        # Crear index.html
        index_path = os.path.join(project_path, "index.html")
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(
                f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{project_name}</title>
</head>
<body>
    <h1>Proyecto {project_name}</h1>
</body>
</html>"""
            )
        app.logger.debug("Archivo index.html creado en %s", index_path)
# Crear base.json
        base_path = os.path.join(project_path, "base.json")
        with open(base_path, "w", encoding="utf-8") as f:
            json.dump({"nombre": project_name}, f,
                      ensure_ascii=False, indent=4)
        app.logger.debug("Archivo base.json creado en %s", base_path)

        # Crear archivo componentes.json dentro de temp
        componentes_path = os.path.join(
            project_path, "src", "temp", "componentes.json")
        with open(componentes_path, "w", encoding="utf-8") as f:
            json.dump({}, f, ensure_ascii=False, indent=4)
        app.logger.debug(
            "Archivo componentes.json creado en %s", componentes_path)

        # Crear styles.css dentro de src/styles
        styles_path = os.path.join(project_path, "src", "styles", "styles.css")
        with open(styles_path, "w", encoding="utf-8") as f:
            f.write(
                f"""/* Estilos base para el proyecto {project_name} */
body {{
    font-family: Arial, sans-serif;
}}"""
            )
        app.logger.debug("Archivo styles.css creado en %s", styles_path)

        # Crear script.js dentro de src/scripts
        script_path = os.path.join(project_path, "src", "scripts", "script.js")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(
                f"""// Script base para el proyecto {project_name}
console.log('Proyecto {project_name} cargado');"""
            )
        app.logger.debug("Archivo script.js creado en %s", script_path)

        return True, "Proyecto creado exitosamente."
    except Exception as e:
        app.logger.error("Error creando el proyecto: %s", e)
        return False, f"Error: {str(e)}"


@app.route("/crear_proyecto", methods=["POST"])
def crear_proyecto_route():
    data = request.get_json()
    app.logger.debug("Datos recibidos en crear_proyecto: %s", data)
    project_name = data.get("nombre")

    if not project_name:
        app.logger.debug("No se proporcionó el nombre del proyecto.")
        return jsonify({"success": False, "message": "El nombre del proyecto es requerido."}), 400

    success, message = create_project_structure(project_name)
    app.logger.debug("Resultado crear proyecto: %s, %s", success, message)
    status = 200 if success else 400
    return jsonify({"success": success, "message": message}), status


@app.route("/listar_proyectos", methods=["GET"])
def listar_proyectos():
    if not os.path.exists(PROJECTS_DIR):
        os.makedirs(PROJECTS_DIR, exist_ok=True)

    projects = [d for d in os.listdir(PROJECTS_DIR) if os.path.isdir(
        os.path.join(PROJECTS_DIR, d))]
    app.logger.debug("Proyectos listados: %s", projects)
    return jsonify({"projects": projects})


@app.route("/abrir_proyecto", methods=["GET"])
def abrir_proyecto():
    project_name = request.args.get("nombre")
    app.logger.debug("Abrir proyecto: %s", project_name)

    if not project_name:
        return jsonify({"success": False, "message": "El nombre del proyecto es requerido."}), 400

    project_path = os.path.join(PROJECTS_DIR, project_name)
    index_file = os.path.join(project_path, "index.html")

    if not os.path.exists(index_file):
        app.logger.debug("index.html no existe en %s", project_path)
        return jsonify({"success": False, "message": "El proyecto no existe o no tiene index.html."}), 404

    return send_file(index_file)
