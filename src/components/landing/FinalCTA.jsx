import StardustOverlay from "./StardustOverlay";
import { ArrowRight } from "lucide-react";
import { trackCTA } from "@/lib/analytics";

export default function FinalCTA() {
  return (
      <section id="build-stack" className="nebula-cta pt-16 md:pt-20 pb-20 md:pb-28 px-6 relative overflow-hidden">
        <StardustOverlay seed={13} opacity={0.6} />

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center text-center">
          <p className="cs-eyebrow mb-6">
            Ready to Automate Your Lead Flow?
          </p>
          <h2 className="font-titles text-[#001B44] text-4xl md:text-5xl font-bold tracking-tight">
            Build Your <span className="text-primary">AI Automation Stack</span>
          </h2>
          <p className="mt-6 text-muted-foreground text-lg max-w-xl leading-relaxed">
            Select the automations your business needs. We handle setup, provider connections, and go-live in 5–7 business days — your stack runs 24/7.
          </p>

          {/* How the demo works - 3 steps */}
          <div className="mt-12 mb-2 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl text-center">
            {[
              { step: "01", title: "Choose your automations", body: "Pick the AI services your business needs. No sales pressure, no fluff." },
              { step: "02", title: "We configure everything", body: "We set up your automations, connect your providers, and handle the technical work." },
              { step: "03", title: "Your stack goes live", body: "In 5–7 business days, your AI automations are running 24/7 — capturing and converting leads." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col gap-2">
                <span className="font-display text-4xl font-black" style={{ color: "rgba(0,174,239,0.25)", lineHeight: 1 }}>{item.step}</span>
                <p className="font-semibold text-foreground text-sm">{item.title}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground/60">
            Live in 5–7 business days · No commitment required · Cancel anytime, month-to-month
          </p>
        </div>

        <div className="max-w-3xl mx-auto text-center mt-4 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/store"
              onClick={() => {
                trackCTA("browse_ai_services", "final_cta");
              }}
              className="focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
              className="cs-btn-primary"
              style={{
               padding: "0 40px",
               height: "56px",
               fontSize: "1rem",
              }}
              >
              Browse AI Services
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