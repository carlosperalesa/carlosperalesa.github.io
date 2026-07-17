#!/bin/bash

# ==============================================================================
# SCRIPT DE DESPLIEGUE AUTOMATICO - CARLOSPERALES.DEV
# ==============================================================================
# Orden de ejecucion:
# 1. Git Pull (Actualizar codigo)
# 2. PocketBase (Descargar binario si no existe + reiniciar servicio)
# 3. Permisos (Ajustar ownership y permisos)
# 4. Configuracion del Sistema (Nginx)
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
NC='\033[0m'
CHECK="[OK]"
CROSS="[ERROR]"

# Variables de Directorios
MAIN_DIR="/var/www/portafolio"
PB_VERSION="0.36.5"

# Funcion auxiliar para ejecutar comandos con log visual
run_step() {
    local cmd="$1"
    local msg="$2"

    echo -e "\n${BLUE}==============================================${NC}"
    echo -e "${BLUE}> ${msg}${NC}"
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

echo -e "\n INICIANDO DESPLIEGUE v7.0\n"

# ==============================================================================
# 1. GIT PULL
# ==============================================================================
run_step "cd $MAIN_DIR && git pull" "1. Actualizando Repositorio (Git Pull)"

# ==============================================================================
# 2. POCKETBASE
# ==============================================================================
echo -e "\n Desplegando PocketBase..."

if [ ! -d "$MAIN_DIR/other/AutoMail/.venv" ]; then
    run_step "python3 -m venv $MAIN_DIR/other/AutoMail/.venv" "2. Creando entorno virtual de AutoMail"
fi

AUTOMAIL_PY="$MAIN_DIR/other/AutoMail/.venv/bin/python"
if [ -x "$AUTOMAIL_PY" ]; then
    run_step "$AUTOMAIL_PY -m pip install --upgrade pip" "2. Actualizando pip de AutoMail"
    run_step "$AUTOMAIL_PY -m pip install -r $MAIN_DIR/other/AutoMail/requirements.txt" "2. Instalando dependencias de AutoMail"
else
    echo -e "${RED}${CROSS} No se encontró el Python del entorno virtual de AutoMail en $AUTOMAIL_PY${NC}"
fi

# 2.1 Descargar binario si no existe
if [ ! -x "$MAIN_DIR/pocketbase" ]; then
    echo -e "${YELLOW} PocketBase no encontrado, descargando v${PB_VERSION}...${NC}"
    run_step "cd $MAIN_DIR && curl -sL https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip -o pb.zip && unzip -o pb.zip pocketbase && rm pb.zip && chmod +x pocketbase" "2. Descargando PocketBase v${PB_VERSION}"
fi

# 2.2 Instalar servicio y reiniciar
if command -v systemctl >/dev/null 2>&1; then
    if [ -f "$MAIN_DIR/pocketbase.service" ]; then
        run_step "cp $MAIN_DIR/pocketbase.service /etc/systemd/system/pocketbase.service" "2. Instalando pocketbase.service"
        run_step "systemctl daemon-reload" "2. Recargando systemd"
    fi

    if [ -x "$MAIN_DIR/pocketbase" ]; then
        run_step "systemctl enable pocketbase >/dev/null 2>&1 || true" "2. Habilitando PocketBase"
        run_step "systemctl restart pocketbase" "2. Reiniciando PocketBase"
    else
        echo -e "${RED}${CROSS} Binario de PocketBase no encontrado en $MAIN_DIR/pocketbase${NC}"
    fi

    if [ -f "$MAIN_DIR/automail.service" ]; then
        run_step "cp $MAIN_DIR/automail.service /etc/systemd/system/automail.service" "2. Instalando automail.service"
        run_step "systemctl daemon-reload" "2. Recargando systemd para AutoMail"
        run_step "systemctl enable automail >/dev/null 2>&1 || true" "2. Habilitando AutoMail"
        run_step "systemctl restart automail" "2. Reiniciando AutoMail"
    fi
else
    echo -e "${YELLOW} Systemd no disponible. Inicia PocketBase manualmente.${NC}"
fi

# ==============================================================================
# 3. PERMISOS
# ==============================================================================
echo -e "\n 3. Ajustando Permisos del Sistema..."

# 3.1 Archivos Estaticos (Nginx - www-data)
echo -e "   -> Configurando permisos web (www-data)..."
for dir in css js img fonts sounds other; do
    if [ -d "$MAIN_DIR/$dir" ]; then
        chown -R www-data:www-data "$MAIN_DIR/$dir" 2>/dev/null || true
        find "$MAIN_DIR/$dir" -type d -exec chmod 755 {} \; 2>/dev/null || true
        find "$MAIN_DIR/$dir" -type f -exec chmod 644 {} \; 2>/dev/null || true
    fi
done

mkdir -p "$MAIN_DIR/other/AutoMail/runtime"
chown -R www-data:www-data "$MAIN_DIR/other/AutoMail/runtime" 2>/dev/null || true

# 3.2 PocketBase (usuario pocketbase)
echo -e "   -> Configurando permisos PocketBase (pocketbase)..."
chown pocketbase:pocketbase "$MAIN_DIR/pocketbase" 2>/dev/null || true
chown -R pocketbase:pocketbase "$MAIN_DIR/pb_data" 2>/dev/null || true
chown -R pocketbase:pocketbase "$MAIN_DIR/pb_hooks" 2>/dev/null || true

echo -e "${GREEN}${CHECK} Permisos aplicados.${NC}"

# ==============================================================================
# 4. CONFIGURACION DEL SISTEMA
# ==============================================================================
echo -e "\n 4. Configuracion del Sistema..."

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
# 5. FINALIZACION
# ==============================================================================
echo -e "\n DESPLIEGUE COMPLETADO"
echo -e "   https://carlosperales.dev\n"
