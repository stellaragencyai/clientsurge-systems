import { useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, Loader2, KeyRound, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import SignupModal from "./SignupModal";

export default function PortalLoginModal({ onClose }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showSignup, setShowSignup] = useState(false);
  const [view, setView] = useState("login");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      await base44.auth.loginViaEmailPassword(email.trim(), password);
      const currentUser = await base44.auth.me();
      onClose();
      navigate(currentUser?.role === "admin" ? "/admin" : "/client-portal");
    } catch (err) {
      setError(err?.data?.message || err?.message || "Unable to sign in. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
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

  if (showSignup) {
    return (
      <SignupModal
        onClose={onClose}
        onSwitchToLogin={() => setShowSignup(false)}
      />
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="border-b border-border px-8 pb-5 pt-8">
            <button
              onClick={onClose}
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-muted transition-colors hover:bg-border"
              type="button"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">Client Portal</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {view === "login" ? "Welcome Back" : "Reset Your Password"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {view === "login"
                ? "Sign in to access your portal and track your system setup."
                : "Enter your email and we'll send you a secure password reset link."}
            </p>
          </div>

          <form onSubmit={view === "login" ? handleSubmit : handleForgotPassword} className="space-y-4 px-8 py-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {notice && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {notice}
              </div>
            )}

            {view === "login" ? (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (!resetEmail) {
                        setResetEmail(e.target.value);
                      }
                    }}
                    required
                    placeholder="jane@business.com"
                    className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Email *</label>
                <input
                  type="email"
                  value={resetEmail || email}
                  onChange={(e) => {
                    setResetEmail(e.target.value);
                    setEmail(e.target.value);
                  }}
                  required
                  placeholder="jane@business.com"
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                borderRadius: "9999px",
                boxShadow: "0 4px 18px rgba(120,70,20,0.35)",
              }}
              className="flex h-12 w-full items-center justify-center gap-2 text-sm font-bold text-amber-100 transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {view === "login" ? "Signing in..." : "Sending reset email..."}
                </>
              ) : (
                <>
                  {view === "login" ? "Sign In" : "Send Reset Email"}
                  {view === "login" ? <ArrowRight className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                </>
              )}
            </button>

            <div className="flex flex-col items-center gap-2">
              {view === "login" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setNotice("");
                      setResetEmail(email);
                      setView("forgot");
                    }}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary hover:underline"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Forgot your password?
                  </button>
                  <p className="text-center text-xs text-muted-foreground">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setShowSignup(true)}
                      className="font-semibold text-primary hover:underline focus:outline-none"
                    >
                      Start onboarding
                    </button>
                  </p>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setNotice("");
                    setView("login");
                  }}
                  className="text-xs text-muted-foreground transition-colors hover:text-primary hover:underline"
                >
                  Back to sign in
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
