import { useState } from "react";
import { ArrowRight } from "lucide-react";
import DemoBookingInline from "../../components/forms/DemoBookingInline";

export default function MedSpaFinalCTA() {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="py-24 md:py-32 px-6 bg-muted relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1552693673-1bf958298935?w=1000&q=60&auto=format"
          alt="Med spa ambiance"
          width="1000"
          height="667"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-muted via-primary/5 to-muted" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-6">Ready to Start?</p>
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight mb-6">
          If your med spa is already getting leads, you should be converting more of them.
        </h2>
        <p className="text-base font-semibold text-foreground/70 mb-4">
          Many med spas lose opportunities when response slows down. This system gives every new inquiry a faster, more consistent path forward.
        </p>
        <p className="text-base text-muted-foreground max-w-xl mx-auto mb-10">
          Book a quick demo and we will show you where bookings may be leaking and what a safer follow-up system would change.
        </p>

        <p className="text-sm text-muted-foreground mb-8">
          Starting from $99/mo with setup scoped after the audit. Month-to-month after launch.
        </p>

        {!showForm ? (
          <>
            <button
              onClick={() => setShowForm(true)}
              className="focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
              style={{ display: "inline-block", borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)", boxShadow: "0 6px 24px rgba(120,70,20,0.4)", border: "none", cursor: "pointer" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px", height: "58px", padding: "0 44px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "1.05rem", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                Book Your Free Automation Audit
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
              {["Free 15-min call", "No commitment required", "Launch timing confirmed after onboarding"].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                  {t}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="max-w-2xl mx-auto mt-4 rounded-3xl overflow-hidden text-left" style={{ background: "linear-gradient(135deg,rgba(26,21,16,0.97) 0%,rgba(40,30,18,0.97) 100%)", border: "1px solid rgba(200,150,92,0.15)", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
            <div className="px-8 pt-8 pb-4 border-b border-white/5 text-center">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Free 15-Min Demo</span>
              </div>
              <h3 className="font-display text-xl font-semibold text-white">Tell us about your med spa</h3>
              <p className="text-sm text-white/40 mt-1">We will tailor the demo to your exact situation.</p>
            </div>
            <div className="px-8 py-6">
              <DemoBookingInline prefillIndustry="Med Spa" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
