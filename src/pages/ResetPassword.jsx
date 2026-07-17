import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Check, Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

const RULES = [
  { label: "At least 8 characters", test: (value) => value.length >= 8 },
  { label: "One uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value) => /[a-z]/.test(value) },
  { label: "One number", test: (value) => /\d/.test(value) },
];

function validatePassword(password) {
  const failed = RULES.find((rule) => !rule.test(password));
  return failed ? failed.label : "";
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const completedRules = useMemo(() => RULES.filter((rule) => rule.test(newPassword)).length, [newPassword]);
  const strength = Math.round((completedRules / RULES.length) * 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(`Password requirement missing: ${passwordError.toLowerCase()}.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      setSuccess(true);
      setTimeout(() => { window.location.href = "/login"; }, 1400);
    } catch (err) {
      setError(err?.message || "We could not reset your password. Request a fresh link and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout icon={AlertTriangle} title="Invalid reset link" subtitle="This recovery link is missing, incomplete, or expired." footer={<Link to="/forgot-password" className="font-black text-cyan-600 hover:text-cyan-700">Request a new secure link</Link>}>
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600"><AlertTriangle className="h-7 w-7" /></div>
          <p className="mt-5 text-sm font-semibold leading-6 text-slate-600">For your protection, expired and malformed reset links cannot be reused.</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={success ? ShieldCheck : Lock} title={success ? "Password updated" : "Create a new password"} subtitle={success ? "Your account is secure. Redirecting you to sign in." : "Choose a strong password you have not used before."}>
      {success ? (
        <div className="py-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-600 shadow-[0_14px_35px_rgba(6,182,212,0.16)]"><Check className="h-8 w-8" /></div>
          <p className="mt-5 text-sm font-bold text-slate-700">Your password has been changed successfully.</p>
          <div className="mx-auto mt-5 h-1.5 w-36 overflow-hidden rounded-full bg-slate-100"><div className="h-full animate-pulse rounded-full bg-cyan-500" style={{ width: "100%" }} /></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

          <PasswordField label="New password" value={newPassword} onChange={(value) => { setNewPassword(value); setError(""); }} show={showPassword} onToggle={() => setShowPassword((value) => !value)} autoFocus />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.13em] text-slate-600">Password strength</p>
              <p className="text-xs font-black text-cyan-600">{strength}%</p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[linear-gradient(90deg,#16c7ff,#066ee8)] transition-all duration-300" style={{ width: `${strength}%` }} /></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {RULES.map((rule) => {
                const complete = rule.test(newPassword);
                return <div key={rule.label} className={`flex items-center gap-2 text-xs font-bold ${complete ? "text-cyan-700" : "text-slate-400"}`}><span className={`flex h-5 w-5 items-center justify-center rounded-full ${complete ? "bg-cyan-100" : "bg-white ring-1 ring-slate-200"}`}>{complete && <Check className="h-3 w-3" />}</span>{rule.label}</div>;
              })}
            </div>
          </div>

          <PasswordField label="Confirm password" value={confirmPassword} onChange={(value) => { setConfirmPassword(value); setError(""); }} show={showConfirm} onToggle={() => setShowConfirm((value) => !value)} />

          <button type="submit" disabled={loading} className="group relative flex h-13 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[linear-gradient(90deg,#16c7ff_0%,#0798ed_48%,#066ee8_100%)] px-5 text-sm font-black text-white shadow-[0_16px_35px_rgba(0,166,255,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(0,166,255,0.42)] disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating password...</> : <><ShieldCheck className="h-4 w-4" /> Update password</>}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

function PasswordField({ label, value, onChange, show, onToggle, autoFocus = false }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-700">{label}</label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input type={show ? "text" : "password"} autoComplete="new-password" autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Enter a secure password" className="h-13 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-12 text-sm font-semibold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" required />
        <button type="button" onClick={onToggle} aria-label={show ? "Hide password" : "Show password"} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-cyan-600">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
      </div>
    </div>
  );
}
