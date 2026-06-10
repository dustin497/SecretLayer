# Privacy setup (Windows + VeraCrypt)

## Goal

Your **Dark Side** data — notes, PDFs, models, training sets — lives on an encrypted volume. Windows sees nothing useful when the volume is dismounted.

## Step 1 — Create VeraCrypt volume

1. Install [VeraCrypt](https://www.veracrypt.fr/en/Downloads.html).
2. Create encrypted file container or encrypt a USB partition (e.g. 50–200 GB).
3. Choose a strong password. Optionally add keyfiles.
4. Mount as drive letter **`V:`** (recommended in `.env`).

## Step 2 — Lay out the vault

After mounting `V:`:

```
V:\PrivateLayer\
  vault\          ← Obsidian vault (copy vault-templates/obsidian)
  documents\      ← PDFs
  models\         ← Ollama models / GGUF / LoRA adapters
  training\       ← raw JSON + dataset.jsonl
  profiles\       ← business YAML profiles
  .env            ← secrets ONLY here (never on C:)
```

Copy templates:

```powershell
xcopy /E /I vault-templates\obsidian V:\PrivateLayer\vault
copy .env.example V:\PrivateLayer\.env
```

Point PrivateLayer `.env` on `C:` to `VAULT_ROOT=V:\PrivateLayer` or run the app from the volume.

## Step 3 — Obsidian

1. Open Obsidian → Open folder as vault → `V:\PrivateLayer\vault`.
2. Disable community plugins you do not trust.
3. Do not install sync plugins that upload to cloud.

## Step 4 — Ollama models on the volume (optional)

Set `OLLAMA_MODELS` to `V:\PrivateLayer\models` in Windows user environment variables so weights stay encrypted when volume is dismounted.

## Step 5 — API keys and secrets

- Store in `V:\PrivateLayer\.env` only.
- PrivateLayer Settings UI reads env — **never type secrets into assistant chat**.
- Disarm chat logging: agent keeps only in-memory history (restart clears).

## Daily workflow

1. Mount VeraCrypt (`V:`).
2. Start Ollama (if not a service).
3. Start agent: `python -m agent serve`.
4. Open PrivateLayer → unlock Vault Gate → work in Dark Side.
5. When done: lock vault in app → dismount VeraCrypt.

## Threat model (honest)

| Protected | Not protected |
|-----------|----------------|
| Data at rest when dismounted | Live memory while app is running |
| Local-only inference | Malware on Windows host |
| User-controlled actions | Physical access while mounted |

For high-risk browsing, use **Network Lab** isolation — never the same session as your vault editor.
