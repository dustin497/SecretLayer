# Finish PrivateLayer on Windows — handoff for local Cursor agent

Cloud agents **cannot** run PowerShell on your PC. Use this doc in **local Agent mode** (not Cloud).

## Your machine state (as of last session)

- Repo copied to: `C:\dev\secretlair-\private-layer`
- Branch: `cursor/private-layer-scaffold-058f`
- GPU: Intel UHD ~2GB → use `qwen2.5:1.5b`
- Rust compile issues were memory/stack related (fixed via env vars in scripts)
- Last error: `Cannot find package 'picomatch'` (broken node_modules + Node 24)

## One-shot finish (run in PowerShell)

```powershell
cd C:\dev\secretlair-\private-layer
git pull origin cursor/private-layer-scaffold-058f
powershell -ExecutionPolicy Bypass -File scripts\fix-node-deps.ps1
powershell -ExecutionPolicy Bypass -File scripts\tauri-dev-windows.ps1
```

If `git pull` fails, skip it and run the two scripts anyway.

## If picomatch / vite still fails

Install Node **20 LTS** (not 24): https://nodejs.org/  
Close PowerShell, reopen, then:

```powershell
node -v   # must show v20.x
cd C:\dev\secretlair-\private-layer
powershell -ExecutionPolicy Bypass -File scripts\fix-node-deps.ps1
powershell -ExecutionPolicy Bypass -File scripts\tauri-dev-windows.ps1
```

## Success criteria

- Vite starts without `picomatch` error
- Rust compiles (15–30 min first time)
- PrivateLayer window opens
- Setup wizard appears on first launch

## Copy-paste prompt for new local agent

```
Finish PrivateLayer Windows dev setup on my PC.

Project path: C:\dev\secretlair-\private-layer
Branch: cursor/private-layer-scaffold-058f
Repo: https://github.com/dustin497/secretlair-

Context:
- Intel UHD GPU — Ollama model should be qwen2.5:1.5b
- Project must NOT be on OneDrive (already at C:\dev\)
- Previous errors: Rust stack overflow (fixed with RUST_MIN_STACK=8388608, CARGO_BUILD_JOBS=1), then picomatch/vite ERR_MODULE_NOT_FOUND with Node v24

Do this in PowerShell (local terminal, not cloud):
1. cd C:\dev\secretlair-\private-layer
2. git pull origin cursor/private-layer-scaffold-058f
3. If node -v shows v24, tell me to install Node 20 LTS first
4. powershell -ExecutionPolicy Bypass -File scripts\fix-node-deps.ps1
5. powershell -ExecutionPolicy Bypass -File scripts\tauri-dev-windows.ps1
6. If agent not running: packages\agent\.venv\Scripts\python.exe -m agent serve (separate window)
7. Confirm PrivateLayer window opens; fix any remaining errors until tauri dev succeeds

Do not move project back to OneDrive. Use scripts in private-layer/scripts/ — do not invent new paths.
```
