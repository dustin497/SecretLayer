import sys
from pathlib import Path

from .finetune import run_finetune
from .prepare import prepare_dataset

TRAINING_ROOT = Path(__file__).resolve().parents[4] / "training"


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "help"
    if cmd == "prepare":
        n = prepare_dataset(TRAINING_ROOT / "raw", TRAINING_ROOT / "dataset.jsonl")
        print(f"Prepared {n} training examples → {TRAINING_ROOT / 'dataset.jsonl'}")
    elif cmd == "finetune":
        out = run_finetune()
        print(f"Adapter saved → {out}")
        print("Import into Ollama: see docs/TRAINING.md")
    else:
        print("Usage:")
        print("  python -m trainer prepare")
        print("  python -m trainer finetune")


if __name__ == "__main__":
    main()
