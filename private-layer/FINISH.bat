@echo off
setlocal
cd /d "%~dp0"

echo.
echo ========================================
echo   PrivateLayer - one-click finish
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found.
    echo Install Node 22 LTS from https://nodejs.org/ then run this again.
    start https://nodejs.org/
    pause
    exit /b 1
)

for /f "delims=" %%v in ('node -v') do set NODEVER=%%v
echo Node: %NODEVER%
echo %NODEVER% | findstr /r "^v24\." >nul
if not errorlevel 1 (
    echo.
    echo ERROR: Node 24 breaks Vite. Install Node 22 LTS instead.
    echo Download: https://nodejs.org/
    start https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo [1/2] Fixing dependencies...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\fix-node-deps.ps1"
if errorlevel 1 (
    echo.
    echo FAILED at fix-node-deps. Copy this window text and send it for help.
    pause
    exit /b 1
)

echo.
echo [2/2] Starting PrivateLayer (first compile 15-30 min - do not close)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\tauri-dev-windows.ps1"
if errorlevel 1 (
    echo.
    echo FAILED at tauri dev. Copy this window text and send it for help.
    pause
    exit /b 1
)

pause
