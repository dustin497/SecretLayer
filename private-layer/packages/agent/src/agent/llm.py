import httpx

from .config import config


def load_system_prompt() -> str:
    path = config.system_prompt_file
    if path.exists():
        return path.read_text(encoding="utf-8")
    return (
        "You are a local action-taking business assistant. "
        "You help plan, write, and organize documents. "
        "Propose concrete file actions when asked. Be direct and useful."
    )


async def chat_ollama(user_message: str, history: list[dict] | None = None) -> str:
    system = load_system_prompt()
    messages = [{"role": "system", "content": system}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    async with httpx.AsyncClient(timeout=120.0) as client:
        res = await client.post(
            f"{config.ollama_host}/api/chat",
            json={"model": config.default_model, "messages": messages, "stream": False},
        )
        res.raise_for_status()
        data = res.json()
        return data.get("message", {}).get("content", "")
