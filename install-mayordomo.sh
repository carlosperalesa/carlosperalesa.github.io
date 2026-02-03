#!/bin/bash

# Script de instalación del servicio Mayordomo
# Ejecutar: sudo bash install-mayordomo.sh

set -e

echo "📦 Instalando servicio Mayordomo..."

# Copiar archivo de servicio
sudo cp mayordomo.service /etc/systemd/system/

# Recargar systemd
sudo systemctl daemon-reload

# Habilitar inicio automático
sudo systemctl enable mayordomo

# Iniciar servicio
sudo systemctl start mayordomo

# Verificar estado
sudo systemctl status mayordomo --no-pager

echo "✅ Mayordomo instalado y corriendo en puerto 5001"
echo "   Ver logs: journalctl -u mayordomo -f"
echo "   O: tail -f /var/log/mayordomo.log"
