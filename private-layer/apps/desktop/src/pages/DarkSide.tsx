import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { VaultSession } from "../App";
import { AssistantPanel } from "../components/AssistantPanel";
import { Sidebar } from "../components/Sidebar";

type Props = {
  session: VaultSession;
  onLock: () => void;
};

type SystemStatus = {
  ollama_ok: boolean;
  agent_ok: boolean;
  vault_path: string;
  model: string;
};

type View = "assistant" | "documents" | "profiles" | "training" | "network" | "settings";

export function DarkSide({ session, onLock }: Props) {
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
        {view === "documents" && <Placeholder title="Documents" hint="Obsidian vault + PDF import. Open vault folder from Settings." />}
        {view === "profiles" && <Placeholder title="Business Profiles" hint="YAML/MD structured company profiles. Agent can read and update." />}
        {view === "training" && <Placeholder title="Training Pipeline" hint="Run packages/trainer on your GPU. Export edits → fine-tune → load in Ollama." />}
        {view === "network" && <NetworkLab />}
        {view === "settings" && <SettingsPanel />}
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
    <section
      style={{
        background: "#0c0c14",
        border: "1px dashed #374151",
        borderRadius: 12,
        padding: "2rem",
        color: "#9ca3af",
      }}
    >
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
        Curiosity browsing belongs in a <strong>separate sandbox</strong> — not inside your document agent.
        Use Tor Browser inside a VM or a dedicated VeraCrypt session. Never mix vault files with untrusted network content.
      </p>
      <ul style={{ color: "#d1d5db", lineHeight: 1.8 }}>
        <li>Install Tor Browser in a Windows Sandbox or spare VM</li>
        <li>Do not store vault passwords or models in that environment</li>
        <li>See <code>docs/NETWORK_ISOLATION.md</code> for the full setup</li>
      </ul>
      <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
        PrivateLayer does not embed a dark-web browser — isolation protects your Dark Side data.
      </p>
    </section>
  );
}

function SettingsPanel() {
  return (
    <section style={{ display: "grid", gap: "1rem", maxWidth: 560 }}>
      <SettingRow label="Ollama host" value="http://127.0.0.1:11434" />
      <SettingRow label="Default model" value="dolphin-mistral:latest (change in .env)" />
      <SettingRow label="System prompt" value="vault-templates/system-prompt.txt — you edit this" />
      <SettingRow label="Action approval" value="REQUIRE_ACTION_APPROVAL=true" />
      <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
        API keys and secrets: store in .env inside your VeraCrypt volume only. Never commit or paste into assistant chat.
      </p>
    </section>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#111118", borderRadius: 8, padding: "1rem" }}>
      <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{label}</div>
      <div style={{ marginTop: "0.25rem", fontFamily: "Consolas, monospace", fontSize: "0.9rem" }}>{value}</div>
    </div>
  );
}
