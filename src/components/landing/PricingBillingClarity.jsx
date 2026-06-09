/**
 * PricingBillingClarity — inline trust micro-copy block shown below pricing CTAs.
 * Addresses: ambiguous billing terms, 30-day guarantee reassurance, no hidden fees.
 */
import { ShieldCheck, Calendar, CreditCard, RotateCcw } from "lucide-react";

export default function PricingBillingClarity({ setupFee, monthlyFee, packageName }) {
  return (
    <div
      className="mt-4 rounded-xl border px-4 py-3 text-left space-y-2"
      style={{
        background: "rgba(0,174,239,0.04)",
        borderColor: "rgba(0,174,239,0.15)",
      }}
    >
      <div className="flex items-start gap-2.5">
        <CreditCard className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-foreground/70 leading-snug">
          <strong className="text-foreground">${setupFee?.toLocaleString()} today</strong> — one-time setup &amp; installation fee charged at checkout.
        </p>
      </div>
      <div className="flex items-start gap-2.5">
        <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-foreground/70 leading-snug">
          <strong className="text-foreground">${monthlyFee?.toLocaleString()}/month begins 30 days after your system goes live</strong> — not before.
        </p>
      </div>
      <div className="flex items-start gap-2.5">
        <RotateCcw className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-foreground/70 leading-snug">
          Month-to-month. No annual lock-in. Cancel anytime from your billing portal.
        </p>
      </div>
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-foreground/70 leading-snug">
          Protected by our <strong className="text-foreground">30-day money-back guarantee</strong>. Zero risk.
        </p>
      </div>
    </div>
  );
}