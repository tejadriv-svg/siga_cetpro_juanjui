@echo off
chcp 65001 >nul
title Detener Servidor SIGA CETPRO
cls
echo ===================================================================
echo               DETENER SERVIDOR SIGA CETPRO JUANJUÍ
echo ===================================================================
echo.
echo Buscando procesos activos en el puerto 3000...

set FOUND=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Deteniendo proceso PID: %%a...
    taskkill /f /pid %%a >nul 2>&1
    set FOUND=1
)

if "%FOUND%"=="1" (
    echo.
    echo [+] El servidor ha sido detenido exitosamente.
) else (
    echo.
    echo [-] No se encontró ningún servidor activo en el puerto 3000.
)

echo.
timeout /t 3 >nul
exit
