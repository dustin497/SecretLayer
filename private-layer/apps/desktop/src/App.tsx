import { useState } from "react";
import { VaultGate } from "./pages/VaultGate";
import { DarkSide } from "./pages/DarkSide";

export type VaultSession = {
  unlockedAt: number;
  vaultLabel: string;
};

export function App() {
  const [session, setSession] = useState<VaultSession | null>(null);

  if (!session) {
    return <VaultGate onUnlock={setSession} />;
  }

  return <DarkSide session={session} onLock={() => setSession(null)} />;
}
