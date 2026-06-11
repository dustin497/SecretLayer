import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { VaultSession } from "../App";
import type { AppConfig } from "../types/config";
import { AssistantPanel } from "../components/AssistantPanel";
import { Sidebar } from "../components/Sidebar";
import { primaryBtn } from "../styles/forms";

type Props = {
  session: VaultSession;
  onLock: () => void;
  onOpenSetup: () => void;
};

type SystemStatus = {
  ollama_ok: boolean;
  agent_ok: boolean;
  vault_path: string;
  model: string;
};

type View = "assistant" | "documents" | "profiles" | "training" | "network" | "settings";

export function DarkSide({ session, onLock, onOpenSetup }: Props) {
  const [view, setView] = useState<View>("assistant");
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    invoke<SystemStatus>("get_system_status")
      .then(setStatus)
      .catch(() =>
        setStatus({
          ollama_ok: false,
          agent_ok: false,
          vault_path: session.vaultLabel,
          model: "unknown",
        }),
      );
  }, [session.vaultLabel]);

  async function handleLock() {
    await invoke("lock_vault");
    onLock();
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar view={view} onViewChange={setView} onLock={handleLock} status={status} />

      <main style={{ flex: 1, padding: "1.5rem 2rem", overflow: "auto" }}>
        <header style={{ marginBottom: "1.5rem" }}>
          <p style={{ margin: 0, fontSize: "0.7rem", letterSpacing: "0.15em", color: "#a78bfa" }}>
            DARK SIDE — PRIVATE LAYER
          </p>
          <h1 style={{ margin: "0.25rem 0", fontSize: "1.5rem" }}>{viewTitle(view)}</h1>
          <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.9rem" }}>
            Vault: {status?.vault_path ?? session.vaultLabel}
            {status?.ollama_ok ? " · LLM online" : " · LLM offline"}
            {status?.agent_ok ? " · Agent online" : " · Agent offline"}
          </p>
        </header>

        {view === "assistant" && <AssistantPanel />}
        {view === "documents" && <Placeholder title="Documents" hint="Obsidian vault lives at vault\ inside your vault path. Open from Explorer." />}
        {view === "profiles" && <Placeholder title="Business Profiles" hint="YAML profiles in vault\profiles. Agent can read and update." />}
        {view === "training" && <Placeholder title="Model Training" hint="Export edits to training\raw, then python -m trainer prepare && finetune." />}
        {view === "network" && <NetworkLab />}
        {view === "settings" && <SettingsPanel onOpenSetup={onOpenSetup} />}
      </main>
    </div>
  );
}

function viewTitle(view: View): string {
  const titles: Record<View, string> = {
    assistant: "Action Assistant",
    documents: "Documents",
    profiles: "Business Profiles",
    training: "Model Training",
    network: "Network Lab",
    settings: "Settings",
  };
  return titles[view];
}

function Placeholder({ title, hint }: { title: string; hint: string }) {
  return (
    <section style={{ background: "#0c0c14", border: "1px dashed #374151", borderRadius: 12, padding: "2rem", color: "#9ca3af" }}>
      <h2 style={{ marginTop: 0, color: "#e5e7eb" }}>{title}</h2>
      <p>{hint}</p>
    </section>
  );
}

function NetworkLab() {
  return (
    <section style={{ background: "#0c0c14", border: "1px solid #374151", borderRadius: 12, padding: "1.5rem" }}>
      <h2 style={{ marginTop: 0 }}>Network Lab (isolated)</h2>
      <p style={{ color: "#9ca3af", lineHeight: 1.6 }}>
        Use Tor Browser in a VM or Windows Sandbox — never inside the document agent.
      </p>
      <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>See docs/NETWORK_ISOLATION.md in the install folder.</p>
    </section>
  );
}

function SettingsPanel({ onOpenSetup }: { onOpenSetup: () => void }) {
  const [cfg, setCfg] = useState<AppConfig | null>(null);

  useEffect(() => {
    invoke<AppConfig>("get_app_config").then(setCfg).catch(() => undefined);
  }, []);

  if (!cfg) return <p style={{ color: "#9ca3af" }}>Loading settings…</p>;

  return (
    <section style={{ display: "grid", gap: "1rem", maxWidth: 560 }}>
      <SettingRow label="Vault path" value={cfg.vaultRoot} />
      <SettingRow label="Ollama host" value={cfg.ollamaHost} />
      <SettingRow label="Default model" value={cfg.defaultModel} />
      <SettingRow label="Action approval" value={cfg.requireActionApproval ? "enabled" : "disabled"} />
      <SettingRow label="Config files" value="%LOCALAPPDATA%\\PrivateLayer\\config\\settings.json" />
      <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
        API keys: add to config\.env on your VeraCrypt volume only — never in the assistant chat.
      </p>
      <button type="button" style={primaryBtn} onClick={onOpenSetup}>
        Open setup wizard
      </button>
    </section>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#111118", borderRadius: 8, padding: "1rem" }}>
      <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{label}</div>
      <div style={{ marginTop: "0.25rem", fontFamily: "Consolas, monospace", fontSize: "0.9rem", wordBreak: "break-all" }}>{value}</div>
    </div>
  );
}
