#!/bin/bash

# ==============================================================================
# SCRIPT DE BACKUP Y RESTORE - BRUJA TEATRAL
# ==============================================================================
# Uso:
#   ./backup.sh backup   - Crear backup de database y uploads
#   ./backup.sh restore  - Restaurar desde el último backup
# ==============================================================================

set -e  # Salir si hay errores

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Directorio de BT
BT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$BT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Archivos a respaldar
DATABASE_FILE="$BT_DIR/database.db"
UPLOADS_DIR="$BT_DIR/public/uploads"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

backup() {
    echo -e "${BLUE}📦 INICIANDO BACKUP...${NC}\n"
    
    # Backup de base de datos
    if [ -f "$DATABASE_FILE" ]; then
        echo -e "${YELLOW}→ Respaldando database.db...${NC}"
        cp "$DATABASE_FILE" "$BACKUP_DIR/database-$TIMESTAMP.db"
        echo -e "${GREEN}✅ Database respaldada: database-$TIMESTAMP.db${NC}"
    else
        echo -e "${RED}⚠️  database.db no encontrado${NC}"
    fi
    
    # Backup de uploads
    if [ -d "$UPLOADS_DIR" ]; then
        echo -e "${YELLOW}→ Respaldando uploads...${NC}"
        tar -czf "$BACKUP_DIR/uploads-$TIMESTAMP.tar.gz" -C "$BT_DIR/public" uploads
        echo -e "${GREEN}✅ Uploads respaldados: uploads-$TIMESTAMP.tar.gz${NC}"
    else
        echo -e "${RED}⚠️  Directorio uploads no encontrado${NC}"
    fi
    
    # Crear archivo de metadata
    cat > "$BACKUP_DIR/backup-$TIMESTAMP.info" <<EOF
Backup Date: $(date)
Database: database-$TIMESTAMP.db
Uploads: uploads-$TIMESTAMP.tar.gz
Location: $BT_DIR
EOF
    
    echo -e "\n${GREEN}✅ BACKUP COMPLETADO${NC}"
    echo -e "Ubicación: $BACKUP_DIR"
    echo -e "Archivos:"
    echo -e "  - database-$TIMESTAMP.db"
    echo -e "  - uploads-$TIMESTAMP.tar.gz"
    echo -e "  - backup-$TIMESTAMP.info\n"
}

restore() {
    echo -e "${BLUE}🔄 INICIANDO RESTORE...${NC}\n"
    
    # Listar backups disponibles
    echo -e "${YELLOW}Backups disponibles:${NC}"
    ls -1t "$BACKUP_DIR"/*.info 2>/dev/null | head -5 | while read -r info_file; do
        basename "$info_file" .info
    done
    
    # Buscar el último backup
    LATEST_INFO=$(ls -1t "$BACKUP_DIR"/*.info 2>/dev/null | head -1)
    
    if [ -z "$LATEST_INFO" ]; then
        echo -e "${RED}❌ No se encontraron backups${NC}"
        exit 1
    fi
    
    BACKUP_ID=$(basename "$LATEST_INFO" .info)
    echo -e "\n${YELLOW}→ Restaurando desde: $BACKUP_ID${NC}\n"
    
    # Confirmar con el usuario
    read -p "¿Confirmar restauración? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo -e "${RED}❌ Restore cancelado${NC}"
        exit 0
    fi
    
    # Detener contenedor si está corriendo
    echo -e "${YELLOW}→ Deteniendo contenedor...${NC}"
    docker compose down 2>/dev/null || true
    
    # Restaurar database
    DB_BACKUP="$BACKUP_DIR/database-${BACKUP_ID#backup-}.db"
    if [ -f "$DB_BACKUP" ]; then
        echo -e "${YELLOW}→ Restaurando database.db...${NC}"
        cp "$DB_BACKUP" "$DATABASE_FILE"
        echo -e "${GREEN}✅ Database restaurada${NC}"
    else
        echo -e "${RED}⚠️  Backup de database no encontrado${NC}"
    fi
    
    # Restaurar uploads
    UPLOADS_BACKUP="$BACKUP_DIR/uploads-${BACKUP_ID#backup-}.tar.gz"
    if [ -f "$UPLOADS_BACKUP" ]; then
        echo -e "${YELLOW}→ Restaurando uploads...${NC}"
        rm -rf "$UPLOADS_DIR"
        mkdir -p "$BT_DIR/public"
        tar -xzf "$UPLOADS_BACKUP" -C "$BT_DIR/public"
        echo -e "${GREEN}✅ Uploads restaurados${NC}"
    else
        echo -e "${RED}⚠️  Backup de uploads no encontrado${NC}"
    fi
    
    # Ajustar permisos
    echo -e "${YELLOW}→ Ajustando permisos...${NC}"
    chown 1000:1000 "$DATABASE_FILE" 2>/dev/null || true
    chown -R 1000:1000 "$UPLOADS_DIR" 2>/dev/null || true
    chmod 644 "$DATABASE_FILE" 2>/dev/null || true
    chmod -R 755 "$UPLOADS_DIR" 2>/dev/null || true
    
    echo -e "\n${GREEN}✅ RESTORE COMPLETADO${NC}"
    echo -e "${YELLOW}Recuerda reiniciar el contenedor: docker compose up -d${NC}\n"
}

# Main
case "$1" in
    backup)
        backup
        ;;
    restore)
        restore
        ;;
    *)
        echo "Uso: $0 {backup|restore}"
        echo ""
        echo "  backup  - Crear backup de database y uploads"
        echo "  restore - Restaurar desde el último backup"
        exit 1
        ;;
esac
