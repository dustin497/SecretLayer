import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { scanPasses, scanTextForSecrets } from "../lib/safety";

export function SafetyPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  function runScan() {
    const hits = scanTextForSecrets(text);
    const pass = scanPasses(hits);
    if (hits.length === 0) {
      setResult("✓ No known secret patterns detected.");
      return;
    }
    const lines = hits.map((h) => `${h.severity === "critical" ? "✗" : "!"} ${h.label}: ${h.excerpt}`);
    setResult(`${pass ? "Cleared for paste" : "BLOCKED — rotate exposed credentials"}:\n${lines.join("\n")}`);
    api.trackEvent("safety.scan", { hits: hits.length, pass }).catch(() => {});
  }

  async function captureLead() {
    if (!email.includes("@")) return;
    await api.captureLead(email, "safety-scanner", "builder-tools", "Interested after safety scan");
    setResult((r) => (r ?? "") + "\n\nLead captured — we'll send vault + PR blocking tips.");
  }

  return (
    <div className="page">
      <header className="dash-header">
        <h1>Safety scanner</h1>
        <Link to="/" className="btn ghost">Home</Link>
      </header>
      <p className="muted">
        Industry-calibrated patterns: AWS, GitHub, Stripe, Slack, database URLs, JWTs. Run before promotion or paste into vaults.
      </p>
      <div className="card form">
        <label>
          Paste code, .env, or config
          <textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="API_KEY=sk_live_..." />
        </label>
        <button type="button" className="btn primary" onClick={runScan}>Scan</button>
      </div>
      {result && <pre className="card scan-result">{result}</pre>}
      <section className="card waitlist">
        <h2>Get PR-blocking tools</h2>
        <div className="row">
          <input type="email" placeholder="you@builds.dev" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="button" className="btn ghost" onClick={captureLead}>Notify me</button>
        </div>
      </section>
    </div>
  );
}
