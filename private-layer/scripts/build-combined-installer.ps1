# Build ONE combined Windows installer:
#   - PrivateLayer desktop app
#   - Python agent (venv created on install)
#   - Ollama check + GPU detect on install
#   - Desktop shortcut
# No secrets bundled.
#
#   powershell -ExecutionPolicy Bypass -File scripts\build-combined-installer.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host ""
Write-Host "=== PrivateLayer COMBINED Installer Build ===" -ForegroundColor Cyan
Write-Host ""

function Require-Command($name, $hint) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        Write-Host "Missing: $name" -ForegroundColor Red
        Write-Host $hint -ForegroundColor Yellow
        exit 1
    }
}

Require-Command node "https://nodejs.org/"
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    corepack enable | Out-Null
    corepack prepare pnpm@10.33.3 --activate | Out-Null
}
Require-Command pnpm "Run: corepack enable, then corepack prepare pnpm@10.33.3 --activate"
Require-Command cargo "https://rustup.rs/"
Require-Command python "https://www.python.org/ — needed on target PCs for agent"

Write-Host "[1/4] Installing Node deps..." -ForegroundColor Gray
corepack enable | Out-Null
corepack prepare pnpm@10.33.3 --activate | Out-Null
pnpm install | Out-Null

Write-Host "[2/4] Building desktop app (release)..." -ForegroundColor Gray
pnpm tauri build

Write-Host "[3/4] Staging package (app + agent + scripts)..." -ForegroundColor Gray
& powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\installer\stage-package.ps1")

$staging = Join-Path $Root "dist\staging"
$iss = Join-Path $Root "scripts\installer\PrivateLayer.iss"
$dist = Join-Path $Root "dist"

Write-Host "[4/4] Creating installer..." -ForegroundColor Gray

# Inno Setup (best — single Setup.exe)
$iscc = @(
    "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    "$env:ProgramFiles\Inno Setup 6\ISCC.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($iscc) {
    & $iscc $iss
    $setupExe = Get-ChildItem $dist -Filter "PrivateLayer-Setup-*.exe" | Select-Object -First 1
    Write-Host ""
    Write-Host "=== SUCCESS: Combined installer ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Give users this ONE file:" -ForegroundColor White
    Write-Host "  $($setupExe.FullName)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "They double-click it. It installs:" -ForegroundColor Gray
    Write-Host "  - Desktop app"
    Write-Host "  - Python agent (auto venv + pip)"
    Write-Host "  - Ollama check (opens download if missing)"
    Write-Host "  - GPU recommendation"
    Write-Host "  - Desktop shortcut"
    exit 0
}

# Fallback: zip + Install script (no Inno on build machine)
Write-Host "Inno Setup not found — creating zip fallback." -ForegroundColor Yellow
Write-Host "Install Inno Setup 6 for a single .exe: https://jrsoftware.org/isinfo.php" -ForegroundColor Yellow

Copy-Item (Join-Path $Root "scripts\installer\Install-PrivateLayer.ps1") (Join-Path $staging "Install-PrivateLayer.ps1") -Force
$zipPath = Join-Path $dist "PrivateLayer-Setup-0.1.0.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$staging\*" -DestinationPath $zipPath

Write-Host ""
Write-Host "=== SUCCESS: Zip installer (fallback) ===" -ForegroundColor Green
Write-Host ""
Write-Host "Extract zip, then run:" -ForegroundColor White
Write-Host "  powershell -ExecutionPolicy Bypass -File Install-PrivateLayer.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "Zip: $zipPath" -ForegroundColor Gray
