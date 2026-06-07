import { useState } from "react";
import { PLAN_CATALOG, type PlanId } from "@secretlayer/shared";
import { api, type BillingPlanResponse } from "../lib/api";

const UPGRADE_PLANS: PlanId[] = ["personal", "pro"];

export function BillingPanel({
  token,
  plan,
  onRefresh,
}: {
  token: string;
  plan: BillingPlanResponse;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = plan.plan.toLowerCase() as PlanId;

  async function upgrade(target: PlanId) {
    setBusy(true);
    setError(null);
    try {
      const { url } = await api.billingCheckout(token, target);
      await api.trackEvent("billing.checkout.start", { plan: target });
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setBusy(false);
    }
  }

  async function manage() {
    setBusy(true);
    setError(null);
    try {
      const { url } = await api.billingPortal(token);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open billing portal");
      setBusy(false);
    }
  }

  function formatLimit(value: number | null) {
    return value === null ? "Unlimited" : String(value);
  }

  return (
    <section className="card">
      <div className="dash-header" style={{ marginBottom: "0.75rem" }}>
        <h2 style={{ margin: 0 }}>Billing</h2>
        <span className="chip active">{plan.plan}</span>
      </div>
      <p className="muted">
        {formatLimit(plan.usage.secrets)}/{formatLimit(plan.limits.secrets)} secrets ·{" "}
        {formatLimit(plan.usage.projects)}/{formatLimit(plan.limits.projects)} projects
        {plan.subscriptionStatus && ` · ${plan.subscriptionStatus}`}
        {plan.currentPeriodEnd && ` · renews ${new Date(plan.currentPeriodEnd).toLocaleDateString()}`}
      </p>

      <div className="grid-3" style={{ marginTop: "1rem" }}>
        {UPGRADE_PLANS.map((id) => {
          const def = PLAN_CATALOG[id];
          const isCurrent = current === id;
          return (
            <article key={id} className="card" style={{ padding: "1rem" }}>
              <h3 style={{ margin: "0 0 0.25rem" }}>{def.name}</h3>
              <p className="muted" style={{ margin: "0 0 0.5rem" }}>{def.priceLabel}</p>
              <p style={{ fontSize: "0.9rem", color: "#cbd5e1" }}>{def.description}</p>
              <ul style={{ fontSize: "0.85rem", color: "#94a3b8", paddingLeft: "1.1rem" }}>
                {def.features.slice(0, 4).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button
                type="button"
                className="btn primary"
                style={{ width: "100%", marginTop: "0.5rem" }}
                disabled={busy || isCurrent}
                onClick={() => upgrade(id)}
              >
                {isCurrent ? "Current plan" : `Upgrade to ${def.name}`}
              </button>
            </article>
          );
        })}
      </div>

      <div className="actions" style={{ marginTop: "1rem" }}>
        <button
          type="button"
          className="btn ghost"
          disabled={busy || !plan.hasStripeCustomer}
          onClick={manage}
        >
          Manage billing
        </button>
        <button type="button" className="btn ghost" disabled={busy} onClick={onRefresh}>
          Refresh plan
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
