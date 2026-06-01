/**
 * Setup-fee guarantee banner
 * Risk reversal to reduce purchase hesitation
 */

import { Shield, CheckCircle2 } from "lucide-react";

export default function MoneyBackGuarantee() {
  return (
    <div className="relative my-12 rounded-2xl overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: "#ffffff"
        }} />
      

      <div className="relative z-10 px-6 md:px-10 py-8 flex items-start gap-6">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-primary/15">
            <Shield className="h-7 w-7 text-primary" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-lg mb-2">
            30-Day Setup-Fee Guarantee
          </h3>
          <p className="text-muted-foreground mb-4">
            If the installed system is not producing measurable lead-capture, response, or booking improvements in your first 30 days, we review the account and refund the setup cost when the guarantee terms are met. Monthly service cancellation follows the terms shown before checkout.
          </p>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground font-medium">30-day review window</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground font-medium">Setup-fee refund when terms are met</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground font-medium">Month-to-month service terms</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 rounded-2xl border border-primary/20 pointer-events-none" />
    </div>);

}
