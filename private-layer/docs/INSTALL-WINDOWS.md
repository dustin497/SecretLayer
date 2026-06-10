# Install & run PrivateLayer on Windows

Step-by-step for a **proper installer** and daily use. No guessing your GPU — we detect it for you.

---

## Part A — One-time setup (30–45 minutes)

### 1. Install prerequisites

Install these (double-click each installer):

| Tool | Download | Why |
|------|----------|-----|
| **Node.js 20 LTS** | https://nodejs.org/ | Builds the app |
| **Rust** | https://rustup.rs/ | Desktop shell |
| **VS Build Tools** | https://visualstudio.microsoft.com/visual-cpp-build-tools/ | Check **“Desktop development with C++”** |
| **Python 3.11+** | https://www.python.org/ | Local agent |
| **Ollama** | https://ollama.com/ | Your local LLM |
| **VeraCrypt** (recommended) | https://www.veracrypt.fr/ | Encrypted vault drive |

### 2. Clone or open the project

```powershell
cd C:\Users\YOU\Projects\SecretLayer\private-layer
```

(Or wherever you cloned the repo.)

### 3. Find your GPU (you said you don’t know — run this)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\detect-gpu.ps1
```

It prints your GPU name and which model to pull, e.g.:

```powershell
ollama pull qwen2.5:7b
```

Copy that into `.env` as `DEFAULT_MODEL=qwen2.5:7b`.

### 4. Set up Python agent + dependencies

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows-setup.ps1
```

### 5. Create VeraCrypt vault (privacy)

1. VeraCrypt → Create Volume → file container → mount as **`V:`**
2. Create folder `V:\PrivateLayer`
3. Copy templates:

```powershell
xcopy /E /I vault-templates\obsidian V:\PrivateLayer\vault
copy .env.example V:\PrivateLayer\.env
```

4. Edit `V:\PrivateLayer\.env` — set `VAULT_ROOT=V:\PrivateLayer`

---

## Part B — Build the Windows installer

On your Windows machine (needs Rust + VS Build Tools):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-windows-installer.ps1
```

When it finishes, you get **two** installers in:

```
apps\desktop\src-tauri\target\release\bundle\nsis\PrivateLayer_0.1.0_x64-setup.exe   ← use this
apps\desktop\src-tauri\target\release\bundle\msi\PrivateLayer_0.1.0_x64_en-US.msi
```

### Install like any Windows app

1. Double-click **`PrivateLayer_0.1.0_x64-setup.exe`**
2. Click through the wizard (installs for current user by default)
3. Default location: `%LOCALAPPDATA%\Programs\PrivateLayer\PrivateLayer.exe`

The installer is **only the desktop shell**. Ollama + the Python agent are separate (privacy + updates).

---

## Part C — Every day: how to run it

### Option 1 — Desktop shortcut (easiest)

After installing:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\create-desktop-shortcut.ps1
```

Double-click **PrivateLayer** on your desktop. It will:

1. Start Ollama (if installed)
2. Start the Python agent (`:8790`)
3. Open the PrivateLayer app

### Option 2 — Manual

```powershell
# Terminal 1 — agent (leave open or use start script)
cd packages\agent
.\.venv\Scripts\python.exe -m agent serve

# Terminal 2 — or use installed exe
& "$env:LOCALAPPDATA\Programs\PrivateLayer\PrivateLayer.exe"
```

### Option 3 — One script

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-private-layer.ps1 `
  -InstalledExe "$env:LOCALAPPDATA\Programs\PrivateLayer\PrivateLayer.exe"
```

---

## Part D — First launch inside the app

1. **Mount VeraCrypt** (`V:`) before opening PrivateLayer
2. Open PrivateLayer → **Vault Gate**
3. Enter vault path: `V:\PrivateLayer`
4. Enter your vault password → **Enter Dark Side**
5. Open **Assistant** → type a message
6. Status bar should show **LLM online** and **Agent online**

If LLM offline: `ollama serve` and `ollama pull <your model>`  
If Agent offline: run `python -m agent serve` in `packages\agent`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails “link.exe not found” | Install VS Build Tools with C++ workload |
| Vault path not found | Mount VeraCrypt first |
| LLM offline | `ollama pull qwen2.5:7b` then restart |
| Agent offline | `scripts\windows-setup.ps1` again |
| App slow | Run `detect-gpu.ps1` — use smaller model |

---

## What the installer does NOT include

| Not bundled | You install separately |
|-------------|------------------------|
| Ollama + model weights | ollama.com |
| Python agent | `windows-setup.ps1` |
| VeraCrypt | veracrypt.fr |
| Obsidian | obsidian.md |

This keeps your **models and secrets** under your control, not inside a single opaque installer.
