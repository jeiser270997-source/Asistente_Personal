Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   Generador de Contextos Modulares (IA Local 6GB) " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# Limpiar anteriores
Remove-Item -Path .\ctx_*.md -Force -ErrorAction SilentlyContinue

# 1. Módulo CORE (Cerebro, Lóbulos, Runtime) -> ~15k tokens
Write-Host "[*] Generando ctx_core.md (Cerebro y Runtime)..." -ForegroundColor Yellow
npx repomix --include "lib/ai/**,lib/lobulos/**,lib/think/**,lib/runtime/**,lib/events/**" --output ctx_core.md

# 2. Módulo JOBS (Scrapers y Pipeline de Empleo) -> ~25k tokens
Write-Host "[*] Generando ctx_jobs.md (Pipeline de Empleo)..." -ForegroundColor Yellow
npx repomix --include "scripts/jobs/**,lib/jobs/**" --output ctx_jobs.md

# 3. Módulo DASHBOARD (Frontend Next.js) -> ~20k tokens
Write-Host "[*] Generando ctx_dashboard.md (Frontend)..." -ForegroundColor Yellow
npx repomix --include "dashboard/src/**,dashboard/package.json" --output ctx_dashboard.md

# 4. Módulo WHEELSAVER (Python API) -> ~15k tokens
Write-Host "[*] Generando ctx_wheelsaver.md (Python API)..." -ForegroundColor Yellow
npx repomix --include "wheel-saver/api/**,wheel-saver/scraper/**,wheel-saver/cli.py" --output ctx_wheelsaver.md

Write-Host "===================================================" -ForegroundColor Green
Write-Host "✅ ¡Contextos ligeros generados con éxito!" -ForegroundColor Green
Write-Host "Úsalos en tu IA local según lo que vayas a programar." -ForegroundColor Green
