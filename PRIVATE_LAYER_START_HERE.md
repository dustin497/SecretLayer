# PrivateLayer — start here

**If you don't see PrivateLayer**, you're probably on the wrong git branch or haven't installed the app yet.

## 1. Get the code (required)

PrivateLayer lives on branch `cursor/private-layer-scaffold-058f`, **not** on `main`.

```powershell
git fetch origin
git checkout cursor/private-layer-scaffold-058f
```

Then open this folder in your editor:

```
your-repo\private-layer\
```

## 2. Run without building an installer (fastest test)

On Windows, in PowerShell:

```powershell
cd private-layer
powershell -ExecutionPolicy Bypass -File scripts\windows-setup.ps1
ollama pull qwen2.5:7b
packages\agent\.venv\Scripts\python.exe -m agent serve
```

Leave that window open. New PowerShell window:

```powershell
cd private-layer
pnpm install
pnpm tauri dev
```

The **PrivateLayer window** opens from `pnpm tauri dev` (not from a Start Menu entry yet).

## 3. Install like a normal Windows app

```powershell
cd private-layer
powershell -ExecutionPolicy Bypass -File scripts\build-combined-installer.ps1
```

Double-click:

```
private-layer\dist\PrivateLayer-Setup-0.1.0.exe
```

Then create desktop icon:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\create-desktop-shortcut.ps1
```

## 4. Where things appear

| What | Where |
|------|--------|
| Project files | `...\SecretLayer\private-layer\` |
| Installed app | `%LOCALAPPDATA%\PrivateLayer\PrivateLayer.exe` |
| Desktop shortcut | After `create-desktop-shortcut.ps1` |
| Start Menu | After combined installer (search "PrivateLayer") |

## 5. Still stuck?

- **`main` branch** = only a stub README — no PrivateLayer
- **No `.exe` until you build** on your Windows PC (Rust + Node required)
- Full guide: `private-layer\docs\INSTALL-WINDOWS.md`
