#!/bin/bash

echo "========================================"
echo "Instalando Docker en DigitalOcean Droplet"
echo "========================================"
echo ""

# Update package index
echo "1/5 Actualizando paquetes del sistema..."
sudo apt-get update -qq

# Install prerequisites
echo "2/5 Instalando prerequisitos..."
sudo apt-get install -y -qq \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
echo "3/5 Agregando clave GPG de Docker..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo "4/5 Configurando repositorio de Docker..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
echo "5/5 Instalando Docker Engine..."
sudo apt-get update -qq
sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
echo ""
echo "Iniciando servicio Docker..."
sudo systemctl start docker
sudo systemctl enable docker

# Test Docker installation
echo ""
echo "========================================"
echo "Verificando instalacion..."
echo "========================================"
docker --version
docker compose version

echo ""
echo "========================================"
echo "✅ Docker instalado correctamente!"
echo "========================================"
echo ""
echo "Comandos utiles:"
echo "  sudo docker ps              - Ver contenedores corriendo"
echo "  sudo docker compose up -d   - Iniciar aplicacion"
echo "  sudo docker compose logs -f - Ver logs en tiempo real"
echo ""
