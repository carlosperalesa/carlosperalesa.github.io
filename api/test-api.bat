@echo off
echo ========================================
echo   PRUEBA DE CONTACT API
echo ========================================
echo.

echo [1/3] Verificando que la API este corriendo...
curl.exe -s http://localhost:5000/api/health
echo.
echo.

echo [2/3] Enviando mensaje de prueba...
curl.exe -X POST http://localhost:5000/api/contact ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test User\",\"phone\":\"+56912345678\",\"email\":\"test@example.com\",\"subject\":\"Prueba de contacto\",\"message\":\"Este es un mensaje de prueba desde el script.\"}"
echo.
echo.

echo [3/3] Verificando mensajes guardados...
curl.exe -s http://localhost:5000/api/contacts
echo.
echo.

echo ========================================
echo   PRUEBA COMPLETADA
echo ========================================
echo.
echo Presiona cualquier tecla para salir...
pause >nul
