import { useState } from "react";
import { AlertTriangle, CreditCard, Loader2, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * PaymentFailedBanner — shown in the client portal when subscription status
 * is past_due, unpaid, or order payment_status is failed.
 */
export default function PaymentFailedBanner({ subscription, order }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPastDue = ["past_due", "unpaid", "incomplete"].includes(subscription?.status);
  const isOrderFailed = order?.payment_status === "failed";

  if (!isPastDue && !isOrderFailed) return null;

  const handleUpdatePayment = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("getStripePaymentUpdateUrl", {});
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError("Unable to load payment update page. Please contact support.");
      }
    } catch (err) {
      setError(err?.data?.error || err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-6 -mt-2 mb-6">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>

          {/* Text */}
          <div className="flex-1">
            <p className="text-sm font-bold text-red-900">Payment Failed — Action Required</p>
            <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
              Your most recent payment didn't go through. Your automation campaigns have been paused.
              Please update your payment method to restore service.
            </p>
            {error && (
              <p className="text-xs text-red-600 font-semibold mt-1">{error}</p>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={handleUpdatePayment}
            disabled={loading}
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            {loading ? "Loading…" : "Update Payment Method"}
            {!loading && <ExternalLink className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}