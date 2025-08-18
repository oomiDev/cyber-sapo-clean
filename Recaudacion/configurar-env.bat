@echo off
echo ========================================
echo   CONFIGURANDO ARCHIVO .ENV
echo ========================================
echo.

REM Crear archivo .env con la configuración
echo # CONFIGURACION DEL SISTEMA DE RECAUDACION > .env
echo NODE_ENV=development >> .env
echo PORT=3000 >> .env
echo MONGODB_URI=mongodb+srv://omivip90:8ihmbg6EjldKPRhs@cluster0.dw67vcu.mongodb.net/recaudacion?retryWrites=true^&w=majority^&appName=Cluster0 >> .env
echo JWT_SECRET=mi_clave_secreta_recaudacion_2024 >> .env
echo. >> .env
echo # CONFIGURACION DE EMAIL (OPCIONAL) >> .env
echo EMAIL_HOST=smtp.gmail.com >> .env
echo EMAIL_PORT=587 >> .env
echo EMAIL_USER= >> .env
echo EMAIL_PASS= >> .env

echo ✅ Archivo .env creado exitosamente
echo.
echo 📄 Configuración aplicada:
echo    - Base de datos: MongoDB Atlas
echo    - Puerto: 3000
echo    - Entorno: Desarrollo
echo.
echo 🚀 Ahora puedes ejecutar: npm install
echo    Después ejecuta: npm start
echo.
echo Presiona cualquier tecla para continuar con la instalación...
pause
echo.
echo 📦 Instalando dependencias...
npm install
echo.
if %errorlevel% equ 0 (
    echo ✅ Dependencias instaladas correctamente
    echo.
    echo 🚀 Iniciando servidor...
    echo 📊 Dashboard: http://localhost:3000
    echo 🔧 Admin Panel: http://localhost:3000/admin.html
    echo.
    echo 💡 Presiona Ctrl+C para detener el servidor
    echo.
    npm start
) else (
    echo ❌ Error instalando dependencias
    echo.
    pause
)
