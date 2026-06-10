# Training your own model

PrivateLayer ships a **LoRA fine-tuning pipeline** so your assistant learns your tone, templates, and workflows — on your GPU, on your data.

## Prerequisites (Windows)

- NVIDIA GPU with **16GB+ VRAM** recommended for 7B QLoRA
- CUDA-enabled PyTorch (install from [pytorch.org](https://pytorch.org/) if `pip install torch` fails)
- Python 3.11+

```powershell
cd packages\trainer
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Step 1 — Collect training examples

Every time you **approve** a good assistant edit, save a JSON file in `training/raw/`:

```json
{
  "instruction": "What you asked",
  "input": "Optional context",
  "output": "The response you approved, including action blocks if useful"
}
```

See `training/raw/example.json`.

Quality beats quantity: **50–200** excellent examples often beat thousands of noisy ones.

## Step 2 — Prepare dataset

```powershell
python -m trainer prepare
```

Creates `training/dataset.jsonl`.

## Step 3 — Fine-tune (LoRA)

```powershell
set BASE_MODEL_FOR_FINETUNE=Qwen/Qwen2.5-7B-Instruct
set LORA_OUTPUT_DIR=V:\PrivateLayer\training\adapter
python -m trainer finetune
```

Training may take 30–90 minutes depending on GPU and dataset size.

## Step 4 — Merge and load in Ollama

### Option A — Merge adapter (recommended)

Use `llama.cpp` or Hugging Face merge script to bake LoRA into base weights, then import to Ollama.

### Option B — Ollama Modelfile with adapter (experimental)

Create `Modelfile`:

```
FROM qwen2.5:7b
ADAPTER V:\PrivateLayer\training\adapter
SYSTEM """<paste your system-prompt.txt>"""
```

```powershell
ollama create my-associate -f Modelfile
```

Set in `.env`:

```
DEFAULT_MODEL=my-associate
```

## Step 5 — Iterate

1. Use the model for real work.
2. Export good turns to `training/raw/`.
3. Re-run `prepare` + `finetune`.
4. Swap model in Ollama.

You are training **your** associate — not a cloud model with hidden rules.

## Uncensored bases

Many users start from uncensored local bases (e.g. Dolphin variants) before LoRA. That is a **local choice** — weights stay on your volume.
