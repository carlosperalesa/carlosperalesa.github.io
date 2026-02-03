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

# Permisos objetivo (de variables de entorno o valores por defecto)
PERM_API_DATA="${PERM_API_DATA:-777}"
PERM_BT_UPLOADS="${PERM_BT_UPLOADS:-777}"
PERM_BT_DATABASE="${PERM_BT_DATABASE:-666}"
PERM_STATIC_FILES="${PERM_STATIC_FILES:-755}"

# ============================================
# FUNCIÓN CENTRALIZADA DE PERMISOS
# ============================================
fix_all_permissions() {
    local phase="$1"  # "pre-build" o "post-build"
    
    echo -e "\n${YELLOW}${WRENCH} Corrigiendo permisos (${phase})...${NC}"
    
    # 1. Archivos estáticos (siempre)
    echo -e "   ${WRENCH} Archivos estáticos (css, js, img, fonts)..."
    for dir in css js img fonts; do
        if [ -d "$MAIN_DIR/$dir" ]; then
            chown -R www-data:www-data "$MAIN_DIR/$dir" 2>/dev/null || true
            chmod -R ${PERM_STATIC_FILES:-755} "$MAIN_DIR/$dir" 2>/dev/null || true
        fi
    done
    
    if [ "$phase" == "pre-build" ]; then
        # 2. Pre-build: Preparar filesystem del host
        echo -e "   ${WRENCH} API data directory (host)..."
        mkdir -p "$API_DIR/data"
        chown -R 1000:1000 "$API_DIR/data" 2>/dev/null || true
        chmod -R ${PERM_API_DATA:-777} "$API_DIR/data" 2>/dev/null || true
        
        echo -e "   ${WRENCH} BT database y uploads (host)..."
        touch "$BT_DIR/database.db" 2>/dev/null || true
        mkdir -p "$BT_DIR/public/uploads"
        chown -R 33:33 "$BT_DIR" 2>/dev/null || true
        chmod ${PERM_BT_DATABASE:-666} "$BT_DIR/database.db" 2>/dev/null || true
        chmod -R ${PERM_BT_UPLOADS:-777} "$BT_DIR/public/uploads" 2>/dev/null || true
        
    elif [ "$phase" == "post-build" ]; then
        # 3. Post-build: Arreglar permisos DENTRO de contenedores
        echo -e "   ${WRENCH} Esperando a que contenedores inicien..."
        sleep 3
        
        if docker ps | grep -q bruja-teatral; then
            echo -e "   ${WRENCH} BT container: uploads y database..."
            docker exec bruja-teatral chmod -R ${PERM_BT_UPLOADS:-777} /app/public/uploads 2>/dev/null || echo "      ⚠️ No se pudo arreglar uploads"
            docker exec bruja-teatral chmod ${PERM_BT_DATABASE:-666} /app/database.db 2>/dev/null || true
        fi
        
        if docker ps | grep -q portfolio-contact-api; then
            echo -e "   ${WRENCH} API container: data folder..."
            docker exec portfolio-contact-api chmod -R ${PERM_API_DATA:-777} /app/data 2>/dev/null || true
        fi
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

echo -e "\n🚀 INICIANDO DESPLIEGUE AUTOMÁTICO v4.0\n"

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

# 5. FIX PERMISOS POST-BUILD
fix_all_permissions "post-build"

# 6. Limpieza
echo -e "\n🧹 Limpiando imágenes antiguas..."
docker image prune -f 2>/dev/null || true

# 7. Recargar Nginx
echo -e "\n🔄 Actualizando configuración de Nginx..."
cp "$API_DIR/nginx.conf" /etc/nginx/sites-available/carlosperales.dev
ln -sf /etc/nginx/sites-available/carlosperales.dev /etc/nginx/sites-enabled/

run_task "nginx -t && systemctl reload nginx" "Recargando Nginx"

# 8. Health Check
echo "-----------------------------------"
echo -e "\n🔍 VERIFICACIÓN DE SALUD\n"
sleep 5
chmod +x "$MAIN_DIR/check.sh"
"$MAIN_DIR/check.sh"

echo -e "\n✨ PROCESO COMPLETADO ✨\n"
