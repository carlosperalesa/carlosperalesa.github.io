#!/bin/bash
# =============================================================
# DIAGNÓSTICO COMPLETO - PROYECTO BT
# =============================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
OK="${GREEN}✔${NC}"
FAIL="${RED}✖${NC}"
WARN="${YELLOW}⚠${NC}"

BT_DIR="/var/www/BT"
NGINX_CONF="/etc/nginx/sites-enabled/carlosperales.dev"

section() { echo -e "\n${BLUE}══════════════════════════════════════${NC}"; echo -e "${BLUE}  $1${NC}"; echo -e "${BLUE}══════════════════════════════════════${NC}"; }

# --------------------------------------------------------------
section "1. ARCHIVOS EN /var/www/BT"
# --------------------------------------------------------------
echo "Listado raíz del directorio:"
ls -la "$BT_DIR/" | head -20
echo ""
echo "Subdirectorios detectados:"
ls -d "$BT_DIR"/*/ 2>/dev/null || echo "  (ninguno)"

# --------------------------------------------------------------
section "2. INDEX.HTML - ¿QUÉ SE ESTÁ SIRVIENDO?"
# --------------------------------------------------------------
INDEX="$BT_DIR/index.html"
if [ -f "$INDEX" ]; then
    echo -e "$OK index.html encontrado en $INDEX"
    echo "--- Primeras 20 líneas ---"
    head -n 20 "$INDEX"
else
    echo -e "$FAIL NO existe index.html en $BT_DIR"
fi

# PocketBase pb_public
PBPUBLIC="$BT_DIR/pb_public"
if [ -d "$PBPUBLIC" ]; then
    echo -e "\n$WARN Existe una carpeta pb_public en $PBPUBLIC:"
    ls -la "$PBPUBLIC/" | head -10
    echo -e "\n  -- Primeras 20 líneas de pb_public/index.html --"
    head -n 20 "$PBPUBLIC/index.html" 2>/dev/null || echo "  (no existe index.html en pb_public)"
fi

# --------------------------------------------------------------
section "3. PERMISOS"
# --------------------------------------------------------------
OWNER=$(stat -c '%U' "$BT_DIR" 2>/dev/null)
echo "Dueño de $BT_DIR: $OWNER"
[ "$OWNER" = "www-data" ] && echo -e "$OK Dueño correcto (www-data)" || echo -e "$WARN Dueño inesperado: $OWNER (debería ser www-data)"

BAD_PERM=$(find "$BT_DIR" -not -path "$BT_DIR/.git/*" \( -type f -not -perm 644 -o -type d -not -perm 755 \) 2>/dev/null | head -5)
if [ -z "$BAD_PERM" ]; then
    echo -e "$OK Permisos de archivos/directorios correctos (644/755)"
else
    echo -e "$FAIL Permisos incorrectos en:"
    echo "$BAD_PERM"
fi

# --------------------------------------------------------------
section "4. NGINX - CONFIGURACIÓN PARA /bt/"
# --------------------------------------------------------------
if [ -f "$NGINX_CONF" ]; then
    echo -e "$OK Archivo de configuración encontrado: $NGINX_CONF"
    echo "--- Bloques relativos a /bt/ ---"
    grep -n -A 8 "location /bt" "$NGINX_CONF"
else
    echo -e "$FAIL NO se encontró: $NGINX_CONF"
    echo "Archivos en sites-enabled:"
    ls -la /etc/nginx/sites-enabled/
fi

echo ""
echo "--- Test de sintaxis Nginx ---"
nginx -t 2>&1

# Verificar que el alias apunta a la carpeta correcta
ALIAS_PATH=$(grep -A 3 "location /bt/ {" "$NGINX_CONF" 2>/dev/null | grep "alias" | awk '{print $2}' | tr -d ';')
if [ -n "$ALIAS_PATH" ]; then
    echo -e "\nNginx sirve /bt/ desde: $ALIAS_PATH"
    [ -d "${ALIAS_PATH%/}" ] && echo -e "$OK El directorio existe" || echo -e "$FAIL El directorio NO existe"
else
    echo -e "$WARN No se encontró directiva 'alias' para /bt/"
fi

# --------------------------------------------------------------
section "5. CERTBOT / SSL"
# --------------------------------------------------------------
echo "Verificando certificados Let's Encrypt:"
if command -v certbot &>/dev/null; then
    certbot certificates 2>&1 | grep -E "(Domains|Expiry|Path|INVALID|VALID)"
else
    echo -e "$WARN certbot no instalado"
fi

echo ""
echo "Escucha en puertos 80 y 443:"
ss -tuln | grep -E ":80|:443" || echo -e "$FAIL Nginx NO está escuchando en 80/443"

# --------------------------------------------------------------
section "6. POCKETBASE BT (puerto 8091)"
# --------------------------------------------------------------
echo "Estado del servicio pocketbase-bt:"
systemctl status pocketbase-bt --no-pager 2>/dev/null | head -15 || echo -e "$FAIL Servicio pocketbase-bt no encontrado"

echo ""
echo "Respuesta interna en puerto 8091:"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8091/api/health 2>/dev/null)
[ "$STATUS" = "200" ] && echo -e "$OK PocketBase BT respondió 200 en /api/health" || echo -e "$FAIL PocketBase BT respondió: $STATUS (se esperaba 200)"

echo ""
echo "Respuesta Admin UI /bt/_/ (vía Nginx):"
STATUS_ADMIN=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8091/_/ 2>/dev/null)
[ "$STATUS_ADMIN" = "200" ] && echo -e "$OK Admin UI BT respondió 200" || echo -e "$FAIL Admin UI BT respondió: $STATUS_ADMIN"

# --------------------------------------------------------------
section "7. LOGS RECIENTES DE NGINX (errores)"
# --------------------------------------------------------------
echo "Últimas 20 líneas del error.log de Nginx:"
tail -n 20 /var/log/nginx/error.log 2>/dev/null || echo "(no encontrado)"

# --------------------------------------------------------------
section "8. RESUMEN DE DIAGNÓSTICO"
# --------------------------------------------------------------
echo -e "\nURL que está siendo servida en /bt/: $(curl -s -o /dev/null -w "%{redirect_url}" https://carlosperales.dev/bt/ 2>/dev/null || echo 'N/A')"
echo -e "HTTP Status en https://carlosperales.dev/bt/: $(curl -s -o /dev/null -w "%{http_code}" https://carlosperales.dev/bt/ 2>/dev/null)"
echo -e "\n$OK Diagnóstico completo.\n"
