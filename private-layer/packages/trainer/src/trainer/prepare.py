"""
Build training JSONL from approved agent edits.

Place raw examples in training/raw/*.json:
{
  "instruction": "Reorganize my Q2 plan",
  "input": "...context...",
  "output": "...your approved response..."
}
"""

import json
from pathlib import Path


def prepare_dataset(raw_dir: Path, out_file: Path) -> int:
    raw_dir.mkdir(parents=True, exist_ok=True)
    out_file.parent.mkdir(parents=True, exist_ok=True)

    rows = []
    for path in sorted(raw_dir.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        instruction = data.get("instruction", "")
        inp = data.get("input", "")
        output = data.get("output", "")
        text = (
            f"### Instruction:\n{instruction}\n\n"
            f"### Input:\n{inp}\n\n"
            f"### Response:\n{output}"
        )
        rows.append({"text": text})

    with out_file.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row) + "\n")

    return len(rows)
