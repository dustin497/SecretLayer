# PrivateLayer - repair broken node_modules (picomatch/vite/esbuild on Windows)
# Run from private-layer root:
#   powershell -ExecutionPolicy Bypass -File scripts\fix-node-deps.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host ""
Write-Host "=== PrivateLayer — fix Node dependencies ===" -ForegroundColor Cyan
Write-Host ""

$nodeVersion = (node -v)
Write-Host "Node: $nodeVersion" -ForegroundColor Gray
if ($nodeVersion -match "^v24\.") {
    Write-Host "WARN: Node 24 can break Vite. Prefer Node 20 LTS from https://nodejs.org/" -ForegroundColor Yellow
}

Write-Host "Removing old node_modules..." -ForegroundColor Gray
Get-ChildItem -Path $Root -Directory -Recurse -Filter "node_modules" -ErrorAction SilentlyContinue |
    ForEach-Object { Remove-Item -Recurse -Force $_.FullName -ErrorAction SilentlyContinue }

if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    & pnpm install
} else {
    & npx --yes pnpm@10.33.3 install
}
if ($LASTEXITCODE -ne 0) { throw "pnpm install failed" }

Write-Host ""
Write-Host "OK — dependencies reinstalled." -ForegroundColor Green
Write-Host "Next: powershell -ExecutionPolicy Bypass -File scripts\tauri-dev-windows.ps1" -ForegroundColor Gray
Write-Host ""
