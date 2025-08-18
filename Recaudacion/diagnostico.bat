@echo off
echo ========================================
echo   DIAGNOSTICO DEL SISTEMA
echo ========================================
echo.

echo 🔍 Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js NO está instalado
    echo 📥 Descargar desde: https://nodejs.org/
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Node.js detectado
)
echo.

echo 🔍 Verificando npm...
npm --version
if %errorlevel% neq 0 (
    echo ❌ npm NO está disponible
    pause
    exit /b 1
) else (
    echo ✅ npm detectado
)
echo.

echo 🔍 Verificando archivos del proyecto...
if exist "package.json" (
    echo ✅ package.json encontrado
) else (
    echo ❌ package.json NO encontrado
)

if exist "server.js" (
    echo ✅ server.js encontrado
) else (
    echo ❌ server.js NO encontrado
)

if exist ".env" (
    echo ✅ .env encontrado
) else (
    echo ❌ .env NO encontrado - creando...
    echo NODE_ENV=development > .env
    echo PORT=3000 >> .env
    echo MONGODB_URI=mongodb+srv://omivip90:8ihmbg6EjldKPRhs@cluster0.dw67vcu.mongodb.net/recaudacion?retryWrites=true^&w=majority^&appName=Cluster0 >> .env
    echo JWT_SECRET=mi_clave_secreta_recaudacion_2024 >> .env
    echo ✅ .env creado
)

if exist "node_modules" (
    echo ✅ node_modules encontrado
) else (
    echo ❌ node_modules NO encontrado - instalando...
    npm install
    if %errorlevel% equ 0 (
        echo ✅ Dependencias instaladas
    ) else (
        echo ❌ Error instalando dependencias
        pause
        exit /b 1
    )
)
echo.

echo 🚀 Intentando iniciar servidor...
echo 📊 Dashboard: http://localhost:3000
echo 🔧 Admin Panel: http://localhost:3000/admin.html
echo.
echo 💡 Si hay errores, se mostrarán abajo:
echo ========================================
npm start
