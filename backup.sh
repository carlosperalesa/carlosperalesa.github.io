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
# 1. Backup Contact API Database
# ============================================
echo "📦 Backing up Contact API database..."
CONTACT_DB="/var/www/html-static/api/data/contacts.db"
if [ -f "$CONTACT_DB" ]; then
    cp "$CONTACT_DB" "$BACKUP_DIR/contacts_$DATE.db"
    echo "✅ Contact API database backed up"
else
    echo "⚠️ Contact API database not found"
fi

# ============================================
# 2. Backup Bruja Teatral Database
# ============================================
echo "📦 Backing up Bruja Teatral database..."
BT_DB="/var/www/html-static/other/BT/database.db"
if [ -f "$BT_DB" ]; then
    cp "$BT_DB" "$BACKUP_DIR/bruja_teatral_$DATE.db"
    echo "✅ Bruja Teatral database backed up"
else
    echo "⚠️ Bruja Teatral database not found"
fi

# ============================================
# 3. Backup Bruja Teatral Uploads
# ============================================
echo "📦 Backing up Bruja Teatral uploads..."
BT_UPLOADS="/var/www/html-static/other/BT/public/uploads"
if [ -d "$BT_UPLOADS" ]; then
    tar -czf "$BACKUP_DIR/bt_uploads_$DATE.tar.gz" -C "$BT_UPLOADS" .
    echo "✅ Bruja Teatral uploads backed up"
else
    echo "⚠️ Bruja Teatral uploads folder not found"
fi

# ============================================
# 4. Cleanup old backups
# ============================================
echo "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete
echo "✅ Old backups cleaned up"

# ============================================
# 5. Summary
# ============================================
echo ""
echo "============================================"
echo "✅ Backup completed: $DATE"
echo "============================================"
echo "Location: $BACKUP_DIR"
ls -lh "$BACKUP_DIR" | tail -5
echo ""
echo "Total backup size:"
du -sh "$BACKUP_DIR"
