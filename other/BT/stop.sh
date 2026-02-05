#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n🛑 DETENIENDO BRUJA TEATRAL...\n"

BT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BLUE}▶ Deteniendo contenedor...${NC}"
cd "$BT_DIR" && docker compose down

echo -e "\n${GREEN}✅ Bruja Teatral detenida.${NC}\n"
