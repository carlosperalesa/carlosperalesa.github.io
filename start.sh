#!/bin/bash

# Colores e Iconos
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color
CHECK="✅"
CROSS="❌"

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

echo -e "\n🚀 INICIANDO DESPLIEGUE AUTOMÁTICO v3.2\n"

# 1. Rutas
MAIN_DIR="/var/www/html-static"
API_DIR="$MAIN_DIR/api"
BT_DIR="$MAIN_DIR/other/BT"

# 2. Git Pull Global
run_task "cd $MAIN_DIR && git pull" "Actualizando repositorio ($MAIN_DIR)"
if [ $? -ne 0 ]; then exit 1; fi

# 3. Main API
echo -e "\n⏳ Iniciando rebuild de Main API..."
# Fix permissions for Main API (running as user 1000)
mkdir -p "$API_DIR/data"
chown -R 1000:1000 "$API_DIR/data" 2>/dev/null || true
chmod -R 775 "$API_DIR/data" 2>/dev/null || true

run_task "cd $API_DIR && docker compose up -d --build" "Reconstruyendo Main API"

# 4. Bruja Teatral (BT)
echo -e "\n⏳ Iniciando rebuild de Bruja Teatral..."
# Ensure essential files/dirs exist
touch "$BT_DIR/database.db"
mkdir -p "$BT_DIR/public/uploads"

# EXTREME PERM FIX: Recursively chown the directory to 33:33 (www-data)
# This ensures SQLite can create journal files and manage the DB properly
echo -e "   🔧 Ajustando permisos recursivos para usuario 33 (www-data)..."
chown -R 33:33 "$BT_DIR" 2>/dev/null || true
chmod -R 775 "$BT_DIR/public/uploads" 2>/dev/null || true

run_task "cd $BT_DIR && docker compose up -d --build" "Reconstruyendo Bruja Teatral"

# 5. Limpieza
echo -e "\n🧹 Limpiando imágenes antiguas..."
docker image prune -f 2>/dev/null || true

# 6. Recargar Nginx (Importante para cambios de config)
echo -e "\n🔄 Actualizando configuración de Nginx..."
cp "$API_DIR/nginx.conf" /etc/nginx/sites-available/carlosperales.dev
ln -sf /etc/nginx/sites-available/carlosperales.dev /etc/nginx/sites-enabled/

run_task "nginx -t && systemctl reload nginx" "Recargando Nginx"

echo "-----------------------------------"
echo -e "\n🔍 VERIFICACIÓN DE SALUD\n"
sleep 5
chmod +x "$MAIN_DIR/check.sh"
"$MAIN_DIR/check.sh"

echo -e "\n✨ PROCESO COMPLETADO ✨\n"
