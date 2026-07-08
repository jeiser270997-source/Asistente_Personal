# Script para configurar el backup automático de LifeOS en Windows Task Scheduler
# Debe ejecutarse con permisos de administrador o en tu sesión activa.

$TaskName = "LifeOS_DailyBackup"
$Description = "Ejecuta el script de backup_automator.js todos los días a las 2:00 AM para comprimir y subir los datos de LifeOS a Google Drive."

# Obtener la ruta base del proyecto
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BaseDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$NodeScriptPath = Join-Path $BaseDir "scripts\maintenance\backup_automator.js"

# Detectar ruta de Node.js
$NodeExe = (Get-Command node.exe).Source
if (-not $NodeExe) {
    Write-Error "No se encontró node.exe en el PATH. Instala Node.js o asegúrate de que está en las variables de entorno."
    exit
}

# Crear la acción
$Action = New-ScheduledTaskAction -Execute $NodeExe -Argument "`"$NodeScriptPath`"" -WorkingDirectory $BaseDir

# Crear el trigger: Todos los días a las 2:00 AM
$Trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM

# Crear settings para que no se detenga si la PC no tiene batería, etc.
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

Write-Host "Registrando tarea programada: $TaskName ..."
# Registrar tarea (en el contexto del usuario actual para tener acceso a los archivos y a Rclone)
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description $Description -Force

Write-Host "✅ Tarea programada registrada exitosamente."
Write-Host "La tarea se ejecutará como el usuario actual todos los días a las 2:00 AM."
Write-Host "Puedes verla o editarla abriendo el 'Programador de tareas' (Task Scheduler) en Windows."
