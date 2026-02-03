#!/bin/bash

# ============================================
# AUDITOR DE SISTEMA v1.0
# Validación profunda de JavaScript, routing, 
# variables de entorno y dependencias
# ============================================

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    AUDITORÍA EXHAUSTIVA DEL SISTEMA     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}\n"

ERRORS=0
WARNINGS=0

# Directorio base
MAIN_DIR="${DEPLOY_ROOT:-/var/www/html-static}"
API_DIR="$MAIN_DIR/api"
BT_DIR="$MAIN_DIR/other/BT"

# ============================================
# 1. VALIDACIÓN DE SINTAXIS JAVASCRIPT
# ============================================
echo -e "${YELLOW}[1/7] Validando sintaxis JavaScript...${NC}"

# Lista de archivos JS críticos
JS_FILES=(
    "$MAIN_DIR/js/admin.js"
    "$MAIN_DIR/js/app.js"
    "$MAIN_DIR/js/contact.js"
    "$BT_DIR/public/js/app.js"
    "$BT_DIR/public/js/admin.js"
)

for js_file in "${JS_FILES[@]}"; do
    if [ -f "$js_file" ]; then
        # Contar llaves
        open_braces=$(grep -o '{' "$js_file" | wc -l)
        close_braces=$(grep -o '}' "$js_file" | wc -l)
        
        if [ "$open_braces" -ne "$close_braces" ]; then
            echo -e "   ${RED}❌ $js_file: Llaves desbalanceadas ({:$open_braces }:$close_braces)${NC}"
            ERRORS=$((ERRORS + 1))
        else
            echo -e "   ${GREEN}✅ $js_file: Sintaxis OK${NC}"
        fi
        
        # Verificar funciones usadas pero no definidas
        if grep -q "appendConsoleLine" "$js_file" 2>/dev/null; then
            if ! grep -q "function appendConsoleLine" "$js_file" 2>/dev/null; then
                echo -e "   ${RED}❌ $js_file: appendConsoleLine usado pero no definido${NC}"
                ERRORS=$((ERRORS + 1))
            fi
        fi
    else
        echo -e "   ${YELLOW}⚠️  $js_file: No encontrado${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done

# ============================================
# 2. VARIABLES DE ENTORNO EN CONTENEDORES
# ============================================
echo -e "\n${YELLOW}[2/7] Verificando variables en contenedores Docker...${NC}"

if docker ps | grep -q "portfolio-contact-api"; then
    RUNNER_IN_CONTAINER=$(docker exec portfolio-contact-api printenv RUNNER_SECRET 2>/dev/null || echo "")
    SECRET_IN_CONTAINER=$(docker exec portfolio-contact-api printenv SECRET_KEY 2>/dev/null || echo "")
    
    if [ -z "$RUNNER_IN_CONTAINER" ]; then
        echo -e "   ${RED}❌ Main API: RUNNER_SECRET no disponible en contenedor${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "   ${GREEN}✅ Main API: RUNNER_SECRET configurado${NC}"
    fi
    
    if [ -z "$SECRET_IN_CONTAINER" ]; then
        echo -e "   ${YELLOW}⚠️  Main API: SECRET_KEY no disponible (usando default)${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "   ${GREEN}✅ Main API: SECRET_KEY configurado${NC}"
    fi
else
    echo -e "   ${RED}❌ Contenedor portfolio-contact-api no está corriendo${NC}"
    ERRORS=$((ERRORS + 1))
fi

if docker ps | grep -q "bruja-teatral"; then
    BT_SECRET=$(docker exec bruja-teatral printenv SECRET_KEY 2>/dev/null || echo "")
    BT_RUNNER=$(docker exec bruja-teatral printenv RUNNER_SECRET 2>/dev/null || echo "")
    
    if [ -z "$BT_SECRET" ]; then
        echo -e "   ${YELLOW}⚠️  BT API: SECRET_KEY no disponible (usando default)${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "   ${GREEN}✅ BT API: SECRET_KEY configurado${NC}"
    fi
    
    if [ -z "$BT_RUNNER" ]; then
        echo -e "   ${YELLOW}⚠️  BT API: RUNNER_SECRET no disponible${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "   ${GREEN}✅ BT API: RUNNER_SECRET configurado${NC}"
    fi
else
    echo -e "   ${RED}❌ Contenedor bruja-teatral no está corriendo${NC}"
    ERRORS=$((ERRORS + 1))
fi

# ============================================
# 3. TESTS DE ROUTING NGINX
# ============================================
echo -e "\n${YELLOW}[3/7] Probando routing de Nginx...${NC}"

# Test Main API
MAIN_API_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health 2>/dev/null || echo "000")
if [ "$MAIN_API_TEST" = "200" ]; then
    echo -e "   ${GREEN}✅ Main API: /api/health responde 200${NC}"
else
    echo -e "   ${RED}❌ Main API: /api/health responde $MAIN_API_TEST${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test BT API
BT_API_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/other/BT/api/posts 2>/dev/null || echo "000")
if [ "$BT_API_TEST" = "200" ]; then
    echo -e "   ${GREEN}✅ BT API: /other/BT/api/posts responde 200${NC}"
else
    echo -e "   ${RED}❌ BT API: /other/BT/api/posts responde $BT_API_TEST${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test archivos estáticos BT
BT_STATIC_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/other/BT/index.html 2>/dev/null || echo "000")
if [ "$BT_STATIC_TEST" = "200" ]; then
    echo -e "   ${GREEN}✅ BT Estáticos: /other/BT/index.html responde 200${NC}"
else
    echo -e "   ${RED}❌ BT Estáticos: /other/BT/index.html responde $BT_STATIC_TEST${NC}"
    ERRORS=$((ERRORS + 1))
fi

# ============================================
# 4. SCOPE DE VARIABLES GLOBALES
# ============================================
echo -e "\n${YELLOW}[4/7] Verificando scope de variables JavaScript...${NC}"

if [ -f "$BT_DIR/public/js/app.js" ]; then
    if grep -q "window.API_URL" "$BT_DIR/public/js/app.js" && \
       grep -q "window.ASSETS_BASE" "$BT_DIR/public/js/app.js"; then
        echo -e "   ${GREEN}✅ BT app.js: Variables expuestas globalmente (window.)${NC}"
    else
        echo -e "   ${RED}❌ BT app.js: Variables NO expuestas globalmente${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

if [ -f "$BT_DIR/public/post.html" ]; then
    if grep -q "window.API_URL" "$BT_DIR/public/post.html"; then
        echo -e "   ${GREEN}✅ BT post.html: Usa window.API_URL correctamente${NC}"
    else
        echo -e "   ${YELLOW}⚠️  BT post.html: No usa window.API_URL${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# ============================================
# 5. ORDEN DE CARGA DE SCRIPTS
# ============================================
echo -e "\n${YELLOW}[5/7] Verificando orden de carga en index.html...${NC}"

if [ -f "$MAIN_DIR/index.html" ]; then
    ADMIN_LINE=$(grep -n "admin.js" "$MAIN_DIR/index.html" | head -1 | cut -d: -f1)
    APP_LINE=$(grep -n "js/app.js" "$MAIN_DIR/index.html" | head -1 | cut -d: -f1)
    
    if [ -n "$ADMIN_LINE" ] && [ -n "$APP_LINE" ]; then
        if [ "$ADMIN_LINE" -lt "$APP_LINE" ]; then
            echo -e "   ${RED}❌ admin.js se carga ANTES que app.js (admin depende de App.api)${NC}"
            ERRORS=$((ERRORS + 1))
        else
            echo -e "   ${GREEN}✅ admin.js se carga DESPUÉS de app.js${NC}"
        fi
    fi
    
    # Verificar si openLoginModal está definido antes de usarse
    ONCLICK_LINE=$(grep -n "openLoginModal()" "$MAIN_DIR/index.html" | head -1 | cut -d: -f1)
    if [ -n "$ONCLICK_LINE" ] && [ -n "$ADMIN_LINE" ]; then
        if [ "$ONCLICK_LINE" -lt "$ADMIN_LINE" ]; then
            echo -e "   ${RED}❌ openLoginModal() usado en línea $ONCLICK_LINE pero admin.js carga en $ADMIN_LINE${NC}"
            ERRORS=$((ERRORS + 1))
        else
            echo -e "   ${GREEN}✅ openLoginModal() disponible cuando se usa${NC}"
        fi
    fi
fi

# ============================================
# 6. INTEGRIDAD DE ARCHIVOS CRÍTICOS
# ============================================
echo -e "\n${YELLOW}[6/7] Verificando integridad de archivos...${NC}"

# Verificar que system_runner.py usa variables de entorno
if [ -f "$API_DIR/system_runner.py" ]; then
    if grep -q "os.getenv('RUNNER_SECRET')" "$API_DIR/system_runner.py"; then
        echo -e "   ${GREEN}✅ system_runner.py: Usa os.getenv correctamente${NC}"
    else
        echo -e "   ${RED}❌ system_runner.py: NO usa os.getenv para RUNNER_SECRET${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

# Verificar docker-compose.yml pasa variables
if [ -f "$API_DIR/docker-compose.yml" ]; then
    if grep -q "RUNNER_SECRET=\${RUNNER_SECRET}" "$API_DIR/docker-compose.yml" || \
       grep -q "RUNNER_SECRET:\${RUNNER_SECRET}" "$API_DIR/docker-compose.yml"; then
        echo -e "   ${GREEN}✅ Main docker-compose.yml: Pasa RUNNER_SECRET${NC}"
    else
        echo -e "   ${RED}❌ Main docker-compose.yml: NO pasa RUNNER_SECRET${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

if [ -f "$BT_DIR/docker-compose.yml" ]; then
    if grep -q "SECRET_KEY=\${SECRET_KEY" "$BT_DIR/docker-compose.yml"; then
        echo -e "   ${GREEN}✅ BT docker-compose.yml: Pasa SECRET_KEY${NC}"
    else
        echo -e "   ${YELLOW}⚠️  BT docker-compose.yml: Revisa paso de SECRET_KEY${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# ============================================
# 7. PERMISOS DE ARCHIVOS
# ============================================
echo -e "\n${YELLOW}[7/7] Verificando permisos finales...${NC}"

# JS debe ser 644
JS_WRONG_PERMS=$(find "$MAIN_DIR/js" -type f -name "*.js" ! -perm 644 2>/dev/null | wc -l)
if [ "$JS_WRONG_PERMS" -eq 0 ]; then
    echo -e "   ${GREEN}✅ Archivos JS: Todos tienen 644${NC}"
else
    echo -e "   ${RED}❌ Archivos JS: $JS_WRONG_PERMS archivos con permisos incorrectos${NC}"
    ERRORS=$((ERRORS + 1))
fi

# HTML debe ser 644
HTML_WRONG_PERMS=$(find "$MAIN_DIR" -type f -name "*.html" ! -perm 644 2>/dev/null | wc -l)
if [ "$HTML_WRONG_PERMS" -eq 0 ]; then
    echo -e "   ${GREEN}✅ Archivos HTML: Todos tienen 644${NC}"
else
    echo -e "   ${RED}❌ Archivos HTML: $HTML_WRONG_PERMS archivos con permisos incorrectos${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Directorios deben ser 755
DIR_WRONG_PERMS=$(find "$MAIN_DIR/js" "$MAIN_DIR/css" -type d ! -perm 755 2>/dev/null | wc -l)
if [ "$DIR_WRONG_PERMS" -eq 0 ]; then
    echo -e "   ${GREEN}✅ Directorios: Todos tienen 755${NC}"
else
    echo -e "   ${YELLOW}⚠️  Directorios: $DIR_WRONG_PERMS con permisos incorrectos${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# ============================================
# RESUMEN FINAL
# ============================================
echo -e "\n${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            RESUMEN AUDITORÍA             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"

if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
    echo -e "\n${GREEN}✅ SISTEMA SALUDABLE: No se detectaron problemas${NC}\n"
    exit 0
elif [ "$ERRORS" -eq 0 ]; then
    echo -e "\n${YELLOW}⚠️  $WARNINGS advertencias encontradas${NC}\n"
    exit 0
else
    echo -e "\n${RED}❌ $ERRORS errores críticos encontrados${NC}"
    echo -e "${YELLOW}⚠️  $WARNINGS advertencias${NC}\n"
    exit 1
fi
