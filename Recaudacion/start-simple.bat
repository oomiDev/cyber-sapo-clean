@echo off
echo ========================================
echo   SISTEMA DE RECAUDACION - INICIO FACIL
echo ========================================
echo.

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado
    echo.
    echo 📥 Descargar Node.js desde: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js detectado
echo.

REM Verificar si las dependencias están instaladas
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Error instalando dependencias
        pause
        exit /b 1
    )
    echo ✅ Dependencias instaladas
    echo.
)

REM Verificar archivo .env
if not exist ".env" (
    echo ⚙️ Creando archivo de configuración...
    copy .env.example .env >nul
    echo.
    echo ⚠️  IMPORTANTE: Edita el archivo .env con tu configuración de MongoDB
    echo    Archivo ubicado en: %cd%\.env
    echo.
    echo 💡 Para MongoDB gratis usa MongoDB Atlas: https://www.mongodb.com/atlas
    echo.
    pause
)

echo 🚀 Iniciando servidor...
echo.
echo 📊 Dashboard: http://localhost:3000
echo 🔧 Admin Panel: http://localhost:3000/admin.html
echo.
echo 💡 Presiona Ctrl+C para detener el servidor
echo.

REM Iniciar el servidor
npm start
