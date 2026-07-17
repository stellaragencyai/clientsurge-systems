import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  Shield,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import SignupModal from "./SignupModal";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";
import { useAuth } from "@/lib/AuthContext";

const ELECTRIC = "#13B7F3";
const NAVY = "#061A33";

function AuthField({ label, icon: Icon, type = "text", value, onChange, placeholder, autoComplete, trailing }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-700">{label}</span>
      <span className="group relative block">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#13B7F3]" />
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-12 text-sm font-medium text-slate-950 shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#13B7F3] focus:bg-white focus:ring-4 focus:ring-[#13B7F3]/10"
        />
        {trailing}
      </span>
    </label>
  );
}

function StatusMessage({ type, children }) {
  const success = type === "success";
  const Icon = success ? CheckCircle2 : AlertCircle;
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
      success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"
    }`}>
      <Icon className="mt-0.5 h-4 w-4 flex-none" />
      <span>{children}</span>
    </div>
  );
}

function ElectricButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-5 text-sm font-black text-white shadow-[0_10px_28px_rgba(19,183,243,0.30)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(19,183,243,0.42)] disabled:cursor-not-allowed disabled:opacity-60"
      style={{ background: "linear-gradient(135deg,#19C2FF 0%,#0EA7E8 55%,#0A8FD0 100%)" }}
    >
      <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
      <span className="relative flex items-center gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {children}
      </span>
    </button>
  );
}

function ModalShell({ children, onClose, ariaLabel, maxWidth = "max-w-lg" }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <motion.button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 cursor-default bg-[#020B16]/75 backdrop-blur-md"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          tabIndex={-1}
          className={`relative z-10 w-full ${maxWidth} overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-[0_32px_100px_rgba(2,11,22,0.42)] focus:outline-none`}
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute left-0 right-0 top-0 h-1" style={{ background: "linear-gradient(90deg,#13B7F3,#6EDCFF,#13B7F3)" }} />
          <button
            onClick={onClose}
            type="button"
            aria-label="Close dialog"
            className="absolute right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
          {children}
        </motion.div>
      </div>
    </div>,
    document.body,
  );
}

export default function PortalLoginModal({ onClose }) {
  const { applyAuthenticatedUser } = useAuth();
  const dialogRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showSignup, setShowSignup] = useState(false);
  const [view, setView] = useState("login");
  const [adminUser, setAdminUser] = useState(null);
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  useEffect(() => {
    dialogRef.current?.focus();
    const handleEscape = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEscape);
    const releaseScrollLock = acquireBodyScrollLock("portal-login-modal");
    return () => {
      document.removeEventListener("keydown", handleEscape);
      releaseScrollLock();
    };
  }, [onClose]);

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
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("from_url");
      window.location.href = fromUrl?.startsWith("/") && !fromUrl.startsWith("//") ? fromUrl : "/client-portal";
    } catch (err) {
      setError(err?.data?.message || err?.message || "Unable to sign in. Check your email and password, then try again.");
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
      setNotice(`A secure reset link was sent to ${emailToReset}.`);
      setView("forgot-success");
    } catch (err) {
      setError(err?.data?.message || err?.message || "We could not send the reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (showSignup) {
    return <SignupModal onClose={onClose} onSwitchToLogin={() => setShowSignup(false)} />;
  }

  if (showRoleSelect && adminUser) {
    return (
      <ModalShell onClose={onClose} ariaLabel="Choose login destination" maxWidth="max-w-xl">
        <div className="relative overflow-hidden px-7 pb-7 pt-9 sm:px-9 sm:pb-9">
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[#13B7F3]/10 blur-3xl" />
          <div className="relative">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#13B7F3]/20 bg-[#13B7F3]/10 text-[#0A9FDA]">
              <Shield className="h-6 w-6" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0A9FDA]">Admin access detected</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">Choose your workspace</h2>
            <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">Your account can enter either the operational control center or the client experience.</p>

            <div className="mt-7 space-y-3">
              {[
                { destination: "/admin", icon: Shield, title: "Admin Command Center", text: "Manage leads, clients, automations, onboarding, and system operations." },
                { destination: "/client-portal", icon: User, title: "Client Portal", text: "Open the customer-facing portal, performance views, and setup progress." },
              ].map(({ destination, icon: Icon, title, text }) => (
                <button
                  key={destination}
                  type="button"
                  onClick={() => { window.location.href = destination; }}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#13B7F3]/50 hover:shadow-[0_14px_32px_rgba(15,23,42,0.10)]"
                >
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[#061A33] text-[#25C4FF] shadow-inner">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-slate-950">{title}</span>
                    <span className="mt-0.5 block text-xs font-medium leading-5 text-slate-500">{text}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 flex-none text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-[#13B7F3]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </ModalShell>
    );
  }

  const forgotSuccess = view === "forgot-success";
  const forgot = view === "forgot";

  return (
    <ModalShell onClose={onClose} ariaLabel="Client portal sign in">
      <div ref={dialogRef} className="grid min-h-[570px] sm:grid-cols-[0.78fr_1.22fr]" tabIndex={-1}>
        <div className="relative hidden overflow-hidden bg-[#061A33] px-7 py-8 text-white sm:block">
          <div className="pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full border border-[#13B7F3]/20" />
          <div className="pointer-events-none absolute -left-10 top-36 h-52 w-52 rounded-full border border-[#13B7F3]/20" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-52 w-52 rounded-full bg-[#13B7F3]/15 blur-3xl" />
          <div className="relative flex h-full flex-col">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#13B7F3]/12 text-[#28C7FF] ring-1 ring-[#13B7F3]/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="mt-auto pb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#47D1FF]">Secure workspace</p>
              <h3 className="mt-3 text-2xl font-black leading-tight tracking-[-0.04em]">Your AI operations, one login away.</h3>
              <p className="mt-3 text-xs font-medium leading-5 text-slate-300">Access setup progress, lead activity, automation health, and reporting.</p>
              <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                <LockKeyhole className="h-3.5 w-3.5 text-[#13B7F3]" />
                Encrypted access
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col px-6 pb-7 pt-9 sm:px-8 sm:pb-8">
          {forgotSuccess ? (
            <div className="flex flex-1 flex-col justify-center text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm">
                <Mail className="h-7 w-7" />
              </div>
              <p className="mt-6 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">Email sent</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-slate-950">Check your inbox</h2>
              <p className="mx-auto mt-3 max-w-xs text-sm font-medium leading-6 text-slate-500">{notice || "Use the secure link in your email to create a new password."}</p>
              <button
                type="button"
                onClick={() => { setView("login"); setNotice(""); setError(""); }}
                className="mx-auto mt-7 inline-flex items-center gap-2 text-sm font-black text-[#0A9FDA] transition hover:text-[#0787BC]"
              >
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0A9FDA]">{forgot ? "Account recovery" : "Client portal"}</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-slate-950">{forgot ? "Reset your password" : "Welcome back"}</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{forgot ? "Enter your email and we will send a secure reset link." : "Enter your credentials to continue to your workspace."}</p>
              </div>

              <form onSubmit={forgot ? handleForgotPassword : handleSubmit} className="mt-7 space-y-4">
                {error && <StatusMessage type="error">{error}</StatusMessage>}
                {!forgot && (
                  <>
                    <AuthField
                      label="Email address"
                      icon={Mail}
                      type="email"
                      value={email}
                      onChange={(value) => { setEmail(value); if (!resetEmail) setResetEmail(value); }}
                      placeholder="you@company.com"
                      autoComplete="email"
                    />
                    <AuthField
                      label="Password"
                      icon={LockKeyhole}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={setPassword}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      trailing={(
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                    />
                  </>
                )}
                {forgot && (
                  <AuthField
                    label="Email address"
                    icon={Mail}
                    type="email"
                    value={resetEmail || email}
                    onChange={(value) => { setResetEmail(value); setEmail(value); }}
                    placeholder="you@company.com"
                    autoComplete="email"
                  />
                )}

                <ElectricButton loading={loading}>
                  {loading ? (forgot ? "Sending secure link..." : "Signing you in...") : (forgot ? "Send reset link" : "Sign in")}
                  {!loading && (forgot ? <Mail className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />)}
                </ElectricButton>

                <div className="pt-1 text-center">
                  {!forgot ? (
                    <>
                      <button
                        type="button"
                        onClick={() => { setError(""); setNotice(""); setResetEmail(email); setView("forgot"); }}
                        className="text-xs font-bold text-slate-500 transition hover:text-[#0A9FDA]"
                      >
                        Forgot your password?
                      </button>
                      <p className="mt-3 text-xs font-medium text-slate-400">
                        New to ClientSurge?{" "}
                        <button type="button" onClick={() => setShowSignup(true)} className="font-black text-[#0A9FDA] hover:text-[#0787BC]">Start onboarding</button>
                      </p>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setError(""); setNotice(""); setView("login"); }}
                      className="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-[#0A9FDA]"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
