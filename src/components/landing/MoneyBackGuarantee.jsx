/**
 * Money-Back Guarantee Banner
 * Risk reversal to reduce purchase hesitation
 */

import { Shield, CheckCircle2 } from "lucide-react";

export default function MoneyBackGuarantee() {
  return (
    <div className="relative my-12 rounded-2xl overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, rgba(154,92,46,0.12) 0%, rgba(200,150,92,0.08) 100%)",
        }}
      />

      <div className="relative z-10 px-6 md:px-10 py-8 flex items-start gap-6">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-primary/15">
            <Shield className="h-7 w-7 text-primary" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-lg mb-2">
            30-Day Money-Back Guarantee
          </h3>
          <p className="text-muted-foreground mb-4">
            If you don't see measurable results in your first 30 days — more leads captured, faster response times, or scheduled bookings — we refund your full setup fee. You only pay monthly if it's working.
          </p>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground font-medium">No risk trial period</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground font-medium">Full setup refund if unsatisfied</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground font-medium">Cancel anytime, no contracts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 rounded-2xl border border-primary/20 pointer-events-none" />
    </div>
  );
}