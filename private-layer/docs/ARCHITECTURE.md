# Architecture

## Overview

PrivateLayer is a **Windows desktop shell** (Tauri 2 + React) that gates access to your encrypted **Dark Side** — a local workspace for documents, models, and an action-taking assistant.

```
┌─────────────────────────────────────────────────────────┐
│  PrivateLayer.exe (Tauri)                               │
│  ┌─────────────┐    ┌──────────────────────────────────┐│
│  │ Vault Gate  │ →  │ Dark Side UI                     ││
│  │ (unlock)    │    │ Assistant │ Docs │ Train │ Settings││
│  └─────────────┘    └──────────────────────────────────┘│
└────────────────────────────┬────────────────────────────┘
                             │ HTTP localhost
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   Ollama :11434      Agent :8790         VeraCrypt volume
   (your LLM)         (Python FastAPI)    V:\PrivateLayer\
```

## Components

| Component | Tech | Role |
|-----------|------|------|
| `apps/desktop` | Tauri + React | Vault Gate, Dark Side navigation, assistant chat UI |
| `packages/agent` | Python FastAPI | LLM chat, tool execution, action approval |
| `packages/trainer` | Python + PEFT | LoRA fine-tune pipeline |
| `packages/tools` | Python | Shared PDF/Obsidian helpers (imported by agent) |
| VeraCrypt volume | External | Encryption at rest for vault, models, training data |
| Obsidian | External | Human-editable markdown UI on the vault |

## User sovereignty (no cloud restraint)

- Inference runs **locally** via Ollama (or your merged LoRA weights).
- **System prompt** is a file you edit (`vault-templates/system-prompt.txt`).
- **Base model** is your choice — including uncensored weights — because weights never leave your machine.
- **Actions** (file writes, PDF ops) go through `REQUIRE_ACTION_APPROVAL` unless you disable it.

PrivateLayer does not phone home. It does not inject OpenAI-style moderation.

## Action flow

1. User sends message in Assistant panel.
2. Agent calls Ollama with your system prompt + history.
3. Model may return ` ```action {...} ``` ` blocks.
4. If approval required → actions listed as pending; user re-sends with `approve_actions: true`.
5. Tools execute against paths under `VAULT_ROOT` only.

## What we deliberately do NOT merge

- **Dark web browsing** inside the document agent (see NETWORK_ISOLATION.md).
- **Cloud LLM APIs** in the default path (optional future plugin, off by default).

## Roadmap

- [ ] OS keychain for vault password
- [ ] Obsidian URI launcher from Documents view
- [ ] Approve/reject actions in UI (not just API flag)
- [ ] RAG index over vault markdown
- [ ] Ollama Modelfile generator after LoRA merge
