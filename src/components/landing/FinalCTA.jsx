import StardustOverlay from "./StardustOverlay";
import { ArrowRight } from "lucide-react";
import { trackCTA } from "@/lib/analytics";

export default function FinalCTA() {
  return (
      <section id="get-audit" className="nebula-cta pt-16 md:pt-20 pb-20 md:pb-28 px-6 relative overflow-hidden">
        <StardustOverlay seed={13} opacity={0.6} />

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center text-center">
          <p className="cs-eyebrow mb-6">
            Ready to Transform Your Lead Flow?
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Claim Your Free <span className="text-primary">System Diagnostic</span>
          </h2>
          <p className="mt-6 text-muted-foreground text-lg max-w-xl leading-relaxed">
            Get a free 15-minute readiness assessment to see exactly where your business is leaking revenue and how AI automation can recover it.
          </p>

          {/* How the demo works - 3 steps */}
          <div className="mt-12 mb-2 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl text-center">
            {[
              { step: "01", title: "Claim your diagnostic window", body: "Secure a 15-minute readiness slot. No sales pressure, no fluff." },
              { step: "02", title: "We map your revenue gaps", body: "We show you exactly where leads are leaking in your current setup." },
              { step: "03", title: "See your system configured", body: "We preview the AI workflow for your industry and the proof steps required before go-live." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col gap-2">
                <span className="font-display text-4xl font-black" style={{ color: "rgba(0,174,239,0.25)", lineHeight: 1 }}>{item.step}</span>
                <p className="font-semibold text-foreground text-sm">{item.title}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground/60">
            Free 15-minute diagnostic · No commitment required · Activation timeline confirmed after assessment
          </p>
        </div>

        <div className="max-w-3xl mx-auto text-center mt-4 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/book"
              onClick={() => {
                trackCTA("get_free_automation_audit", "final_cta");
              }}
              className="focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
              className="cs-btn-primary"
              style={{
               padding: "0 40px",
               height: "56px",
               fontSize: "1rem",
              }}
              >
              Activate My System
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="/pricing"
              onClick={() => trackCTA("view_pricing", "final_cta")}
              className="inline-flex items-center justify-center h-14 px-6 rounded-lg border-2 border-primary/30 bg-background/80 text-sm font-semibold text-primary hover:bg-primary/8 hover:border-primary/50 transition-all duration-200">
              
              View Pricing
            </a>
            <a
              href="/contact"
              onClick={() => trackCTA("contact_support", "final_cta")}
              className="inline-flex items-center justify-center h-14 px-6 rounded-lg border border-border bg-background/70 text-sm font-semibold text-foreground hover:bg-muted transition-all duration-200">
              Contact
            </a>
          </div>
        {/* Trust signals below buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <span className="text-xs text-muted-foreground/70 font-medium">📞 (602) 584-3227</span>
          <span className="hidden sm:block text-muted-foreground/30">|</span>
          <span className="text-xs text-muted-foreground/70 font-medium">🛡 30-day performance review included</span>
          <span className="hidden sm:block text-muted-foreground/30">|</span>
          <span className="text-xs text-muted-foreground/70 font-medium">⚡ Live in 5–7 business days</span>
        </div>
        </div>
      </section>
    );

}