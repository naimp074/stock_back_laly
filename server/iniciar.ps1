# Script para iniciar el servidor backend
Write-Host "🚀 Iniciando servidor backend..." -ForegroundColor Green
Write-Host ""

# Verificar que estamos en la carpeta correcta
if (-not (Test-Path "server.js")) {
    Write-Host "❌ Error: No se encuentra server.js" -ForegroundColor Red
    Write-Host "Ejecuta este script desde la carpeta server/" -ForegroundColor Yellow
    exit 1
}

# Verificar que existe .env
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Advertencia: No se encuentra archivo .env" -ForegroundColor Yellow
    Write-Host "Creando archivo .env desde env.example.txt..." -ForegroundColor Yellow
    Copy-Item "config\env.example.txt" ".env"
    Write-Host "✅ Archivo .env creado. Verifica la configuración antes de continuar." -ForegroundColor Green
}

# Verificar que node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# Iniciar servidor
Write-Host "▶️  Iniciando servidor en modo desarrollo..." -ForegroundColor Cyan
Write-Host ""
npm run dev



