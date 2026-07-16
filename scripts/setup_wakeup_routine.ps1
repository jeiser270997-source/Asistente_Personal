<#
.SYNOPSIS
    LifeOS — Deploy Wake-Up Routine to Windows Task Scheduler

.DESCRIPTION
    Crea/actualiza la tarea programada 'LifeOS_MorningRoutine' en Windows
    Task Scheduler. Esta tarea es el núcleo de la arquitectura "Run & Die":
    enciende la PC desde hibernación/suspensión a las 5:00 AM, ejecuta la
    rutina matutina completa (scrapers, empleo, backups, briefing) y apaga.

    Arquitectura:
       BIOS RTC (opcional) → Windows Task Scheduler → daily_routine.js → shutdown

.PARAMETER TaskName
    Nombre de la tarea en el Task Scheduler. Default: LifeOS_MorningRoutine

.PARAMETER TaskDescription
    Descripción de la tarea. Default: "LifeOS — Rutina Matutina (Run & Die)"

.PARAMETER UnregisterExisting
    Si existe una tarea previa, la elimina antes de crear la nueva.

.PARAMETER StartAt
    Hora de ejecución en formato HH:mm (24h). Default: "05:00"

.EXAMPLE
    .\setup_wakeup_routine.ps1

.EXAMPLE
    .\setup_wakeup_routine.ps1 -StartAt "06:30" -UnregisterExisting

.NOTES
    Autor:    LifeOS SRE
    Requiere: Administrador privileges. Windows 10/11 o Server 2016+.
    Run & Die Architecture v2.5
#>

[CmdletBinding()]
param(
    [string]$TaskName = "LifeOS_MorningRoutine",
    [string]$TaskDescription = "LifeOS — Rutina Matutina (Run & Die): scrapers SIMIT/SENA/DIAN, empleo, backups, briefing y apagado automático.",
    [switch]$UnregisterExisting,
    [string]$StartAt = "05:00"
)

# ──────────────────────────────────────────────────────────────────
# Verificar privilegios de Administrador
# ──────────────────────────────────────────────────────────────────
$isAdmin = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $isAdmin.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║  ERROR: Este script requiere permisos de             ║" -ForegroundColor Red
    Write-Host "║  Administrador para registrar tareas programadas.    ║" -ForegroundColor Red
    Write-Host "║                                                     ║" -ForegroundColor Red
    Write-Host "║  Ejecuta PowerShell como Administrador y reintenta:  ║" -ForegroundColor Red
    Write-Host "║  > Start-Process powershell -Verb RunAs              ║" -ForegroundColor Yellow
    Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Red
    exit 1
}

# ──────────────────────────────────────────────────────────────────
# Resolver rutas absolutas
# ──────────────────────────────────────────────────────────────────
$ProjectRoot = (Get-Item $PSScriptRoot).Parent.FullName
$nodeCmd = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "❌ ERROR: node.exe no encontrado en el PATH." -ForegroundColor Red
    Write-Host "   Instala Node.js desde https://nodejs.org y asegúrate de que esté en el PATH." -ForegroundColor Yellow
    exit 1
}
$NodePath = $nodeCmd.Source
$ScriptPath = Join-Path -Path $ProjectRoot -ChildPath "scripts\daily_routine.js"

Write-Host "📂 Directorio del proyecto:     $ProjectRoot" -ForegroundColor Cyan
Write-Host "📌 Node.js:                     $NodePath" -ForegroundColor Cyan
Write-Host "📄 Script objetivo:             $ScriptPath" -ForegroundColor Cyan

if (-not (Test-Path $ScriptPath)) {
    Write-Host "❌ ERROR: daily_routine.js no encontrado en: $ScriptPath" -ForegroundColor Red
    Write-Host "   Verifica que el script exista en la ubicación esperada." -ForegroundColor Yellow
    exit 1
}

# ──────────────────────────────────────────────────────────────────
# Si existe la tarea, opcionalmente la eliminamos
# ──────────────────────────────────────────────────────────────────
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing -and $UnregisterExisting) {
    Write-Host "🗑️  Eliminando tarea existente: $TaskName..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "   ✅ Tarea eliminada." -ForegroundColor Green
} elseif ($existing) {
    Write-Host "⚠️  La tarea '$TaskName' ya existe. Se actualizará con -Force." -ForegroundColor Yellow
}

# ──────────────────────────────────────────────────────────────────
# Crear Acción: ejecutar Node.js con el script
# ──────────────────────────────────────────────────────────────────
$Action = New-ScheduledTaskAction -Execute $NodePath `
    -Argument "`"$ScriptPath`"" `
    -WorkingDirectory $ProjectRoot

Write-Host "⚙️  Acción creada:" -ForegroundColor DarkGray
Write-Host "   Ejecutable:   $NodePath" -ForegroundColor DarkGray
Write-Host "   Argumento:    $ScriptPath" -ForegroundColor DarkGray
Write-Host "   Working Dir:  $ProjectRoot" -ForegroundColor DarkGray

# ──────────────────────────────────────────────────────────────────
# Crear Trigger: diario a las 05:00 AM
# ──────────────────────────────────────────────────────────────────
$Trigger = New-ScheduledTaskTrigger -Daily -At $StartAt

Write-Host "⏰ Trigger creado: Diario a las $StartAt" -ForegroundColor DarkGray

# ──────────────────────────────────────────────────────────────────
# Configuraciones críticas: WakeToRun, baterías, etc.
# ──────────────────────────────────────────────────────────────────
$Settings = New-ScheduledTaskSettingsSet `
    -WakeToRun `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -AllowHardTerminate:$false `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 2) `
    -MultipleInstances IgnoreNew

Write-Host "🔧 Settings:" -ForegroundColor DarkGray
Write-Host "   WakeToRun:              ✅ (Despierta PC de hibernación/suspensión)" -ForegroundColor DarkGray
Write-Host "   AllowStartIfOnBatteries: ✅" -ForegroundColor DarkGray
Write-Host "   DontStopIfGoingOnBatteries: ✅" -ForegroundColor DarkGray
Write-Host "   ExecutionTimeLimit:      2 horas" -ForegroundColor DarkGray
Write-Host "   RestartCount:            3 (reintentos cada 2 min)" -ForegroundColor DarkGray

# ──────────────────────────────────────────────────────────────────
# Registrar la tarea en el Task Scheduler
# ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "📝 Registrando tarea: $TaskName ..." -ForegroundColor Magenta

try {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $Action `
        -Trigger $Trigger `
        -Settings $Settings `
        -Description $TaskDescription `
        -User "SYSTEM" `
        -RunLevel Highest `
        -Force

    Write-Host "✅ Tarea registrada exitosamente." -ForegroundColor Green
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  ☀️  LifeOS — Arquitectura Run & Die DESPLEGADA          ║" -ForegroundColor Green
    Write-Host "║                                                          ║" -ForegroundColor Green
    Write-Host "║  Tarea:        $($TaskName.PadRight(38))║" -ForegroundColor White
    Write-Host "║  Horario:      $StartAt AM (todos los días)             ║" -ForegroundColor White
    Write-Host "║  Despierta PC: SÍ                                        ║" -ForegroundColor White
    Write-Host "║                                                          ║" -ForegroundColor Green
    Write-Host "║  Para probar sin esperar:                                ║" -ForegroundColor Green
    Write-Host "║    Start-ScheduledTask -TaskName '$TaskName'              ║" -ForegroundColor Yellow
    Write-Host "║                                                          ║" -ForegroundColor Green
    Write-Host "║  Para ver el estado:                                     ║" -ForegroundColor Green
    Write-Host "║    Get-ScheduledTask -TaskName '$TaskName' | fl           ║" -ForegroundColor Yellow
    Write-Host "║                                                          ║" -ForegroundColor Green
    Write-Host "║  Para desinstalar:                                       ║" -ForegroundColor Green
    Write-Host "║    Unregister-ScheduledTask -TaskName '$TaskName'         ║" -ForegroundColor Yellow
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green

} catch {
    Write-Host "❌ ERROR al registrar la tarea: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Posibles causas:" -ForegroundColor Yellow
    Write-Host "   • PowerShell no ejecutado como Administrador" -ForegroundColor Yellow
    Write-Host "   • El usuario SYSTEM no tiene permisos para ejecutar la tarea" -ForegroundColor Yellow
    Write-Host "   • El nombre de la tarea ya existe y -Force no funcionó" -ForegroundColor Yellow
    exit 1
}

# ──────────────────────────────────────────────────────────────────
# Verificar que la tarea quedó registrada correctamente
# ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔍 Verificando registro..." -ForegroundColor Cyan
$registeredTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($registeredTask) {
    Write-Host "✅ Estado actual de la tarea:" -ForegroundColor Green
    Write-Host "   TaskName: $($registeredTask.TaskName)" -ForegroundColor Gray
    Write-Host "   State:    $($registeredTask.State)" -ForegroundColor Gray
    Write-Host "   Enabled:  $($registeredTask.Enabled)" -ForegroundColor Gray
    
    if ($registeredTask.State -eq 'Ready') {
        Write-Host ""
        Write-Host "🎯 La rutina matutina está armada y lista para las $StartAt AM." -ForegroundColor Green
        Write-Host "   No olvides configurar el RTC Alarm en la BIOS/UEFI para" -ForegroundColor Cyan
        Write-Host "   que la PC encienda desde apagado completo si es necesario." -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️  No se pudo verificar la tarea registrada." -ForegroundColor Yellow
}
