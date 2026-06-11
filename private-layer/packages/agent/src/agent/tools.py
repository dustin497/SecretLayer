import json
import re
from datetime import datetime, timezone
from pathlib import Path

import fitz  # PyMuPDF
import yaml

from .config import config


def write_markdown_note(relative_path: str, content: str) -> str:
    """Write or update a markdown note in the Obsidian vault."""
    target = config.obsidian_vault / relative_path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    return str(target)


def read_markdown_note(relative_path: str) -> str:
    target = config.obsidian_vault / relative_path
    if not target.exists():
        raise FileNotFoundError(relative_path)
    return target.read_text(encoding="utf-8")


def update_business_profile(profile_name: str, updates: dict) -> str:
    """Merge updates into a YAML business profile."""
    profiles_dir = config.vault_root / "profiles"
    profiles_dir.mkdir(parents=True, exist_ok=True)
    path = profiles_dir / f"{profile_name}.yaml"
    existing = {}
    if path.exists():
        existing = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    existing.update(updates)
    existing["updated_at"] = datetime.now(timezone.utc).isoformat()
    path.write_text(yaml.dump(existing, sort_keys=False), encoding="utf-8")
    return str(path)


def pdf_extract_text(pdf_name: str) -> str:
    path = config.documents_dir / pdf_name
    doc = fitz.open(path)
    text = "\n".join(page.get_text() for page in doc)
    doc.close()
    return text


def pdf_set_metadata(pdf_name: str, metadata: dict) -> str:
    """
    Set PDF document metadata (title, author, subject, keywords, dates).
    For correcting archival metadata on documents you own — not forgery.
    """
    path = config.documents_dir / pdf_name
    doc = fitz.open(path)
    for key, value in metadata.items():
        if key in ("creationDate", "modDate"):
            doc.set_metadata({key: value})
        else:
            m = doc.metadata or {}
            m[key] = str(value)
            doc.set_metadata(m)
    out = path.with_suffix(".updated.pdf")
    doc.save(out)
    doc.close()
    return str(out)


def parse_action_blocks(reply: str) -> list[dict]:
    """Extract JSON action blocks from model output: ```action {...} ```"""
    pattern = r"```action\s*(\{.*?\})\s*```"
    actions = []
    for match in re.finditer(pattern, reply, re.DOTALL):
        try:
            actions.append(json.loads(match.group(1)))
        except json.JSONDecodeError:
            continue
    return actions


def execute_action(action: dict) -> str:
    tool = action.get("tool")
    args = action.get("args", {})
    if tool == "write_markdown":
        return write_markdown_note(args["path"], args["content"])
    if tool == "read_markdown":
        return read_markdown_note(args["path"])
    if tool == "update_profile":
        return update_business_profile(args["name"], args["updates"])
    if tool == "pdf_extract":
        return pdf_extract_text(args["name"])[:8000]
    if tool == "pdf_metadata":
        return pdf_set_metadata(args["name"], args.get("metadata", {}))
    raise ValueError(f"Unknown tool: {tool}")
