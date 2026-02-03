#!/bin/bash

# ========================================
# Cron Job: Auto Fix Permissions
# ========================================
# Ejecuta cada 1 minuto para garantizar que los permisos siempre sean correctos

set -e

MAIN_DIR="/var/www/html-static"
BT_DIR="$MAIN_DIR/other/BT"
API_DIR="$MAIN_DIR/api"

# Log file
LOG_FILE="/var/log/fix-permissions.log"
MAX_LOG_SIZE=10485760  # 10MB

# Función para loguear
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Rotar log si es muy grande
if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE") -gt $MAX_LOG_SIZE ]; then
    mv "$LOG_FILE" "$LOG_FILE.old"
fi

log "🔧 INICIANDO FIX PERMISSIONS CRON"

# ============================================
# 1. MAIN DIR - Archivos estáticos
# ============================================
if [ -d "$MAIN_DIR" ]; then
    # Directorios de assets
    for dir in css js img fonts; do
        if [ -d "$MAIN_DIR/$dir" ]; then
            find "$MAIN_DIR/$dir" -type d -exec chmod 755 {} \; 2>/dev/null || true
            find "$MAIN_DIR/$dir" -type f -exec chmod 644 {} \; 2>/dev/null || true
        fi
    done
    
    # Scripts
    find "$MAIN_DIR" -maxdepth 1 -type f -name "*.sh" -exec chmod 755 {} \; 2>/dev/null || true
fi

# ============================================
# 2. BT - Container uploads
# ============================================
if docker ps 2>/dev/null | grep -q bruja-teatral; then
    log "🐳 Arreglando permisos en bruja-teatral..."
    docker exec bruja-teatral chmod -R 777 /app/public/uploads 2>/dev/null || log "   ⚠️ Error en uploads"
    docker exec bruja-teatral chmod -R 755 /app/public 2>/dev/null || log "   ⚠️ Error en public"
    docker exec bruja-teatral chmod 666 /app/database.db 2>/dev/null || log "   ⚠️ Error en database.db"
fi

# ============================================
# 3. API - Data folder
# ============================================
if docker ps 2>/dev/null | grep -q portfolio-contact-api; then
    log "🐳 Arreglando permisos en portfolio-contact-api..."
    docker exec portfolio-contact-api chmod -R 777 /app/data 2>/dev/null || log "   ⚠️ Error en data"
fi

log "✅ FIX PERMISSIONS COMPLETADO"
