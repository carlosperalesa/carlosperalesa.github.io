#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n🛑 DETENIENDO SERVICIOS...\n"

# 1. Rutas
MAIN_DIR="/var/www/html-static"
API_DIR="$MAIN_DIR/api"
BT_DIR="$MAIN_DIR/other/BT"

# Detect if running locally (Windows path might differ, but this script is mainly for Linux/Server)
if [ -d "api" ]; then
    # Local fallback logic if running from repo root
    API_DIR="./api"
    BT_DIR="./other/BT"
fi

# 2. Stop Main API
echo -e "${BLUE}▶ Deteniendo Main API...${NC}"
if [ -d "$API_DIR" ]; then
    cd "$API_DIR" && docker compose down
else
    echo "⚠️ Directorio API no encontrado"
fi

# 3. Stop BT
echo -e "${BLUE}▶ Deteniendo Bruja Teatral...${NC}"
if [ -d "$BT_DIR" ]; then
    cd "$BT_DIR" && docker compose down
else
    echo "⚠️ Directorio BT no encontrado"
fi

echo -e "\n${GREEN}✅ Todos los servicios detenidos.${NC}\n"
