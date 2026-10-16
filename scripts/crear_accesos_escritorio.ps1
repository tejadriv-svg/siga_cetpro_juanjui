$ws = New-Object -ComObject WScript.Shell
$lnkPath = "C:\Users\CETPRO\Desktop\INICIAR SIGA (Servidor).lnk"
$s = $ws.CreateShortcut($lnkPath)
$s.TargetPath = "C:\Users\CETPRO\antigravity\siga_cetpro_juanjui\scripts\iniciar_servidor.bat"
$s.WorkingDirectory = "C:\Users\CETPRO\antigravity\siga_cetpro_juanjui"
$s.IconLocation = "C:\Users\CETPRO\antigravity\siga_cetpro_juanjui\public\siga-logo.ico,0"
$s.Description = "Iniciar Servidor SIGA CETPRO Juanjuí de forma independiente"
$s.Save()

$lnkStopPath = "C:\Users\CETPRO\Desktop\DETENER SIGA (Servidor).lnk"
$s2 = $ws.CreateShortcut($lnkStopPath)
$s2.TargetPath = "C:\Users\CETPRO\antigravity\siga_cetpro_juanjui\scripts\detener_servidor.bat"
$s2.WorkingDirectory = "C:\Users\CETPRO\antigravity\siga_cetpro_juanjui"
$s2.IconLocation = "C:\Users\CETPRO\antigravity\siga_cetpro_juanjui\public\siga-logo.ico,0"
$s2.Description = "Detener Servidor SIGA CETPRO Juanjuí"
$s2.Save()

$lnkBackupPath = "C:\Users\CETPRO\Desktop\COPIA DE SEGURIDAD SIGA.lnk"
$s3 = $ws.CreateShortcut($lnkBackupPath)
$s3.TargetPath = "C:\Users\CETPRO\antigravity\siga_cetpro_juanjui\scripts\hacer_copia_seguridad.bat"
$s3.WorkingDirectory = "C:\Users\CETPRO\antigravity\siga_cetpro_juanjui"
$s3.IconLocation = "C:\Users\CETPRO\antigravity\siga_cetpro_juanjui\public\siga-logo.ico,0"
$s3.Description = "Generar copia de seguridad de la base de datos SIGA CETPRO"
$lnkStudioPath = "C:\Users\CETPRO\Desktop\VER BASE DE DATOS (Estilo Supabase).lnk"
$s4 = $ws.CreateShortcut($lnkStudioPath)
$s4.TargetPath = "C:\Users\CETPRO\antigravity\siga_cetpro_juanjui\scripts\abrir_visor_bd.bat"
$s4.WorkingDirectory = "C:\Users\CETPRO\antigravity\siga_cetpro_juanjui"
$s4.IconLocation = "C:\Users\CETPRO\antigravity\siga_cetpro_juanjui\public\siga-logo.ico,0"
$s4.Description = "Abrir visor interactivo de tablas de base de datos estilo Supabase"
$s4.Save()

Write-Host "Accesos directos creados exitosamente en el Escritorio."
