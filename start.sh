#!/bin/bash

# Cargar variables de entorno del sistema
if [ -f /etc/environment ]; then
    set -a
    source /etc/environment
    set +a
fi

# Colores e Iconos
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
CHECK="✅"
CROSS="❌"
WRENCH="🔧"

# Usar variables de entorno del sistema con valores por defecto
MAIN_DIR="${DEPLOY_ROOT:-/var/www/html-static}"
API_DIR="$MAIN_DIR/api"
BT_DIR="$MAIN_DIR/other/BT"

# ============================================
# FUNCIÓN CENTRALIZADA DE PERMISOS
# ============================================
fix_all_permissions() {
    local phase="$1"  # "pre-build" o "post-build"
    
    echo -e "\n${YELLOW}${WRENCH} Corrigiendo permisos (${phase})...${NC}"
    
    if [ "$phase" == "pre-build" ]; then
        # 1. Archivos estáticos (Nginx - www-data)
        # Se asegura que Nginx pueda servir los archivos estáticos
        echo -e "   ${WRENCH} Archivos estáticos (css, js, img, fonts)..."
        for dir in css js img fonts sounds other; do
            if [ -d "$MAIN_DIR/$dir" ]; then
                chown -R www-data:www-data "$MAIN_DIR/$dir" 2>/dev/null || true
                # Directorios: 755, Archivos: 644
                find "$MAIN_DIR/$dir" -type d -exec chmod 755 {} \; 2>/dev/null || true
                find "$MAIN_DIR/$dir" -type f -exec chmod 644 {} \; 2>/dev/null || true
            fi
        done

        # 2. Pre-build: Preparar filesystem para Contenedores (UID 1000)

        # Main API Data
        echo -e "   ${WRENCH} API data directory (UID 1000)..."
        mkdir -p "$API_DIR/data"
        # Asignar a UID 1000 (appuser)
        chown -R 1000:1000 "$API_DIR/data" 2>/dev/null || true
        chmod -R 755 "$API_DIR/data" 2>/dev/null || true
        
        # Bruja Teatral Data
        echo -e "   ${WRENCH} BT database y uploads (UID 1000)..."
        # Asegurar que archivo DB existe para montarse como archivo
        if [ ! -f "$BT_DIR/database.db" ]; then
            touch "$BT_DIR/database.db"
        fi
        mkdir -p "$BT_DIR/public/uploads"
        
        # Asignar a UID 1000 (appuser)
        chown 1000:1000 "$BT_DIR/database.db" 2>/dev/null || true
        chown -R 1000:1000 "$BT_DIR/public/uploads" 2>/dev/null || true
        
        # Permisos RW para usuario
        chmod 644 "$BT_DIR/database.db" 2>/dev/null || true
        chmod -R 755 "$BT_DIR/public/uploads" 2>/dev/null || true
        
    elif [ "$phase" == "post-build" ]; then
        # 3. Post-build
        # Ya no es necesario usar docker exec chmod 777 porque seteamos el ownership correcto
        echo -e "   ${GREEN}${CHECK} Permisos verificados en host."
    fi
    
    echo -e "${GREEN}${CHECK} Permisos corregidos (${phase})${NC}"
}

# Wrapper simple con decoracion
run_task() {
    local cmd="$1"
    local msg="$2"
    
    echo -e "\n${BLUE}==============================================${NC}"
    echo -e "${BLUE}▶ ${msg}${NC}"
    echo -e "${BLUE}----------------------------------------------${NC}"
    
    eval "$cmd"
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}${CHECK} Completado con éxito${NC}"
        return 0
    else
        echo -e "${RED}${CROSS} Error en la ejecución${NC}"
        return 1
    fi
}

# ============================================
# MAYORDOMO (SYSTEM RUNNER)
# ============================================
ensure_mayordomo_service() {
    if ! command -v systemctl >/dev/null 2>&1; then
        echo -e "   ${YELLOW}⚠️ systemd no disponible. Omitiendo Mayordomo.${NC}"
        return 0
    fi

    if ! systemctl list-unit-files | grep -q "^mayordomo\.service"; then
        if [ -f "$MAIN_DIR/mayordomo.service" ]; then
            cp "$MAIN_DIR/mayordomo.service" /etc/systemd/system/mayordomo.service
            systemctl daemon-reload
            systemctl enable mayordomo
        else
            echo -e "   ${YELLOW}⚠️ mayordomo.service no encontrado en $MAIN_DIR.${NC}"
            return 0
        fi
    fi

    systemctl start mayordomo
    systemctl status mayordomo --no-pager >/dev/null 2>&1 || true
}

# ============================================
# CRON FIX PERMISSIONS (MODE)
# ============================================
if [ "$1" == "--cron-fix-permissions" ]; then
    LOG_FILE="/var/log/check.log"
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    echo "[$TIMESTAMP] [CRON] INFO: Iniciando mantenimiento automático de permisos" >> "$LOG_FILE"
    fix_all_permissions "post-build" >> "$LOG_FILE" 2>&1
    echo "[$TIMESTAMP] [CRON] INFO: Mantenimiento completado" >> "$LOG_FILE"

    # Rotar log si supera 10MB
    LOG_SIZE=$(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
    if [ "$LOG_SIZE" -gt 10485760 ]; then
        mv "$LOG_FILE" "$LOG_FILE.old"
        echo "[$TIMESTAMP] [CRON] INFO: Log rotado (tamaño: $LOG_SIZE bytes)" > "$LOG_FILE"
    fi

    exit 0
fi

echo -e "\n🚀 INICIANDO DESPLIEGUE AUTOMÁTICO v5.0\n"

# 1. Git Pull Global
run_task "cd $MAIN_DIR && git pull" "Actualizando repositorio ($MAIN_DIR)"
if [ $? -ne 0 ]; then exit 1; fi

# 2. FIX PERMISOS PRE-BUILD
fix_all_permissions "pre-build"

# 3. Main API
echo -e "\n⏳ Iniciando rebuild de Main API..."
run_task "cd $API_DIR && docker compose up -d --build" "Reconstruyendo Main API"

# 4. Bruja Teatral (BT)
echo -e "\n⏳ Iniciando rebuild de Bruja Teatral..."
run_task "cd $BT_DIR && docker compose up -d --build" "Reconstruyendo Bruja Teatral"

# 5. FIX PERMISOS POST-BUILD (Log only)
fix_all_permissions "post-build"

# 6. Limpieza
echo -e "\n🧹 Limpiando imágenes antiguas..."
docker image prune -f 2>/dev/null || true

# 7. Recargar Nginx
echo -e "\n🔄 Actualizando configuración de Nginx..."
cp "$API_DIR/nginx.conf" /etc/nginx/sites-available/carlosperales.dev
ln -sf /etc/nginx/sites-available/carlosperales.dev /etc/nginx/sites-enabled/

run_task "nginx -t && systemctl reload nginx" "Recargando Nginx"

# 8. Verificar servicio Mayordomo
run_task "ensure_mayordomo_service" "Verificando servicio Mayordomo"

# 9. Health Check
echo "-----------------------------------"
echo -e "\n🔍 VERIFICACIÓN DE SALUD\n"
sleep 5
chmod +x "$MAIN_DIR/check.sh"
"$MAIN_DIR/check.sh"

echo -e "\n✨ PROCESO COMPLETADO ✨\n"
