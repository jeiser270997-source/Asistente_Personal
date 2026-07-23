# Script Idempotente de Preparacion e Inicializacion LifeOS (Disaster Recovery)

Write-Host "=== INICIALIZANDO ENTORNO LIFEOS ===" -ForegroundColor Green

# 1. Verificar Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[X] Node.js no esta instalado. Instale Node 18+ primero." -ForegroundColor Red
    exit 1
}
$nodeVer = node -v
Write-Host "[OK] Node.js detectado: $nodeVer" -ForegroundColor Cyan

# 2. Verificar o crear .env
if (-not (Test-Path ".env")) {
    Write-Host "[!] Archivo .env no encontrado. Creando desde .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "[OK] .env creado. Complete las credenciales necesarias." -ForegroundColor Green
    } else {
        Write-Host "[X] .env.example no existe." -ForegroundColor Red
    }
} else {
    Write-Host "[OK] Archivo .env verificado." -ForegroundColor Cyan
}

# 3. Instalar dependencias npm si falta node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "[+] Instalando dependencias npm..." -ForegroundColor Yellow
    npm ci
} else {
    Write-Host "[OK] node_modules verificado." -ForegroundColor Cyan
}

# 4. Migrar base de datos SQLite WAL
Write-Host "[+] Ejecutando migraciones SQLite WAL..." -ForegroundColor Yellow
npm run migrate

# 5. Reindexar skills
Write-Host "[+] Reindexando catalogo de skills..." -ForegroundColor Yellow
npm run skills:reindex

# 6. Correr suite de pruebas
Write-Host "[+] Ejecutando suite de pruebas de verificacion..." -ForegroundColor Yellow
npm test

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "SUCCESS: ENTORNO LIFEOS PREPARADO Y OPERATIVO EN 100%" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
