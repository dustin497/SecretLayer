use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub onboarding_complete: bool,
    pub vault_root: String,
    pub ollama_host: String,
    pub default_model: String,
    pub require_action_approval: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            onboarding_complete: false,
            vault_root: "V:\\PrivateLayer".into(),
            ollama_host: "http://127.0.0.1:11434".into(),
            default_model: "qwen2.5:7b".into(),
            require_action_approval: true,
        }
    }
}

pub fn config_dir() -> PathBuf {
    if let Ok(home) = std::env::var("PRIVATE_LAYER_HOME") {
        return PathBuf::from(home).join("config");
    }
    if let Ok(local) = std::env::var("LOCALAPPDATA") {
        return PathBuf::from(local).join("PrivateLayer").join("config");
    }
    PathBuf::from(".private-layer-config")
}

fn settings_path() -> PathBuf {
    config_dir().join("settings.json")
}

pub fn load_config() -> AppConfig {
    let path = settings_path();
    if path.exists() {
        if let Ok(raw) = fs::read_to_string(&path) {
            if let Ok(cfg) = serde_json::from_str(&raw) {
                return cfg;
            }
        }
    }
    AppConfig::default()
}

pub fn save_config(cfg: &AppConfig) -> Result<(), String> {
    let dir = config_dir();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let json = serde_json::to_string_pretty(cfg).map_err(|e| e.to_string())?;
    fs::write(settings_path(), json).map_err(|e| e.to_string())?;
    write_dotenv(cfg)?;
    Ok(())
}

pub fn write_dotenv(cfg: &AppConfig) -> Result<(), String> {
    let dir = config_dir();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let vault = cfg.vault_root.trim_end_matches('\\');
    let content = format!(
        r"# Written by PrivateLayer setup wizard — no secrets stored here
PORT=8787
API_ORIGIN=http://localhost:8787
WEB_ORIGIN=http://localhost:5173
JWT_SECRET=change-me-in-production

VAULT_ROOT={vault}
OBSIDIAN_VAULT={vault}\\vault
MODELS_DIR={vault}\\models
DOCUMENTS_DIR={vault}\\documents
TRAINING_DIR={vault}\\training

OLLAMA_HOST={ollama}
DEFAULT_MODEL={model}
AGENT_PORT=8790
REQUIRE_ACTION_APPROVAL={approval}

PROMOTION_WEBHOOK_URL=
NETLIFY_AUTH_TOKEN=
NETLIFY_SITE_ID=
",
        vault = vault,
        ollama = cfg.ollama_host,
        model = cfg.default_model,
        approval = if cfg.require_action_approval { "true" } else { "false" },
    );
    fs::write(dir.join(".env"), content).map_err(|e| e.to_string())?;
    Ok(())
}
