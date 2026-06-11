# PrivateLayer — Windows first-time setup
# Run in PowerShell (not as admin unless installing system tools)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "=== PrivateLayer Windows Setup ===" -ForegroundColor Cyan

# Node / pnpm
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Install Node.js 20+ from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
corepack enable
corepack prepare pnpm@10.33.3 --activate

pnpm install

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env — edit VAULT_ROOT to your VeraCrypt mount (e.g. V:\PrivateLayer)" -ForegroundColor Green
}

# Agent venv
$AgentDir = Join-Path $Root "packages\agent"
Set-Location $AgentDir
if (-not (Test-Path ".venv")) {
    python -m venv .venv
}
& .\.venv\Scripts\pip install -r requirements.txt

# Trainer venv (optional)
$TrainerDir = Join-Path $Root "packages\trainer"
Set-Location $TrainerDir
if (-not (Test-Path ".venv")) {
    python -m venv .venv
}
Write-Host "Trainer: activate packages\trainer\.venv and pip install -r requirements.txt when ready for GPU training" -ForegroundColor Gray

Set-Location $Root
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Mount VeraCrypt volume"
Write-Host "  2. ollama pull dolphin-mistral"
Write-Host "  3. packages\agent\.venv\Scripts\python -m agent serve"
Write-Host "  4. pnpm tauri dev"
Write-Host ""
Write-Host "See docs\PRIVACY.md for full vault layout." -ForegroundColor Green
