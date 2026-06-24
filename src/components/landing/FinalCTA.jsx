import StardustOverlay from "./StardustOverlay";
import { ArrowRight, Phone, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import SectionHeader from "@/components/design-system/SectionHeader";

export default function FinalCTA() {
  return (
      <section id="build-stack" className="nebula-cta pt-16 md:pt-20 pb-20 md:pb-28 px-6 relative overflow-hidden">
        <StardustOverlay seed={13} opacity={0.6} />

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center text-center">
          <SectionHeader
            eyebrow="Ready to Automate Your Lead Flow?"
            title="Build Your AI Automation Stack"
            subtitle="Select the automations your business needs. We handle setup, provider connections, and go-live in 5–7 business days — your stack runs 24/7."
          />

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
                <p className="text-foreground/70 text-xs leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-foreground/60">
            Live in 5–7 business days · No commitment required · Cancel anytime, month-to-month
          </p>
        </div>

        <div className="max-w-3xl mx-auto text-center mt-4 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/pricing"
              onClick={() => {
                trackCTA("compare_packages", "final_cta");
              }}
              className="cs-btn-primary focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
              style={{
                padding: "0 40px",
                height: "56px",
                fontSize: "1rem",
              }}
            >
              See Plans &amp; Pricing
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/store"
              onClick={() => trackCTA("browse_automation_store", "final_cta")}
              className="inline-flex items-center justify-center h-14 px-6 rounded-lg border-2 border-primary/30 bg-background/80 text-sm font-semibold text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-200">
              Browse Automation Store
            </Link>
            <Link
              to="/contact"
              onClick={() => trackCTA("contact_support", "final_cta")}
              className="inline-flex items-center justify-center h-14 px-6 rounded-lg border border-border bg-background/70 text-sm font-semibold text-foreground hover:bg-muted transition-all duration-200">
              Contact
            </Link>
          </div>
        {/* Trust signals below buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <a href="tel:+16025843227" className="text-xs text-foreground/70 font-medium hover:text-primary transition-colors inline-flex items-center gap-1" style={{ textDecoration: "none" }}><Phone className="w-3.5 h-3.5" /> (602) 584-3227</a>
          <span className="hidden sm:block text-foreground/30">|</span>
          <span className="text-xs text-foreground/70 font-medium inline-flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> 30-day performance review included</span>
          <span className="hidden sm:block text-foreground/30">|</span>
          <span className="text-xs text-foreground/70 font-medium inline-flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Live in 5–7 business days</span>
        </div>
        </div>
      </section>
    );

}