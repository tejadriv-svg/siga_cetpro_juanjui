@echo off
setlocal
title Copia de Seguridad - SIGA CETPRO Juanjui
cls
echo ===================================================================
echo             COPIA DE SEGURIDAD - SIGA CETPRO JUANJUI
echo ===================================================================
echo.
echo Generando respaldo de la base de datos local PostgreSQL...
echo.

set PGPASSWORD=postgres
set CURR_DATE=%date:~-4%-%date:~7,2%-%date:~4,2%
set CURR_TIME=%time:~0,2%%time:~3,2%
set CURR_TIME=%CURR_TIME: =0%
set TIMESTAMP=%CURR_DATE%_%CURR_TIME%

set BACKUP_DIR=C:\Users\CETPRO\antigravity\siga_cetpro_juanjui\backups
set BACKUP_FILE=%BACKUP_DIR%\siga_backup_%TIMESTAMP%.sql

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -h localhost -p 5432 -U postgres -d siga_cetpro -F p --no-owner --no-privileges -f "%BACKUP_FILE%"

if %ERRORLEVEL% equ 0 (
    echo.
    echo ===================================================================
    echo [+] Copia de seguridad completada exitosamente!
    echo.
    echo     Archivo generado: %BACKUP_FILE%
    echo ===================================================================
    echo.
    echo Puede copiar este archivo a una memoria USB para mayor seguridad.
) else (
    echo.
    echo [-] Ocurrio un error al generar la copia de seguridad.
)

echo.
echo Presione cualquier tecla para salir...
pause >nul
endlocal
