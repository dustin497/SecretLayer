import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";

export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }, [title, description]);
}

export function SiteNav() {
  return (
    <nav className="site-nav">
      <Link to="/" className="site-logo">SecretLayer</Link>
      <div className="site-links">
        <Link to="/calculator">API calculator</Link>
        <Link to="/guides">Guides</Link>
        <Link to="/referral">Referrals</Link>
        <Link to="/safety">Safety scan</Link>
        <Link to="/signup" className="btn primary nav-cta">Start free</Link>
      </div>
    </nav>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteNav />
      {children}
    </>
  );
}

export function ApiLandingGrid() {
  const apis = [
    "openai", "supabase", "stripe", "github", "vercel",
    "aws", "anthropic", "twilio", "resend", "firebase",
  ];
  return (
    <section className="card">
      <h2>SecretLayer for your stack</h2>
      <div className="api-grid">
        {apis.map((slug) => (
          <Link key={slug} to={`/for/${slug}`} className="api-chip">
            {slug.charAt(0).toUpperCase() + slug.slice(1)}
          </Link>
        ))}
      </div>
    </section>
  );
}
