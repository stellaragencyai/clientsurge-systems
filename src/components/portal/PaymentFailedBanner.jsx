import { Loader2 } from "lucide-react";

function hasPaymentFailure(order, subscription) {
  return (
    subscription?.status === "past_due" ||
    order?.billing_status === "past_due" ||
    order?.payment_status === "payment_failed" ||
    order?.payment_status === "failed"
  );
}

export default function PaymentFailedBanner({ order, subscription, onManageBilling, loading = false }) {
  if (!hasPaymentFailure(order, subscription)) {
    return null;
  }

  return (
    <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl p-4 mb-4 flex flex-col gap-3 md:flex-row md:items-center">
      <span className="text-amber-400 text-xl">⚠️</span>
      <div>
        <p className="text-amber-300 font-semibold">Payment Failed</p>
        <p className="text-amber-200/80 text-sm">
          Your last payment could not be processed. Update your payment method to keep your automations active.
        </p>
      </div>
      <button
        onClick={onManageBilling}
        disabled={loading}
        className="md:ml-auto bg-amber-500 text-black font-semibold rounded-lg px-4 py-2 text-sm hover:bg-amber-400 disabled:opacity-70 inline-flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Fix Now →
      </button>
    </div>
  );
}
