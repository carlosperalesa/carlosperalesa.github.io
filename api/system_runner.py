import http.server
import json
import subprocess
import os
import threading
import time
from urllib.parse import urlparse, parse_qs
from datetime import datetime

# CONFIGURACIÓN desde variables de entorno del sistema
PORT = int(os.getenv('RUNNER_PORT', 5001))
RUNNER_SECRET = os.getenv('RUNNER_SECRET')

if not RUNNER_SECRET:
    print("❌ ERROR FATAL: Variable de entorno RUNNER_SECRET no está configurada")
    print("   Configúrala con: export RUNNER_SECRET=$(openssl rand -hex 32)")
    print("   O agrégala a /etc/environment para persistencia")
    exit(1)

WHITELIST = {
    "deploy": "/var/www/html-static/start.sh",
    "check": "/var/www/html-static/check.sh",
    "fix-bt-permissions": "/var/www/html-static/other/BT/fix-permissions.sh"
}

# Estado de los jobs ejecutándose
JOBS = {}


def execute_script_async(action, script_path, job_id):
    """Ejecuta un script en background y guarda el resultado"""
    try:
        JOBS[job_id]["status"] = "running"
        JOBS[job_id]["start_time"] = datetime.now().isoformat()

        print(f"🚀 [Job {job_id}] Ejecutando acción: {action} ({script_path})")

        # Dar permisos de ejecución
        print(f"🔐 [Job {job_id}] Dando permisos de ejecución al script...")
        chmod_result = subprocess.run(
            ["chmod", "+x", script_path],
            capture_output=True,
            text=True
        )
        if chmod_result.returncode != 0:
            print(
                f"⚠️ [Job {job_id}] Warning al dar permisos: {chmod_result.stderr}")

        # Ejecutar el script
        process = subprocess.Popen(
            ["bash", script_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        stdout, stderr = process.communicate()

        # Guardar resultado
        JOBS[job_id]["status"] = "completed" if process.returncode == 0 else "failed"
        JOBS[job_id]["output"] = stdout
        JOBS[job_id]["error"] = stderr
        JOBS[job_id]["return_code"] = process.returncode
        JOBS[job_id]["end_time"] = datetime.now().isoformat()

        print(f"✅ [Job {job_id}] Completado con código {process.returncode}")

    except Exception as e:
        JOBS[job_id]["status"] = "error"
        JOBS[job_id]["error"] = str(e)
        JOBS[job_id]["end_time"] = datetime.now().isoformat()
        print(f"❌ [Job {job_id}] Error: {e}")


class SystemRunnerHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(
            content_length) if content_length > 0 else b"{}"

        try:
            data = json.loads(post_data)
            secret = data.get('secret')
            action = data.get('action')

            if secret != RUNNER_SECRET:
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(
                    {"error": "Unauthorized"}).encode())
                return

            if action not in WHITELIST:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(
                    {"error": "Action not in whitelist"}).encode())
                return

            # Crear un job ID único
            job_id = f"{action}_{int(time.time() * 1000)}"
            script_path = WHITELIST[action]

            # Inicializar el job
            JOBS[job_id] = {
                "action": action,
                "status": "pending",
                "output": "",
                "error": "",
                "return_code": None,
                "start_time": None,
                "end_time": None
            }

            # Ejecutar en background usando threading
            thread = threading.Thread(
                target=execute_script_async,
                args=(action, script_path, job_id),
                daemon=True
            )
            thread.start()

            # Responder inmediatamente con el job ID
            response = {
                "success": True,
                "job_id": job_id,
                "message": f"Job {job_id} iniciado. Puedes verificar su estado con /status/{job_id}"
            }

            print(f"✅ [POST] Job creado: {job_id}")
            print(f"📋 [POST] Jobs activos: {list(JOBS.keys())}")

            self.send_response(202)  # 202 Accepted
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_GET(self):
        """GET para verificar el estado de un job"""
        path = self.path

        if path.startswith('/status/'):
            job_id = path.replace('/status/', '')
            print(f"🔍 [GET] Consultando estado de job: {job_id}")
            print(f"📋 [GET] Jobs disponibles: {list(JOBS.keys())}")

            if job_id not in JOBS:
                print(f"❌ [GET] Job {job_id} no encontrado")
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(
                    {"error": "Job not found"}).encode())
                return

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(JOBS[job_id]).encode())
            return

        self.send_response(404)
        self.end_headers()


if __name__ == "__main__":
    print(f"🕵️ Mayordomo (System Runner) activo en puerto {PORT}...")
    print(f"🔒 Whitelist: {list(WHITELIST.keys())}")
    # Cambiado a 0.0.0.0 para que el contenedor Docker pueda conectar con el host
    server = http.server.HTTPServer(('0.0.0.0', PORT), SystemRunnerHandler)
    server.serve_forever()
