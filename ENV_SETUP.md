# Configuración de Variables de Entorno

Este sistema usa **variables de entorno del sistema** en lugar de archivos `.env` para mayor seguridad.

## Variables Requeridas

### En el Servidor (Ubuntu)

Editar `/etc/environment` (persisten entre reinicios):

```bash
sudo nano /etc/environment
```

Agregar:

```bash
# Secreto para comunicación API <-> Mayordomo (CRÍTICO)
RUNNER_SECRET="<generar_con_openssl_rand_hex_32>"

# Secret key para JWT tokens (CRÍTICO)
SECRET_KEY="<generar_con_openssl_rand_hex_32>"

# Directorio de deploy (opcional, default: /var/www/html-static)
DEPLOY_ROOT="/var/www/html-static"

# Puertos (opcional, usar defaults)
API_PORT=5000
BT_PORT=3000
RUNNER_PORT=5001

# Permisos objetivo (opcional, usar defaults)
PERM_API_DATA=777
PERM_BT_UPLOADS=777
PERM_BT_DATABASE=666
PERM_STATIC_FILES=755
```

## Generar Secretos

```bash
# Generar RUNNER_SECRET
openssl rand -hex 32

# Generar SECRET_KEY
openssl rand -hex 32
```

## Aplicar Cambios

Después de editar `/etc/environment`:

```bash
# Recargar variables de entorno
source /etc/environment

# Reiniciar servicios
systemctl restart docker
python3 /var/www/html-static/api/system_runner.py &
```

O simplemente **reiniciar el servidor**:

```bash
reboot
```

## Verificar Configuración

```bash
# Verificar que las variables están configuradas
echo $RUNNER_SECRET
echo $SECRET_KEY

# Ejecutar health check
bash /var/www/html-static/check.sh
```

El check.sh verificará automáticamente que `RUNNER_SECRET` esté configurado.

## Seguridad

✅ **Ventajas de este método:**
- No se almacenan secretos en archivos
- No se suben a GitHub
- Persisten entre reinicios
- Accesibles para todos los servicios del sistema

❌ **NO uses** `.bashrc` o `.profile` (solo cargan en sesiones interactivas).
✅ **USA** `/etc/environment` (variables globales del sistema).
