# AGENTS.md — PrivateLayer

Separate from SecretLayer. Sovereign Windows desktop vault at `private-layer/`.

## Cursor Cloud specific instructions

- Target OS: **Windows** (Tauri build). Linux cloud VM can lint frontend only.
- VM update script: `cd private-layer && pnpm install`
- Full desktop: `pnpm tauri dev` (requires Rust + Windows SDK on user machine)
- Combined Windows installer: `scripts/build-combined-installer.ps1` → `dist/PrivateLayer-Setup-*.exe` (Inno) or zip fallback
- Desktop-only build: `scripts/build-windows-installer.ps1`
- GPU detect: `scripts/detect-gpu.ps1`
- Daily launch: `scripts/start-private-layer.ps1` + `create-desktop-shortcut.ps1`
- Agent sidecar: `cd packages/agent && pip install -e . && python -m agent serve` (port 8790)
- Ollama expected at `127.0.0.1:11434`

## Key paths

| Path | Purpose |
|------|---------|
| `apps/desktop` | Tauri + React shell |
| `packages/agent` | Action-taking LLM agent |
| `packages/trainer` | LoRA pipeline |
| `vault-templates/` | System prompt + Obsidian starter |

## User sovereignty

Do not add cloud LLM defaults or moderation layers unless user explicitly requests. Local model + user-edited system prompt is the design.

## Network

Do not integrate dark-web browsing into the agent. Document isolation in `docs/NETWORK_ISOLATION.md` only.
