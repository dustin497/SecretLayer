# PrivateLayer - launch Tauri dev with Windows-safe Rust/Node settings
# Run from private-layer root:
#   powershell -ExecutionPolicy Bypass -File scripts\tauri-dev-windows.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if ($Root -match "OneDrive") {
    Write-Host "WARN: Project is on OneDrive. Move to C:\dev\secretlair-\private-layer for reliable Rust builds." -ForegroundColor Yellow
}

# Bigger stack for rustc LLVM threads (fixes "optimize module ... overflowed its stack")
$env:RUST_MIN_STACK = "8388608"
# One crate at a time — less RAM pressure on Intel iGPU / 8GB RAM PCs
$env:CARGO_BUILD_JOBS = "1"
# Less debug info during dev compile
$env:CARGO_PROFILE_DEV_DEBUG = "0"

Write-Host ""
Write-Host "PrivateLayer — tauri dev" -ForegroundColor Cyan
Write-Host "  RUST_MIN_STACK=$env:RUST_MIN_STACK" -ForegroundColor Gray
Write-Host "  CARGO_BUILD_JOBS=$env:CARGO_BUILD_JOBS" -ForegroundColor Gray
Write-Host "  First compile may take 15-30 minutes. Do not close this window." -ForegroundColor Yellow
Write-Host ""

if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    & pnpm tauri dev
} else {
    & npx --yes pnpm@10.33.3 tauri dev
}
exit $LASTEXITCODE
