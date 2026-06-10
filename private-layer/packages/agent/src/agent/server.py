from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import config
from .llm import chat_ollama
from .tools import execute_action, parse_action_blocks

app = FastAPI(title="PrivateLayer Agent", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420", "tauri://localhost", "http://127.0.0.1:1420"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_history: list[dict] = []


class ChatRequest(BaseModel):
    message: str
    approve_actions: bool = False


class ChatResponse(BaseModel):
    reply: str
    pending_actions: list[str] = []
    executed: list[str] = []


class WizardConfig(BaseModel):
    onboardingComplete: bool | None = None
    vaultRoot: str | None = None
    ollamaHost: str | None = None
    defaultModel: str | None = None
    requireActionApproval: bool | None = None


@app.get("/health")
def health():
    return {"ok": True, "service": "private-layer-agent"}


@app.get("/config")
def get_config():
    return {
        "vaultRoot": str(config.vault_root),
        "ollamaHost": config.ollama_host,
        "defaultModel": config.default_model,
        "requireActionApproval": config.require_approval,
    }


@app.post("/config")
def update_config(body: WizardConfig):
    config.apply_wizard(body.model_dump(exclude_none=True))
    return get_config()


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    global _history
    reply = await chat_ollama(req.message, _history[-10:])
    _history.append({"role": "user", "content": req.message})
    _history.append({"role": "assistant", "content": reply})

    actions = parse_action_blocks(reply)
    pending: list[str] = []
    executed: list[str] = []

    for action in actions:
        desc = f"{action.get('tool')}: {action.get('args', {})}"
        if config.require_approval and not req.approve_actions:
            pending.append(desc)
            continue
        try:
            result = execute_action(action)
            executed.append(f"{desc} → {result}")
        except Exception as e:
            executed.append(f"{desc} → ERROR: {e}")

    return ChatResponse(reply=reply, pending_actions=pending, executed=executed)


def main():
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=config.agent_port, log_level="info")
