# PrivateLayer — ONE script to run everything on YOUR Windows PC
# Works on Windows PowerShell 5.1 and PowerShell 7+
#
#   cd path\to\SecretLayer\private-layer
#   powershell -ExecutionPolicy Bypass -File scripts\run-all-windows.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PrivateLayer - full setup + launch" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Need($name, $hint) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        Write-Host "MISSING: $name" -ForegroundColor Red
        Write-Host "  $hint" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "  OK  $name" -ForegroundColor Green
}

function Ensure-Pnpm {
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        Write-Host "  OK  pnpm" -ForegroundColor Green
        return
    }
    if (Get-Command corepack -ErrorAction SilentlyContinue) {
        Write-Host "  Enabling pnpm via corepack..." -ForegroundColor Gray
        corepack enable | Out-Null
        corepack prepare pnpm@10.33.3 --activate | Out-Null
    }
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        Write-Host "  OK  pnpm" -ForegroundColor Green
        return
    }
    Write-Host "MISSING: pnpm" -ForegroundColor Red
    Write-Host "  Run: corepack enable" -ForegroundColor Yellow
    Write-Host "  Then: corepack prepare pnpm@10.33.3 --activate" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/8] Checking prerequisites..." -ForegroundColor Cyan
Need node "Install Node.js 20+ from https://nodejs.org/"
Need python "Install Python 3.11+ from https://www.python.org/ (check Add to PATH)"
Ensure-Pnpm
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "  WARN cargo not found - install Rust from https://rustup.rs/ for pnpm tauri dev" -ForegroundColor Yellow
} else {
    Write-Host "  OK  cargo" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/8] GPU detect..." -ForegroundColor Cyan
$gpuScript = Join-Path $Root "scripts\detect-gpu.ps1"
if (Test-Path $gpuScript) {
    & powershell -ExecutionPolicy Bypass -File $gpuScript
}

Write-Host ""
Write-Host "[3/8] Node + Python setup..." -ForegroundColor Cyan
corepack enable | Out-Null
corepack prepare pnpm@10.33.3 --activate | Out-Null
pnpm install

$agentDir = Join-Path $Root "packages\agent"
Set-Location $agentDir
if (-not (Test-Path ".venv")) { python -m venv .venv }
& .\.venv\Scripts\pip install -q -r requirements.txt
Set-Location $Root

if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env" }

Write-Host ""
Write-Host "[4/8] Ollama..." -ForegroundColor Cyan
if (Get-Command ollama -ErrorAction SilentlyContinue) {
    Write-Host "  Ollama installed" -ForegroundColor Green
    $model = "qwen2.5:7b"
    Write-Host "  Pulling $model (first time may take several minutes)..." -ForegroundColor Gray
    ollama pull $model
    if (-not (Get-Process ollama -ErrorAction SilentlyContinue)) {
        Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden
        Start-Sleep -Seconds 3
    }
} else {
    Write-Host "  Ollama NOT installed - opening download page" -ForegroundColor Yellow
    Start-Process "https://ollama.com/download/windows"
    Write-Host "  Install Ollama, then re-run this script." -ForegroundColor Yellow
    Read-Host "Press Enter after installing Ollama (or to continue without model)"
}

Write-Host ""
Write-Host "[5/8] Starting agent (background)..." -ForegroundColor Cyan
$agentPy = Join-Path $agentDir ".venv\Scripts\python.exe"
$agentUp = $false
try {
    $r = Invoke-WebRequest "http://127.0.0.1:8790/health" -UseBasicParsing -TimeoutSec 2
    $agentUp = ($r.StatusCode -eq 200)
} catch { }

if (-not $agentUp) {
    $env:PYTHONPATH = Join-Path $agentDir "src"
    Start-Process -FilePath $agentPy -ArgumentList "-m","agent","serve" -WorkingDirectory $agentDir -WindowStyle Hidden
    Start-Sleep -Seconds 3
    Write-Host "  Agent running on http://127.0.0.1:8790" -ForegroundColor Green
} else {
    Write-Host "  Agent already running" -ForegroundColor Green
}

Write-Host ""
Write-Host "[6/8] Desktop shortcut..." -ForegroundColor Cyan
$installedExe = Join-Path $env:LOCALAPPDATA "PrivateLayer\PrivateLayer.exe"
$releaseExe = Join-Path $Root "apps\desktop\src-tauri\target\release\private-layer-desktop.exe"

if (Test-Path $installedExe) {
    & powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\create-desktop-shortcut.ps1") -InstalledExe $installedExe
} elseif (Test-Path $releaseExe) {
    & powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\create-desktop-shortcut.ps1") -InstalledExe $releaseExe -InstallDir $Root
} else {
    Write-Host "  Skip shortcut until app is built (step 7)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[7/8] Launch PrivateLayer app..." -ForegroundColor Cyan

if (Test-Path $installedExe) {
    Start-Process $installedExe
    Write-Host "  Launched installed app" -ForegroundColor Green
} elseif (Test-Path $releaseExe) {
    Start-Process $releaseExe
    Write-Host "  Launched release build" -ForegroundColor Green
} elseif (Get-Command cargo -ErrorAction SilentlyContinue) {
    Write-Host "  Starting pnpm tauri dev (first compile takes 5-15 min)..." -ForegroundColor Yellow
    Set-Location $Root
    pnpm tauri dev
} else {
    Write-Host "  Install Rust, then run: pnpm tauri dev" -ForegroundColor Red
    Write-Host "  Or build installer: scripts\build-combined-installer.ps1" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[8/8] Done" -ForegroundColor Cyan
Write-Host "  Setup wizard should appear on first launch." -ForegroundColor Gray
Write-Host "  Mount VeraCrypt (V:) before unlocking vault." -ForegroundColor Gray
Write-Host ""
