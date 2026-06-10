# Network isolation (curiosity without burning your vault)

You asked about exploring sensitive parts of the internet privately. **Do not run that inside the same environment as your business vault and action-taking agent.** One compromise there exposes everything.

## Recommended architecture

```
┌──────────────────────┐     ┌──────────────────────┐
│  PrivateLayer        │     │  Network sandbox     │
│  Dark Side           │     │  (separate)          │
│  V:\ vault, agent,   │     │  Windows Sandbox VM  │
│  Ollama, Obsidian    │     │  or spare laptop     │
└──────────────────────┘     │  Tor Browser only    │
         NO bridge           └──────────────────────┘
```

## Option 1 — Windows Sandbox (built into Pro/Enterprise)

1. Enable Windows Sandbox in Windows Features.
2. Inside sandbox only: install Tor Browser.
3. No shared folders with host. No vault drive mounted.
4. When you close sandbox, everything is wiped.

## Option 2 — Hyper-V / VirtualBox VM

1. Minimal Linux or Windows VM.
2. Tor Browser + VPN if you want layered routing.
3. Snapshot before experiments; restore after.
4. Never install PrivateLayer or mount VeraCrypt in this VM.

## Option 3 — Dedicated VeraCrypt session (weaker)

A second VeraCrypt volume only for network curiosity — **no** Obsidian vault, **no** models, **no** agent. Still riskier than a VM because the host OS is shared.

## What PrivateLayer Network Lab does

The desktop app **documents** this setup and does **not** embed a Tor browser tied to your document agent. That separation is intentional:

- Your assistant can **write files** and **run tools** — coupling that to anonymous browsing is a security anti-pattern.
- Malicious pages should not share a process space with tools that edit PDFs and profiles.

## Legal and safety note

Tor and privacy tools are legal in most jurisdictions for legitimate research. You remain responsible for how you use them. PrivateLayer is built to **protect your data**, not to bypass law enforcement or facilitate harm.

## If you only need privacy from corporations/ISPs

For everyday privacy (not dark web), a local LLM + VeraCrypt vault already removes Big Tech from your document workflow. Tor is only needed for specific network anonymity goals.
