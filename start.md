# Documentación de `start.sh`

El script `start.sh` es la herramienta principal para desplegar y actualizar todo el ecosistema de **CarlosPerales.dev** y sus subsistemas (como **Bruja Teatral**).

## Flujo de Ejecución

El script sigue un orden lógico estricto para asegurar un despliegue sin interrupciones:

### 1. Actualización de Código (`Git Pull`)
*   Se mueve al directorio raíz del proyecto.
*   Ejecuta `git pull` para descargar los últimos cambios desde el repositorio remoto.

### 2. Despliegue de Servicios (`Deploy`)
Utiliza Docker Compose para construir y levantar los contenedores.
*   **Main API**: Reconstruye y levanta el servicio ubicado en `api/`.
*   **Bruja Teatral**: Reconstruye y levanta el subsistema ubicado en `other/BT/`.
*   *Nota*: Se utiliza la bandera `--build` para asegurar que cualquier cambio en el código o dependencias se refleje en las imágenes Docker.

### 3. Ajuste de Permisos (`Permissions`)
Una vez que los contenedores están definidos, el script corrige los permisos del sistema de archivos para garantizar que tanto el servidor web como los contenedores puedan leer/escribir donde corresponde.
*   **Archivos Estáticos (Web)**: Se asignan al usuario `www-data` (Nginx) para que puedan ser servidos públicamente.
*   **Volúmenes de Docker (Main API & BT)**: Se asignan al **UID 1000**.
    *   Esto es crítico porque los contenedores corren como un usuario no-root (UID 1000) por seguridad.
    *   Se asegura que `other/BT/database.db` y `other/BT/public/uploads` tengan los dueños correctos para evitar errores de "Permission denied" o "Read-only database".

### 4. Configuración del Sistema (`System Config`)
Aplica configuraciones a nivel de servidor (Host).
*   **Nginx**: Copia el archivo `api/nginx.conf` a `/etc/nginx/sites-available/` y recarga el servicio Nginx. Esto aplica cambios en rutas, SSL, o caché.
*   **Mayordomo**: Instala, habilita y reinicia el servicio `mayordomo.service` (Systemd), encargado de tareas privilegiadas en segundo plano.

### 5. Limpieza
*   Ejecuta `docker image prune` para eliminar imágenes antiguas y liberar espacio en disco.

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
