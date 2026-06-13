import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { REFERRAL_GOAL, REFERRAL_REWARD_DAYS } from "@secretlayer/shared";
import { SiteLayout, usePageMeta } from "../components/SiteLayout";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export function ReferralPage() {
  const { session } = useAuth();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof api.referralMe>> | null>(null);
  const [copied, setCopied] = useState(false);

  usePageMeta(
    `Refer 5 builders, get 1 month free | SecretLayer`,
    `Share SecretLayer with other builders. Refer ${REFERRAL_GOAL} signups and get ${REFERRAL_REWARD_DAYS} days of Personal free.`,
  );

  useEffect(() => {
    if (!session?.token) return;
    api.referralMe(session.token).then(setStats).catch(() => {});
  }, [session?.token]);

  async function copyLink() {
    if (!stats?.shareUrl) return;
    await navigator.clipboard.writeText(stats.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <SiteLayout>
      <div className="page">
        <h1>Refer {REFERRAL_GOAL}, get 1 month free</h1>
        <p className="lede">
          Help builders organize API keys. When {REFERRAL_GOAL} people sign up with your link, you get{" "}
          <strong>{REFERRAL_REWARD_DAYS} days of Personal</strong> (unlimited secrets &amp; projects).
        </p>

        {session && stats ? (
          <section className="card highlight">
            <h2>Your progress</h2>
            <p className="calc-big">{stats.count} / {stats.goal}</p>
            <p className="muted">
              {stats.remaining > 0
                ? `${stats.remaining} more signup${stats.remaining === 1 ? "" : "s"} to unlock your free month`
                : stats.rewardActive
                  ? `Reward active until ${new Date(stats.rewardUntil!).toLocaleDateString()}`
                  : "Reward unlocked!"}
            </p>
            <p><code>{stats.code}</code></p>
            <div className="actions">
              <button type="button" className="btn primary" onClick={copyLink}>
                {copied ? "Copied!" : "Copy invite link"}
              </button>
              <Link to="/app" className="btn ghost">Back to vault</Link>
            </div>
          </section>
        ) : (
          <section className="card">
            <p>Sign up to get your personal referral link.</p>
            <Link to="/signup" className="btn primary">Create free account</Link>
          </section>
        )}

        <section className="card">
          <h2>How it works</h2>
          <ol className="guide-steps">
            <li>Sign up and copy your link from this page or the dashboard.</li>
            <li>Share with indie devs juggling OpenAI, Stripe, Supabase keys.</li>
            <li>Each verified signup counts toward your {REFERRAL_GOAL}.</li>
            <li>Hit {REFERRAL_GOAL} → Personal plan free for {REFERRAL_REWARD_DAYS} days.</li>
          </ol>
        </section>
      </div>
    </SiteLayout>
  );
}
