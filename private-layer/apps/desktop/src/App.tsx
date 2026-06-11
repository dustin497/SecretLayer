import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { VaultGate } from "./pages/VaultGate";
import { DarkSide } from "./pages/DarkSide";
import { FirstRunWizard } from "./pages/FirstRunWizard";

export type VaultSession = {
  unlockedAt: number;
  vaultLabel: string;
};

type AppPhase = "loading" | "wizard" | "gate" | "dark";

export function App() {
  const [phase, setPhase] = useState<AppPhase>("loading");
  const [session, setSession] = useState<VaultSession | null>(null);

  useEffect(() => {
    invoke<boolean>("is_onboarding_complete")
      .then((done) => setPhase(done ? "gate" : "wizard"))
      .catch(() => setPhase("wizard"));
  }, []);

  if (phase === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#9ca3af" }}>
        Loading PrivateLayer…
      </div>
    );
  }

  if (phase === "wizard") {
    return <FirstRunWizard onComplete={() => setPhase("gate")} />;
  }

  if (!session) {
    return (
      <VaultGate
        onUnlock={setSession}
        onOpenSetup={() => setPhase("wizard")}
      />
    );
  }

  return (
    <DarkSide
      session={session}
      onLock={() => setSession(null)}
      onOpenSetup={() => {
        setSession(null);
        setPhase("wizard");
      }}
    />
  );
}
