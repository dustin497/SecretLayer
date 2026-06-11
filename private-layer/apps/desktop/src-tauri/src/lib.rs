mod config;

use config::{load_config, save_config, AppConfig};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::sync::Mutex;
use tauri::State;

struct VaultState {
    unlocked: bool,
    vault_path: String,
    password_hash: Option<String>,
}

impl Default for VaultState {
    fn default() -> Self {
        Self {
            unlocked: false,
            vault_path: String::new(),
            password_hash: None,
        }
    }
}

#[derive(Serialize)]
pub struct SystemStatus {
    ollama_ok: bool,
    agent_ok: bool,
    vault_path: String,
    model: String,
}

#[derive(Serialize)]
pub struct OllamaStatus {
    online: bool,
    models: Vec<String>,
}

#[derive(Serialize)]
pub struct VaultPathStatus {
    exists: bool,
    path: String,
}

fn hash_password(password: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    hex::encode(hasher.finalize())
}

#[tauri::command]
fn is_onboarding_complete() -> bool {
    load_config().onboarding_complete
}

#[tauri::command]
fn get_app_config() -> AppConfig {
    load_config()
}

#[tauri::command]
fn save_app_config(cfg: AppConfig) -> Result<(), String> {
    save_config(&cfg)?;
    sync_agent_config(&cfg);
    Ok(())
}

fn sync_agent_config(cfg: &AppConfig) {
    let client = reqwest::blocking::Client::new();
    let _ = client
        .post("http://127.0.0.1:8790/config")
        .json(cfg)
        .timeout(std::time::Duration::from_secs(3))
        .send();
}

#[tauri::command]
fn check_ollama_models(host: Option<String>) -> OllamaStatus {
    let base = host.unwrap_or_else(|| load_config().ollama_host);
    let url = format!("{}/api/tags", base.trim_end_matches('/'));
    let client = reqwest::blocking::Client::new();
    let res = client
        .get(&url)
        .timeout(std::time::Duration::from_secs(4))
        .send();

    match res {
        Ok(r) if r.status().is_success() => {
            let models = r
                .json::<serde_json::Value>()
                .ok()
                .and_then(|v| v.get("models")?.as_array().cloned())
                .map(|arr| {
                    arr.iter()
                        .filter_map(|m| m.get("name").and_then(|n| n.as_str()).map(String::from))
                        .collect()
                })
                .unwrap_or_default();
            OllamaStatus {
                online: true,
                models,
            }
        }
        _ => OllamaStatus {
            online: false,
            models: vec![],
        },
    }
}

#[tauri::command]
fn check_vault_path(path: String) -> VaultPathStatus {
    let exists = std::path::Path::new(&path).exists();
    VaultPathStatus { exists, path }
}

#[tauri::command]
fn unlock_vault(
    password: String,
    vault_path: String,
    state: State<'_, Mutex<VaultState>>,
) -> Result<bool, String> {
    let path = std::path::Path::new(&vault_path);
    if !path.exists() {
        return Err(format!(
            "Vault path not found: {vault_path}. Mount VeraCrypt first."
        ));
    }

    let hash = hash_password(&password);
    let mut guard = state.lock().map_err(|e| e.to_string())?;

    match &guard.password_hash {
        None => guard.password_hash = Some(hash.clone()),
        Some(stored) if *stored != hash => return Ok(false),
        _ => {}
    }

    guard.unlocked = true;
    guard.vault_path = vault_path;
    Ok(true)
}

#[tauri::command]
fn lock_vault(state: State<'_, Mutex<VaultState>>) -> Result<(), String> {
    let mut guard = state.lock().map_err(|e| e.to_string())?;
    guard.unlocked = false;
    guard.vault_path.clear();
    Ok(())
}

#[tauri::command]
fn get_system_status(state: State<'_, Mutex<VaultState>>) -> Result<SystemStatus, String> {
    let guard = state.lock().map_err(|e| e.to_string())?;
    let cfg = load_config();
    let vault_path = if guard.vault_path.is_empty() {
        cfg.vault_root.clone()
    } else {
        guard.vault_path.clone()
    };

    let ollama_ok = reqwest::blocking::Client::new()
        .get(format!("{}/api/tags", cfg.ollama_host.trim_end_matches('/')))
        .timeout(std::time::Duration::from_secs(2))
        .send()
        .map(|r| r.status().is_success())
        .unwrap_or(false);

    let agent_ok = reqwest::blocking::Client::new()
        .get("http://127.0.0.1:8790/health")
        .timeout(std::time::Duration::from_secs(2))
        .send()
        .map(|r| r.status().is_success())
        .unwrap_or(false);

    Ok(SystemStatus {
        ollama_ok,
        agent_ok,
        vault_path,
        model: cfg.default_model,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(Mutex::new(VaultState::default()))
        .invoke_handler(tauri::generate_handler![
            is_onboarding_complete,
            get_app_config,
            save_app_config,
            check_ollama_models,
            check_vault_path,
            unlock_vault,
            lock_vault,
            get_system_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
