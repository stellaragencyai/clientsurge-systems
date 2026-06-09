/**
 * GuaranteeCard — post-purchase 30-day guarantee reassurance.
 * Shown in billing dashboard and order success to reduce early churn anxiety.
 */
import { ShieldCheck } from "lucide-react";

export default function GuaranteeCard({ compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5">
        <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
        <p className="text-xs text-green-800">
          <strong>30-Day Money-Back Guarantee</strong> — if your system isn't live within 30 days, you get a full refund.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 overflow-hidden">
      <div className="px-5 py-4 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0 text-2xl">
          🛡️
        </div>
        <div>
          <p className="text-sm font-bold text-green-900">Your Installation Is Protected</p>
          <p className="text-xs text-green-800 mt-1 leading-relaxed">
            If your system isn't fully configured and live within <strong>30 days of purchase</strong>, we'll issue a
            complete refund — no questions asked. Your investment is completely risk-free.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Full refund if not live in 30 days", "No cancellation fees", "Month-to-month — cancel anytime"].map(
              (item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-800 bg-green-100 rounded-full px-2.5 py-0.5"
                >
                  ✓ {item}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}