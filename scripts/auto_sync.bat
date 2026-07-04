@echo off
setlocal

:: Cambiar al directorio del proyecto
cd /d "%~dp0.."

echo [Life OS] Iniciando sincronizacion con GitHub...

:: Añadir cambios
git add data/
git add .agents/
git add skills/

:: Revisar si hay cambios
git status --porcelain > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [Life OS] No hay cambios para sincronizar.
    exit /b 0
)

:: Hacer commit
set "datetime=%date% %time%"
git commit -m "Auto-sync Life OS: %datetime%"

:: Hacer push
git push origin main

echo [Life OS] Sincronizacion completada con exito.
exit /b 0
