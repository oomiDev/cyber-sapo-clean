# Script PowerShell para iniciar el sistema de recaudación
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SISTEMA DE RECAUDACION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio del script
Set-Location $PSScriptRoot
Write-Host "Directorio: $PWD" -ForegroundColor Yellow
Write-Host ""

# Verificar archivos
Write-Host "Verificando archivos..." -ForegroundColor Green
if (!(Test-Path "package.json")) {
    Write-Host "❌ ERROR: package.json no encontrado" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}
Write-Host "✅ package.json encontrado" -ForegroundColor Green

if (!(Test-Path "server.js")) {
    Write-Host "❌ ERROR: server.js no encontrado" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}
Write-Host "✅ server.js encontrado" -ForegroundColor Green

# Crear .env si no existe
if (!(Test-Path ".env")) {
    Write-Host "Creando archivo .env..." -ForegroundColor Yellow
    @"
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://omivip90:8ihmbg6EjldKPRhs@cluster0.dw67vcu.mongodb.net/recaudacion?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=mi_clave_secreta_recaudacion_2024
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ .env creado" -ForegroundColor Green
}

# Instalar dependencias
if (!(Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    Write-Host "Esto puede tomar unos minutos..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
        Read-Host "Presiona Enter para salir"
        exit 1
    }
    Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Green
Write-Host ""
Write-Host "📊 Dashboard: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Admin Panel: http://localhost:3000/admin.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANTE: NO CIERRES ESTA VENTANA" -ForegroundColor Yellow
Write-Host "   El servidor se ejecuta aquí" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Para detener: Presiona Ctrl+C" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Iniciar servidor
npm start

Write-Host ""
Write-Host "Servidor detenido." -ForegroundColor Yellow
Read-Host "Presiona Enter para salir"
