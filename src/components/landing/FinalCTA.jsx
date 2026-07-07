import StardustOverlay from "./StardustOverlay";
import { ArrowRight, ShoppingCart, Shield, Zap, Phone, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";

export default function FinalCTA() {
  return (
    <section id="build-stack" className="bg-white pt-16 md:pt-20 pb-20 md:pb-28 px-6 relative overflow-hidden">
      <StardustOverlay seed={13} opacity={0.6} />
      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center text-center">
        <div className="cs-section-header cs-section-header--center" style={{ marginBottom: 0 }}>
          <p className="cs-section-eyebrow">Ready to Install Your AI System?</p>
          <div className="cs-section-title-row justify-center" style={{ gap: "10px" }}>
            <span className="cs-section-bar" aria-hidden="true" />
            <h2 className="cs-section-title">
              Add to Cart. Check Out. We Handle the Rest.
            </h2>
          </div>
          <p className="cs-section-subtitle mx-auto">
            Pick your system, complete guided intake at checkout, and ClientSurge handles setup, provider connections, testing, and launch. No demos or sales calls required.
          </p>
        </div>

        <div className="mt-12 mb-2 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl text-center">
          {[
            { step: "01", title: "Add to cart", body: "Pick Starter, Growth, Pro, or individual automation modules that match your biggest gap." },
            { step: "02", title: "Check out", body: "Complete guided intake at checkout — tell us your lead sources, tools, booking path, and launch goals." },
            { step: "03", title: "We install & test", body: "ClientSurge configures the workflows and checks proof before treating the system as live." },
          ].map((item) => (
            <div key={item.step} className="flex flex-col gap-2">
              <span className="font-display text-4xl font-black" style={{ color: "rgba(0,174,239,0.25)", lineHeight: 1 }}>{item.step}</span>
              <p className="font-semibold text-foreground text-sm">{item.title}</p>
              <p className="text-foreground text-xs leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        {/* Urgency bar — time-sensitivity without fake scarcity */}
        <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "rgba(0,174,239,0.08)", border: "1px solid rgba(0,174,239,0.2)" }}>
          <Clock className="w-3.5 h-3.5 text-[#00AEEF]" />
          <span className="text-xs font-bold text-[#006BB0]">Most systems installed in 3–5 business days</span>
        </div>

        <p className="mt-4 text-sm text-foreground">Month-to-month · Proof checked before launch · Done-for-you setup included</p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/store"
            onClick={() => trackCTA("browse_automation_store", "final_cta")}
            className="cs-btn-primary focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
            style={{ padding: "0 40px", height: "56px", fontSize: "1rem", boxShadow: "var(--cs-glow-md), 0 2px 12px rgba(0,121,193,0.35)" }}
          >
            <ShoppingCart className="w-5 h-5" /> Browse the Store
          </Link>
          <Link
            to="/pricing"
            onClick={() => trackCTA("compare_packages", "final_cta")}
            className="btn-secondary"
          >
            Compare Packages <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {/* Prefer to talk? — phone as a clear alternative conversion path */}
        <div className="mt-6 flex flex-col items-center gap-1">
          <p className="text-xs text-foreground/60">Prefer to talk to a human first?</p>
          <a href="tel:+16025843227" className="text-base font-bold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5" style={{ textDecoration: "none" }}>
            <Phone className="w-4 h-4 text-[#00AEEF]" /> (602) 584-3227
          </a>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <span className="text-sm text-foreground font-semibold inline-flex items-center gap-1.5"><Shield className="w-4 h-4" /> 30-day performance review included</span>
          <span className="hidden sm:block text-foreground/30">|</span>
          <span className="text-sm text-foreground font-semibold inline-flex items-center gap-1.5"><Zap className="w-4 h-4" /> Launch path tested before go-live</span>
        </div>
      </div>
    </section>
  );
}