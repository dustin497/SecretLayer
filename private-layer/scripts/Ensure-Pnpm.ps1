# Ensures pnpm is available. Auto-enables via corepack, npm, or npx fallback.
# Compatible with Windows PowerShell 5.1+ (no && operator).

function Refresh-NodePath {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { return }
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

    if (Get-Command npm -ErrorAction SilentlyContinue) {
        Write-Host "  Installing pnpm globally via npm..." -ForegroundColor Gray
        npm install -g pnpm@10.33.3
        Refresh-NodePath
        if (Get-Command pnpm -ErrorAction SilentlyContinue) {
            Write-Host "  OK  pnpm (via npm install -g)" -ForegroundColor Green
            return
        }
    }

    Write-Host "  OK  pnpm (will use npx fallback)" -ForegroundColor Yellow
}
