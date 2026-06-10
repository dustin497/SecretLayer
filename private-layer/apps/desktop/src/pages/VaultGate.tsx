import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { VaultSession } from "../App";
import type { AppConfig } from "../types/config";
import { inputStyle, panelStyle, primaryBtn, secondaryBtn } from "../styles/forms";

type Props = {
  onUnlock: (session: VaultSession) => void;
  onOpenSetup: () => void;
};

export function VaultGate({ onUnlock, onOpenSetup }: Props) {
  const [password, setPassword] = useState("");
  const [vaultPath, setVaultPath] = useState("V:\\PrivateLayer");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    invoke<AppConfig>("get_app_config")
      .then((cfg) => setVaultPath(cfg.vaultRoot))
      .catch(() => undefined);
  }, []);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const ok = await invoke<boolean>("unlock_vault", { password, vaultPath });
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
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <form onSubmit={handleUnlock} style={{ ...panelStyle, width: "min(420px, 100%)" }}>
        <p style={{ margin: 0, fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#a78bfa" }}>
          PrivateLayer
        </p>
        <h1 style={{ margin: "0.5rem 0 0.25rem", fontSize: "1.75rem" }}>Vault Gate</h1>
        <p style={{ margin: "0 0 1.5rem", color: "#9ca3af", fontSize: "0.95rem" }}>
          Mount VeraCrypt, then unlock to enter the Dark Side.
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

        {error && <p style={{ color: "#f87171", fontSize: "0.9rem", marginBottom: "1rem" }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ ...primaryBtn, width: "100%" }}>
          {loading ? "Unlocking…" : "Enter Dark Side"}
        </button>

        <button type="button" style={{ ...secondaryBtn, width: "100%", marginTop: "0.75rem" }} onClick={onOpenSetup}>
          Re-run setup wizard
        </button>
      </form>
    </div>
  );
}
