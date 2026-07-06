# act_runner.ps1
# Corre GitHub Actions localmente usando 'act' (https://github.com/nektos/act)
# Prerequisito: choco install act-cli  (o descargar binario de releases)
# Uso: .\scripts\act_runner.ps1 [nombre-del-job]
# Ejemplos:
#   .\scripts\act_runner.ps1 process-emails
#   .\scripts\act_runner.ps1 run-brain
#   .\scripts\act_runner.ps1 check

param(
  [string]$Job = "process-emails",
  [string]$Workflow = "",
  [switch]$DryRun = $false
)

# Verificar que act está instalado
if (-not (Get-Command act -ErrorAction SilentlyContinue)) {
  Write-Host "❌ 'act' no está instalado." -ForegroundColor Red
  Write-Host "   Instalar con: choco install act-cli" -ForegroundColor Yellow
  Write-Host "   O descargar de: https://github.com/nektos/act/releases" -ForegroundColor Yellow
  exit 1
}

# Verificar que .env existe
if (-not (Test-Path ".env")) {
  Write-Host "❌ .env no encontrado en la raíz del proyecto." -ForegroundColor Red
  exit 1
}

Write-Host "🚀 Ejecutando job '$Job' localmente con act..." -ForegroundColor Cyan

$actArgs = @(
  "-j", $Job,
  "--secret-file", ".env",
  "--container-architecture", "linux/amd64",
  "-P", "ubuntu-22.04=ghcr.io/catthehacker/ubuntu:act-22.04"
)

if ($Workflow) {
  $actArgs += @("-W", ".github/workflows/$Workflow")
}

if ($DryRun) {
  $actArgs += "--dryrun"
  Write-Host "🔍 Modo DryRun — no se ejecutará realmente." -ForegroundColor Yellow
}

Write-Host "Comando: act $($actArgs -join ' ')" -ForegroundColor Gray
act @actArgs
