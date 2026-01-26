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
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup directory not found: $BACKUP_DIR"
    exit 1
fi

# Find the LATEST backup file for contacts
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/contacts_*.db 2>/dev/null | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ No backups found for contacts database."
    exit 1
fi

echo "🔍 Latest backup found: $(basename "$LATEST_BACKUP")"
echo "🚀 Starting automatic restore procedure..."

# 1. Stop API Container
echo "🛑 Stopping API container..."
cd "$HTML_DIR/api" && docker compose stop

# 2. Restore Database
echo "📦 Restoring database file..."
TARGET_DB="$HTML_DIR/api/data/contactos.db"

if cp "$LATEST_BACKUP" "$TARGET_DB"; then
    echo "✅ Database file copied successfully."
    
    # Ensure ownership is correct (User 1000 for Docker)
    echo "🔧 Adjusting permissions..."
    chown 1000:1000 "$TARGET_DB"
    chmod 664 "$TARGET_DB"
    
    echo "✅ Permissions OK."
else
    echo "❌ Failed to copy backup file."
    exit 1
fi

# 3. Restart API Container
echo "🚀 Restarting API container..."
cd "$HTML_DIR/api" && docker compose start

echo ""
echo "✨ RESTORE COMPLETED SUCCESSFULLY ✨"
