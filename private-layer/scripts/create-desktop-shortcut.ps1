# Create Desktop shortcut "PrivateLayer" that starts the full stack
param(
    [string]$InstalledExe = "$env:LOCALAPPDATA\Programs\PrivateLayer\PrivateLayer.exe"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Launcher = Join-Path $Root "scripts\start-private-layer.ps1"
$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "PrivateLayer.lnk"

$Wsh = New-Object -ComObject WScript.Shell
$Sc = $Wsh.CreateShortcut($ShortcutPath)
$Sc.TargetPath = "powershell.exe"
$Sc.Arguments = "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Launcher`" -InstalledExe `"$InstalledExe`""
$Sc.WorkingDirectory = $Root
$Sc.IconLocation = "$InstalledExe,0"
$Sc.Description = "PrivateLayer — Dark Side vault"
$Sc.Save()

Write-Host "Shortcut created: $ShortcutPath" -ForegroundColor Green
Write-Host "Double-click PrivateLayer on your desktop to start." -ForegroundColor Green
