import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { trackCTA } from "@/lib/analytics";
import DemoBookingModal from "@/components/forms/DemoBookingModal";

const BADGES = [
  "No contracts",
  "Live in 48 hrs",
  "Done-for-you",
  "30-day guarantee",
];

export default function FinalCTA() {
  const [showBookingModal, setShowBookingModal] = useState(false);

  return (
    <>
      <section
        id="book-demo"
        aria-labelledby="final-cta-heading"
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#040d1a",
          padding: "clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 4rem)",
        }}
      >
        {/* Deep radial blue glow — centre */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse 70% 60% at 50% 60%, rgba(0,110,200,0.38) 0%, rgba(0,60,140,0.18) 38%, transparent 72%)",
          }}
        />

        {/* Subtle star-dot texture */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            opacity: 0.55,
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "780px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          {/* Eyebrow */}
          <p
            style={{
              margin: "0 0 18px",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#4fc3f7",
            }}
          >
            Ready to Start?
          </p>

          {/* Headline */}
          <h2
            id="final-cta-heading"
            style={{
              margin: "0 0 8px",
              fontFamily: "Montserrat, system-ui, sans-serif",
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              color: "#ffffff",
            }}
          >
            You&apos;re Already Getting Leads.
          </h2>
          <h2
            style={{
              margin: "0 0 24px",
              fontFamily: "Montserrat, system-ui, sans-serif",
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              background: "linear-gradient(90deg, #29b6f6 0%, #0288d1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Let&apos;s Convert Every One.
          </h2>

          {/* Body */}
          <p
            style={{
              margin: "0 auto 20px",
              maxWidth: "520px",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.62)",
            }}
          >
            Book a free 15-minute strategy call. We&apos;ll map exactly where your
            business is leaking bookings and show you what the system looks like
            for your specific situation.
          </p>

          {/* Bold social proof line */}
          <p
            style={{
              margin: "0 0 6px",
              fontSize: "0.875rem",
              fontWeight: 700,
              color: "rgba(255,255,255,0.88)",
            }}
          >
            Most clients are live in 48 hours. No contracts. No fluff.
          </p>
          <p
            style={{
              margin: "0 0 22px",
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.36)",
            }}
          >
            Free 15-minute call &middot; no commitment required &middot; live in 24–48 hours
          </p>

          {/* Badge pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "28px",
            }}
          >
            {BADGES.map((label) => (
              <span
                key={label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 14px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.78)",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#29b6f6",
                    flexShrink: 0,
                  }}
                />
                {label}
              </span>
            ))}
          </div>

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            {/* Primary CTA */}
            <button
              type="button"
              onClick={() => {
                trackCTA("book_your_free_demo", "final_cta");
                setShowBookingModal(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                height: "52px",
                padding: "0 32px",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg, #0288d1 0%, #01579b 100%)",
                color: "#ffffff",
                fontSize: "0.9375rem",
                fontWeight: 700,
                boxShadow: "0 0 32px rgba(2,136,209,0.55), 0 4px 14px rgba(0,0,0,0.3)",
                transition: "box-shadow 0.2s ease, transform 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 48px rgba(2,136,209,0.75), 0 6px 20px rgba(0,0,0,0.35)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 0 32px rgba(2,136,209,0.55), 0 4px 14px rgba(0,0,0,0.3)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Get Your Free Audit
              <ArrowRight style={{ width: "18px", height: "18px" }} />
            </button>

            {/* Secondary CTA */}
            <a
              href="/contact"
              onClick={() => trackCTA("lead_leakage_contact", "final_cta")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: "52px",
                padding: "0 28px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.22)",
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.82)",
                fontSize: "0.9375rem",
                fontWeight: 600,
                textDecoration: "none",
                transition: "background 0.2s ease, border-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.38)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
              }}
            >
              Free Lead Audit
            </a>
          </div>
        </div>
      </section>

      {showBookingModal && (
        <DemoBookingModal onClose={() => setShowBookingModal(false)} />
      )}
    </>
  );
}