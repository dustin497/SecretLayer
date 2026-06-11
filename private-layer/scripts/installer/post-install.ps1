# Post-install: Python agent venv, Ollama check, GPU hint, shortcut, config
# Called by Inno Setup or Install-PrivateLayer.ps1
param(
    [string]$InstallDir = "$env:LOCALAPPDATA\PrivateLayer"
)

$ErrorActionPreference = "Continue"
$LogFile = Join-Path $InstallDir "install.log"
function Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Add-Content -Path $LogFile -Value $line
    Write-Host $msg
}

Log "=== PrivateLayer post-install ==="
Log "Install dir: $InstallDir"

# Config directory (secrets live here or on VeraCrypt — never bundled)
$configDir = Join-Path $InstallDir "config"
New-Item -ItemType Directory -Path $configDir -Force | Out-Null
$envFile = Join-Path $configDir ".env"
if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $InstallDir ".env.example") $envFile
    Log "Created config\.env — edit VAULT_ROOT after mounting VeraCrypt"
}

# Python agent venv
$agentDir = Join-Path $InstallDir "agent"
$venvPython = Join-Path $agentDir ".venv\Scripts\python.exe"

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Log "WARNING: Python not found. Install Python 3.11+ from python.org then re-run post-install.ps1"
} else {
    if (-not (Test-Path $venvPython)) {
        Log "Creating agent virtual environment..."
        Set-Location $agentDir
        python -m venv .venv
    }
    Log "Installing agent dependencies (may take 1-2 min)..."
    & (Join-Path $agentDir ".venv\Scripts\pip.exe") install -q -r (Join-Path $agentDir "requirements.txt")
    $env:PYTHONPATH = Join-Path $agentDir "src"
    Log "Agent venv ready."
}

# Ollama check
if (Get-Command ollama -ErrorAction SilentlyContinue) {
    Log "Ollama: installed"
    $ollamaVer = (ollama --version 2>&1) | Out-String
    Log "  $ollamaVer".Trim()
    # Suggest pulling a model if none
    try {
        $tags = ollama list 2>&1 | Out-String
        if ($tags -notmatch "qwen|dolphin|mistral|llama") {
            Log "No local models yet. Run: ollama pull qwen2.5:7b"
        }
    } catch { }
} else {
    Log "Ollama: NOT installed"
    Log "  Download: https://ollama.com/download/windows"
    $openOllama = Read-Host "Open Ollama download page in browser? (y/n)"
    if ($openOllama -eq "y") {
        Start-Process "https://ollama.com/download/windows"
    }
}

# GPU recommendation
$detectGpu = Join-Path $InstallDir "scripts\detect-gpu.ps1"
if (Test-Path $detectGpu) {
    $gpuOut = Join-Path $configDir "gpu-recommendation.txt"
    & powershell -ExecutionPolicy Bypass -File $detectGpu *>&1 | Tee-Object -FilePath $gpuOut
    Log "GPU hints saved to config\gpu-recommendation.txt"
}

# Desktop shortcut
$launcher = Join-Path $InstallDir "scripts\start-private-layer.ps1"
$shortcutScript = Join-Path $InstallDir "scripts\create-desktop-shortcut.ps1"
if (Test-Path $shortcutScript) {
    & powershell -ExecutionPolicy Bypass -File $shortcutScript `
        -InstalledExe (Join-Path $InstallDir "PrivateLayer.exe") `
        -InstallDir $InstallDir
    Log "Desktop shortcut created."
}

# Persist install path for launchers
Set-Content (Join-Path $configDir "install-path.txt") $InstallDir
[Environment]::SetEnvironmentVariable("PRIVATE_LAYER_HOME", $InstallDir, "User")

Log ""
Log "=== Post-install complete ==="
Log "Double-click 'PrivateLayer' on your desktop to start."
Log "Mount VeraCrypt, edit config\.env, then unlock in the app."
