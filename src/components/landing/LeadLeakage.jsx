import { useState } from "react";
import { Star, ArrowRight } from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";

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
      className="py-24 md:py-32 px-6"
      style={{
        background: "linear-gradient(180deg, #fdfbf8 0%, #f8f3eb 60%, #fdfbf8 100%)",
      }}
    >
      <div className="max-w-5xl mx-auto space-y-20">

        {/* --- High-review angle --- */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">
              Strong Reviews. Untapped Revenue.
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
              Already Have Great Reviews?{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #7a3f1a 0%, #c8965c 52%, #9a5c2e 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                You're Sitting on Untapped Revenue.
              </span>
            </h2>
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

          {/* Stars visual */}
          <div
            className="rounded-3xl p-8 flex flex-col gap-5"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(252,240,220,0.6) 100%)",
              border: "1.5px solid rgba(200,150,92,0.22)",
              boxShadow: "0 8px 32px rgba(154,92,46,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
          >
            <div className="flex items-center gap-1.5">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className="w-6 h-6 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-2 text-sm font-bold text-foreground">4.9 stars on Google</span>
            </div>
            {[
              { label: "Caller finds you on Google", lost: false },
              { label: "Calls during your busy hour", lost: true },
              { label: "No text-back is sent", lost: true },
              { label: "Lead goes to your competitor", lost: true },
            ].map(({ label, lost }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{
                  background: lost ? "rgba(220,38,38,0.05)" : "rgba(34,197,94,0.07)",
                  border: lost ? "1px solid rgba(220,38,38,0.12)" : "1px solid rgba(34,197,94,0.15)",
                }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: lost ? "#dc2626" : "#16a34a" }}
                />
                <span className={`text-sm font-medium ${lost ? "text-red-700" : "text-green-700"}`}>
                  {label}
                </span>
                {lost && (
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                    Lost
                  </span>
                )}
              </div>
            ))}
            <p className="text-xs text-muted-foreground text-center pt-1">
              This scenario plays out dozens of times a month for most service businesses.
            </p>
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
                className="w-full flex items-center gap-4 rounded-xl px-5 py-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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