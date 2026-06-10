# Start full PrivateLayer stack: Ollama + agent + desktop app
param(
    [string]$InstalledExe = "",
    [string]$InstallDir = ""
)

$ErrorActionPreference = "Stop"

# Resolve install root
if ($InstallDir -and (Test-Path $InstallDir)) {
    $Root = $InstallDir
} elseif ($env:PRIVATE_LAYER_HOME -and (Test-Path $env:PRIVATE_LAYER_HOME)) {
    $Root = $env:PRIVATE_LAYER_HOME
} elseif (Test-Path "$env:LOCALAPPDATA\PrivateLayer\PrivateLayer.exe") {
    $Root = "$env:LOCALAPPDATA\PrivateLayer"
} else {
    $Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
}

# Load .env — prefer installed config\, then repo .env
$envCandidates = @(
    (Join-Path $Root "config\.env"),
    (Join-Path $Root ".env")
)
foreach ($envFile in $envCandidates) {
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
                [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
            }
        }
        break
    }
}

$vaultRoot = $env:VAULT_ROOT
if ($vaultRoot -and -not (Test-Path $vaultRoot)) {
    Write-Host "Vault not mounted: $vaultRoot — mount VeraCrypt or edit config\.env" -ForegroundColor Yellow
}

# 1) Ollama
if (Get-Command ollama -ErrorAction SilentlyContinue) {
    if (-not (Get-Process ollama -ErrorAction SilentlyContinue)) {
        Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden
        Start-Sleep -Seconds 2
    }
} else {
    Write-Host "Ollama not installed: https://ollama.com/download/windows" -ForegroundColor Yellow
}

# 2) Agent — installed layout uses agent\ not packages\agent\
$agentCandidates = @(
    (Join-Path $Root "agent\.venv\Scripts\python.exe"),
    (Join-Path $Root "packages\agent\.venv\Scripts\python.exe")
)
$agentPython = $agentCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
$agentDir = if ($agentPython) { Split-Path (Split-Path (Split-Path $agentPython)) } else { Join-Path $Root "agent" }

if ($agentPython) {
    $agentRunning = $false
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:8790/health" -UseBasicParsing -TimeoutSec 2
        $agentRunning = $r.StatusCode -eq 200
    } catch { }

    if (-not $agentRunning) {
        $env:PYTHONPATH = Join-Path $agentDir "src"
        Start-Process -FilePath $agentPython -ArgumentList "-m", "agent", "serve" -WorkingDirectory $agentDir -WindowStyle Hidden
        Start-Sleep -Seconds 2
    }
} else {
    Write-Host "Agent not ready — re-run scripts\installer\post-install.ps1" -ForegroundColor Yellow
}

# 3) Desktop
if (-not $InstalledExe) {
    $InstalledExe = Join-Path $Root "PrivateLayer.exe"
}
if (-not (Test-Path $InstalledExe)) {
    $InstalledExe = Join-Path $Root "apps\desktop\src-tauri\target\release\private-layer-desktop.exe"
}

if (Test-Path $InstalledExe) {
    Start-Process $InstalledExe
    exit 0
}

if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    Set-Location $Root
    pnpm tauri dev
} else {
    Write-Host "PrivateLayer.exe not found. Run build-combined-installer.ps1" -ForegroundColor Red
    exit 1
}
