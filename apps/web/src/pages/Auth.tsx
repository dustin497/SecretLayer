import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const { setSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref.toUpperCase());
  }, [searchParams]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res =
        mode === "login"
          ? await api.login(email, password)
          : await api.signup(email, password, referralCode || undefined);
      setSession(res);
      await api.trackEvent(mode === "login" ? "auth.login" : "auth.signup", { referral: referralCode || null });
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
    }
  }

  return (
    <div className="page narrow">
      <h1>{mode === "login" ? "Sign in" : "Create account"}</h1>
      <p className="muted">Unlock your encrypted vault after signing in.</p>
      {mode === "signup" && referralCode && (
        <p className="status">Referral code applied: <code>{referralCode}</code></p>
      )}
      <form className="card form" onSubmit={onSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </label>
        {mode === "signup" && (
          <label>
            Referral code (optional)
            <input value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} placeholder="SL-XXXXXXXX" />
          </label>
        )}
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn primary">{mode === "login" ? "Sign in" : "Sign up"}</button>
      </form>
      <p className="muted">
        {mode === "login" ? (
          <>No account? <Link to="/signup">Sign up</Link></>
        ) : (
          <>Have an account? <Link to="/login">Sign in</Link></>
        )}
      </p>
    </div>
  );
}
