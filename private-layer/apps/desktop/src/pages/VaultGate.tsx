import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { VaultSession } from "../App";

type Props = {
  onUnlock: (session: VaultSession) => void;
};

export function VaultGate({ onUnlock }: Props) {
  const [password, setPassword] = useState("");
  const [vaultPath, setVaultPath] = useState("V:\\PrivateLayer");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const ok = await invoke<boolean>("unlock_vault", {
        password,
        vaultPath,
      });
      if (!ok) {
        setError("Unlock failed. Check password and that your VeraCrypt volume is mounted.");
        return;
      }
      onUnlock({ unlockedAt: Date.now(), vaultLabel: vaultPath });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
      }}
    >
      <form
        onSubmit={handleUnlock}
        style={{
          width: "min(420px, 100%)",
          background: "rgba(12, 12, 20, 0.9)",
          border: "1px solid #2a2a3d",
          borderRadius: 16,
          padding: "2rem",
          boxShadow: "0 0 60px rgba(88, 28, 135, 0.15)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.7rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#a78bfa",
          }}
        >
          PrivateLayer
        </p>
        <h1 style={{ margin: "0.5rem 0 0.25rem", fontSize: "1.75rem" }}>Vault Gate</h1>
        <p style={{ margin: "0 0 1.5rem", color: "#9ca3af", fontSize: "0.95rem" }}>
          Mount VeraCrypt, then unlock to enter the Dark Side. Nothing syncs to the cloud.
        </p>

        <label style={{ display: "block", marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Vault path</span>
          <input
            type="text"
            value={vaultPath}
            onChange={(e) => setVaultPath(e.target.value)}
            style={inputStyle}
            placeholder="V:\PrivateLayer"
          />
        </label>

        <label style={{ display: "block", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Vault password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            autoFocus
            required
          />
        </label>

        {error && (
          <p style={{ color: "#f87171", fontSize: "0.9rem", marginBottom: "1rem" }}>{error}</p>
        )}

        <button type="submit" disabled={loading} style={primaryBtn}>
          {loading ? "Unlocking…" : "Enter Dark Side"}
        </button>

        <p style={{ marginTop: "1.25rem", fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.5 }}>
          Your model. Your vault. Your rules. Local inference only — paste API keys in Settings, never in chat logs.
        </p>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: "0.35rem",
  padding: "0.65rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #374151",
  background: "#0a0a12",
  color: "#f3f4f6",
};

const primaryBtn: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem",
  borderRadius: 8,
  border: "none",
  background: "linear-gradient(135deg, #6d28d9, #4c1d95)",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};
