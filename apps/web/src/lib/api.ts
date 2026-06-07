const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export const api = {
  health: () => request<{ ok: boolean }>("/health"),
  signup: (email: string, password: string) =>
    request<{ user: { id: string; email: string }; token: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ user: { id: string; email: string }; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: (token: string) =>
    request<{ ok: boolean }>("/auth/logout", { method: "POST", headers: authHeaders(token) }),
  projects: (token: string) =>
    request<{ projects: { id: string; name: string; description?: string }[] }>("/projects", {
      headers: authHeaders(token),
    }),
  createProject: (token: string, name: string, description?: string) =>
    request<{ project: { id: string; name: string } }>("/projects", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ name, description }),
    }),
  billingPlan: (token: string) =>
    request<{ plan: string; limits: { secrets: number; projects: number }; usage: { secrets: number; projects: number } }>(
      "/billing/plan",
      { headers: authHeaders(token) },
    ),
  vaultItems: (token: string) =>
    request<{ vaultItems: VaultItemResponse[] }>("/vault-items", { headers: authHeaders(token) }),
  syncVaultItem: (token: string, clientId: string, body: unknown) =>
    request<{ ok: boolean }>(`/vault-items/client/${encodeURIComponent(clientId)}`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }),
  deleteVaultItem: (token: string, clientId: string) =>
    request<{ ok: boolean }>(`/vault-items/client/${encodeURIComponent(clientId)}`, {
      method: "DELETE",
      headers: authHeaders(token),
    }),
  captureLead: (email: string, source: string, intent: string, message?: string) =>
    request<{ lead: { id: string; email: string } }>("/leads", {
      method: "POST",
      body: JSON.stringify({ email, source, intent, message }),
    }),
  safetyStatus: () =>
    request<{ score: number | null; passed: boolean | null; target: string }>("/safety/status"),
  trackEvent: (event: string, properties?: Record<string, unknown>) =>
    request<{ ok: boolean }>("/analytics/events", {
      method: "POST",
      body: JSON.stringify({ event, properties }),
    }),
};

export interface VaultItemResponse {
  clientId: string;
  label: string;
  encryptedBlob: unknown;
  encryptionMeta: { clientEncrypted: boolean; algorithm: string; syncedBy: string };
  updatedAt: string;
}
