import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CredentialsWizard from "@/components/onboarding/CredentialsWizard";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";

const SUPPORT_EMAIL = "support@clientsurgesystems.com";

function payload(raw) {
  return raw?.data || raw || {};
}

function supportHref(requestId) {
  const subject = requestId ? `Credentials setup help ${requestId}` : "Credentials setup help";
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

function ActivationShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#061126] text-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-24 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-[32rem] w-[32rem] rounded-full bg-blue-700/10 blur-3xl" />
      </div>
      <header className="relative z-10 border-b border-white/10 bg-[#061126]/90 px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">ClientSurge activation</p>
            <p className="mt-1 text-sm font-semibold text-white">Secure installation workspace</p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-100 sm:flex">
            <ShieldCheck className="h-4 w-4" /> Verified setup session
          </div>
        </div>
      </header>
      <main className="relative z-10">{children}</main>
    </div>
  );
}

export default function CredentialsSetup() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const setupToken = params.get("token") || params.get("setup_token") || "";
  const requestedSection = params.get("section") || "";
  const [orderId, setOrderId] = useState(() => params.get("order_id") || null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const sessionId = params.get("session_id");
    if (orderId) validateOrder(orderId);
    else if (sessionId) resolveOrderFromSession(sessionId);
    else {
      setError("This credentials setup link is missing an order ID or Stripe session ID.");
      setLoading(false);
    }
  }, []);

  const resolveOrderFromSession = async (sessionId) => {
    try {
      const result = payload(await base44.functions.invoke("getOrderStatus", { session_id: sessionId, token: setupToken }));
      setRequestId(result.request_id || "");
      if (result?.eligible && result?.order?.id) {
        setOrderId(result.order.id);
        validateOrder(result.order.id);
      } else {
        setError("We could not match this checkout session to an eligible order yet. Please use the link from your confirmation email or contact support.");
        setLoading(false);
      }
    } catch (err) {
      setRequestId(err?.data?.request_id || err?.request_id || "");
      setError(err?.data?.error || err?.message || "Unable to verify your order. Please try again or contact support.");
      setLoading(false);
    }
  };

  const validateOrder = async (id) => {
    try {
      const result = payload(await base44.functions.invoke("getOrderStatus", { order_id: id, token: setupToken }));
      setRequestId(result.request_id || "");
      if (!result?.order) {
        setError("Order not found. Please check your confirmation email for the correct setup link.");
        return;
      }
      if (!result.eligible) {
        setError("This order is not eligible for credentials setup yet. If payment already completed, contact support so we can verify it.");
        return;
      }
      setOrder({ ...result.order, setup_token: setupToken, requested_section: requestedSection });
    } catch (err) {
      setRequestId(err?.data?.request_id || err?.request_id || "");
      setError(err?.data?.error || err?.message || "Unable to verify your order. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (result) => {
    const id = order?.id || orderId;
    const target = result?.redirect_to || (id ? `/setup/status/${id}` : null);
    if (target) navigate(target);
    else setSubmitted(true);
  };

  if (loading) {
    return (
      <ActivationShell>
        <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-xl items-center px-6 py-16">
          <div className="w-full rounded-[28px] border border-white/10 bg-white p-8 text-center shadow-[0_32px_90px_rgba(0,0,0,0.38)] sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-950">Verifying your activation</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">We are confirming your order and opening the correct secure installation workspace.</p>
            <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-cyan-400 to-blue-600" />
            </div>
          </div>
        </div>
      </ActivationShell>
    );
  }

  if (error) {
    return (
      <ActivationShell>
        <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-xl items-center px-6 py-16">
          <div className="w-full rounded-[28px] border border-white/10 bg-white p-8 shadow-[0_32px_90px_rgba(0,0,0,0.38)] sm:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600"><AlertCircle className="h-7 w-7" /></div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-red-600">Activation blocked</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Unable to open setup</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">{error}</p>
            {requestId && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">Support reference: {requestId}</p>}
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <a href={supportHref(requestId)} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(14,165,233,0.32)]">Contact Support</a>
              <Link to="/client-portal/progress" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-800 hover:bg-slate-50">Open Portal</Link>
            </div>
          </div>
        </div>
      </ActivationShell>
    );
  }

  if (submitted) {
    return (
      <ActivationShell>
        <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-xl items-center px-6 py-16">
          <div className="w-full rounded-[28px] border border-white/10 bg-white p-8 text-center shadow-[0_32px_90px_rgba(0,0,0,0.38)] sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-8 w-8" /></div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Configuration received</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Your installation is moving forward</h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600">Our team will review your configuration and update the portal as each system is verified.</p>
            <Link to="/client-portal/progress" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-6 text-sm font-black text-white shadow-[0_12px_30px_rgba(14,165,233,0.32)]">View setup progress <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </ActivationShell>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-5 py-3 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-cyan-600" /> Information is used only for installation and verification.</div>
          <Link to="/client-portal/progress" className="hidden font-black text-cyan-700 hover:text-cyan-600 sm:inline">Exit to portal</Link>
        </div>
      </div>
      <CredentialsWizard order={order} onComplete={handleComplete} />
    </div>
  );
}
