import { Link, Navigate, useParams } from "react-router-dom";
import { SiteLayout, usePageMeta } from "../components/SiteLayout";
import { GUIDES, getGuide } from "../content/guides";

export function GuidesIndex() {
  usePageMeta(
    "Weekly builder guides — API secrets & vaults | SecretLayer",
    "In-depth weekly guides for indie developers managing OpenAI, Stripe, Supabase, and more.",
  );

  return (
    <SiteLayout>
      <div className="page">
        <h1>Weekly guides</h1>
        <p className="lede">One detailed guide per week — problems developers actually search for.</p>
        <div className="guide-list">
          {GUIDES.map((g) => (
            <Link key={g.slug} to={`/guides/${g.slug}`} className="card guide-card">
              <p className="eyebrow">Week {g.week}</p>
              <h2>{g.title}</h2>
              <p className="muted">{g.summary}</p>
              <p className="muted">{g.readMinutes} min read</p>
            </Link>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}

export function GuideArticle() {
  const { slug } = useParams<{ slug: string }>();
  const guide = slug ? getGuide(slug) : undefined;
  if (!guide) return <Navigate to="/guides" replace />;

  usePageMeta(`${guide.title} | SecretLayer`, guide.summary);

  if (guide.slug !== "openai-api-key-vault-week-1") {
    return <Navigate to="/guides" replace />;
  }

  return (
    <SiteLayout>
      <article className="page guide-article">
        <p className="eyebrow">Week {guide.week} · {guide.readMinutes} min</p>
        <h1>{guide.title}</h1>

        <section className="card">
          <h2>Why this matters now</h2>
          <p>
            OpenAI keys are in every indie SaaS repo, but most leaks happen <em>after</em> the first commit —
            copied into Slack, pasted in Loom descriptions, or duplicated across Vercel preview envs.
            SecretLayer treats <code>OPENAI_API_KEY</code> like production credentials: one project, one vault per environment.
          </p>
        </section>

        <section className="card">
          <h2>15-minute vault setup</h2>
          <ol className="guide-steps">
            <li>Create project <strong>AI App</strong> in SecretLayer.</li>
            <li>Add vault <strong>Development</strong> — store a key with low spend limits from OpenAI dashboard.</li>
            <li>Add vault <strong>Production</strong> — separate key, never reused in dev.</li>
            <li>Run the <Link to="/safety">safety scanner</Link> on your <code>.env</code> before deleting local copies.</li>
            <li>Export encrypted backup (Settings → coming soon) before rotating.</li>
          </ol>
        </section>

        <section className="card">
          <h2>Rotation without downtime</h2>
          <p>
            In OpenAI dashboard, create key #2 → add to vault → update Vercel env → revoke key #1.
            Document rotation date in vault notes so you&apos;re not guessing in 90 days.
          </p>
        </section>

        <section className="card highlight">
          <h2>Cost check</h2>
          <p>Before scaling GPT usage, estimate spend with our <Link to="/calculator">API cost calculator</Link>.</p>
          <Link to="/for/openai" className="btn primary">SecretLayer for OpenAI</Link>
        </section>
      </article>
    </SiteLayout>
  );
}
