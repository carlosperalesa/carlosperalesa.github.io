#!/bin/bash

# ==============================================================================
# SCRIPT DE DESPLIEGUE AUTOMÁTICO - CARLOSPERALES.DEV
# ==============================================================================
# Orden de ejecución:
# 1. Git Pull (Actualizar código)
# 2. Deploy (Construir y levantar contenedores)
# 3. Permisos (Ajustar ownership y permisos)
# 4. Configuración del Sistema (Nginx, Mayordomo)
# ==============================================================================

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

# Variables de Directorios
MAIN_DIR="${DEPLOY_ROOT:-/var/www/html-static}"
API_DIR="$MAIN_DIR/api"
BT_DIR="$MAIN_DIR/other/BT"

# Función auxiliar para ejecutar comandos con log visual
run_step() {
    local cmd="$1"
    local msg="$2"
    
    echo -e "\n${BLUE}==============================================${NC}"
    echo -e "${BLUE}▶ ${msg}${NC}"
    echo -e "${BLUE}----------------------------------------------${NC}"
    
    eval "$cmd"
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}${CHECK} Paso completado.${NC}"
        return 0
    else
        echo -e "${RED}${CROSS} Error en este paso.${NC}"
        return 1
    fi
}

echo -e "\n🚀 INICIANDO DESPLIEGUE v6.0\n"

# ==============================================================================
# 1. GIT PULL
# ==============================================================================
run_step "cd $MAIN_DIR && git pull" "1. Actualizando Repositorio (Git Pull)"

# ==============================================================================
# 2. DEPLOY (Docker Compose Build & Up)
# ==============================================================================
echo -e "\n⏳ Desplegando servicios..."

# Main API
run_step "cd $API_DIR && docker compose up -d --build" "2.1 Reconstruyendo Main API"

# Bruja Teatral
run_step "cd $BT_DIR && docker compose up -d --build" "2.2 Reconstruyendo Bruja Teatral"

# ==============================================================================
# 3. PERMISOS
# ==============================================================================
echo -e "\n${YELLOW}${WRENCH} 3. Ajustando Permisos del Sistema...${NC}"

# 3.1 Archivos Estáticos (Nginx - www-data)
echo -e "   -> Configurando permisos web (www-data)..."
for dir in css js img fonts sounds other; do
    if [ -d "$MAIN_DIR/$dir" ]; then
        chown -R www-data:www-data "$MAIN_DIR/$dir" 2>/dev/null || true
        find "$MAIN_DIR/$dir" -type d -exec chmod 755 {} \; 2>/dev/null || true
        find "$MAIN_DIR/$dir" -type f -exec chmod 644 {} \; 2>/dev/null || true
    fi
done

# 3.2 Main API Data (UID 1000)
echo -e "   -> Configurando Main API Data (UID 1000)..."
mkdir -p "$API_DIR/data"
chown -R 1000:1000 "$API_DIR/data" 2>/dev/null || true
chmod -R 755 "$API_DIR/data" 2>/dev/null || true

# 3.3 Bruja Teatral Data (UID 1000)
echo -e "   -> Configurando Bruja Teatral (Database & Uploads)..."
# Asegurar existencia de archivos clave
if [ ! -f "$BT_DIR/database.db" ]; then
    touch "$BT_DIR/database.db"
    echo "      (Creado database.db vacío)"
fi
mkdir -p "$BT_DIR/public/uploads"

# Asignar permisos UID 1000 (Usuario contenedor)
chown 1000:1000 "$BT_DIR/database.db" 2>/dev/null || true
chown -R 1000:1000 "$BT_DIR/public/uploads" 2>/dev/null || true

# Permisos de lectura/escritura
chmod 644 "$BT_DIR/database.db" 2>/dev/null || true
chmod -R 755 "$BT_DIR/public/uploads" 2>/dev/null || true

echo -e "${GREEN}${CHECK} Permisos aplicados.${NC}"

# ==============================================================================
# 4. CONFIGURACIÓN DEL SISTEMA
# ==============================================================================
echo -e "\n${YELLOW}⚙️  4. Configuración del Sistema...${NC}"

# 4.1 Nginx
echo -e "   -> Actualizando Nginx..."
cp "$API_DIR/nginx.conf" /etc/nginx/sites-available/carlosperales.dev
ln -sf /etc/nginx/sites-available/carlosperales.dev /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
if [ $? -eq 0 ]; then
    echo -e "      ${GREEN}Nginx recargado correctamente.${NC}"
else
    echo -e "      ${RED}Error al recargar Nginx.${NC}"
fi

# 4.2 Mayordomo Service
echo -e "   -> Verificando servicio Mayordomo..."
if command -v systemctl >/dev/null 2>&1; then
    # Verificar si el archivo de servicio existe en el repo y copiarlo
    if [ -f "$MAIN_DIR/mayordomo.service" ]; then
        # Copiar siempre para asegurar que actualizaciones al archivo .service se apliquen
        cp "$MAIN_DIR/mayordomo.service" /etc/systemd/system/mayordomo.service
        systemctl daemon-reload
        systemctl enable mayordomo
        systemctl restart mayordomo
        echo -e "      ${GREEN}Mayordomo actualizado y reiniciado.${NC}"
    else
        echo -e "      ${YELLOW}Archivo mayordomo.service no encontrado en origen.${NC}"
    fi
else
    echo -e "      ${YELLOW}Systemd no disponible (entorno no compatible).${NC}"
fi

# ==============================================================================
# 5. LIMPIEZA Y FINALIZACIÓN
# ==============================================================================
echo -e "\n🧹 Limpiando imágenes Docker antiguas..."
docker image prune -f >/dev/null 2>&1

echo -e "\n✨ DESPLIEGUE COMPLETADO EXITOSAMENTE ✨"
echo -e "   Recuerda visitar: https://carlosperales.dev"
echo -e "   Para verificar estado: ./check.sh\n"
