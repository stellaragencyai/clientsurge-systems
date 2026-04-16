import { useState } from "react";
import { X, ArrowRight, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SignupModal from "./SignupModal";

export default function LoginModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSignup, setShowSignup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      base44.auth.redirectToLogin();
    } catch (err) {
      setError("An error occurred. Please try again.");
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Centering wrapper */}
      <div className="flex min-h-full items-center justify-center p-4">
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10">
        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-border">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-border transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Client Portal</span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-foreground">Welcome Back</h2>
          <p className="text-sm text-muted-foreground mt-1">Sign in to access your portal and track your system setup.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="jane@business.com"
              className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", borderRadius: "9999px", boxShadow: "0 4px 18px rgba(120,70,20,0.35)" }}
            className="w-full h-12 flex items-center justify-center gap-2 text-sm font-bold text-amber-100 transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
            ) : (
              <>Sign In <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => setShowSignup(true)}
              className="text-primary font-semibold hover:underline focus:outline-none"
            >
              Start onboarding
            </button>
          </p>
        </form>
      </div>
      </div>
    </div>
  );
}