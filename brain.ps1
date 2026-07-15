# brain.ps1 — Lanza OpenCode con DeepSeek + MCP LifeOS
# Uso: .\brain.ps1  (desde la raíz del proyecto)

# Carga variables desde .env al entorno del shell actual
Get-Content .env -ErrorAction SilentlyContinue |
  Where-Object { $_ -match '^([^#\s][^=]*)=(.*)$' } |
  ForEach-Object {
    $name  = $Matches[1].Trim()
    $value = $Matches[2].Trim().Trim('"').Trim("'")
    [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
  }

Write-Host "✅ Variables de entorno cargadas (.env)" -ForegroundColor Green
Write-Host "🧠 Iniciando LifeOS Brain con DeepSeek..." -ForegroundColor Cyan

opencode
