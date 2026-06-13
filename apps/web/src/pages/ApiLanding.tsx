import { Link, Navigate, useParams } from "react-router-dom";
import { getLandingBySlug } from "@secretlayer/shared";
import { ApiLandingGrid, SiteLayout, usePageMeta } from "../components/SiteLayout";

export function ApiLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const landing = slug ? getLandingBySlug(slug) : undefined;

  if (!landing) return <Navigate to="/" replace />;

  usePageMeta(
    `SecretLayer for ${landing.name} — ${landing.tagline}`,
    `${landing.problem} Organize ${landing.name} API keys in encrypted vaults. Free tier for builders.`,
  );

  return (
    <SiteLayout>
      <div className="page">
        <p className="eyebrow">SecretLayer for {landing.name}</p>
        <h1>{landing.tagline}</h1>
        <p className="lede">{landing.problem}</p>
        <div className="actions">
          <Link to="/signup" className="btn primary">{landing.cta}</Link>
          <Link to="/calculator" className="btn ghost">Estimate API costs</Link>
        </div>

        <section className="card">
          <h2>Keys we help you organize</h2>
          <ul className="key-list">
            {landing.secrets.map((k) => (
              <li key={k}><code>{k}</code></li>
            ))}
          </ul>
        </section>

        <section className="card highlight">
          <h2>Example vault structure</h2>
          <p className="muted">Project: <strong>{landing.vaultExample.project}</strong> → Vault: <strong>{landing.vaultExample.vault}</strong></p>
          <ul className="key-list">
            {landing.vaultExample.keys.map((k) => (
              <li key={k}><code>{k}</code></li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>Builders search for</h2>
          <p className="muted">{landing.searchTerms.join(" · ")}</p>
        </section>

        <ApiLandingGrid />
      </div>
    </SiteLayout>
  );
}
