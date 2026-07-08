import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CredentialsWizard from "@/components/onboarding/CredentialsWizardHardened";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const SUPPORT_EMAIL = "support@clientsurgesystems.com";

function payload(raw) {
  return raw?.data || raw || {};
}

function supportHref(requestId) {
  const subject = requestId ? `Credentials setup help ${requestId}` : "Credentials setup help";
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

export default function CredentialsSetup() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const setupToken = params.get("token") || params.get("setup_token") || "";
  const [orderId, setOrderId] = useState(() => params.get("order_id") || null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const sessionId = params.get("session_id");
    if (orderId) {
      validateOrder(orderId);
    } else if (sessionId) {
      resolveOrderFromSession(sessionId);
    } else {
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
      setOrder({ ...result.order, setup_token: setupToken });
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-2xl mx-auto px-6 py-12 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#00AEEF] animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-600">Verifying your order before collecting credentials...</p>
          <p className="mt-2 text-xs text-slate-400">No credentials form is shown until the order source is verified.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-5 rounded-3xl border border-border bg-white p-8 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto"><AlertCircle className="w-7 h-7 text-red-600" /></div>
          <h1 className="text-2xl font-semibold text-foreground">Unable to Load Setup</h1>
          <p className="text-muted-foreground">{error}</p>
          {requestId && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Reference: {requestId}</p>}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href={supportHref(requestId)} className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors">Contact Support</a>
            <Link to="/client-portal/progress" className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors">Open Portal</Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto"><CheckCircle2 className="w-8 h-8 text-green-600" /></div>
          <h1 className="text-2xl font-semibold text-foreground">Setup Info Received</h1>
          <p className="text-muted-foreground leading-relaxed">Thank you. Our team will review your details and update your client portal as each setup step is verified.</p>
          <Link to="/client-portal/progress" className="cs-btn-primary text-sm">View Setup Progress</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-3xl px-6 pt-8">
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Credentials are only used for setup and verification. Your portal will show status based on posted ClientSurge records, not assumptions.
        </div>
      </div>
      <CredentialsWizard order={order} setupToken={setupToken} onComplete={handleComplete} />
    </div>
  );
}
