import { useState } from "react";
import { Star, ArrowRight } from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";
import RevenueRecoveryCounter from "./visuals/RevenueRecoveryCounter";

const checklist = [
  "You have strong reviews but no clear booking funnel",
  "You miss calls during busy hours",
  "Leads ask questions but never book",
  "Follow-up is manual or inconsistent",
  "You rely only on your Google Business Profile",
  "You have no automated reminders or reactivation campaigns",
  "You have no simple way to track every lead from inquiry to booking",
];

export default function LeadLeakage() {
  const demoBooking = useDemoBooking();
  const [checked, setChecked] = useState({});

  const toggle = (i) => setChecked((prev) => ({ ...prev, [i]: !prev[i] }));
  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <section
      id="lead-leakage"
      className="pt-16 md:pt-28 pb-32 md:pb-40 px-6"
      style={{
        background: "linear-gradient(180deg, #fdfbf8 0%, #f8f3eb 50%, #f3ebe2 85%, #ede5db 100%)",
      }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center pt-10 pb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">Revenue You're Missing</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Already Have Great Reviews?{" "}
            <span style={{ background: "linear-gradient(135deg, #7a3f1a 0%, #c8965c 52%, #9a5c2e 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              You're Sitting on Untapped Revenue.
            </span>
          </h2>
        </div>
      </div>
      <div className="max-w-5xl mx-auto space-y-20">

        {/* --- High-review angle --- */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="mt-5 text-muted-foreground text-base leading-relaxed">
              A business with strong reviews already has trust. The opportunity is not getting more attention — it is capturing and converting the attention you already have.
            </p>
            <p className="mt-4 text-muted-foreground text-base leading-relaxed">
              When someone finds you on Google, checks your reviews, calls you, messages you, or clicks your page — that interest should enter a system automatically. Right now, most of it disappears.
            </p>
            <div
              className="mt-6 rounded-2xl px-5 py-4 text-sm text-foreground/80 leading-relaxed"
              style={{
                background: "rgba(154,92,46,0.06)",
                border: "1px solid rgba(154,92,46,0.14)",
              }}
            >
              <span className="font-semibold text-foreground">On landing pages:</span>{" "}
              If your website is missing, weak, or not converting, we can include a conversion-focused landing page as part of the full system — so every ad click and Google visit has somewhere to land and something to do.
            </div>
          </div>

          {/* Revenue Recovery Counter Visual */}
          <div className="flex justify-center scale-200 origin-center">
            <RevenueRecoveryCounter />
          </div>
        </div>

        {/* --- Checklist --- */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">
              Quick Self-Audit
            </p>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              You May Need a Conversion System If…
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">Check every item that applies to your business.</p>
          </div>

          <div className="space-y-3">
            {checklist.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                className={`w-full flex items-center gap-4 rounded-xl px-5 py-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary clip-path-reveal clip-delay-${i + 1}`}
                style={{
                  background: checked[i]
                    ? "linear-gradient(135deg, rgba(154,92,46,0.09) 0%, rgba(200,150,92,0.06) 100%)"
                    : "rgba(255,255,255,0.82)",
                  border: checked[i]
                    ? "1.5px solid rgba(154,92,46,0.28)"
                    : "1.5px solid rgba(200,205,215,0.5)",
                  boxShadow: checked[i]
                    ? "0 4px 16px rgba(154,92,46,0.08)"
                    : "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
                  style={{
                    background: checked[i]
                      ? "linear-gradient(135deg,#7a4825,#c8965c)"
                      : "rgba(154,92,46,0.1)",
                    border: checked[i] ? "none" : "1.5px solid rgba(154,92,46,0.2)",
                  }}
                >
                  {checked[i] && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.2 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className={`text-sm font-medium ${checked[i] ? "text-foreground" : "text-foreground/75"}`}>
                  {item}
                </span>
              </button>
            ))}
          </div>

          {/* Result feedback */}
          {checkedCount > 0 && (
            <div
              className="mt-6 rounded-2xl px-6 py-5 text-center transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(154,92,46,0.08) 0%, rgba(200,150,92,0.05) 100%)",
                border: "1.5px solid rgba(154,92,46,0.2)",
              }}
            >
              <p className="text-base font-semibold text-foreground">
                {checkedCount === 1
                  ? "You checked 1 item — there's at least one clear gap in your conversion system."
                  : checkedCount <= 3
                  ? `You checked ${checkedCount} items — your business is leaking bookings in multiple places.`
                  : `You checked ${checkedCount} items — a full conversion system would have a significant impact on your revenue.`}
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={demoBooking?.openDemoBooking}
              style={{
                display: "inline-block",
                borderRadius: "9999px",
                padding: "2px",
                background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                boxShadow: "0 4px 18px rgba(120,70,20,0.35)",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  height: "48px",
                  padding: "0 28px",
                  borderRadius: "9999px",
                  background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                  color: "#f5e6d0",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                Get a Free Lead Leakage Audit
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
            <p className="text-xs text-muted-foreground">Free 15-min call · no commitment</p>
          </div>
        </div>

      </div>
    </section>
  );
}