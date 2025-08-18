@echo off
echo ========================================
echo    CYBER SAPO - Reinicio Limpio
echo ========================================

echo.
echo [1/4] Cerrando procesos existentes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM http-server.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo [2/4] Iniciando Backend con Analytics (Puerto 3001)...
cd backend
start "CYBER SAPO Backend Analytics" cmd /k "node server-simple.js"
timeout /t 4 /nobreak >nul

echo.
echo [3/4] Iniciando Frontend (Puerto 8080)...
cd ..\frontend
start "CYBER SAPO Frontend" cmd /k "npx http-server -p 8080 -c-1"
timeout /t 3 /nobreak >nul

echo.
echo [4/4] Sistema iniciado correctamente!
echo.
echo 🎯 URLs disponibles:
echo    - Panel Admin: http://localhost:8080/admin.html
echo    - Analytics: http://localhost:8080/machine-analytics.html?id=1
echo    - Backend API: http://localhost:3001/api/health
echo.
echo 📊 Nuevas funcionalidades:
echo    ✅ Sistema completo de analytics por máquina
echo    ✅ Gráficas de tendencias de recaudación
echo    ✅ Heatmaps de horas pico de demanda
echo    ✅ Distribución semanal y por tipos de juego
echo    ✅ Métricas detalladas de rendimiento
echo    ✅ Tablas de partidas recientes y más largas
echo    ✅ Botones de analytics en panel admin
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause > nul
