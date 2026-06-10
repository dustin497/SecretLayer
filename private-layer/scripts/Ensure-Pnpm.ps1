# Ensures pnpm is available. Auto-enables via corepack when Node is installed.
# Compatible with Windows PowerShell 5.1+ (no && operator).

function Ensure-Pnpm {
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        Write-Host "  OK  pnpm" -ForegroundColor Green
        return
    }

    if (-not (Get-Command corepack -ErrorAction SilentlyContinue)) {
        Write-Host "MISSING: pnpm" -ForegroundColor Red
        Write-Host "  Install Node.js 20+ from https://nodejs.org/" -ForegroundColor Yellow
        Write-Host "  Then run:" -ForegroundColor Yellow
        Write-Host "    corepack enable" -ForegroundColor Yellow
        Write-Host "    corepack prepare pnpm@10.33.3 --activate" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "  pnpm not on PATH — enabling via corepack..." -ForegroundColor Yellow
    corepack enable | Out-Null
    corepack prepare pnpm@10.33.3 --activate | Out-Null

    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-Host "MISSING: pnpm (corepack setup failed)" -ForegroundColor Red
        Write-Host "  Run manually:" -ForegroundColor Yellow
        Write-Host "    corepack enable" -ForegroundColor Yellow
        Write-Host "    corepack prepare pnpm@10.33.3 --activate" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "  OK  pnpm (via corepack)" -ForegroundColor Green
}
