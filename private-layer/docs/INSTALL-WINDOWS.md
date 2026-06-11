# Install & run PrivateLayer on Windows

Step-by-step for a **proper installer** and daily use. No guessing your GPU — we detect it for you.

---

## Part A — One-time setup (30–45 minutes)

### 1. Install prerequisites

Install these (double-click each installer):

| Tool | Download | Why |
|------|----------|-----|
| **Node.js 22 LTS** | https://nodejs.org/ | Builds the app (avoid Node 24) |
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

## Part B — Build the **combined** installer (recommended)

One installer sets up **everything** (no secrets bundled):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-combined-installer.ps1
```

### What you get

| Output | When |
|--------|------|
| **`dist\PrivateLayer-Setup-0.1.0.exe`** | Inno Setup 6 installed on build PC (best) |
| **`dist\PrivateLayer-Setup-0.1.0.zip`** | Fallback if Inno not installed |

### Install like any Windows app

1. Double-click **`PrivateLayer-Setup-0.1.0.exe`**
2. Wizard installs to `%LOCALAPPDATA%\PrivateLayer\`
3. Post-install automatically:
   - Creates Python agent virtualenv + `pip install`
   - Checks **Ollama** (offers to open download page if missing)
   - Runs **GPU detect** → saves `config\gpu-recommendation.txt`
   - Creates **desktop shortcut**
   - Creates `config\.env` from template (you add vault path — no secrets pre-filled)

### Zip fallback

```powershell
# Extract zip, then:
powershell -ExecutionPolicy Bypass -File Install-PrivateLayer.ps1
```

### Old desktop-only build (optional)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-windows-installer.ps1
```

That NSIS build is desktop-only; prefer **build-combined-installer.ps1**.

---

## Part C — Every day: how to run it

### Option 1 — Desktop shortcut (easiest)

The **combined installer** creates this automatically. Or manually:

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
& "$env:LOCALAPPDATA\PrivateLayer\PrivateLayer.exe"
```

### Option 3 — One script

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-private-layer.ps1 `
  -InstallDir "$env:LOCALAPPDATA\PrivateLayer"
```

---

## Part D — First launch inside the app

1. **Mount VeraCrypt** (`V:`) before opening PrivateLayer
2. Open PrivateLayer → **Setup wizard** (first run only)
   - **Browse** your vault folder (or type `V:\PrivateLayer`)
   - **Pick Ollama model** from dropdown (or choose a default for later)
   - Click **Enter PrivateLayer** — saves `config\settings.json` + `config\.env` (no secrets)
3. **Vault Gate** → vault path is pre-filled from wizard
4. Enter your vault password → **Enter Dark Side**
5. Open **Assistant** → type a message
6. Status bar should show **LLM online** and **Agent online**

Re-run wizard anytime: **Vault Gate** → “Re-run setup wizard”, or **Settings** → “Open setup wizard”.

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

## What the combined installer does NOT bundle

| Not bundled | Why |
|-------------|-----|
| **API keys / passwords** | You put these in `config\.env` or VeraCrypt only |
| **Ollama binary** | Installer checks + opens download; you install once |
| **Model weights** | Large; you `ollama pull` after GPU detect |
| **VeraCrypt** | You create encrypted vault separately |
| **Obsidian** | Optional editor for vault markdown |

Python **is required** on the PC (agent venv is created at install). Ollama is prompted if missing.
