import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

const SESSION_KEY = "secretlayerAuthSession";

interface Session {
  user: { id: string; email: string };
  token: string;
}

interface AuthContextValue {
  session: Session | null;
  setSession: (s: Session | null) => void;
  vaultPassword: string | null;
  setVaultPassword: (p: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(loadSession);
  const [vaultPassword, setVaultPassword] = useState<string | null>(null);

  const setSession = (s: Session | null) => {
    setSessionState(s);
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
    if (!s) setVaultPassword(null);
  };

  const value = useMemo(
    () => ({ session, setSession, vaultPassword, setVaultPassword }),
    [session, vaultPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth requires AuthProvider");
  return ctx;
}
