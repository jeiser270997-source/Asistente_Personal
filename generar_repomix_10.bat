@echo off
setlocal EnableDelayedExpansion

title Generador de Repomix (10 Partes)
color 0B

:: ==========================================================
::  UNIVERSAL REPO CHUNKER (10 PARTES)
::  - Genera un .md unico con Repomix
::  - Lo divide en 10 partes iguales para IA
::  - 100% reutilizable en cualquier proyecto
:: ==========================================================

echo ==========================================================
echo           REPO MIXER - 10 PART SPLITTER
echo ==========================================================
echo.

:: Configuracion de rutas (relativas al directorio actual)
set "TEMP_FILE=repomix_temp_full.md"
set "OUT_DIR=repomix_parts"

:: Limpieza de ejecuciones anteriores
if exist "%TEMP_FILE%" del "%TEMP_FILE%"
if exist "%OUT_DIR%" rmdir /s /q "%OUT_DIR%"
mkdir "%OUT_DIR%"

echo [1/3] Empaquetando codigo con Repomix...
echo.

:: Ejecutar Repomix (Genera un solo archivo markdown)
:: Repomix respeta automaticamente el .gitignore y excluye node_modules
call npx repomix --style markdown --output "%TEMP_FILE%"

:: Verificar si Repomix tuvo exito
if not exist "%TEMP_FILE%" (
    echo.
    echo [ERROR] Repomix fallo o no genero el archivo temporal.
    echo Asegurate de tener Node.js instalado y ejecutar "npm install -g repomix" si falla.
    pause
    exit /b 1
)

echo.
echo [2/3] Dividiendo en 10 partes iguales con PowerShell...
echo.

:: Ejecutar logica de division usando PowerShell desde el BAT
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$text = [System.IO.File]::ReadAllText('%TEMP_FILE%');" ^
  "$total = $text.Length;" ^
  "if ($total -eq 0) { Write-Host 'El archivo esta vacio.'; exit; }" ^
  "$chunk = [math]::Ceiling($total / 10);" ^
  "for ($i = 0; $i -lt 10; $i++) {" ^
  "  $start = $i * $chunk;" ^
  "  $len = [math]::Min($chunk, $total - $start);" ^
  "  $part = $text.Substring($start, $len);" ^
  "  $path = '%OUT_DIR%\parte-' + ($i+1) + '.md';" ^
  "  [System.IO.File]::WriteAllText($path, $part, (New-Object System.Text.UTF8Encoding $false));" ^
  "  Write-Host '  Generado:' $path;" ^
  "}"

echo.
echo [3/3] Limpieza y finalizacion...
:: Borrar el archivo temporal gigante
del "%TEMP_FILE%"

echo.
echo ==========================================================
echo  PROCESO COMPLETADO
echo ==========================================================
echo  Se han generado 10 archivos en la carpeta: %OUT_DIR%\
echo  Copia y pega el contenido de "parte-1.md" a "parte-10.md"
echo  en el chat de tu IA.
echo ==========================================================
echo.
pause