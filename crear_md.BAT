@echo off
title Generar Repomix Actualizado
color 0B

echo ===================================================
echo      Generador de Repomix (Asistente Personal)
echo ===================================================
echo.

cd /d "%~dp0"

echo [*] Generando nuevo empaquetado en formato Markdown...
echo [*] Archivo destino: repomix_active.md
echo [*] Por favor espera...
echo.

call npx repomix --output repomix_active.md

echo.
echo ===================================================
echo [OK] Proceso finalizado con exito.
echo [OK] Tu proyecto esta empaquetado en: repomix_active.md
echo ===================================================
pause
