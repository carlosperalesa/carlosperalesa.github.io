#!/bin/bash

# Colores e Iconos
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'
CHECK="✅"
CROSS="❌"

echo -e "\n${BLUE}🔍 VERIFICACIÓN DE BRUJA TEATRAL${NC}\n"

HAS_ERROR=0

# Función de verificación
check_service() {
    local name="$1"
    local cmd="$2"
    if eval "$cmd" &>/dev/null; then
        echo -e "${GREEN}${CHECK} $name${NC}"
    else
        echo -e "${RED}${CROSS} $name${NC}"
        HAS_ERROR=1
    fi
}

# 1. CONTENEDOR
echo -e "${BLUE}━━━ Contenedor Docker ━━━${NC}"
check_service "BT Container Running" "docker ps --format '{{.Names}}' | grep -q 'bruja-teatral'"

# 2. ARCHIVOS Y PERMISOS
echo -e "\n${BLUE}━━━ Archivos y Permisos ━━━${NC}"
BT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -f "$BT_DIR/database.db" ]; then
    echo -e "${GREEN}${CHECK} database.db existe${NC}"
    OWNER=$(stat -c '%U' "$BT_DIR/database.db" 2>/dev/null || stat -f '%Su' "$BT_DIR/database.db" 2>/dev/null)
    if [ "$OWNER" = "1000" ] || [ "$OWNER" = "appuser" ]; then
        echo -e "${GREEN}${CHECK} database.db ownership correcto${NC}"
    else
        echo -e "${YELLOW}⚠️  database.db ownership: $OWNER (esperado: 1000)${NC}"
    fi
else
    echo -e "${RED}${CROSS} database.db no encontrado${NC}"
    HAS_ERROR=1
fi

if [ -d "$BT_DIR/public/uploads" ]; then
    echo -e "${GREEN}${CHECK} Directorio uploads existe${NC}"
else
    echo -e "${RED}${CROSS} Directorio uploads no encontrado${NC}"
    HAS_ERROR=1
fi

# 3. ENDPOINT API
echo -e "\n${BLUE}━━━ Endpoint API ━━━${NC}"
if curl -sf http://localhost:3000/api/health > /dev/null; then
    echo -e "${GREEN}${CHECK} API Health (localhost:3000)${NC}"
else
    echo -e "${RED}${CROSS} API Health no responde${NC}"
    HAS_ERROR=1
fi

if curl -sf https://carlosperales.dev/bt/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}${CHECK} API accesible via /bt/api/${NC}"
else
    echo -e "${YELLOW}⚠️  API no accesible via /bt/api/ (verificar Nginx)${NC}"
fi

# 4. RECURSOS
echo -e "\n${BLUE}━━━ Recursos del Sistema ━━━${NC}"
CONTAINER_ID=$(docker ps -q -f name=bruja-teatral)
if [ -n "$CONTAINER_ID" ]; then
    MEM=$(docker stats --no-stream --format "{{.MemUsage}}" $CONTAINER_ID)
    CPU=$(docker stats --no-stream --format "{{.CPUPerc}}" $CONTAINER_ID)
    echo -e "   ${BLUE}Memoria:${NC} $MEM"
    echo -e "   ${BLUE}CPU:${NC} $CPU"
fi

# RESUMEN
echo -e "\n-----------------------------------"
if [ $HAS_ERROR -eq 0 ]; then
    echo -e "${GREEN}✅ TODOS LOS CHECKS PASARON${NC}\n"
else
    echo -e "${RED}❌ ALGUNOS CHECKS FALLARON${NC}"
    echo -e "${YELLOW}💡 Ejecuta ./start.sh para reiniciar${NC}\n"
fi
