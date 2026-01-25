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
    
    # Ejecutar comando mostrando output en tiempo real
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

echo -e "\n🚀 INICIANDO DESPLIEGUE AUTOMÁTICO v3.0\n"

# Resumen de tareas
echo -e "${BLUE}Plan de ejecución:${NC}"
echo "1. Actualizar código (git pull)"
echo "2. Reconstruir Main API (Puede tardar 1-2 mins)"
echo "3. Reconstruir Bruja Teatral API (Puede tardar 1-2 mins)"
echo "4. Verificar Salud del Sistema"
echo -e "\n⚠️  Nota: Si ves 'Building...' o 'Waiting', por favor ESPERA. No está pegado, está trabajando."
echo -e "----------------------------------------------\n"

# 1. Rutas
MAIN_DIR="/var/www/html-static"
API_DIR="$MAIN_DIR/api"
BT_DIR="$MAIN_DIR/other/BT"

# 2. Git Pull Global
run_task "cd $MAIN_DIR && git pull" "Actualizando repositorio ($MAIN_DIR)"
if [ $? -ne 0 ]; then exit 1; fi

# 3. Main API
echo -e "\n⏳ Iniciando rebuild de Main API. Ten paciencia..."
run_task "cd $API_DIR && docker compose up -d --build" "Reconstruyendo Main API"

# 4. Bruja Teatral (BT)
echo -e "\n⏳ Iniciando rebuild de Bruja Teatral. Ten paciencia..."
run_task "cd $BT_DIR && docker compose up -d --build" "Reconstruyendo Bruja Teatral"

echo "-----------------------------------"
echo -e "\n🔍 VERIFICACIÓN DE SALUD (HEALTH CHECKS)\n"

# Wait
echo -e "\n⏳ Esperando 5 segundos para arranque de servicios..."
sleep 5

# Check Main API
HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" https://carlosperales.dev/api/health)
if [ "$HTTP_STATUS" == "200" ]; then
    echo -e "${GREEN}${CHECK} MAIN API: ONLINE${NC}"
else
    echo -e "${RED}${CROSS} MAIN API: OFFLINE ($HTTP_STATUS)${NC}"
fi

# Check BT API
HTTP_STATUS_BT=$(curl -o /dev/null -s -w "%{http_code}\n" https://carlosperales.dev/bt/api/posts)
if [ "$HTTP_STATUS_BT" == "200" ]; then
    echo -e "${GREEN}${CHECK} BT API:   ONLINE${NC}"
else
    echo -e "${RED}${CROSS} BT API:   WARN/OFFLINE ($HTTP_STATUS_BT)${NC}"
fi

echo -e "\n✨ PROCESO COMPLETADO Ver detalles: /tmp/deploy.log ✨\n"
