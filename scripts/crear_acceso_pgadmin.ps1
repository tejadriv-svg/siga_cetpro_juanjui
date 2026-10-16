$ws = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut("C:\Users\CETPRO\Desktop\pgAdmin 4.lnk")
$lnk.TargetPath = "C:\Program Files\PostgreSQL\18\pgAdmin 4\runtime\pgAdmin4.exe"
$lnk.WorkingDirectory = "C:\Program Files\PostgreSQL\18\pgAdmin 4\runtime"
$lnk.Description = "pgAdmin 4 - Administrador oficial de PostgreSQL"
$lnk.Save()
Write-Host "Acceso directo pgAdmin 4 creado en el Escritorio."
