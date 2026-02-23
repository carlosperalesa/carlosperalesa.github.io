#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n🛑 DETENIENDO SERVICIOS...\n"

# 1. Detener PocketBase (systemd)
echo -e "${BLUE}▶ Deteniendo PocketBase...${NC}"
if command -v systemctl >/dev/null 2>&1; then
    systemctl stop pocketbase || echo "⚠️ Servicio pocketbase no encontrado"
else
    echo "⚠️ Systemd no disponible"
fi

echo -e "\n${GREEN}✅ Todos los servicios detenidos.${NC}\n"
