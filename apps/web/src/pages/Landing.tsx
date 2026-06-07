import { useState } from "react";
import { Link } from "react-router-dom";
import { TrustBadge } from "../components/TrustBadge";
import { api } from "../lib/api";

const features = [
  { title: "Projects → Vaults", detail: "One project per app or client. Vaults per environment. Secrets encrypted before sync." },
  { title: "Safety scanner", detail: "Paste code or env files — catch AWS, GitHub, Stripe, and DB leaks before you ship." },
  { title: "Promotion gate", detail: "Marketing and deploys only run after safety nets pass. Leads get nurture when you ship safe." },
];

export function Landing() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function joinWaitlist() {
    if (!email.includes("@")) {
      setStatus("Enter a valid email.");
      return;
    }
    try {
      await api.captureLead(email, "waitlist", "early-access");
      await api.trackEvent("lead.waitlist", { email });
      setStatus("You're on the list — we'll reach out when the next vault ships.");
      setEmail("");
    } catch {
      setStatus("Could not join waitlist. Try again.");
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <p className="eyebrow">secretlayer.net</p>
          <TrustBadge />
        </div>
        <h1>Secrets for the common builder</h1>
        <p className="lede">
          Organize API keys into projects and encrypted vaults. Scan before you ship. Promote only when safety clears.
        </p>
        <div className="actions">
          <Link to="/signup" className="btn primary">Start free vault</Link>
          <Link to="/safety" className="btn ghost">Run safety scan</Link>
        </div>
      </header>

      <section className="grid-3">
        {features.map((f) => (
          <article key={f.title} className="card">
            <h2>{f.title}</h2>
            <p>{f.detail}</p>
          </article>
        ))}
      </section>

      <section className="card highlight">
        <h2>Why builders choose SecretLayer</h2>
        <ul>
          <li>Zero-knowledge: AES-GCM + PBKDF2 before localStorage or cloud sync</li>
          <li>Free tier: 10 secrets, 3 projects — enough for side projects</li>
          <li>Promotion leads strengthened with nurture tied to vault + safety value</li>
        </ul>
      </section>

      <footer className="waitlist">
        <label htmlFor="email">Join the builder waitlist</label>
        <div className="row">
          <input id="email" type="email" placeholder="you@builds.dev" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="button" className="btn ghost" onClick={joinWaitlist}>Join</button>
        </div>
        {status && <p className="status">{status}</p>}
      </footer>
    </div>
  );
}
