@echo off
echo Enviando mensaje de prueba a la API...
echo.
curl -X POST http://localhost:5000/api/contact ^
  -H "Content-Type: application/json" ^
  -d "{\"name\": \"Tester Automatico\", \"email\": \"test@example.com\", \"message\": \"Este es un mensaje de prueba para verificar el contador\", \"subject\": \"Prueba de Badge\"}"
echo.
echo.
echo Si ves success: true, actualiza el navegador para ver el badge.
pause
