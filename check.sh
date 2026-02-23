#!/bin/bash

# Cargar variables de entorno del sistema
if [ -f /etc/environment ]; then
    set -a
    source /etc/environment
    set +a
fi

# Colores e Iconos
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
CHECK="✅"
CROSS="❌"
WRENCH="🔧"

# Log file
LOG_FILE="/var/log/check.log"

# Usar variables de entorno del sistema con valores por defecto
MAIN_DIR="${DEPLOY_ROOT:-/var/www/html-static}"

# Función de logging
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $level: $message" >> "$LOG_FILE"
}

# Contador
TOTAL_STEPS=4
CURRENT_STEP=1

print_step() {
    echo -e "${BLUE}[${CURRENT_STEP}/${TOTAL_STEPS}] ${1}...${NC}"
    log "INFO" "Step $CURRENT_STEP: $1"
    CURRENT_STEP=$((CURRENT_STEP + 1))
}

check_service() {
    local name=$1
    local cmd=$2
    if eval "$cmd" >/dev/null 2>&1; then
        echo -e "   ${GREEN}${CHECK} ${name}: OK${NC}"
        log "OK" "${name}: OK"
    else
        echo -e "   ${RED}${CROSS} ${name}: ERROR${NC}"
        log "ERROR" "${name}: ERROR"
        HAS_ERROR=1
    fi
}

echo -e "\n🔍 SYSTEM HEALTH CHECK & DIAGNOSIS v5.0\n"
log "START" "========== Iniciando health check =========="
HAS_ERROR=0

# 1. NGINX
print_step "Verificando Servidor Web (Nginx)"
check_service "Nginx Service" "systemctl is-active --quiet nginx"
check_service "Config Syntax" "nginx -t"

# 2. DOCKER
print_step "Verificando Motor Docker"
check_service "Docker Service" "systemctl is-active --quiet docker"

# 3. RECURSOS
print_step "Verificando Recursos del Sistema"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
echo -e "   Disk Usage: ${DISK_USAGE}%"
MEM_FREE=$(free -m | awk 'NR==2 {print $4}')
echo -e "   Free RAM: ${MEM_FREE}MB"

if [ "$DISK_USAGE" -gt 90 ]; then
    echo -e "   ${RED}${CROSS} ALERTA: Disco casi lleno${NC}"
    HAS_ERROR=1
fi

# 4. CONECTIVIDAD (Local & Public)
print_step "Verificando Endpoints HTTP (Timeout 5s)"

check_endpoint() {
    local name=$1
    local local_url=$2
    local public_url=$3

    CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$local_url" 2>/dev/null || echo "000")

    if [ "$CODE" == "200" ] || [ "$CODE" == "301" ]; then
        echo -e "   ${GREEN}${CHECK} ${name}: OK (Local)${NC}"
        log "OK" "${name} OK on Local ($CODE)"
    else
        echo -e "   ${YELLOW}⚠️  ${name} Local ($CODE) - Probando Público...${NC}"
        CODE_PUB=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$public_url" 2>/dev/null || echo "000")

        if [ "$CODE_PUB" == "200" ] || [ "$CODE_PUB" == "301" ]; then
            echo -e "   ${GREEN}${CHECK} ${name}: OK (Public)${NC}"
            log "OK" "${name} OK on Public ($CODE_PUB)"
        else
            echo -e "   ${RED}${CROSS} ${name}: FAIL (Local: $CODE, Public: $CODE_PUB)${NC}"
            log "ERROR" "${name} Failed"
            HAS_ERROR=1
        fi
    fi
}

check_endpoint "PocketBase" "http://127.0.0.1:8090/_/" "https://carlosperales.dev/_/"
echo -e "\n-----------------------------------"
if [ $HAS_ERROR -eq 0 ]; then
    echo -e "${GREEN}✅ SISTEMA OPERATIVO Y SALUDABLE${NC}"
    log "SUCCESS" "Health check completado sin errores"
else
    echo -e "${RED}❌ SE DETECTARON ERRORES${NC}"
    echo -e "${YELLOW}👉 Revisa logs con: tail -f /var/log/check.log${NC}"
    log "FAILED" "Health check completado con errores"
fi
echo -e "-----------------------------------\n"

exit $HAS_ERROR
