# PrivateLayer

**Your sovereign desktop vault for Windows.** A full desktop shell that unlocks into your encrypted **Dark Side** — local documents, your own trained model, and an action-taking assistant that runs only on your machine.

> Separate from SecretLayer. Nothing leaves your vault unless you explicitly allow it.

## What you get

| Zone | Purpose |
|------|---------|
| **Vault Gate** | Password unlock → enter your private layer |
| **Dark Side** | Main shell: assistant, documents, profiles, training |
| **Local LLM** | Ollama / your fine-tuned model — no cloud, no API keys in chat |
| **Training pipeline** | LoRA fine-tune on your writing and workflows |
| **Action agent** | Edits files, PDFs, Obsidian notes — you approve actions |

## Privacy model

```
Windows Desktop
    └── PrivateLayer.app (Tauri)
            └── Vault Gate (app-level encryption + VeraCrypt volume)
                    └── Dark Side
                            ├── Obsidian vault (markdown, tasks, plans)
                            ├── Your models (Ollama / GGUF / LoRA adapters)
                            ├── Documents + PDFs
                            └── Local agent (Python sidecar)
```

**Recommended:** store the vault on a **VeraCrypt** volume (e.g. `V:\`). Mount it before opening PrivateLayer. See [docs/PRIVACY.md](docs/PRIVACY.md).

## Install on Windows (installer + daily use)

**Full guide:** [docs/INSTALL-WINDOWS.md](docs/INSTALL-WINDOWS.md)

```powershell
# Don't know your GPU?
powershell -ExecutionPolicy Bypass -File scripts\detect-gpu.ps1

# One-time stack setup
powershell -ExecutionPolicy Bypass -File scripts\windows-setup.ps1

# Build proper installer (.exe setup + .msi)
powershell -ExecutionPolicy Bypass -File scripts\build-windows-installer.ps1

# Desktop shortcut → starts Ollama + agent + app
powershell -ExecutionPolicy Bypass -File scripts\create-desktop-shortcut.ps1
```

**Can you put cloud AI “in” the model?** No — but your **local** trained assistant is yours. See [docs/LOCAL-ASSISTANT-VS-CLOUD.md](docs/LOCAL-ASSISTANT-VS-CLOUD.md).

## Quick start (developers)

### 1. Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [pnpm](https://pnpm.io/) — `corepack enable && corepack prepare pnpm@10.33.3 --activate`
- [Rust](https://rustup.rs/) (for Tauri)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) — C++ workload
- [Ollama](https://ollama.com/) — local inference
- [Python 3.11+](https://www.python.org/)
- [VeraCrypt](https://www.veracrypt.fr/) (optional but recommended)

### 2. Install

```powershell
cd private-layer
pnpm install
copy .env.example .env
# Edit .env — set VAULT_ROOT to your mounted VeraCrypt drive
```

### 3. Pull a local model (your choice — uncensored bases work)

```powershell
ollama pull dolphin-mistral
# or: ollama pull qwen2.5:7b
```

### 4. Python agent sidecar

```powershell
cd packages/agent
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m agent serve
```

### 5. Run the desktop app

```powershell
cd ..\..
pnpm tauri dev
```

Flow: **Launch → Vault Gate (unlock) → Dark Side dashboard**.

## Training your own model

See [docs/TRAINING.md](docs/TRAINING.md). Short version:

1. Export approved edits from the agent into `training/raw/`.
2. Run `python -m trainer prepare` to build JSONL.
3. Run `python -m trainer finetune` (LoRA on your GPU).
4. Merge adapter → point Ollama or llama.cpp at your weights.

You own the data, the weights, and the behavior. No cloud moderation.

## Your model, your rules

PrivateLayer does **not** inject cloud safety filters. You pick:

- Base model (including uncensored local weights)
- System prompt (`vault-templates/system-prompt.txt`)
- Which actions require approval (`REQUIRE_ACTION_APPROVAL`)

The assistant is built to **act** (write files, reorganize vault, update profiles) when you allow it — not to lecture you.

## Network / curiosity zone

For isolated research browsing, use a **separate sandbox** (Tor Browser in a VM or dedicated VeraCrypt session) — not mixed with your document agent. See [docs/NETWORK_ISOLATION.md](docs/NETWORK_ISOLATION.md).

## Project layout

```
private-layer/
  apps/desktop/       # Tauri + React — Vault Gate + Dark Side UI
  packages/agent/     # Local action-taking LLM agent
  packages/trainer/   # LoRA training pipeline
  packages/tools/     # PDF, Obsidian, profile helpers
  vault-templates/    # Obsidian + system prompt starters
  docs/
```

## Commands

```powershell
pnpm dev              # Vite frontend only
pnpm tauri dev        # Full desktop app (Windows)
pnpm tauri build      # Production .msi / .exe
```

## Docs

- [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [PRIVACY.md](docs/PRIVACY.md)
- [TRAINING.md](docs/TRAINING.md)
- [NETWORK_ISOLATION.md](docs/NETWORK_ISOLATION.md)
