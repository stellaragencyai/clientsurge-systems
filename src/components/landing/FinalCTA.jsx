import { useState } from "react";
import StardustOverlay from "./StardustOverlay";
import { ArrowRight } from "lucide-react";
import { trackCTA } from "@/lib/analytics";
import DemoBookingModal from "@/components/forms/DemoBookingModal";

export default function FinalCTA() {
  const [showBookingModal, setShowBookingModal] = useState(false);

  return (
    <>
      <section id="book-demo" className="nebula-cta py-24 md:py-32 px-6 relative overflow-hidden">
        <StardustOverlay seed={13} opacity={0.6} />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-6">
            Ready to Start?
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
            You&apos;re Already Getting Leads.
            <br />
            <span className="text-primary">Let&apos;s Make Sure You&apos;re Converting Them.</span>
          </h2>
          <p className="mt-6 text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Book a free 15-minute demo. We will map out exactly where your business is leaking bookings and show you what an AI lead conversion system would look like for your specific situation — no obligation.
          </p>
          <div
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-primary/80"
            style={{
              background: "rgba(154,92,46,0.08)",
              border: "1px solid rgba(154,92,46,0.18)",
            }}
          >
            Free 15-minute call · no commitment required · pilot launch plan reviewed with you first
          </div>
        </div>

        <div className="max-w-3xl mx-auto text-center mt-10 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                trackCTA("book_your_free_demo", "final_cta");
                setShowBookingModal(true);
              }}
              className="inline-block focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
              style={{
                borderRadius: "9999px",
                padding: "2px",
                background:
                  "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                boxShadow: "0 4px 18px rgba(120,70,20,0.35)",
                border: "none",
                cursor: "pointer",
                textDecoration: "none",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.boxShadow =
                  "0 8px 40px rgba(161,120,35,0.6), 0 4px 18px rgba(120,70,20,0.35)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.boxShadow =
                  "0 4px 18px rgba(120,70,20,0.35)";
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  height: "56px",
                  padding: "0 40px",
                  borderRadius: "9999px",
                  background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                  color: "#f5e6d0",
                  fontWeight: "700",
                  fontSize: "1rem",
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                Book Your Free Demo
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>
            <a
              href="#lead-leakage"
              onClick={() => trackCTA("lead_leakage_audit", "final_cta")}
              className="inline-flex items-center justify-center h-14 px-6 rounded-full border-2 border-primary/30 bg-background/80 text-sm font-semibold text-primary hover:bg-primary/8 hover:border-primary/50 transition-all duration-200"
            >
              Get a Free Lead Leakage Audit
            </a>
          </div>
        </div>
      </section>
      {showBookingModal && <DemoBookingModal onClose={() => setShowBookingModal(false)} />}
    </>
  );
}
