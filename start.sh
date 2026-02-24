#!/bin/bash

# ==============================================================================
# SCRIPT DE DESPLIEGUE AUTOMÁTICO - CARLOSPERALES.DEV
# ==============================================================================
# Orden de ejecución:
# 1. Git Pull (Actualizar código)
# 2. Deploy (Servicios opcionales)
# 3. Permisos (Ajustar ownership y permisos)
# 4. Configuración del Sistema (Nginx)
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
# 2. DEPLOY (Servicios)
# ==============================================================================
echo -e "\n⏳ Desplegando servicios..."

# PocketBase (systemd)
if command -v systemctl >/dev/null 2>&1; then
    if [ -f "$MAIN_DIR/pocketbase.service" ]; then
        run_step "cp $MAIN_DIR/pocketbase.service /etc/systemd/system/pocketbase.service" "2. Instalando pocketbase.service"
        run_step "systemctl daemon-reload" "2. Recargando systemd"
    else
        echo -e "${YELLOW}⚠️  pocketbase.service no encontrado en el repo.${NC}"
    fi

    if [ -x "/opt/pocketbase/pocketbase" ]; then
        run_step "systemctl enable pocketbase >/dev/null 2>&1 || true" "2. Habilitando PocketBase"
        run_step "systemctl restart pocketbase" "2. Reiniciando PocketBase"
    else
        echo -e "${YELLOW}⚠️  Binario de PocketBase no encontrado en /opt/pocketbase/pocketbase.${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Systemd no disponible. Inicia PocketBase manualmente.${NC}"
fi

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

echo -e "${GREEN}${CHECK} Permisos aplicados.${NC}"

# ==============================================================================
# 4. CONFIGURACIÓN DEL SISTEMA
# ==============================================================================
echo -e "\n${YELLOW}⚙️  4. Configuración del Sistema...${NC}"

# 4.1 Nginx
echo -e "   -> Recargando Nginx..."
if [ -f "$MAIN_DIR/nginx/carlosperales.dev.conf" ]; then
    cp "$MAIN_DIR/nginx/carlosperales.dev.conf" /etc/nginx/sites-available/carlosperales.dev
    ln -sf /etc/nginx/sites-available/carlosperales.dev /etc/nginx/sites-enabled/
fi
nginx -t && systemctl reload nginx
if [ $? -eq 0 ]; then
    echo -e "      ${GREEN}Nginx recargado correctamente.${NC}"
else
    echo -e "      ${RED}Error al recargar Nginx.${NC}"
fi

# ==============================================================================
# 5. FINALIZACIÓN
# ==============================================================================
echo -e "\n✨ DESPLIEGUE COMPLETADO EXITOSAMENTE ✨"
echo -e "   Recuerda visitar: https://carlosperales.dev"
echo -e "   Para verificar estado: ./check.sh\n"
