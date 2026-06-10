import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


class Config:
    ollama_host: str = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
    default_model: str = os.getenv("DEFAULT_MODEL", "dolphin-mistral:latest")
    vault_root: Path = Path(os.getenv("VAULT_ROOT", "V:/PrivateLayer"))
    obsidian_vault: Path = Path(os.getenv("OBSIDIAN_VAULT", "V:/PrivateLayer/vault"))
    documents_dir: Path = Path(os.getenv("DOCUMENTS_DIR", "V:/PrivateLayer/documents"))
    training_dir: Path = Path(os.getenv("TRAINING_DIR", "V:/PrivateLayer/training"))
    system_prompt_file: Path = Path(
        os.getenv("AGENT_SYSTEM_PROMPT_FILE", "vault-templates/system-prompt.txt")
    )
    require_approval: bool = os.getenv("REQUIRE_ACTION_APPROVAL", "true").lower() == "true"
    agent_port: int = int(os.getenv("AGENT_PORT", "8790"))


config = Config()
