# Combined installer — copies staged package to %LOCALAPPDATA%\PrivateLayer and runs setup
# Use when you have dist\staging (from build-combined-installer.ps1) or extracted Setup zip.
#
#   powershell -ExecutionPolicy Bypass -File scripts\installer\Install-PrivateLayer.ps1

param(
    [string]$SourceDir = "",
    [string]$TargetDir = "$env:LOCALAPPDATA\PrivateLayer"
)

$ErrorActionPreference = "Stop"

if (-not $SourceDir) {
    # Running from inside staging folder or repo
    $candidate = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) "dist\staging"
    if (Test-Path (Join-Path $candidate "PrivateLayer.exe")) {
        $SourceDir = $candidate
    } elseif (Test-Path (Join-Path $PSScriptRoot "..\PrivateLayer.exe")) {
        $SourceDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
    } else {
        Write-Host "Source not found. Run build-combined-installer.ps1 first." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=== PrivateLayer Combined Install ===" -ForegroundColor Cyan
Write-Host "From: $SourceDir"
Write-Host "To:   $TargetDir"
Write-Host ""

if (Test-Path $TargetDir) {
    $overwrite = Read-Host "PrivateLayer already installed. Overwrite? (y/n)"
    if ($overwrite -ne "y") { exit 0 }
    Remove-Item $TargetDir -Recurse -Force
}

New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
Copy-Item "$SourceDir\*" $TargetDir -Recurse -Force

Write-Host "Files copied. Running post-install (agent + Ollama check)..." -ForegroundColor Gray
$postInstall = Join-Path $TargetDir "scripts\post-install.ps1"
& powershell -ExecutionPolicy Bypass -File $postInstall -InstallDir $TargetDir

Write-Host ""
Write-Host "Done. PrivateLayer is installed." -ForegroundColor Green
Write-Host "Launch from desktop shortcut or:" -ForegroundColor Gray
Write-Host "  $TargetDir\PrivateLayer.exe" -ForegroundColor White
