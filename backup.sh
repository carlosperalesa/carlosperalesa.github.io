#!/bin/bash

# ============================================
# Backup Script for carlosperales.dev
# Backs up: Databases + Uploads
# ============================================

set -e

BACKUP_DIR="/var/backups/carlosperales"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

echo "[$(date)] Starting backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# ============================================
# 1. Backup Contact API Database (Main)
# ============================================
echo "📦 Backing up Contact API database..."
CONTACT_DB="/var/www/html-static/api/data/contactos.db"
if [ -f "$CONTACT_DB" ]; then
    cp "$CONTACT_DB" "$BACKUP_DIR/contacts_$DATE.db"
    echo "✅ Contact API database backed up"
else
    echo "⚠️ Contact API database not found"
fi

# ============================================
# 2. Cleanup old backups
# ============================================
echo "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete
echo "✅ Old backups cleaned up"

# ============================================
# 3. Summary
# ============================================
echo ""
echo "============================================"
echo "✅ Backup completed: $DATE"
echo "============================================"
echo "Location: $BACKUP_DIR"
ls -lh "$BACKUP_DIR" | tail -5
echo ""
