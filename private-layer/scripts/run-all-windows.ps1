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

function Refresh-NodePath {
    $nodeDir = Split-Path (Get-Command node).Source -Parent
    $env:PATH = "$nodeDir;$env:PATH"
    try {
        $npmRoot = npm root -g 2>$null
        if ($npmRoot) {
            $npmBin = Split-Path $npmRoot -Parent
            $env:PATH = "$npmBin;$env:PATH"
        }
    } catch { }
    $roamingNpm = Join-Path $env:APPDATA "npm"
    if (Test-Path $roamingNpm) {
        $env:PATH = "$roamingNpm;$env:PATH"
    }
}

function Invoke-Pnpm {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$PnpmArgs)
    Refresh-NodePath
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        & pnpm @PnpmArgs
        return $LASTEXITCODE
    }
    Write-Host "  Using npx pnpm (pnpm not in PATH)..." -ForegroundColor Gray
    & npx --yes pnpm@10.33.3 @PnpmArgs
    return $LASTEXITCODE
}

function Ensure-Pnpm {
    Refresh-NodePath
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        Write-Host "  OK  pnpm" -ForegroundColor Green
        return
    }

    Write-Host "  pnpm not found - trying to install..." -ForegroundColor Gray

    if (Get-Command corepack -ErrorAction SilentlyContinue) {
        try {
            corepack enable 2>$null | Out-Null
            corepack prepare pnpm@10.33.3 --activate 2>$null | Out-Null
        } catch { }
        Refresh-NodePath
        if (Get-Command pnpm -ErrorAction SilentlyContinue) {
            Write-Host "  OK  pnpm (via corepack)" -ForegroundColor Green
            return
        }
    }

    Write-Host "  Installing pnpm globally via npm..." -ForegroundColor Gray
    npm install -g pnpm@10.33.3
    Refresh-NodePath

    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        Write-Host "  OK  pnpm (via npm install -g)" -ForegroundColor Green
        return
    }

    Write-Host "  OK  pnpm (will use npx fallback)" -ForegroundColor Yellow
}

function Need($name, $hint) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        Write-Host "MISSING: $name" -ForegroundColor Red
        Write-Host "  $hint" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "  OK  $name" -ForegroundColor Green
}

Write-Host "[1/8] Checking prerequisites..." -ForegroundColor Cyan
Need node "Install Node.js 22 LTS from https://nodejs.org/ (avoid Node 24)"
$nodeVer = node -v
Write-Host "  Node $nodeVer" -ForegroundColor Gray
if ($nodeVer -match "^v24\.") {
    Write-Host "  WARN Node 24 may break Vite - install Node 22 LTS if dev fails" -ForegroundColor Yellow
}
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
    try {
        & powershell -ExecutionPolicy Bypass -File $gpuScript
    } catch {
        Write-Host "  GPU detect skipped (non-fatal)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "[3/8] Node + Python setup..." -ForegroundColor Cyan
if ($Root -match "OneDrive") {
    Write-Host "  WARN OneDrive path — copy project to C:\dev\ for reliable Rust builds" -ForegroundColor Yellow
}
& powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\fix-node-deps.ps1")
if ($LASTEXITCODE -ne 0) { throw "fix-node-deps failed" }

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
    try {
        $gpu = Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -and $_.Name -notmatch "Microsoft Basic" } |
            Select-Object -First 1
        if ($gpu -and $gpu.Name -match "Intel") { $model = "qwen2.5:1.5b" }
    } catch { }
    if (Test-Path ".env") {
        $envLine = Get-Content ".env" | Where-Object { $_ -match '^DEFAULT_MODEL=' } | Select-Object -First 1
        if ($envLine) { $model = ($envLine -split '=', 2)[1].Trim() }
    }
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
    Write-Host "  Starting pnpm tauri dev (first compile takes 15-30 min on low-RAM PCs)..." -ForegroundColor Yellow
    & powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\tauri-dev-windows.ps1")
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
    Write-Host "  Install Rust, then run: pnpm tauri dev" -ForegroundColor Red
    Write-Host "  Or build installer: scripts\build-combined-installer.ps1" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[8/8] Done" -ForegroundColor Cyan
Write-Host "  Setup wizard should appear on first launch." -ForegroundColor Gray
Write-Host "  Mount VeraCrypt (V:) before unlocking vault." -ForegroundColor Gray
Write-Host ""
