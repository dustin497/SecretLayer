import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BillingPanel } from "../components/BillingPanel";
import type { BillingPlanResponse } from "../lib/api";
import {
  decryptVaultItem,
  encryptVaultItem,
  isEncryptedBlob,
  type EncryptedBlob,
  type VaultItemPlaintext,
} from "@secretlayer/crypto";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

interface DecryptedItem extends VaultItemPlaintext {
  clientId: string;
}

export function Dashboard() {
  const { session, vaultPassword, setVaultPassword, setSession } = useAuth();
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [plan, setPlan] = useState<BillingPlanResponse | null>(null);
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<DecryptedItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [newProject, setNewProject] = useState("");
  const [secretName, setSecretName] = useState("");
  const [secretValue, setSecretValue] = useState("");
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [locked, setLocked] = useState(true);

  const token = session?.token ?? "";
  const email = session?.user.email ?? "";

  const load = useCallback(async () => {
    if (!token) return;
    const [p, b] = await Promise.all([api.projects(token), api.billingPlan(token)]);
    setProjects(p.projects);
    setPlan(b);
    if (!selectedProject && p.projects[0]) setSelectedProject(p.projects[0].id);
  }, [token, selectedProject]);

  useEffect(() => {
    load().catch(() => setStatus("Could not load dashboard."));
  }, [load]);

  useEffect(() => {
    const billing = searchParams.get("billing");
    if (billing === "success") setStatus("Subscription updated — thank you!");
    if (billing === "cancel") setStatus("Checkout canceled.");
  }, [searchParams]);

  async function unlockVault(e: FormEvent) {
    e.preventDefault();
    if (!vaultPassword) return;
    setStatus("Decrypting vault items…");
    try {
      const { vaultItems } = await api.vaultItems(token);
      const decrypted: DecryptedItem[] = [];
      for (const row of vaultItems) {
        if (!isEncryptedBlob(row.encryptedBlob)) continue;
        const plain = await decryptVaultItem(vaultPassword, row.encryptedBlob as EncryptedBlob);
        decrypted.push({ ...plain, clientId: row.clientId });
      }
      setItems(decrypted);
      setLocked(false);
      setStatus(`Unlocked ${decrypted.length} item(s).`);
    } catch {
      setStatus("Wrong master password or corrupt vault data.");
    }
  }

  async function addProject(e: FormEvent) {
    e.preventDefault();
    if (!newProject.trim()) return;
    await api.createProject(token, newProject.trim());
    setNewProject("");
    await load();
    setStatus(`Project "${newProject}" created.`);
  }

  async function addSecret(e: FormEvent) {
    e.preventDefault();
    if (!vaultPassword || locked || !selectedProject) return;
    const id = crypto.randomUUID();
    const plain: VaultItemPlaintext = {
      id,
      projectId: selectedProject,
      secretName: secretName.trim(),
      providerName: provider.trim() || undefined,
      secret: secretValue,
      updatedAt: new Date().toISOString(),
    };
    const blob = await encryptVaultItem(vaultPassword, email, plain);
    await api.syncVaultItem(token, id, {
      clientId: id,
      label: secretName.trim() || "Encrypted vault item",
      encryptedBlob: blob,
      encryptionMeta: { clientEncrypted: true, algorithm: "AES-GCM", syncedBy: "secretlayer-web" },
      updatedAt: plain.updatedAt,
    });
    setItems((prev) => [...prev, { ...plain, clientId: id }]);
    setSecretName("");
    setSecretValue("");
    setProvider("");
    await load();
    setStatus("Secret encrypted and synced.");
  }

  async function logout() {
    await api.logout(token).catch(() => {});
    setSession(null);
  }

  if (!session) return null;

  return (
    <div className="page">
      <header className="dash-header">
        <div>
          <h1>Vault dashboard</h1>
          <p className="muted">{email}</p>
        </div>
        <div className="actions">
          <Link to="/safety" className="btn ghost">Safety scanner</Link>
          <button type="button" className="btn ghost" onClick={logout}>Sign out</button>
        </div>
      </header>

      {plan && <BillingPanel token={token} plan={plan} onRefresh={() => load().catch(() => {})} />}

      {locked ? (
        <form className="card form" onSubmit={unlockVault}>
          <h2>Unlock vault</h2>
          <p className="muted">Master password decrypts items only in this browser session.</p>
          <label>
            Master password
            <input
              type="password"
              value={vaultPassword ?? ""}
              onChange={(e) => setVaultPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn primary">Unlock</button>
        </form>
      ) : (
        <>
          <section className="grid-2">
            <form className="card form" onSubmit={addProject}>
              <h2>Projects</h2>
              <ul className="list">
                {projects.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={selectedProject === p.id ? "chip active" : "chip"}
                      onClick={() => setSelectedProject(p.id)}
                    >
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
              <label>
                New project
                <input value={newProject} onChange={(e) => setNewProject(e.target.value)} placeholder="My SaaS" />
              </label>
              <button type="submit" className="btn ghost">Add project</button>
            </form>

            <form className="card form" onSubmit={addSecret}>
              <h2>Add secret</h2>
              <label>Secret name <input value={secretName} onChange={(e) => setSecretName(e.target.value)} required placeholder="STRIPE_SECRET_KEY" /></label>
              <label>Provider <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Stripe" /></label>
              <label>Secret value <input value={secretValue} onChange={(e) => setSecretValue(e.target.value)} required type="password" /></label>
              <button type="submit" className="btn primary">Encrypt & sync</button>
            </form>
          </section>

          <section className="card">
            <h2>Vault items ({items.length})</h2>
            {items.length === 0 ? (
              <p className="muted">No secrets yet. Add one above.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Name</th><th>Provider</th><th>Preview</th></tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.clientId}>
                      <td>{item.secretName}</td>
                      <td>{item.providerName ?? "—"}</td>
                      <td><code>{item.secret.slice(0, 4)}••••</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
      {status && <p className="status">{status}</p>}
    </div>
  );
}
