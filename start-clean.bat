@echo off
echo 🎮 CYBER SAPO - Inicio Limpio
echo =============================

echo 🔄 Limpiando procesos...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1

echo ⏳ Esperando limpieza...
timeout /t 2 /nobreak >nul

echo 🚀 Iniciando backend...
cd backend
start "CYBER SAPO Backend" node server-simple.js
cd ..

echo ⏳ Esperando backend...
timeout /t 3 /nobreak >nul

echo 🌐 Iniciando frontend...
cd frontend
start "CYBER SAPO Frontend" python -m http.server 8080
cd ..

echo ⏳ Esperando frontend...
timeout /t 2 /nobreak >nul

echo ✅ Servidores iniciados
echo 📊 Backend: http://localhost:3001
echo 🌐 Frontend: http://localhost:8080
echo 🎯 Panel Admin: http://localhost:8080/admin.html

echo.
echo 💡 INSTRUCCIONES:
echo 1. Ve a http://localhost:8080/admin.html
echo 2. Haz clic en "Ver Máquinas" en cualquier ubicación
echo 3. Haz clic en "Analytics" de cualquier máquina
echo 4. Ya tienes 1,444 partidas históricas listas
echo.

start http://localhost:8080/admin.html

echo Presiona cualquier tecla para cerrar...
pause >nul
