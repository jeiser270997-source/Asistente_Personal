@echo off
setlocal

set HEADROOM_PATH=C:\Users\dev\AppData\Roaming\Python\Python314\Scripts\headroom.exe

echo [Life OS] Iniciando Headroom Proxy para compresion de contexto...
echo Ahorro esperado: 60%% - 95%% de tokens.

if not exist "%HEADROOM_PATH%" (
    echo [ERROR] Headroom no encontrado en %HEADROOM_PATH%
    exit /b 1
)

:: Iniciar el proxy
"%HEADROOM_PATH%" proxy
