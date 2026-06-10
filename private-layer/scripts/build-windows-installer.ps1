# Build PrivateLayer Windows installer (.exe setup + .msi)
# Run from repo root on Windows with Rust + VS Build Tools installed.
#
#   powershell -ExecutionPolicy Bypass -File scripts\build-windows-installer.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "=== PrivateLayer Windows Installer Build ===" -ForegroundColor Cyan

function Require-Command($name, $hint) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        Write-Host "Missing: $name" -ForegroundColor Red
        Write-Host $hint -ForegroundColor Yellow
        exit 1
    }
}

Require-Command node "Install Node.js 20+ from https://nodejs.org/"
Require-Command pnpm "Run: corepack enable && corepack prepare pnpm@10.33.3 --activate"
Require-Command cargo "Install Rust from https://rustup.rs/"
Require-Command rustc "Install Rust from https://rustup.rs/"

Write-Host "Installing dependencies..." -ForegroundColor Gray
corepack enable | Out-Null
corepack prepare pnpm@10.33.3 --activate | Out-Null
pnpm install

Write-Host "Building production installer (NSIS + MSI)..." -ForegroundColor Gray
pnpm tauri build

$nsis = Get-ChildItem -Path "apps\desktop\src-tauri\target\release\bundle\nsis" -Filter "*.exe" -ErrorAction SilentlyContinue
$msi  = Get-ChildItem -Path "apps\desktop\src-tauri\target\release\bundle\msi"  -Filter "*.msi" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Build complete ===" -ForegroundColor Green
if ($nsis) {
    Write-Host "NSIS installer (recommended — double-click to install):"
    $nsis | ForEach-Object { Write-Host "  $($_.FullName)" -ForegroundColor White }
}
if ($msi) {
    Write-Host "MSI installer (IT / enterprise):"
    $msi | ForEach-Object { Write-Host "  $($_.FullName)" -ForegroundColor White }
}
Write-Host ""
Write-Host "The installer contains the PrivateLayer DESKTOP app only." -ForegroundColor Yellow
Write-Host "Also run scripts\windows-setup.ps1 once for Ollama + Python agent." -ForegroundColor Yellow
Write-Host "See docs\INSTALL-WINDOWS.md" -ForegroundColor Gray
