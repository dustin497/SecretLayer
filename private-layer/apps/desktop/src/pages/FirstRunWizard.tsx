import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { AppConfig, OllamaStatus, VaultPathStatus } from "../types/config";
import { inputStyle, panelStyle, primaryBtn, secondaryBtn } from "../styles/forms";

type Props = {
  onComplete: () => void;
};

const RECOMMENDED_MODELS = ["qwen2.5:7b", "qwen2.5:3b", "dolphin-mistral:latest", "llama3.2:3b"];

export function FirstRunWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [cfg, setCfg] = useState<AppConfig>({
    onboardingComplete: false,
    vaultRoot: "V:\\PrivateLayer",
    ollamaHost: "http://127.0.0.1:11434",
    defaultModel: "qwen2.5:7b",
    requireActionApproval: true,
  });
  const [ollama, setOllama] = useState<OllamaStatus>({ online: false, models: [] });
  const [vaultCheck, setVaultCheck] = useState<VaultPathStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    invoke<AppConfig>("get_app_config").then(setCfg).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (step === 2) refreshOllama();
  }, [step, cfg.ollamaHost]);

  useEffect(() => {
    if (step === 1 && cfg.vaultRoot) checkVault(cfg.vaultRoot);
  }, [step, cfg.vaultRoot]);

  async function checkVault(path: string) {
    const status = await invoke<VaultPathStatus>("check_vault_path", { path });
    setVaultCheck(status);
  }

  async function refreshOllama() {
    const status = await invoke<OllamaStatus>("check_ollama_models", { host: cfg.ollamaHost });
    setOllama(status);
    if (status.models.length > 0 && !status.models.includes(cfg.defaultModel)) {
      setCfg((c) => ({ ...c, defaultModel: status.models[0] }));
    }
  }

  async function browseVault() {
    const selected = await open({ directory: true, multiple: false, title: "Choose vault folder" });
    if (selected && typeof selected === "string") {
      setCfg((c) => ({ ...c, vaultRoot: selected }));
      await checkVault(selected);
    }
  }

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      await invoke("save_app_config", {
        cfg: { ...cfg, onboardingComplete: true },
      });
      onComplete();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  const steps = ["Welcome", "Vault", "Model", "Done"];

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <div style={{ ...panelStyle, width: "min(520px, 100%)" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
          {steps.map((label, i) => (
            <div
              key={label}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: "0.75rem",
                padding: "0.35rem 0",
                borderRadius: 6,
                background: i === step ? "#1e1b4b" : "#111118",
                color: i <= step ? "#c4b5fd" : "#6b7280",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {step === 0 && (
          <>
            <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.6rem" }}>Welcome to PrivateLayer</h1>
            <p style={{ color: "#9ca3af", lineHeight: 1.6 }}>
              Quick setup: pick your encrypted vault folder and local AI model. No API keys needed in chat — ever.
            </p>
            <ul style={{ color: "#d1d5db", lineHeight: 1.8, paddingLeft: "1.25rem" }}>
              <li>Mount VeraCrypt before step 2 (recommended)</li>
              <li>Install Ollama from ollama.com if you have not yet</li>
              <li>You can change everything later in Settings</li>
            </ul>
            <button type="button" style={primaryBtn} onClick={() => setStep(1)}>
              Start setup
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 style={{ marginTop: 0 }}>Vault folder</h2>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
              Where your Dark Side lives — usually on a VeraCrypt drive.
            </p>
            <label style={{ display: "block", marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Vault path</span>
              <input
                type="text"
                value={cfg.vaultRoot}
                onChange={(e) => setCfg({ ...cfg, vaultRoot: e.target.value })}
                style={inputStyle}
              />
            </label>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <button type="button" style={secondaryBtn} onClick={browseVault}>
                Browse folder…
              </button>
              <button type="button" style={secondaryBtn} onClick={() => checkVault(cfg.vaultRoot)}>
                Check path
              </button>
            </div>
            {vaultCheck && (
              <p style={{ color: vaultCheck.exists ? "#6ee7b7" : "#fbbf24", fontSize: "0.9rem" }}>
                {vaultCheck.exists
                  ? "Path found — good to go."
                  : "Path not found yet. Mount VeraCrypt or create the folder — you can still continue."}
              </p>
            )}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" style={secondaryBtn} onClick={() => setStep(0)}>
                Back
              </button>
              <button type="button" style={primaryBtn} onClick={() => setStep(2)}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ marginTop: 0 }}>Local AI model</h2>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
              PrivateLayer talks to Ollama on your machine only.
            </p>
            <label style={{ display: "block", marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Ollama host</span>
              <input
                type="text"
                value={cfg.ollamaHost}
                onChange={(e) => setCfg({ ...cfg, ollamaHost: e.target.value })}
                style={inputStyle}
              />
            </label>
            <button type="button" style={{ ...secondaryBtn, marginBottom: "1rem" }} onClick={refreshOllama}>
              Refresh models
            </button>
            {ollama.online ? (
              <label style={{ display: "block", marginBottom: "1rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#6ee7b7" }}>Ollama online — pick a model</span>
                <select
                  value={cfg.defaultModel}
                  onChange={(e) => setCfg({ ...cfg, defaultModel: e.target.value })}
                  style={{ ...inputStyle, marginTop: "0.35rem" }}
                >
                  {ollama.models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div style={{ marginBottom: "1rem" }}>
                <p style={{ color: "#fbbf24", fontSize: "0.9rem" }}>
                  Ollama offline. Install from ollama.com, then run: <code>ollama pull qwen2.5:7b</code>
                </p>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Model to use when Ollama is ready</span>
                  <select
                    value={cfg.defaultModel}
                    onChange={(e) => setCfg({ ...cfg, defaultModel: e.target.value })}
                    style={{ ...inputStyle, marginTop: "0.35rem" }}
                  >
                    {RECOMMENDED_MODELS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem", color: "#d1d5db" }}>
              <input
                type="checkbox"
                checked={cfg.requireActionApproval}
                onChange={(e) => setCfg({ ...cfg, requireActionApproval: e.target.checked })}
              />
              Require my approval before file actions
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" style={secondaryBtn} onClick={() => setStep(1)}>
                Back
              </button>
              <button type="button" style={primaryBtn} onClick={() => setStep(3)}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={{ marginTop: 0 }}>Ready</h2>
            <div style={{ background: "#111118", borderRadius: 8, padding: "1rem", marginBottom: "1rem", fontSize: "0.9rem" }}>
              <div><strong>Vault:</strong> {cfg.vaultRoot}</div>
              <div style={{ marginTop: 6 }}><strong>Model:</strong> {cfg.defaultModel}</div>
              <div style={{ marginTop: 6 }}><strong>Ollama:</strong> {cfg.ollamaHost}</div>
              <div style={{ marginTop: 6 }}><strong>Action approval:</strong> {cfg.requireActionApproval ? "on" : "off"}</div>
            </div>
            <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
              Config saved to <code>config\settings.json</code> and <code>config\.env</code> — no secrets stored.
            </p>
            {error && <p style={{ color: "#f87171" }}>{error}</p>}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" style={secondaryBtn} onClick={() => setStep(2)}>
                Back
              </button>
              <button type="button" style={primaryBtn} disabled={saving} onClick={finish}>
                {saving ? "Saving…" : "Enter PrivateLayer"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
