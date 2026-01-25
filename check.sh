#!/bin/bash

# Colores e Iconos
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
CHECK="✅"
CROSS="❌"

# Contador
TOTAL_STEPS=6
CURRENT_STEP=1

print_step() {
    echo -e "${BLUE}[${CURRENT_STEP}/${TOTAL_STEPS}] ${1}...${NC}"
    CURRENT_STEP=$((CURRENT_STEP + 1))
}

check_service() {
    local name=$1
    local cmd=$2
    if eval "$cmd"; then
        echo -e "   ${GREEN}${CHECK} ${name}: OK${NC}"
    else
        echo -e "   ${RED}${CROSS} ${name}: ERROR${NC}"
        HAS_ERROR=1
    fi
}

echo -e "\n🔍 SYSTEM HEALTH CHECK\n"
HAS_ERROR=0

# 1. NGINX
print_step "Verificando Servidor Web (Nginx)"
check_service "Nginx Service" "systemctl is-active --quiet nginx"
check_service "Config Syntax" "nginx -t > /dev/null 2>&1"

# 2. DOCKER DAEMON
print_step "Verificando Motor Docker"
check_service "Docker Service" "systemctl is-active --quiet docker"
check_service "Docker Compose" "docker compose version > /dev/null 2>&1"

# 3. CONTENEDORES
print_step "Verificando Contenedores Activos"
# Verifica que existan y estén running
check_service "Main API Container" "docker ps --format '{{.Names}}' | grep -q 'portfolio-contact-api'"
check_service "BT API Container" "docker ps --format '{{.Names}}' | grep -q 'bruja-teatral'"

# 4. BASES DE DATOS (Check file existence or process)
print_step "Verificando Persistencia (DBs)"
if [ -f "/var/www/html-static/other/BT/database.db" ]; then
    echo -e "   ${GREEN}${CHECK} BT Database: OK (File exists)${NC}"
else
    echo -e "   ${RED}${CROSS} BT Database: MISSING${NC}"
fi
# Main API usa SQLite interno en ./api/instance o similar? O data json?
# Asumiremos JSON en data/
if [ -d "/var/www/html-static/api/data" ]; then
    echo -e "   ${GREEN}${CHECK} Main API Data Dir: OK${NC}"
else
    echo -e "   ${YELLOW}⚠️  Main API Data Dir: Not found${NC}"
fi

# 5. RECURSOS
print_step "Verificando Recursos del Sistema"
# Disco (Alertar si > 90%)
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    echo -e "   ${GREEN}${CHECK} Disk Usage: ${DISK_USAGE}% (OK)${NC}"
else
    echo -e "   ${RED}${CROSS} Disk Usage: ${DISK_USAGE}% (CRITICAL)${NC}"
fi

# Memoria
MEM_FREE=$(free -m | awk 'NR==2 {print $4}')
if [ "$MEM_FREE" -gt 50 ]; then
    echo -e "   ${GREEN}${CHECK} Free RAM: ${MEM_FREE}MB (OK)${NC}"
else
    echo -e "   ${YELLOW}⚠️  Free RAM: ${MEM_FREE}MB (Low)${NC}"
fi

# 6. ENDPOINTS PÚBLICOS
print_step "Verificando Respuesta HTTP (Public)"
HTTP_MAIN=$(curl -o /dev/null -s -w "%{http_code}" https://carlosperales.dev/api/health)
if [ "$HTTP_MAIN" == "200" ]; then
     echo -e "   ${GREEN}${CHECK} Main API: 200 OK${NC}"
else
     echo -e "   ${RED}${CROSS} Main API: ${HTTP_MAIN}${NC}"
fi

HTTP_BT=$(curl -o /dev/null -s -w "%{http_code}" https://carlosperales.dev/bt/api/posts)
if [ "$HTTP_BT" == "200" ]; then
     echo -e "   ${GREEN}${CHECK} BT API: 200 OK${NC}"
else
     echo -e "   ${RED}${CROSS} BT API: ${HTTP_BT}${NC}"
fi

echo -e "\n-----------------------------------"
if [ $HAS_ERROR -eq 0 ]; then
    echo -e "${GREEN}✅ SISTEMA OPERATIVO Y SALUDABLE${NC}"
else
    echo -e "${RED}❌ SE DETECTARON ERRORES${NC}"
fi
echo -e "-----------------------------------\n"
