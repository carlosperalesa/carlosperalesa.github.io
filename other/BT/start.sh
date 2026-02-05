#!/bin/bash

# ==============================================================================
# SCRIPT DE DESPLIEGUE - BRUJA TEATRAL
# ==============================================================================
# Orden de ejecución:
# 1. Docker Compose (Construir y levantar contenedor)
# 2. Permisos (Ajustar ownership y permisos de datos)
# ==============================================================================

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'
CHECK="✅"

echo -e "\n${BLUE}🚀 INICIANDO BRUJA TEATRAL${NC}\n"

# Directorio de BT
BT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Función auxiliar para ejecutar comandos con log visual
run_step() {
    local cmd="$1"
    local desc="$2"
    echo -e "${BLUE}▶ $desc${NC}"
    echo "----------------------------------------------"
    if eval "$cmd"; then
        echo -e "${GREEN}${CHECK} Paso completado.${NC}\n"
        return 0
    else
        echo -e "${RED}❌ Error en: $desc${NC}\n"
        return 1
    fi
}

# ==============================================================================
# 1. DOCKER COMPOSE
# ==============================================================================
echo -e "⏳ Construyendo y levantando contenedor...\n"
run_step "cd $BT_DIR && docker compose up -d --build" "1. Reconstruyendo Bruja Teatral"

# ==============================================================================
# 2. PERMISOS
# ==============================================================================
echo -e "${BLUE}🔧 2. Ajustando Permisos de Datos...${NC}"

# Asegurar existencia de archivos clave
if [ ! -f "$BT_DIR/database.db" ]; then
    touch "$BT_DIR/database.db"
    echo "   (Creado database.db vacío)"
fi
mkdir -p "$BT_DIR/public/uploads"

# Asignar permisos UID 1000 (Usuario contenedor)
chown 1000:1000 "$BT_DIR/database.db" 2>/dev/null || true
chown -R 1000:1000 "$BT_DIR/public/uploads" 2>/dev/null || true

# Permisos de lectura/escritura
chmod 644 "$BT_DIR/database.db" 2>/dev/null || true
chmod -R 755 "$BT_DIR/public/uploads" 2>/dev/null || true

echo -e "${GREEN}${CHECK} Permisos aplicados.${NC}\n"

# ==============================================================================
# FINALIZACIÓN
# ==============================================================================
echo -e "${GREEN}✨ BRUJA TEATRAL INICIADA EXITOSAMENTE ✨${NC}"
echo -e "   Acceso: https://carlosperales.dev/bt/"
echo -e "   Para verificar estado: ./check.sh\n"
