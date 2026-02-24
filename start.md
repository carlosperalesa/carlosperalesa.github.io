# Documentación de `start.sh`

El script `start.sh` es la herramienta principal para desplegar y actualizar el sistema de **CarlosPerales.dev**.

## Flujo de Ejecución

El script sigue un orden lógico estricto para asegurar un despliegue sin interrupciones:

### 1. Actualización de Código (`Git Pull`)
*   Se mueve al directorio raíz del proyecto.
*   Ejecuta `git pull` para descargar los últimos cambios desde el repositorio remoto.

### 2. Despliegue de Servicios (`Deploy`)
Gestiona el servicio de PocketBase via systemd (`pocketbase`).

Si el binario no esta instalado, usa:

```bash
sudo useradd -r -s /usr/sbin/nologin pocketbase || true
sudo mkdir -p /opt/pocketbase
PB_VERSION="0.22.12"
cd /opt/pocketbase
sudo curl -L -o pocketbase.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip"
sudo apt-get install -y unzip
sudo unzip pocketbase.zip
sudo rm pocketbase.zip
sudo chown -R pocketbase:pocketbase /opt/pocketbase
sudo chmod +x /opt/pocketbase/pocketbase
sudo cp /var/www/html-static/pocketbase.service /etc/systemd/system/pocketbase.service
sudo systemctl daemon-reload
sudo systemctl enable pocketbase
sudo systemctl restart pocketbase
```

### 3. Ajuste de Permisos (`Permissions`)
Una vez que los contenedores están definidos, el script corrige los permisos del sistema de archivos para garantizar que tanto el servidor web como los contenedores puedan leer/escribir donde corresponde.
*   **Archivos Estáticos (Web)**: Se asignan al usuario `www-data` (Nginx) para que puedan ser servidos públicamente.

### 4. Configuración del Sistema (`System Config`)
Aplica configuraciones a nivel de servidor (Host).
*   **Nginx**: Valida configuración y recarga el servicio Nginx.

## Uso

Simplemente ejecutar desde la raíz del proyecto:

```bash
./start.sh
```

El script está diseñado para ser idempotente: puede ejecutarse múltiples veces sin causar daños, simplemente reaplicará el estado deseado.

## Verificación
El script ya no ejecuta automáticamente el chequeo de salud. Para verificar el estado del sistema después de un despliegue, ejecute manualmente:

```bash
./check.sh
```
