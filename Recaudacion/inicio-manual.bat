@echo off
cd /d "%~dp0"
echo ========================================
echo   SISTEMA DE RECAUDACION
echo ========================================
echo.
echo Directorio actual: %cd%
echo.

REM Verificar Node.js
echo Verificando Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Node.js no encontrado
    echo.
    echo 📥 SOLUCION:
    echo 1. Ve a: https://nodejs.org/
    echo 2. Descarga la version LTS
    echo 3. Instala con configuracion por defecto
    echo 4. Reinicia este script
    echo.
    echo Presiona cualquier tecla para abrir la pagina de descarga...
    pause >nul
    start https://nodejs.org/
    exit /b 1
)

node --version
echo ✅ Node.js encontrado
echo.

REM Verificar archivos
echo Verificando archivos del proyecto...
if not exist "package.json" (
    echo ❌ ERROR: package.json no encontrado
    echo Asegurate de estar en la carpeta correcta del proyecto
    echo.
    pause
    exit /b 1
)
echo ✅ package.json encontrado

if not exist "server.js" (
    echo ❌ ERROR: server.js no encontrado
    echo.
    pause
    exit /b 1
)
echo ✅ server.js encontrado

REM Crear .env si no existe
if not exist ".env" (
    echo Creando archivo .env...
    (
        echo NODE_ENV=development
        echo PORT=3000
        echo MONGODB_URI=mongodb+srv://omivip90:8ihmbg6EjldKPRhs@cluster0.dw67vcu.mongodb.net/recaudacion?retryWrites=true^&w=majority^&appName=Cluster0
        echo JWT_SECRET=mi_clave_secreta_recaudacion_2024
    ) > .env
    echo ✅ .env creado
)

REM Instalar dependencias
if not exist "node_modules" (
    echo.
    echo 📦 Instalando dependencias...
    echo Esto puede tomar unos minutos...
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo ❌ ERROR instalando dependencias
        echo.
        pause
        exit /b 1
    )
    echo ✅ Dependencias instaladas
)

echo.
echo 🚀 Iniciando servidor...
echo.
echo 📊 Dashboard: http://localhost:3000
echo 🔧 Admin Panel: http://localhost:3000/admin.html
echo.
echo ⚠️  IMPORTANTE: NO CIERRES ESTA VENTANA
echo    El servidor se ejecuta aqui
echo.
echo 💡 Para detener: Presiona Ctrl+C
echo ========================================
echo.

REM Iniciar servidor
npm start

echo.
echo Servidor detenido.
pause
