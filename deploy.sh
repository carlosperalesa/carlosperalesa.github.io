#!/bin/bash

# ============================================
# Auto-deploy script for carlosperales.dev
# Includes: Static site + Contact API + Bruja Teatral
# ============================================

set -e  # Exit on error

LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"
SITE_DIR="/var/www/html-static"

echo "$LOG_PREFIX - 🚀 Starting deploy..."

# ============================================
# 1. Update Code from Git
# ============================================
echo "$LOG_PREFIX - 📥 Pulling latest code..."
cd $SITE_DIR
git fetch origin
git reset --hard origin/main

# ============================================
# 2. Deploy Contact API (Docker)
# ============================================
echo "$LOG_PREFIX - 🐳 Deploying Contact API..."
cd $SITE_DIR/api

# Rebuild and restart container
docker-compose down --remove-orphans 2>/dev/null || true
docker-compose build --no-cache
docker-compose up -d

# Wait for health check
echo "$LOG_PREFIX - ⏳ Waiting for Contact API health check..."
sleep 5
if curl -sf http://localhost:5000/api/health > /dev/null; then
    echo "$LOG_PREFIX - ✅ Contact API is healthy"
else
    echo "$LOG_PREFIX - ⚠️ Contact API health check failed"
fi

# ============================================
# 3. Deploy Bruja Teatral (Docker)
# ============================================
echo "$LOG_PREFIX - 🐳 Deploying Bruja Teatral..."
cd $SITE_DIR/other/BT

# Rebuild and restart container
docker-compose down --remove-orphans 2>/dev/null || true
docker-compose build --no-cache
docker-compose up -d

# Wait for health check
echo "$LOG_PREFIX - ⏳ Waiting for BT health check..."
sleep 5
if curl -sf http://localhost:3000/api/health > /dev/null; then
    echo "$LOG_PREFIX - ✅ Bruja Teatral is healthy"
else
    echo "$LOG_PREFIX - ⚠️ BT health check failed"
fi

# ============================================
# 4. Permissions for uploads
# ============================================
echo "$LOG_PREFIX - 🔐 Setting permissions..."
chmod -R 775 $SITE_DIR/other/BT/public/uploads 2>/dev/null || true

# ============================================
# 5. Reload Nginx (if config changed)
# ============================================
echo "$LOG_PREFIX - 🔄 Testing and reloading Nginx..."
if nginx -t 2>/dev/null; then
    systemctl reload nginx
    echo "$LOG_PREFIX - ✅ Nginx reloaded"
else
    echo "$LOG_PREFIX - ⚠️ Nginx config test failed, skipping reload"
fi

# ============================================
# 6. Cleanup old Docker resources
# ============================================
echo "$LOG_PREFIX - 🧹 Cleaning up old Docker resources..."
docker image prune -f 2>/dev/null || true

echo "$LOG_PREFIX - ✅ Deploy completed successfully!"
echo ""
echo "Services status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "contact-api|bruja-teatral" || echo "No containers found"
