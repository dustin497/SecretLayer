# Create Desktop shortcut that starts the full PrivateLayer stack
param(
    [string]$InstalledExe = "$env:LOCALAPPDATA\PrivateLayer\PrivateLayer.exe",
    [string]$InstallDir = "$env:LOCALAPPDATA\PrivateLayer"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $InstalledExe)) {
    $InstalledExe = Join-Path $InstallDir "PrivateLayer.exe"
}

$Root = if (Test-Path $InstallDir) { $InstallDir } else {
    Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
}

$Launcher = Join-Path $Root "scripts\start-private-layer.ps1"
if (-not (Test-Path $Launcher)) {
    throw "Launcher not found: $Launcher"
}

$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "PrivateLayer.lnk"

$Wsh = New-Object -ComObject WScript.Shell
$Sc = $Wsh.CreateShortcut($ShortcutPath)
$Sc.TargetPath = "powershell.exe"
$Sc.Arguments = "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Launcher`" -InstallDir `"$Root`" -InstalledExe `"$InstalledExe`""
$Sc.WorkingDirectory = $Root
if (Test-Path $InstalledExe) {
    $Sc.IconLocation = "$InstalledExe,0"
}
$Sc.Description = "PrivateLayer — Dark Side vault (Ollama + agent + app)"
$Sc.Save()

Write-Host "Shortcut: $ShortcutPath" -ForegroundColor Green
