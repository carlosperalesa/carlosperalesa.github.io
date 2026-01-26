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
TOTAL_STEPS=7
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

echo -e "\n🔍 SYSTEM HEALTH CHECK & DIAGNOSIS v4.0\n"
HAS_ERROR=0

# 1. NGINX
print_step "Verificando Servidor Web (Nginx)"
check_service "Nginx Service" "systemctl is-active --quiet nginx"
check_service "Config Syntax" "nginx -t"

# 2. DOCKER
print_step "Verificando Motor Docker"
check_service "Docker Service" "systemctl is-active --quiet docker"

# 3. CONTENEDORES
print_step "Verificando Contenedores"
check_service "Main API Container" "docker ps --format '{{.Names}}' | grep -q 'portfolio-contact-api'"
check_service "BT API Container" "docker ps --format '{{.Names}}' | grep -q 'bruja-teatral'"

# 4. PERSISTENCIA Y PERMISOS (Integrado de diagnosis)
print_step "Verificando Persistencia y Permisos"
# Check DB file
if [ -f "/var/www/html-static/other/BT/database.db" ]; then
    DB_OWNER=$(stat -c '%u:%g' /var/www/html-static/other/BT/database.db)
    # Aceptamos tanto usuario 1000 (standard user) como 33 (www-data)
    if [ "$DB_OWNER" == "1000:1000" ] || [ "$DB_OWNER" == "33:33" ]; then
        echo -e "   ${GREEN}${CHECK} BT Database: OK ($DB_OWNER)${NC}"
    else
        echo -e "   ${RED}${CROSS} BT Database: WRONG OWNER ($DB_OWNER)${NC}"
        HAS_ERROR=1
    fi
else
    echo -e "   ${RED}${CROSS} BT Database: MISSING${NC}"
    HAS_ERROR=1
fi

# 5. RECURSOS
print_step "Verificando Recursos del Sistema"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
echo -e "   Disk Usage: ${DISK_USAGE}%"
MEM_FREE=$(free -m | awk 'NR==2 {print $4}')
echo -e "   Free RAM: ${MEM_FREE}MB"

# 6. CONECTIVIDAD INTERNA (Deep Diagnosis)
print_step "Verificando Conectividad Interna (Bridge)"
# Test Main API Port
check_service "Internal Port 5000 (Main)" "curl -s -o /dev/null -w '%{http_code}' http://localhost:5000/api/health | grep -q '200'"
# Test BT Port
check_service "Internal Port 3000 (BT)" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/posts | grep -q '200'"

# 7. ENDPOINTS PÚBLICOS
print_step "Verificando Respuesta HTTP (Public URL)"
HTTP_MAIN=$(curl -o /dev/null -s -w "%{http_code}" https://carlosperales.dev/api/health)
if [ "$HTTP_MAIN" == "200" ]; then
     echo -e "   ${GREEN}${CHECK} Main API Public: 200 OK${NC}"
else
     echo -e "   ${RED}${CROSS} Main API Public: ${HTTP_MAIN}${NC}"
     HAS_ERROR=1
fi

HTTP_BT=$(curl -o /dev/null -s -w "%{http_code}" https://carlosperales.dev/other/BT/api/posts)
if [ "$HTTP_BT" == "200" ]; then
     echo -e "   ${GREEN}${CHECK} BT API Public: 200 OK${NC}"
else
     echo -e "   ${RED}${CROSS} BT API Public: ${HTTP_BT}${NC}"
     HAS_ERROR=1
fi

echo -e "\n-----------------------------------"
if [ $HAS_ERROR -eq 0 ]; then
    echo -e "${GREEN}✅ SISTEMA OPERATIVO Y SALUDABLE${NC}"
else
    echo -e "${RED}❌ SE DETECTARON ERRORES${NC}"
    echo -e "${YELLOW}👉 Revisa logs con: docker logs bruja-teatral${NC}"
fi
echo -e "-----------------------------------\n"
