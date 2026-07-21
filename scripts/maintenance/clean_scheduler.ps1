<#
.SYNOPSIS
    LifeOS — Disable zombie Task Scheduler tasks
.DESCRIPTION
    Deshabilita las tareas del Task Scheduler que ya no se usan.
    NO las borra (por si quieres revertir). Solo las deshabilita.
    
    Tareas que deshabilita:
      - LifeOS_Brain_Morning        (ruta vieja, error)
      - LifeOS_BrainOrchestrator    (ruido: 3 disparos al día)
      - LifeOS_Brain_Correos        (duplicado de email_processor)
      - LifeOS_DailyAlert           (extra, no documentado)
      - LifeOS_AgentHeartbeat       (extra, no documentado)
      - Jeiser_Brain_Orchestrator   (legacy)

    Tarea que DEJA:
      - LifeOS_MorningRoutine       (la única necesaria: 5am wake)

.EXAMPLE
    .\scripts\maintenance\clean_scheduler.ps1

.NOTES
    Ejecutar como Administrador.
    Para revertir: Set-ScheduledTask -TaskName "LifeOS_Brain_Morning" -Enabled $true
#>

[CmdletBinding()]
param(
    [switch]$WhatIf
)

# ── Verificar Admin ──
$isAdmin = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $isAdmin.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "❌ Este script requiere permisos de Administrador." -ForegroundColor Red
    Write-Host "   Ejecuta PowerShell como Administrador y reintenta." -ForegroundColor Yellow
    exit 1
}

$tasksToDisable = @(
    "LifeOS_Brain_Morning"
    "LifeOS_BrainOrchestrator"
    "LifeOS_Brain_Correos"
    "LifeOS_DailyAlert"
    "LifeOS_AgentHeartbeat"
    "Jeiser_Brain_Orchestrator"
)

$keepEnabled = @(
    "LifeOS_MorningRoutine"
)

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  LifeOS — Limpieza de Task Scheduler       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Deshabilitar zombies ──
Write-Host "📌 Deshabilitando tareas zombies..." -ForegroundColor Yellow
foreach ($name in $tasksToDisable) {
    $task = Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
    if (-not $task) {
        Write-Host "   ⏭  $name — no existe" -ForegroundColor DarkGray
        continue
    }
    if ($WhatIf) {
        Write-Host "   🔍 [WhatIf] Se deshabilitaría: $name (actual: $($task.State))" -ForegroundColor Cyan
        continue
    }
    try {
        Disable-ScheduledTask -TaskName $name
        Write-Host "   ✅ $name — DESHABILITADA" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ $name — error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ── Verificar que la buena sigue habilitada ──
Write-Host ""
Write-Host "🔍 Verificando tareas que deben quedar..." -ForegroundColor Cyan
foreach ($name in $keepEnabled) {
    $task = Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
    if (-not $task) {
        Write-Host "   ⚠️  $name — no encontrada. ¿Ya la creaste?" -ForegroundColor Yellow
        continue
    }
    if ($task.Enabled) {
        Write-Host "   ✅ $name — habilitada (State: $($task.State))" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $name — está DESHABILITADA. Revisa si debería estar activa." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ Limpieza completada." -ForegroundColor Green
Write-Host "   Para revertir: Set-ScheduledTask -TaskName '<nombre>' -Enabled `$true" -ForegroundColor DarkGray
Write-Host ""
Write-Host "📋 Tareas actuales del Task Scheduler (LifeOS*):" -ForegroundColor Cyan
Get-ScheduledTask -TaskName "LifeOS*","Jeiser*" -ErrorAction SilentlyContinue | 
    Select-Object TaskName, State, Enabled | 
    Format-Table -AutoSize
