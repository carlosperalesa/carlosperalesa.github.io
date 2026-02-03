#!/bin/bash

# ========================================
# Fix Permissions Script for BT
# ========================================
# Este script arregla los permisos de la carpeta uploads
# Se ejecuta después de cada deploy para asegurar que funciona correctamente

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔧 Arreglando permisos del proyecto BT..."
echo "📁 Directorio: $SCRIPT_DIR"

# Verificar que estamos en el directorio correcto
if [ ! -f "Dockerfile" ]; then
    echo "❌ ERROR: No estamos en el directorio correcto del proyecto BT"
    exit 1
fi

# Si el contenedor está corriendo, entrar y arreglar permisos dentro
if docker ps | grep -q bruja-teatral; then
    echo "✅ Contenedor bruja-teatral está corriendo"
    echo "🔐 Arreglando permisos dentro del contenedor..."
    
    docker exec bruja-teatral chmod -R 777 /app/public/uploads
    docker exec bruja-teatral chmod -R 755 /app/public
    
    echo "✅ Permisos arreglados dentro del contenedor"
else
    echo "⚠️ Contenedor bruja-teatral no está corriendo"
    echo "🔐 Arreglando permisos en el sistema de archivos local..."
    
    if [ -d "public/uploads" ]; then
        chmod -R 777 public/uploads
        chmod -R 755 public
        echo "✅ Permisos arreglados en el sistema de archivos"
    else
        echo "⚠️ Directorio public/uploads no encontrado"
    fi
fi

echo ""
echo "📊 Verificando permisos finales..."
if docker ps | grep -q bruja-teatral; then
    docker exec bruja-teatral ls -la /app/public/uploads
else
    ls -la public/uploads
fi

echo ""
echo "✅ Script de permisos completado!"
