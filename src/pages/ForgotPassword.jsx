import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail, Send } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await base44.auth.resetPasswordRequest(normalizedEmail);
    } catch {
      // Keep the response private and consistent whether the account exists or not.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      icon={sent ? CheckCircle2 : Mail}
      title={sent ? "Check your inbox" : "Reset your password"}
      subtitle={sent ? "We sent secure recovery instructions if an account matches that email." : "Enter the email tied to your ClientSurge account."}
      footer={
        <Link to="/login" className="inline-flex items-center gap-2 font-bold text-cyan-600 transition hover:text-cyan-700">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-600 shadow-[0_14px_35px_rgba(6,182,212,0.16)]">
            <Send className="h-7 w-7" />
          </div>
          <p className="mt-5 text-sm font-semibold leading-6 text-slate-700">
            Recovery instructions were sent to <span className="font-black text-slate-950">{email.trim().toLowerCase()}</span> if it is connected to an account.
          </p>
          <p className="mt-2 text-xs font-medium leading-5 text-slate-500">Check spam or promotions if the message does not appear within a few minutes.</p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-cyan-600 transition hover:text-cyan-700"
          >
            Try another email <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="email" className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-700">Email address</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@business.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className={`h-13 w-full rounded-2xl border bg-white pl-11 pr-4 text-sm font-semibold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 ${error ? "border-red-300 bg-red-50/40" : "border-slate-200"}`}
                required
                aria-invalid={Boolean(error)}
              />
            </div>
            {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex h-13 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[linear-gradient(90deg,#16c7ff_0%,#0798ed_48%,#066ee8_100%)] px-5 text-sm font-black text-white shadow-[0_16px_35px_rgba(0,166,255,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(0,166,255,0.42)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-white/20 transition-transform duration-700 group-hover:translate-x-[500%]" />
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending secure link...</> : <>Send reset link <ArrowRight className="h-4 w-4" /></>}
          </button>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold leading-5 text-slate-500">For your security, we do not reveal whether an email is registered.</p>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
