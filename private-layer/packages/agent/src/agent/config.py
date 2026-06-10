import os
from pathlib import Path

from dotenv import load_dotenv


def bootstrap_env() -> None:
    load_dotenv()
    for base in (
        os.getenv("PRIVATE_LAYER_HOME"),
        os.path.join(os.getenv("LOCALAPPDATA", ""), "PrivateLayer"),
    ):
        if not base:
            continue
        env_path = Path(base) / "config" / ".env"
        if env_path.exists():
            load_dotenv(env_path, override=True)


bootstrap_env()


class Config:
    ollama_host: str = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
    default_model: str = os.getenv("DEFAULT_MODEL", "qwen2.5:7b")
    vault_root: Path = Path(os.getenv("VAULT_ROOT", "V:/PrivateLayer"))
    obsidian_vault: Path = Path(os.getenv("OBSIDIAN_VAULT", "V:/PrivateLayer/vault"))
    documents_dir: Path = Path(os.getenv("DOCUMENTS_DIR", "V:/PrivateLayer/documents"))
    training_dir: Path = Path(os.getenv("TRAINING_DIR", "V:/PrivateLayer/training"))
    system_prompt_file: Path = Path(
        os.getenv("AGENT_SYSTEM_PROMPT_FILE", "vault-templates/system-prompt.txt")
    )
    require_approval: bool = os.getenv("REQUIRE_ACTION_APPROVAL", "true").lower() == "true"
    agent_port: int = int(os.getenv("AGENT_PORT", "8790"))

    def apply_wizard(self, data: dict) -> None:
        if vault := data.get("vaultRoot"):
            self.vault_root = Path(vault)
            self.obsidian_vault = Path(os.getenv("OBSIDIAN_VAULT", str(self.vault_root / "vault")))
            self.documents_dir = Path(os.getenv("DOCUMENTS_DIR", str(self.vault_root / "documents")))
            self.training_dir = Path(os.getenv("TRAINING_DIR", str(self.vault_root / "training")))
        if host := data.get("ollamaHost"):
            self.ollama_host = host
        if model := data.get("defaultModel"):
            self.default_model = model
        if "requireActionApproval" in data:
            self.require_approval = bool(data["requireActionApproval"])


config = Config()
