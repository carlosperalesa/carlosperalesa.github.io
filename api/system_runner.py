import http.server
import json
import subprocess
import os
from urllib.parse import urlparse, parse_qs

# CONFIGURACIÓN
PORT = 5001
# IMPORTANTE: Cambia esto por el mismo valor que pongas en el .env de la API
RUNNER_SECRET = "secreto_interno_para_comandos_98765"
WHITELIST = {
    "deploy": "/var/www/html-static/start.sh",
    "check": "/var/www/html-static/check.sh",
    "backup": "/var/www/html-static/backup.sh",
    "restore": "/var/www/html-static/restore.sh"
}

class SystemRunnerHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        # Eliminamos la restricción de IP de origen para permitir que el contenedor Docker conecte,
        # confiando en el RUNNER_SECRET y en que el puerto 5001 no esté abierto al mundo.
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data)
            secret = data.get('secret')
            action = data.get('action')

            if secret != RUNNER_SECRET:
                self.send_response(401)
                self.end_headers()
                self.wfile.write(b"Unauthorized: Invalid Secret")
                return

            if action not in WHITELIST:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"Bad Request: Action not in whitelist")
                return

            # Ejecutar el comando
            script_path = WHITELIST[action]
            print(f"🚀 Ejecutando acción: {action} ({script_path})")
            
            # Usamos Popen para capturar salida en vivo o al menos no bloquear todo si tarda
            process = subprocess.Popen(
                ["bash", script_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            stdout, stderr = process.communicate()
            
            response = {
                "success": process.returncode == 0,
                "output": stdout,
                "error": stderr,
                "return_code": process.returncode
            }

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())

        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode())

if __name__ == "__main__":
    print(f"🕵️ Mayordomo (System Runner) activo en puerto {PORT}...")
    print(f"🔒 Whitelist: {list(WHITELIST.keys())}")
    # Cambiado a 0.0.0.0 para que el contenedor Docker pueda conectar con el host
    server = http.server.HTTPServer(('0.0.0.0', PORT), SystemRunnerHandler)
    server.serve_forever()
