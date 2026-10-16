@echo off
title Visor de Base de Datos - SIGA CETPRO Juanjui (Estilo Supabase)
cls
echo ===================================================================
echo       VISOR VISUAL DE BASE DE DATOS LOCAL - SIGA CETPRO
echo ===================================================================
echo.
echo   Iniciando interfaz visual interactiva tipo Supabase / Drizzle...
echo   Abriendo navegador web...
echo.
echo   [*] Presione Ctrl + C en esta ventana cuando desee cerrarla.
echo ===================================================================
echo.

cd /d "C:\Users\CETPRO\antigravity\siga_cetpro_juanjui"

start "" cmd /c "timeout /t 3 /nobreak >nul && start https://local.drizzle.studio"

npx drizzle-kit studio --port 4983
