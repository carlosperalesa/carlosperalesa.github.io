#!/bin/bash

# ============================================
# CRON FIX PERMISSIONS (Simplificado v2.0)
# Llama a la función centralizada de start.sh
# ============================================

# Cargar variables de entorno del sistema
if [ -f /etc/environment ]; then
    set -a
    source /etc/environment
    set +a
fi

# Exportar valores por defecto si no existen
export DEPLOY_ROOT="${DEPLOY_ROOT:-/var/www/html-static}"
export PERM_API_DATA="${PERM_API_DATA:-777}"
export PERM_BT_UPLOADS="${PERM_BT_UPLOADS:-777}"
export PERM_BT_DATABASE="${PERM_BT_DATABASE:-666}"

# Cargar start.sh para reutilizar la función fix_all_permissions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/start.sh"

# Log
LOG_FILE="/var/log/check.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] [CRON] INFO: Iniciando mantenimiento automático de permisos" >> "$LOG_FILE"

# Ejecutar fix solo fase post-build (no tocar host, solo containers)
fix_all_permissions "post-build" >> "$LOG_FILE" 2>&1

echo "[$TIMESTAMP] [CRON] INFO: Mantenimiento completado" >> "$LOG_FILE"

# Rotar log si supera 10MB
LOG_SIZE=$(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
if [ "$LOG_SIZE" -gt 10485760 ]; then
    mv "$LOG_FILE" "$LOG_FILE.old"
    echo "[$TIMESTAMP] [CRON] INFO: Log rotado (tamaño: $LOG_SIZE bytes)" > "$LOG_FILE"
fi
