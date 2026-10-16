@echo off
title SIGA CETPRO Juanjui - Servidor Activo
color 0A
cd /d c:\Users\CETPRO\antigravity\siga_cetpro_juanjui

echo =========================================================================
echo              SISTEMA INTEGRADO DE GESTION ACADEMICA (SIGA)
echo                       CETPRO JUANJUI - PERU
echo =========================================================================
echo.
echo Obteniendo la direccion IP de este equipo...
for /f tokens=2 delims=: %%a in ('ipconfig ^| findstr /c:IPv4 /c:Direccin IPv4') do (
    set IP_LOCAL=%%a
    goto :found_ip
)
:found_ip
set IP_LOCAL=%IP_LOCAL: =%

echo [OK] Servidor iniciado correctamente.
echo.
echo =========================================================================
echo  DIRECCIONES DE ACCESO AL SISTEMA:
echo.
echo   * En ESTA misma computadora:
echo     http://localhost:3000
echo.
echo   * Desde CUALQUIER OTRA computadora, laptop o celular del CETPRO:
echo     http://%IP_LOCAL%:3000
echo =========================================================================
echo.
echo  IMPORTANTE: No cierre esta ventana mientras el CETPRO este usando el sistema.
echo =========================================================================
echo.

npm run dev
pause
