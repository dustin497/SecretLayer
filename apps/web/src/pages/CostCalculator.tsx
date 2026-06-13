import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SiteLayout, usePageMeta } from "../components/SiteLayout";

interface ProviderEstimate {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  label: string;
  defaultQty: number;
  max: number;
}

const PROVIDERS: ProviderEstimate[] = [
  { id: "openai", name: "OpenAI", unit: "1M tokens (blended)", pricePerUnit: 2.5, label: "Monthly token millions", defaultQty: 5, max: 500 },
  { id: "anthropic", name: "Anthropic", unit: "1M tokens", pricePerUnit: 3, label: "Monthly token millions", defaultQty: 3, max: 300 },
  { id: "stripe", name: "Stripe", unit: "$100 processed", pricePerUnit: 0.3, label: "Monthly volume ($100 units)", defaultQty: 50, max: 10000 },
  { id: "supabase", name: "Supabase", unit: "Pro base", pricePerUnit: 25, label: "Plan units (Pro=1)", defaultQty: 1, max: 5 },
  { id: "vercel", name: "Vercel", unit: "Pro seat", pricePerUnit: 20, label: "Pro seats", defaultQty: 1, max: 20 },
  { id: "twilio", name: "Twilio", unit: "1k SMS", pricePerUnit: 7.5, label: "SMS thousands", defaultQty: 2, max: 500 },
  { id: "resend", name: "Resend", unit: "10k emails", pricePerUnit: 2, label: "Email tens of thousands", defaultQty: 1, max: 100 },
  { id: "aws", name: "AWS (misc)", unit: "$10 compute", pricePerUnit: 10, label: "Compute tens", defaultQty: 5, max: 500 },
];

export function CostCalculator() {
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(PROVIDERS.map((p) => [p.id, p.defaultQty])),
  );

  usePageMeta(
    "Free API Cost Calculator — OpenAI, Stripe, Supabase & more | SecretLayer",
    "Estimate monthly API spend for OpenAI, Anthropic, Stripe, Supabase, Vercel, Twilio, Resend, and AWS. Then vault your keys in SecretLayer.",
  );

  const lines = useMemo(
    () =>
      PROVIDERS.map((p) => ({
        ...p,
        cost: qty[p.id] * p.pricePerUnit,
      })),
    [qty],
  );

  const total = lines.reduce((s, l) => s + l.cost, 0);

  return (
    <SiteLayout>
      <div className="page">
        <h1>Free API cost calculator</h1>
        <p className="lede">
          Rough monthly estimates for indie builders. Adjust sliders — then organize the keys that drive this bill in encrypted vaults.
        </p>

        <section className="card calc-total">
          <p className="eyebrow">Estimated monthly</p>
          <p className="calc-big">${total.toFixed(2)}</p>
          <p className="muted">Estimates only — check each provider&apos;s pricing page before budgeting.</p>
        </section>

        <div className="calc-grid">
          {lines.map((line) => (
            <article key={line.id} className="card">
              <h2>{line.name}</h2>
              <p className="muted">${line.pricePerUnit.toFixed(2)} per {line.unit}</p>
              <label>
                {line.label}: <strong>{qty[line.id]}</strong>
                <input
                  type="range"
                  min={0}
                  max={line.max}
                  value={qty[line.id]}
                  onChange={(e) => setQty((q) => ({ ...q, [line.id]: Number(e.target.value) }))}
                />
              </label>
              <p className="calc-line">${line.cost.toFixed(2)}/mo</p>
              <Link to={`/for/${line.id === "aws" ? "aws" : line.id}`} className="muted">
                SecretLayer for {line.name} →
              </Link>
            </article>
          ))}
        </div>

        <section className="card highlight">
          <h2>Next step</h2>
          <p>High API spend usually means high secret sprawl. Vault keys by project before the bill surprises you.</p>
          <Link to="/signup" className="btn primary">Start free vault</Link>
        </section>
      </div>
    </SiteLayout>
  );
}
