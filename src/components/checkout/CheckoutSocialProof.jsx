/**
 * Finding #92: Social proof bar for checkout page — trust badges + customer count.
 * Finding #103: Money-back guarantee badge at checkout decision point.
 */
import { Star, ShieldCheck, Users } from "lucide-react";

export default function CheckoutSocialProof() {
  return (
    <div className="mt-6 space-y-4">
      {/* Trust bar */}
      <div className="flex flex-wrap items-center justify-center gap-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="flex">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <span className="text-xs font-semibold text-foreground ml-1">4.9/5</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="w-4 h-4 text-primary" />
          <span className="font-medium">Trusted by 500+ businesses</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          <span className="font-medium">30-Day Money-Back Guarantee</span>
        </div>
      </div>

      {/* Short testimonial */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">JM</span>
          </div>
          <div>
            <p className="text-sm text-foreground leading-relaxed">
              "We went from missing 40% of calls to responding to every lead in under 60 seconds. The ROI was immediate."
            </p>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              — James M., Roofing Contractor
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}