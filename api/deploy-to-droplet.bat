@echo off
echo ========================================
echo   DEPLOY CONTACT API TO DROPLET
echo ========================================
echo.

set DROPLET_IP=64.23.156.112
set DROPLET_PATH=/var/www/portfolio-api

echo [1/5] Creando directorio en el droplet...
ssh root@%DROPLET_IP% "mkdir -p %DROPLET_PATH%"
echo.

echo [2/5] Copiando archivos al droplet...
scp -r * root@%DROPLET_IP%:%DROPLET_PATH%/
echo.

echo [3/5] Construyendo imagen Docker en el droplet...
ssh root@%DROPLET_IP% "cd %DROPLET_PATH% && sudo docker compose build"
echo.

echo [4/5] Levantando contenedor...
ssh root@%DROPLET_IP% "cd %DROPLET_PATH% && sudo docker compose up -d"
echo.

echo [5/5] Verificando estado...
ssh root@%DROPLET_IP% "cd %DROPLET_PATH% && sudo docker compose ps"
echo.

echo ========================================
echo   DEPLOYMENT COMPLETADO
echo ========================================
echo.
echo La API deberia estar disponible en:
echo http://%DROPLET_IP%:5000/api/health
echo.
echo No olvides configurar Nginx para enrutar /api/ al puerto 5000
echo.
pause
