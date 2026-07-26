import "@/styles/clientsurge-os-auth-layout.css";
import "@/styles/clientsurge-os-tokens.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, KeyRound, Mail, Shield, User, LockKeyhole, Sparkles, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { CSAlert, CSButton, CSStatusBadge } from "@/components/design-system";
import { useAuth } from "@/lib/AuthContext";
import { setPageMetadata } from "@/lib/seo";

const BRAND_LOGO =
  "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png";

const BRAND_BENEFITS = [
  "Activation and launch progress",
  "AI service status and recent outcomes",
  "Leads, appointments, reporting, and billing",
  "Support requests and required next actions",
];

export default function Login() {
  const { applyAuthenticatedUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showSignup, setShowSignup] = useState(false);
  const [view, setView] = useState("login");
  const [adminUser, setAdminUser] = useState(null);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [recoveryNotice, setRecoveryNotice] = useState("");

  useEffect(() => {
    return setPageMetadata({
      title: "Client Portal Login | ClientSurge Systems",
      description:
        "Sign in to the ClientSurge Systems client portal to view activation, AI service activity, billing, reports, and required actions.",
      canonicalPath: "/login",
      ogTitle: "Client Portal Login | ClientSurge Systems",
      ogDescription:
        "Secure access to your ClientSurge system, activation progress, performance, billing, and support.",
      robots: "noindex,nofollow",
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("from_url")) setView("login");
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("clientsurge_password_reset_complete") !== "true") return;
      sessionStorage.removeItem("clientsurge_password_reset_complete");
      setRecoveryNotice("Your password has been updated. Sign in with your new password to continue.");
    } catch {}
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      await base44.auth.loginViaEmailPassword(email.trim(), password);
      const currentUser = await base44.auth.me();
      applyAuthenticatedUser(currentUser);
      const role = (currentUser?.role || "").toLowerCase();

      if (role === "admin" || role === "super_admin") {
        setAdminUser(currentUser);
        setShowRoleSelect(true);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("from_url");
      window.location.href = fromUrl && fromUrl.startsWith("/") && !fromUrl.startsWith("//")
        ? fromUrl
        : "/client-portal";
    } catch (err) {
      setError(err?.data?.message || err?.message || "Unable to sign in. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const emailToReset = (resetEmail || email).trim();
      await base44.auth.resetPasswordRequest(emailToReset);
      setNotice("Password reset email sent. Use the secure link in that email to create a new password, then sign in here.");
      setView("forgot-success");
    } catch (err) {
      setError(err?.data?.message || err?.message || "We could not send the reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChoice = (destination) => {
    window.location.href = destination;
  };

  const isLoginView = view === "login";
  const isResetSuccessView = view === "forgot-success";

  if (showSignup) {
    window.location.href = "/register";
    return null;
  }

  return (
    <main className="cs-auth-layout">
      {/* ── Brand panel ── */}
      <div className="cs-auth-layout__brand">
        <div className="cs-auth-layout__brand-lockup">
          <img
            src={BRAND_LOGO}
            alt="ClientSurge Systems"
            width="220"
            height="55"
            decoding="async"
            style={{ height: "clamp(48px, 6vw, 64px)", width: "auto", maxWidth: "100%", objectFit: "contain", filter: "drop-shadow(0 8px 20px rgba(0,174,239,0.25))" }}
          />
        </div>

        <div className="cs-auth-layout__brand-copy">
          <span className="cs-auth-brand-pill">
            <LockKeyhole size={14} aria-hidden="true" /> Secure client access
          </span>
          <h2 style={{ margin: 0, color: "#eef3fa", fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: 1.12, letterSpacing: "-0.04em", fontWeight: 700 }}>
            Your ClientSurge system, in one place.
          </h2>
          <p style={{ margin: "1.25rem 0 0", maxWidth: "42ch", color: "rgba(255,255,255,0.78)", fontSize: "1rem", lineHeight: 1.7 }}>
            Sign in to see what is active, what ClientSurge handled, what results were created, and what needs your attention — without navigating technical tools.
          </p>

          <ul style={{ listStyle: "none", padding: 0, margin: "1.75rem 0 0", display: "grid", gap: "1.15rem" }}>
            {BRAND_BENEFITS.map((item) => (
              <li key={item} style={{ display: "flex", alignItems: "center", gap: "0.85rem", color: "rgba(255,255,255,0.86)", fontSize: "0.95rem", fontWeight: 500, lineHeight: 1.4 }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "1.5rem", height: "1.5rem", borderRadius: "0.5rem", background: "rgba(0,174,239,0.16)", border: "1px solid rgba(0,174,239,0.28)", flexShrink: 0 }}>
                  <Sparkles size={14} aria-hidden="true" style={{ color: "var(--cs-blue-500)" }} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="cs-auth-layout__assurance">
          <Shield aria-hidden="true" />
          <span>Protected access to your ClientSurge system and business data.</span>
        </div>
      </div>

      {/* ── Workspace / form panel ── */}
      <div className="cs-auth-layout__workspace">
        <div className="cs-auth-layout__panel">
          {showRoleSelect && adminUser ? (
            <div className="cs-auth-layout__card">
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
                <span style={{ display: "grid", placeItems: "center", width: "2.5rem", height: "2.5rem", borderRadius: "var(--cs-radius-md)", background: "var(--cs-blue-50)", color: "var(--cs-blue-700)" }}>
                  <Shield size={20} aria-hidden="true" />
                </span>
                <CSStatusBadge tone="info"><Shield size={14} aria-hidden="true" /> Admin detected</CSStatusBadge>
              </div>
              <h1 style={{ margin: "0 0 0.35rem", color: "var(--cs-text-primary)", fontSize: "clamp(1.6rem, 3vw, 2rem)", lineHeight: 1.15, letterSpacing: "-0.03em", fontWeight: 800 }}>
                Choose login role
              </h1>
              <p style={{ margin: "0 0 1.5rem", color: "var(--cs-text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
                Your account has admin privileges. Choose how you would like to proceed.
              </p>

              <div style={{ display: "grid", gap: "0.85rem" }}>
                <button type="button" onClick={() => handleRoleChoice("/admin")} className="cs-auth-layout__role-option">
                  <span className="cs-auth-layout__role-icon" aria-hidden="true"><Shield /></span>
                  <span>
                    <strong style={{ display: "block", color: "var(--cs-text-primary)", fontSize: "0.98rem" }}>Log in as Admin</strong>
                    <span style={{ display: "block", color: "var(--cs-text-secondary)", fontSize: "0.85rem", lineHeight: 1.5, marginTop: "0.2rem" }}>
                      Full access to the admin dashboard, lead management, client onboarding, and system controls.
                    </span>
                  </span>
                  <ArrowRight aria-hidden="true" style={{ color: "var(--cs-blue-600)", flexShrink: 0 }} />
                </button>

                <button type="button" onClick={() => handleRoleChoice("/client-portal")} className="cs-auth-layout__role-option">
                  <span className="cs-auth-layout__role-icon cs-auth-layout__role-icon--client" aria-hidden="true"><User /></span>
                  <span>
                    <strong style={{ display: "block", color: "var(--cs-text-primary)", fontSize: "0.98rem" }}>Log in as Client (Pro Package)</strong>
                    <span style={{ display: "block", color: "var(--cs-text-secondary)", fontSize: "0.85rem", lineHeight: 1.5, marginTop: "0.2rem" }}>
                      View the client portal experience, campaign statuses, lead flow, and setup progress as a member with an active Pro package.
                    </span>
                  </span>
                  <ArrowRight aria-hidden="true" style={{ color: "var(--cs-blue-600)", flexShrink: 0 }} />
                </button>
              </div>
            </div>
          ) : isResetSuccessView ? (
            <div className="cs-auth-layout__card">
              <span style={{ display: "grid", placeItems: "center", width: "3.5rem", height: "3.5rem", margin: "0 auto 1.25rem", borderRadius: "var(--cs-radius-lg)", background: "var(--cs-success-100)", color: "var(--cs-success-700)" }}>
                <Mail size={26} aria-hidden="true" />
              </span>
              <h1 style={{ margin: 0, textAlign: "center", color: "var(--cs-text-primary)", fontSize: "clamp(1.6rem, 3vw, 2rem)", letterSpacing: "-0.03em", fontWeight: 800 }}>
                Check your email
              </h1>
              <p style={{ margin: "0.65rem 0 1.75rem", textAlign: "center", color: "var(--cs-text-secondary)", lineHeight: 1.65 }}>
                Use the secure reset link when it arrives, then return here to sign in.
              </p>
              {notice ? <CSAlert tone="success" title="Reset email sent" style={{ marginBottom: "1.25rem" }}>{notice}</CSAlert> : null}
              <CSButton type="button" size="lg" className="cs-auth-submit cs-btn-primary" onClick={() => { setError(""); setNotice(""); setView("login"); }}>
                Return to sign in
              </CSButton>
            </div>
          ) : (
            <>
              <div className="cs-auth-layout__heading">
                <span className="cs-auth-layout__icon" aria-hidden="true">
                  <LockKeyhole size={22} />
                </span>
                <h1 style={{ margin: 0, color: "var(--cs-text-primary)", fontSize: "clamp(1.8rem, 3vw, 2.35rem)", lineHeight: 1.15, letterSpacing: "-0.035em", fontWeight: 800 }}>
                  {isLoginView ? "Welcome back" : "Reset your password"}
                </h1>
                <p style={{ margin: "0.65rem 0 0", color: "var(--cs-text-secondary)", lineHeight: 1.65, fontSize: "0.95rem" }}>
                  {isLoginView
                    ? "Sign in to access your ClientSurge system, activation progress, and reports."
                    : "Enter the email connected to your ClientSurge account."}
                </p>
              </div>

              <div className="cs-auth-layout__card">
                {recoveryNotice ? (
                  <CSAlert tone="success" title="Password updated" style={{ marginBottom: "1.25rem" }}>{recoveryNotice}</CSAlert>
                ) : null}

                {error ? (
                  <CSAlert tone="danger" title={isLoginView ? "Sign in failed" : "Reset email not sent"} style={{ marginBottom: "1.25rem" }}>{error}</CSAlert>
                ) : null}

                <form onSubmit={isLoginView ? handleSubmit : handleForgotPassword} style={{ display: "grid", gap: "1.1rem" }}>
                  {isLoginView ? (
                    <>
                      <div className="cs-auth-field">
                        <label htmlFor="login-email" className="cs-auth-field__label">Email address</label>
                        <div className="cs-auth-field__control">
                          <Mail size={17} aria-hidden="true" className="cs-auth-field__icon" />
                          <input
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => {
                              setEmail(event.target.value);
                              setError("");
                              if (!resetEmail) setResetEmail(event.target.value);
                            }}
                            required
                            placeholder="jane@business.com"
                            className="cs-auth-input"
                          />
                        </div>
                        <p className="cs-auth-field__hint">Use the email connected to your ClientSurge order.</p>
                      </div>

                      <div className="cs-auth-field">
                        <label htmlFor="login-password" className="cs-auth-field__label">Password</label>
                        <div className="cs-auth-field__control">
                          <KeyRound size={17} aria-hidden="true" className="cs-auth-field__icon" />
                          <input
                            id="login-password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => {
                              setPassword(event.target.value);
                              setError("");
                            }}
                            required
                            placeholder="Enter your password"
                            className="cs-auth-input"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="cs-auth-field">
                      <label htmlFor="login-reset-email" className="cs-auth-field__label">Email address</label>
                      <div className="cs-auth-field__control">
                        <Mail size={17} aria-hidden="true" className="cs-auth-field__icon" />
                        <input
                          id="login-reset-email"
                          type="email"
                          autoComplete="email"
                          value={resetEmail || email}
                          onChange={(event) => {
                            setResetEmail(event.target.value);
                            setEmail(event.target.value);
                            setError("");
                          }}
                          required
                          placeholder="jane@business.com"
                          className="cs-auth-input"
                        />
                      </div>
                      <p className="cs-auth-field__hint">For privacy, ClientSurge sends the same confirmation whether or not an account exists.</p>
                    </div>
                  )}

                  <CSButton type="submit" size="lg" loading={loading} className="cs-auth-submit cs-btn-primary cs-cta-glow">
                    {loading
                      ? isLoginView ? "Signing in..." : "Sending reset email..."
                      : isLoginView ? <>Sign in <ArrowRight aria-hidden="true" /></> : <>Send reset email <Mail aria-hidden="true" /></>}
                  </CSButton>

                  {isLoginView && (
                    <div className="cs-auth-trust-signals" aria-label="Security guarantees">
                      <span>Secure encrypted authentication</span>
                      <span aria-hidden="true">·</span>
                      <span>Enterprise-grade security</span>
                      <span aria-hidden="true">·</span>
                      <span>Your data is protected</span>
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", alignItems: "center", marginTop: "0.5rem" }}>
                    {isLoginView ? (
                      <>
                        <button
                          type="button"
                          onClick={() => { setError(""); setNotice(""); setResetEmail(email); setView("forgot"); }}
                          className="cs-auth-text-link"
                        >
                          <KeyRound size={14} aria-hidden="true" /> Forgot your password?
                        </button>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
                          <p className="cs-auth-field__footer-note" style={{ margin: 0 }}>Need an account?</p>
                          <Link to="/register" className="cs-auth-inline-link">
                            Start onboarding <ArrowRight size={13} aria-hidden="true" />
                          </Link>
                        </div>
                      </>
                    ) : (
                      <button type="button" onClick={() => { setError(""); setNotice(""); setView("login"); }} className="cs-auth-text-link">
                        <ArrowRight size={14} aria-hidden="true" style={{ transform: "rotate(180deg)" }} /> Back to sign in
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="cs-auth-layout__footer">
                <CheckCircle2 size={14} aria-hidden="true" style={{ color: "var(--cs-success-700)" }} />
                <span>Protected by ClientSurge secure access.</span>
                <span className="cs-auth-footer-divider" aria-hidden="true">·</span>
                <Link to="/contact" className="cs-auth-footer-link">Get account help</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}