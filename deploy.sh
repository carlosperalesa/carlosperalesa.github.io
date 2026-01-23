#!/bin/bash

# Auto-deploy script for Bruja Teatral (and static site)

echo "[$(date)] - Starting deploy..."

# 1. Update Code
cd /var/www/html-static
git fetch origin
git reset --hard origin/main

# 2. Setup Python Backend for Bruja Teatral
echo "[$(date)] - Setting up Python environment..."
cd /var/www/html-static/other/BT

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "Virtual environment created."
fi

# Install dependencies
./.venv/bin/pip install -r requirements.txt

# 3. Permissions
# Ensure database folder/file is writable by www-data
chown -R www-data:www-data /var/www/html-static/other/BT
chmod -R 775 /var/www/html-static/other/BT/public/uploads
if [ -f "database.db" ]; then
    chmod 664 database.db
fi
# If dir exists but no db yet, ensure dir is writable so app can create it
chmod 775 /var/www/html-static/other/BT

# 4. Restart Service
echo "[$(date)] - Restarting Gunicorn service..."
# We use sudo here assuming the user running deploy might need it, 
# but if running as root (per your cron/ssh), it's fine.
systemctl daemon-reload
systemctl enable --now bruja_teatral.service
systemctl restart bruja_teatral.service

echo "[$(date)] - Deploy completed successfully."
