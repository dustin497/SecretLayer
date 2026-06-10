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

fn hash_password(password: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    hex::encode(hasher.finalize())
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

    // First unlock sets the password hash for this session (dev mode).
    // Production: verify against keyfile or OS keychain + VeraCrypt mount.
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
    let vault_path = guard.vault_path.clone();

    let ollama_ok = reqwest::blocking::Client::new()
        .get("http://127.0.0.1:11434/api/tags")
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
        model: std::env::var("DEFAULT_MODEL").unwrap_or_else(|_| "dolphin-mistral:latest".into()),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(Mutex::new(VaultState::default()))
        .invoke_handler(tauri::generate_handler![
            unlock_vault,
            lock_vault,
            get_system_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
