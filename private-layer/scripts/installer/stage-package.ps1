# Stage files for combined Windows installer
param(
    [string]$Root = "",
    [string]$OutDir = ""
)

$ErrorActionPreference = "Stop"
if (-not $Root) {
    $Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
}
if (-not $OutDir) {
    $OutDir = Join-Path $Root "dist\staging"
}

if (Test-Path $OutDir) {
    Remove-Item $OutDir -Recurse -Force
}
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

# Desktop binary (Tauri release)
$releaseDir = Join-Path $Root "apps\desktop\src-tauri\target\release"
$desktopExe = Join-Path $releaseDir "private-layer-desktop.exe"
if (-not (Test-Path $desktopExe)) {
    throw "Desktop exe not found. Run: pnpm tauri build`n  Expected: $desktopExe"
}
Copy-Item $desktopExe (Join-Path $OutDir "PrivateLayer.exe")

# Agent package (no venv — created on user's machine at install)
$agentDest = Join-Path $OutDir "agent"
New-Item -ItemType Directory -Path $agentDest -Force | Out-Null
$agentSrc = Join-Path $Root "packages\agent"
Copy-Item (Join-Path $agentSrc "requirements.txt") $agentDest
Copy-Item (Join-Path $agentSrc "pyproject.toml") $agentDest
Copy-Item (Join-Path $agentSrc "src") (Join-Path $agentDest "src") -Recurse

# Scripts (user-facing only — no build/dev scripts)
$scriptsOut = Join-Path $OutDir "scripts"
New-Item -ItemType Directory -Path $scriptsOut -Force | Out-Null
$scriptFiles = @(
    "scripts\start-private-layer.ps1",
    "scripts\detect-gpu.ps1",
    "scripts\create-desktop-shortcut.ps1",
    "scripts\installer\post-install.ps1"
)
foreach ($rel in $scriptFiles) {
    $p = Join-Path $Root $rel
    if (Test-Path $p) {
        $destName = Split-Path $rel -Leaf
        Copy-Item $p (Join-Path $scriptsOut $destName) -Force
    }
}

# Vault templates
$templatesSrc = Join-Path $Root "vault-templates"
if (Test-Path $templatesSrc) {
    Copy-Item $templatesSrc (Join-Path $OutDir "vault-templates") -Recurse -Force
}

Copy-Item (Join-Path $Root ".env.example") (Join-Path $OutDir ".env.example")
Copy-Item (Join-Path $Root "docs\INSTALL-WINDOWS.md") (Join-Path $OutDir "INSTALL.md") -ErrorAction SilentlyContinue

# Version marker
$version = "0.1.0"
try {
    $pkg = Get-Content (Join-Path $Root "package.json") -Raw | ConvertFrom-Json
    $version = $pkg.version
} catch { }
Set-Content (Join-Path $OutDir "VERSION.txt") $version

Write-Host "Staged to: $OutDir" -ForegroundColor Green
Write-Host "  PrivateLayer.exe + agent + scripts + templates" -ForegroundColor Gray
