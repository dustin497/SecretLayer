# Start full PrivateLayer stack: agent sidecar + desktop app
# Use after installing PrivateLayer and running windows-setup.ps1 once.
#
#   powershell -ExecutionPolicy Bypass -File scripts\start-private-layer.ps1
#
# Optional: pass -InstalledExe if you installed via NSIS to Program Files

param(
    [string]$InstalledExe = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

# Load .env from repo or vault
$envFile = Join-Path $Root ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
}

$vaultRoot = $env:VAULT_ROOT
if ($vaultRoot -and -not (Test-Path $vaultRoot)) {
    Write-Host "Vault not mounted: $vaultRoot" -ForegroundColor Yellow
    Write-Host "Mount VeraCrypt first, or edit .env VAULT_ROOT" -ForegroundColor Yellow
}

# 1) Ollama (if installed)
if (Get-Command ollama -ErrorAction SilentlyContinue) {
    $ollamaProc = Get-Process ollama -ErrorAction SilentlyContinue
    if (-not $ollamaProc) {
        Write-Host "Starting Ollama..." -ForegroundColor Gray
        Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden
        Start-Sleep -Seconds 2
    }
} else {
    Write-Host "Ollama not found — install from https://ollama.com" -ForegroundColor Yellow
}

# 2) Python agent
$agentPython = Join-Path $Root "packages\agent\.venv\Scripts\python.exe"
if (Test-Path $agentPython) {
    $agentRunning = $false
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:8790/health" -UseBasicParsing -TimeoutSec 2
        $agentRunning = $r.StatusCode -eq 200
    } catch { }

    if (-not $agentRunning) {
        Write-Host "Starting PrivateLayer agent on :8790..." -ForegroundColor Gray
        $agentDir = Join-Path $Root "packages\agent"
        Start-Process -FilePath $agentPython -ArgumentList "-m", "agent", "serve" -WorkingDirectory $agentDir -WindowStyle Hidden
        Start-Sleep -Seconds 2
    }
} else {
    Write-Host "Agent not set up. Run scripts\windows-setup.ps1 first." -ForegroundColor Yellow
}

# 3) Desktop app
if ($InstalledExe -and (Test-Path $InstalledExe)) {
    Write-Host "Launching installed PrivateLayer..." -ForegroundColor Green
    Start-Process $InstalledExe
    exit 0
}

$devExe = Join-Path $Root "apps\desktop\src-tauri\target\release\private-layer-desktop.exe"
if (Test-Path $devExe) {
    Write-Host "Launching PrivateLayer (release build)..." -ForegroundColor Green
    Start-Process $devExe
    exit 0
}

# Fallback: dev mode
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    Write-Host "No release .exe found — starting dev mode (pnpm tauri dev)..." -ForegroundColor Yellow
    Set-Location $Root
    pnpm tauri dev
} else {
    Write-Host "Install PrivateLayer via the NSIS .exe from build-windows-installer.ps1" -ForegroundColor Red
    exit 1
}
