#!/bin/bash

# ========================================
# Auto Fix Permissions Script
# ========================================
# Este script se ejecuta periódicamente (via cron) para asegurar
# que los permisos siempre sean correctos, sin importar qué pase

set -e

LOG_FILE="/var/log/auto-fix-permissions.log"

log_message() {
    local msg="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $msg" >> "$LOG_FILE"
}

log_message "🔒 Iniciando Auto Fix Permissions"

# Directorios críticos
MAIN_DIR="/var/www/html-static"
BT_DIR="$MAIN_DIR/other/BT"
API_DIR="$MAIN_DIR/api"

# Arreglar permisos del filesystem
log_message "📁 Arreglando permisos del filesystem..."

if [ -d "$MAIN_DIR" ]; then
    chown -R www-data:www-data "$MAIN_DIR/css" 2>/dev/null || true
    chown -R www-data:www-data "$MAIN_DIR/js" 2>/dev/null || true
    chown -R www-data:www-data "$MAIN_DIR/img" 2>/dev/null || true
    chmod -R 755 "$MAIN_DIR/css" "$MAIN_DIR/js" "$MAIN_DIR/img" 2>/dev/null || true
fi

if [ -d "$API_DIR/data" ]; then
    chmod -R 777 "$API_DIR/data" 2>/dev/null || true
fi

# Arreglar permisos dentro de contenedores
log_message "🐳 Arreglando permisos dentro de contenedores..."

# BT Container
if docker ps | grep -q bruja-teatral; then
    log_message "   Arreglando bruja-teatral..."
    docker exec bruja-teatral chmod -R 777 /app/public/uploads 2>/dev/null || log_message "   ⚠️ Error en uploads"
    docker exec bruja-teatral chmod -R 755 /app/public 2>/dev/null || log_message "   ⚠️ Error en public"
    docker exec bruja-teatral chmod -R 666 /app/database.db 2>/dev/null || log_message "   ⚠️ Error en database.db"
fi

# Main API Container
if docker ps | grep -q portfolio-contact-api; then
    log_message "   Arreglando portfolio-contact-api..."
    docker exec portfolio-contact-api chmod -R 777 /app/data 2>/dev/null || log_message "   ⚠️ Error en data"
fi

log_message "✅ Auto Fix Permissions completado"
