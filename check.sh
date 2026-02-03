#!/bin/bash

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
PERM_API_DATA="${PERM_API_DATA:-777}"
PERM_BT_UPLOADS="${PERM_BT_UPLOADS:-777}"
PERM_BT_DATABASE="${PERM_BT_DATABASE:-666}"
PERM_STATIC_FILES="${PERM_STATIC_FILES:-755}"

# Función de logging
log() {
    local level="$1"
    local step="$2"
    local message="$3"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$step] $level: $message" >> "$LOG_FILE"
}

# Función de auto-corrección de permisos
auto_fix_permission() {
    local target="$1"
    local expected_perm="$2"
    local current_perm="$3"
    local is_container="$4"  # true/false
    
    log "FIXING" "$CURRENT_STEP/$TOTAL_STEPS" "Corrigiendo $target de $current_perm → $expected_perm"
    
    if [ "$is_container" == "true" ]; then
        # Corregir dentro de contenedor
        if echo "$target" | grep -q "bruja-teatral"; then
            docker exec bruja-teatral chmod "$expected_perm" "$target" 2>/dev/null
        elif echo "$target" | grep -q "portfolio-contact-api"; then
            docker exec portfolio-contact-api chmod "$expected_perm" "$target" 2>/dev/null
        fi
    else
        # Corregir en host
        chmod "$expected_perm" "$target" 2>/dev/null
    fi
    
    if [ $? -eq 0 ]; then
        log "FIXED" "$CURRENT_STEP/$TOTAL_STEPS" "$target ahora tiene permisos $expected_perm"
        echo -e "      ${GREEN}${WRENCH} CORREGIDO → $expected_perm${NC}"
        return 0
    else
        log "FAILED" "$CURRENT_STEP/$TOTAL_STEPS" "No se pudo corregir $target"
        echo -e "      ${RED}⚠️  NO SE PUDO CORREGIR${NC}"
        return 1
    fi
}

# Contador
TOTAL_STEPS=8
CURRENT_STEP=1

print_step() {
    echo -e "${BLUE}[${CURRENT_STEP}/${TOTAL_STEPS}] ${1}...${NC}"
    log "INFO" "$CURRENT_STEP/$TOTAL_STEPS" "$1"
    CURRENT_STEP=$((CURRENT_STEP + 1))
}

check_service() {
    local name=$1
    local cmd=$2
    if eval "$cmd" >/dev/null 2>&1; then
        echo -e "   ${GREEN}${CHECK} ${name}: OK${NC}"
        log "OK" "$CURRENT_STEP/$TOTAL_STEPS" "${name}: OK"
    else
        echo -e "   ${RED}${CROSS} ${name}: ERROR${NC}"
        log "ERROR" "$CURRENT_STEP/$TOTAL_STEPS" "${name}: ERROR"
        HAS_ERROR=1
    fi
}

echo -e "\n🔍 SYSTEM HEALTH CHECK & DIAGNOSIS v4.0\n"
log "START" "0/0" "========== Iniciando health check =========="
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

# 4. CREDENCIALES Y CONFIGURACIÓN
print_step "Verificando Credenciales (Variables de Entorno)"

# Verificar RUNNER_SECRET
if [ -n "$RUNNER_SECRET" ]; then
    echo -e "   ${GREEN}${CHECK} RUNNER_SECRET: Configurado${NC}"
    log "OK" "$CURRENT_STEP/$TOTAL_STEPS" "RUNNER_SECRET está configurado en variables de entorno"
else
    echo -e "   ${RED}${CROSS} RUNNER_SECRET: NO CONFIGURADO${NC}"
    echo -e "   ${YELLOW}   Ejecuta: export RUNNER_SECRET=\$(openssl rand -hex 32)${NC}"
    log "ERROR" "$CURRENT_STEP/$TOTAL_STEPS" "RUNNER_SECRET no está configurado"
    HAS_ERROR=1
fi

# Verificar SECRET_KEY (opcional pero recomendado)
if [ -n "$SECRET_KEY" ]; then
    echo -e "   ${GREEN}${CHECK} SECRET_KEY: Configurado${NC}"
    log "OK" "$CURRENT_STEP/$TOTAL_STEPS" "SECRET_KEY está configurado"
else
    echo -e "   ${YELLOW}⚠️  SECRET_KEY: No configurado (usando valor por defecto)${NC}"
    log "WARNING" "$CURRENT_STEP/$TOTAL_STEPS" "SECRET_KEY no está configurado"
fi

# 5. PERSISTENCIA Y PERMISOS CON AUTO-CORRECCIÓN
print_step "Verificando Persistencia y Permisos"

# Check BT Database file
if [ -f "$MAIN_DIR/other/BT/database.db" ]; then
    DB_PERMS=$(stat -c '%a' $MAIN_DIR/other/BT/database.db 2>/dev/null || stat -f '%OLp' $MAIN_DIR/other/BT/database.db | tail -c 4)
    EXPECTED_DB_PERMS="${PERM_BT_DATABASE:-666}"
    
    if [ "$DB_PERMS" == "$EXPECTED_DB_PERMS" ]; then
        echo -e "   ${GREEN}${CHECK} BT Database Perms: OK ($DB_PERMS)${NC}"
        log "OK" "$CURRENT_STEP/$TOTAL_STEPS" "BT database.db tiene permisos correctos ($DB_PERMS)"
    else
        echo -e "   ${RED}${CROSS} BT Database Perms: WRONG ($DB_PERMS, expected $EXPECTED_DB_PERMS)${NC}"
        log "ERROR" "$CURRENT_STEP/$TOTAL_STEPS" "BT database.db permisos incorrectos ($DB_PERMS != $EXPECTED_DB_PERMS)"
        auto_fix_permission "$MAIN_DIR/other/BT/database.db" "$EXPECTED_DB_PERMS" "$DB_PERMS" "false"
    fi
else
    echo -e "   ${RED}${CROSS} BT Database: MISSING${NC}"
    log "ERROR" "$CURRENT_STEP/$TOTAL_STEPS" "BT database.db no existe"
    HAS_ERROR=1
fi

# Check BT uploads folder
if [ -d "$MAIN_DIR/other/BT/public/uploads" ]; then
    UPLOADS_PERMS=$(stat -c '%a' $MAIN_DIR/other/BT/public/uploads 2>/dev/null || stat -f '%OLp' $MAIN_DIR/other/BT/public/uploads | tail -c 4)
    EXPECTED_UPLOADS_PERMS="${PERM_BT_UPLOADS:-777}"
    
    if [ "$UPLOADS_PERMS" == "$EXPECTED_UPLOADS_PERMS" ]; then
        echo -e "   ${GREEN}${CHECK} BT Uploads Folder: OK ($UPLOADS_PERMS)${NC}"
        log "OK" "$CURRENT_STEP/$TOTAL_STEPS" "BT uploads tiene permisos correctos ($UPLOADS_PERMS)"
    else
        echo -e "   ${RED}${CROSS} BT Uploads Folder: WRONG ($UPLOADS_PERMS, expected $EXPECTED_UPLOADS_PERMS)${NC}"
        log "ERROR" "$CURRENT_STEP/$TOTAL_STEPS" "BT uploads permisos incorrectos ($UPLOADS_PERMS != $EXPECTED_UPLOADS_PERMS)"
        auto_fix_permission "$MAIN_DIR/other/BT/public/uploads" "$EXPECTED_UPLOADS_PERMS" "$UPLOADS_PERMS" "false"
    fi
else
    echo -e "   ${RED}${CROSS} BT Uploads Folder: MISSING${NC}"
    log "ERROR" "$CURRENT_STEP/$TOTAL_STEPS" "BT uploads no existe"
    HAS_ERROR=1
fi

# Check API data folder
if [ -d "$MAIN_DIR/api/data" ]; then
    API_DATA_PERMS=$(stat -c '%a' $MAIN_DIR/api/data 2>/dev/null || stat -f '%OLp' $MAIN_DIR/api/data | tail -c 4)
    EXPECTED_API_PERMS="${PERM_API_DATA:-777}"
    
    if [ "$API_DATA_PERMS" == "$EXPECTED_API_PERMS" ]; then
        echo -e "   ${GREEN}${CHECK} API Data Folder: OK ($API_DATA_PERMS)${NC}"
        log "OK" "$CURRENT_STEP/$TOTAL_STEPS" "API data tiene permisos correctos ($API_DATA_PERMS)"
    else
        echo -e "   ${YELLOW}⚠️  API Data Folder: $API_DATA_PERMS (expected $EXPECTED_API_PERMS)${NC}"
        log "WARNING" "$CURRENT_STEP/$TOTAL_STEPS" "API data permisos suboptimales ($API_DATA_PERMS != $EXPECTED_API_PERMS)"
        auto_fix_permission "$MAIN_DIR/api/data" "$EXPECTED_API_PERMS" "$API_DATA_PERMS" "false"
    fi
else
    echo -e "   ${YELLOW}⚠️ API Data Folder: Not created yet${NC}"
    log "WARNING" "$CURRENT_STEP/$TOTAL_STEPS" "API data no existe todavía"
fi

# Check if BT container can write to uploads
if docker ps --format '{{.Names}}' | grep -q 'bruja-teatral'; then
    CONTAINER_WRITE=$(docker exec bruja-teatral test -w /app/public/uploads && echo "OK" || echo "FAIL")
    if [ "$CONTAINER_WRITE" == "OK" ]; then
        echo -e "   ${GREEN}${CHECK} BT Container Write Access: OK${NC}"
        log "OK" "$CURRENT_STEP/$TOTAL_STEPS" "BT container tiene acceso de escritura a uploads"
    else
        echo -e "   ${RED}${CROSS} BT Container Write Access: DENIED${NC}"
        log "ERROR" "$CURRENT_STEP/$TOTAL_STEPS" "BT container NO tiene acceso de escritura"
        # Auto-fix dentro del contenedor
        docker exec bruja-teatral chmod 777 /app/public/uploads 2>/dev/null
        log "FIXED" "$CURRENT_STEP/$TOTAL_STEPS" "Permisos corregidos dentro del contenedor BT"
        HAS_ERROR=1
    fi
fi

# 6. RECURSOS
print_step "Verificando Recursos del Sistema"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
echo -e "   Disk Usage: ${DISK_USAGE}%"
log "INFO" "$CURRENT_STEP/$TOTAL_STEPS" "Disk usage: ${DISK_USAGE}%"
MEM_FREE=$(free -m | awk 'NR==2 {print $4}')
echo -e "   Free RAM: ${MEM_FREE}MB"
log "INFO" "$CURRENT_STEP/$TOTAL_STEPS" "Free RAM: ${MEM_FREE}MB"

# 7. CONECTIVIDAD INTERNA
print_step "Verificando Conectividad Interna (Bridge)"
check_service "Internal Port 5000 (Main)" "curl -s -o /dev/null -w '%{http_code}' http://localhost:5000/api/health | grep -q '200'"
check_service "Internal Port 3000 (BT)" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/posts | grep -q '200'"

# 8. ENDPOINTS PÚBLICOS
print_step "Verificando Respuesta HTTP (Public URL)"
HTTP_MAIN=$(curl -o /dev/null -s -w "%{http_code}" https://carlosperales.dev/api/health 2>/dev/null || echo "000")
if [ "$HTTP_MAIN" == "200" ]; then
     echo -e "   ${GREEN}${CHECK} Main API Public: 200 OK${NC}"
     log "OK" "$CURRENT_STEP/$TOTAL_STEPS" "Main API responde 200 OK"
else
     echo -e "   ${RED}${CROSS} Main API Public: ${HTTP_MAIN}${NC}"
     log "ERROR" "$CURRENT_STEP/$TOTAL_STEPS" "Main API responde ${HTTP_MAIN}"
     HAS_ERROR=1
fi

HTTP_BT=$(curl -o /dev/null -s -w "%{http_code}" https://carlosperales.dev/other/BT/api/posts 2>/dev/null || echo "000")
if [ "$HTTP_BT" == "200" ]; then
     echo -e "   ${GREEN}${CHECK} BT API Public: 200 OK${NC}"
     log "OK" "$CURRENT_STEP/$TOTAL_STEPS" "BT API responde 200 OK"
else
     echo -e "   ${RED}${CROSS} BT API Public: ${HTTP_BT}${NC}"
     log "ERROR" "$CURRENT_STEP/$TOTAL_STEPS" "BT API responde ${HTTP_BT}"
     HAS_ERROR=1
fi

echo -e "\n-----------------------------------"
if [ $HAS_ERROR -eq 0 ]; then
    echo -e "${GREEN}✅ SISTEMA OPERATIVO Y SALUDABLE${NC}"
    log "SUCCESS" "FIN" "Health check completado sin errores"
else
    echo -e "${RED}❌ SE DETECTARON ERRORES (algunos fueron auto-corregidos)${NC}"
    echo -e "${YELLOW}👉 Revisa logs con: tail -f /var/log/check.log${NC}"
    log "FAILED" "FIN" "Health check completado con errores"
fi
echo -e "-----------------------------------\n"

exit $HAS_ERROR
