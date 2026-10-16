@echo off
chcp 65001 >nul
title SIGA CETPRO Juanjuí - Servidor Activo
cls
echo ===================================================================
echo               SIGA CETPRO JUANJUÍ - SERVIDOR INDEPENDIENTE
echo ===================================================================
echo.
echo   El servidor se está ejecutando de forma independiente a Antigravity.
echo.
echo   [+] Acceso en esta PC:  http://localhost:3000
echo   [+] Acceso en Laptops:  http://192.168.100.10:3000
echo.
echo   [*] NOTA: Puede minimizar esta ventana. Mientras permanezca abierta,
echo             las laptops y otras PCs de la red podrán usar el sistema.
echo.
echo   [*] Para apagar el servidor: Simplemente cierre esta ventana.
echo ===================================================================
echo.

:: Liberar puerto 3000 si quedó algún proceso previo colgado
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

cd /d "C:\Users\CETPRO\antigravity\siga_cetpro_juanjui"

:: Abrir navegador local en 2 segundos
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

echo Iniciando servicios del SIGA...
echo.
npm run dev
pause
