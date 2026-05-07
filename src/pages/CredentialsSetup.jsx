import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CredentialsWizard from "@/components/onboarding/CredentialsWizard";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function CredentialsSetup() {
  const navigate = useNavigate();
  const [orderId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("order_id") || null;
  });

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!orderId) {
      // #406 — no order_id in URL → redirect to /pricing
      navigate("/pricing");
      return;
    }
    validateOrder();
  }, [orderId]);

  const validateOrder = async () => {
    try {
      const orders = await base44.entities.Order.filter({ id: orderId });
      const found = orders?.[0];
      if (!found) {
        setError("Order not found. Please check your confirmation email for the correct link.");
        return;
      }
      if (found.payment_status !== "paid") {
        // #406 — redirect to pricing if order not paid
        navigate("/pricing");
        return;
      }
      setOrder(found);
    } catch (err) {
      setError("Unable to verify your order. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying your order…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Unable to Load Setup</h1>
          <p className="text-muted-foreground">{error}</p>
          <a
            href="mailto:support@clientsurgesystems.com"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Setup Info Received!</h1>
          <p className="text-muted-foreground leading-relaxed">
            Thank you — our team will review your details and have your system configured within <strong>24–48 hours</strong>. You'll receive a confirmation email when your automations are live.
          </p>
          <p className="text-sm text-muted-foreground">
            Questions? Email{" "}
            <a href="mailto:support@clientsurgesystems.com" className="text-primary underline">
              support@clientsurgesystems.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <CredentialsWizard order={order} onComplete={handleComplete} />
    </div>
  );
}