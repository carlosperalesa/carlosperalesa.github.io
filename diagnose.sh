#!/bin/bash

# ============================================
# DIAGNOSE SCRIPT FOR CARLOSPERALES.DEV
# Debugs: Nginx Routing -> Docker Container -> Flask App
# ============================================

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n🔍 ${BLUE}INICIANDO DIAGNÓSTICO PROFUNDO DE BRUJA TEATRAL${NC}"
echo "==================================================="

# 1. VERIFICAR CONTENEDOR
echo -e "\n1️⃣  ${YELLOW}Verificando estado del contenedor BT...${NC}"
if docker ps | grep -q bruja-teatral; then
    echo -e "   ${GREEN}✅ Contenedor 'bruja-teatral' está corriendo.${NC}"
else
    echo -e "   ${RED}❌ El contenedor 'bruja-teatral' NO está corriendo.${NC}"
    echo "   Saliendo..."
    exit 1
fi

# 2. PRUEBA INTERNA (DIRECTA A DOCKER)
echo -e "\n2️⃣  ${YELLOW}Probando conexión directa al puerto 3000 (Localhost)...${NC}"
# Intentamos obtener la ruta /api/posts directamente del contenedor
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/posts)
RESPONSE=$(curl -s http://localhost:3000/api/posts | head -c 100)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "   ${GREEN}✅ Conexión Interna OK (HTTP 200)${NC}"
    echo "   Respuesta parcial: $RESPONSE..."
else
    echo -e "   ${RED}❌ Fallo Conexión Interna (HTTP $HTTP_CODE)${NC}"
    echo "   Esto significa que la aplicación Flask dentro de Docker tiene problemas."
    echo "   👉 Revisando logs del contenedor:"
    docker logs bruja-teatral --tail 20
fi

# 3. VERIFICAR NGINX CONFIG
echo -e "\n3️⃣  ${YELLOW}Verificando configuración de Nginx para BT...${NC}"
# Buscar la configuración relevante
GREP_RESULT=$(grep -r "location.*BT" /etc/nginx/sites-enabled/)
if [ -z "$GREP_RESULT" ]; then
    echo -e "   ${RED}❌ No se encontró configuración de 'BT' en /etc/nginx/sites-enabled/${NC}"
    echo "   Posiblemente el archivo api/nginx.conf no se copió o no se recargó."
else
    echo -e "   ${GREEN}✅ Configuración encontrada:${NC}"
    echo "$GREP_RESULT"
fi

# 4. PRUEBA EXTERNA (VÍA NGINX)
echo -e "\n4️⃣  ${YELLOW}Probando conexión vía Nginx (Public URL)...${NC}"
PUBLIC_URL="https://carlosperales.dev/other/BT/api/posts"
echo "   URL: $PUBLIC_URL"

# Hacemos la petición y mostramos headers para ver si hay redirecciones o errores extraños
curl -v "$PUBLIC_URL" > /tmp/curl_output.txt 2>&1

HTTP_PUBLIC=$(grep "< HTTP/2" /tmp/curl_output.txt | awk '{print $3}')

if [ "$HTTP_PUBLIC" == "200" ]; then
    echo -e "   ${GREEN}✅ Conexión Pública OK (HTTP 200)${NC}"
else
    echo -e "   ${RED}❌ Fallo Conexión Pública (HTTP $HTTP_PUBLIC)${NC}"
    echo -e "   Analizando logs de acceso de Nginx..."
    tail -n 5 /var/log/nginx/access.log | grep "BT"
    
    echo -e "\n   ${YELLOW}🔍 Análisis de ruta:${NC}"
    echo "   Si Localhost (Paso 2) funcionó pero Pública (Paso 4) falló,"
    echo "   el problema es Nginx. Revisa:"
    echo "   - Que 'proxy_pass' termine en '/' (ej: http://127.0.0.1:3000/api/)"
    echo "   - Que 'location' coincida exactamente con la URL."
fi

echo -e "\n==================================================="
echo -e "🏁 Diagnóstico Finalizado."
