#!/bin/bash

echo "========================================"
echo "Desplegando Bruja Teatral en DigitalOcean"
echo "========================================"
echo ""

# Variables - MODIFICA ESTAS
DROPLET_IP="64.23.156.112"
DROPLET_USER="root"
PROJECT_DIR="/var/www/bruja-teatral"
DOMAIN="carlosperales.dev"  # Tu dominio actual

echo "Configuracion:"
echo "  IP: $DROPLET_IP"
echo "  Usuario: $DROPLET_USER"
echo "  Directorio: $PROJECT_DIR"
echo "  Dominio: $DOMAIN"
echo ""
read -p "¿Continuar? (s/n): " CONFIRM
if [ "$CONFIRM" != "s" ]; then
    echo "Cancelado."
    exit 0
fi

echo ""
echo "1/6 Conectando al droplet y creando directorio..."
ssh $DROPLET_USER@$DROPLET_IP "mkdir -p $PROJECT_DIR"

echo "2/6 Copiando archivos del proyecto..."
scp -r ./* $DROPLET_USER@$DROPLET_IP:$PROJECT_DIR/

echo "3/6 Instalando Docker en el droplet..."
ssh $DROPLET_USER@$DROPLET_IP "bash $PROJECT_DIR/install-docker-droplet.sh"

echo "4/6 Configurando variables de entorno..."
ssh $DROPLET_USER@$DROPLET_IP << 'EOF'
cd /var/www/bruja-teatral
cat > .env << 'ENVEOF'
PORT=3000
FLASK_ENV=production
SECRET_KEY=$(openssl rand -hex 32)
ENVEOF
echo "✓ Variables de entorno configuradas"
EOF

echo "5/6 Construyendo imagen Docker..."
ssh $DROPLET_USER@$DROPLET_IP "cd $PROJECT_DIR && sudo docker compose build"

echo "6/6 Iniciando contenedor..."
ssh $DROPLET_USER@$DROPLET_IP "cd $PROJECT_DIR && sudo docker compose up -d"

echo ""
echo "========================================"
echo "✅ Despliegue completado!"
echo "========================================"
echo ""
echo "La aplicacion esta corriendo en:"
echo "  http://$DROPLET_IP:3000"
echo ""
echo "Para configurar con tu dominio:"
echo "  http://$DOMAIN/other/BT/"
echo ""
echo "Comandos utiles (ejecutar en el droplet):"
echo "  ssh $DROPLET_USER@$DROPLET_IP"
echo "  cd $PROJECT_DIR"
echo "  sudo docker compose logs -f    # Ver logs"
echo "  sudo docker compose restart    # Reiniciar"
echo "  sudo docker compose down       # Detener"
echo ""
