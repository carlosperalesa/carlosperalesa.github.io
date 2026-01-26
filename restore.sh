#!/bin/bash

# ============================================
# Restore Script for carlosperales.dev
# Restores: Databases + Uploads from /var/backups/carlosperales
# ============================================

BACKUP_DIR="/var/backups/carlosperales"
HTML_DIR="/var/www/html-static"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Iniciando sistema de restauración de Carlos Perales Dev${NC}"

# Check if backup directory exists and has files
if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR")" ]; then
    echo -e "${RED}❌ No se encontraron backups en $BACKUP_DIR${NC}"
    exit 1
fi

# List available backups by date (grouped by timestamp)
echo -e "\n${YELLOW}Backups disponibles:${NC}"
ls -1 "$BACKUP_DIR" | grep "contacts_" | sed 's/contacts_//;s/.db//' | sort -r | head -n 10

echo -e "\n${BLUE}Introduce el timestamp del backup que deseas restaurar (ej: 20260126_011048):${NC}"
read TIMESTAMP

if [ -z "$TIMESTAMP" ]; then
    echo -e "${RED}❌ Timestamp no válido.${NC}"
    exit 1
fi

# Files to restore
CONTACT_DB_BK="$BACKUP_DIR/contacts_$TIMESTAMP.db"
BT_DB_BK="$BACKUP_DIR/bruja_teatral_$TIMESTAMP.db"
BT_UPLOADS_BK="$BACKUP_DIR/bt_uploads_$TIMESTAMP.tar.gz"

# Verify files exist
if [ ! -f "$CONTACT_DB_BK" ] && [ ! -f "$BT_DB_BK" ]; then
    echo -e "${RED}❌ No se encontraron archivos para el timestamp: $TIMESTAMP${NC}"
    exit 1
fi

echo -e "\n${RED}⚠️  ¡ADVERTENCIA! Esto sobrescribirá los datos actuales.${NC}"
echo -e "Escribe 'SI' para confirmar la restauración:"
read CONFIRM

if [ "$CONFIRM" != "SI" ]; then
    echo "Operación cancelada."
    exit 0
fi

# 1. Stop Containers
echo -e "\n🛑 Deteniendo contenedores..."
cd "$HTML_DIR/api" && docker compose stop
cd "$HTML_DIR/other/BT" && docker compose stop

# 2. Restore Databases
echo -e "\n📦 Restaurando bases de datos..."
if [ -f "$CONTACT_DB_BK" ]; then
    cp "$CONTACT_DB_BK" "$HTML_DIR/api/data/contactos.db"
    chown 1000:1000 "$HTML_DIR/api/data/contactos.db"
    echo "✅ Contact API DB restaurada"
fi

if [ -f "$BT_DB_BK" ]; then
    cp "$BT_DB_BK" "$HTML_DIR/other/BT/database.db"
    chown 1000:1000 "$HTML_DIR/other/BT/database.db"
    echo "✅ Bruja Teatral DB restaurada"
fi

# 3. Restore Uploads
if [ -f "$BT_UPLOADS_BK" ]; then
    echo -e "\n🖼️ Restaurando carpeta de uploads..."
    rm -rf "$HTML_DIR/other/BT/public/uploads/*"
    tar -xzf "$BT_UPLOADS_BK" -C "$HTML_DIR/other/BT/public/uploads/"
    chown -R 1000:1000 "$HTML_DIR/other/BT/public/uploads"
    echo "✅ Bruja Teatral uploads restaurados"
fi

# 4. Restart Containers
echo -e "\n🚀 Reiniciando contenedores..."
cd "$HTML_DIR/api" && docker compose start
cd "$HTML_DIR/other/BT" && docker compose start

echo -e "\n${GREEN}✨ RESTAURACIÓN COMPLETADA CON ÉXITO ✨${NC}"
