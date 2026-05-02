import { useState, lazy, Suspense } from "react";
import { ArrowRight, Zap, PhoneMissed, Calendar } from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";
import CascadingChecklistItem from "@/components/visual-effects/CascadingChecklistItem";
import { BUTTON_TEXT, BUTTON_STYLES } from "@/lib/constants";

const HeroDashboardScreen = lazy(() => import("./HeroDashboardScreen"));
const HeroSMSDemo = lazy(() => import("./HeroSMSDemo"));

const checklist = [
  "Every lead hears from you within 60 seconds — even after hours",
  "Missed calls instantly turn into text conversations, not dead ends",
  "14 days of automated follow-up keeps leads warm without manual work",
  "Guided booking flow converts ready prospects into confirmed appointments",
  "Fully built and live in 5–7 business days — we handle everything",
];

const statsRow = [
  { icon: Zap, value: "60s", label: "First response" },
  { icon: PhoneMissed, value: "3x", label: "More bookings" },
  { icon: Calendar, value: "5–7d", label: "Go live" },
];

export default function Hero() {
  const demoBooking = useDemoBooking();

  return (
    <section
      className="landing-hero"
      style={{
        position: "relative",
        overflow: "visible",
        background: "#ffffff",
        paddingBottom: "clamp(3rem, 6vw, 5rem)",
      }}
    >
      {/* Ambient background */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 18% 20%, rgba(200,150,92,0.1) 0%, transparent 30%), radial-gradient(circle at 72% 22%, rgba(92,164,138,0.1) 0%, transparent 24%), radial-gradient(circle at 78% 56%, rgba(122,72,37,0.08) 0%, transparent 32%)" }} />
      </div>

      <div
        className="landing-hero__inner"
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "clamp(5rem, 12vw, 7rem) clamp(1rem, 5vw, 3rem) clamp(3rem, 6vw, 5.5rem)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(32px, 5vw, 72px)",
          alignItems: "center",
          minHeight: "100svh",
        }}
      >
        {/* LEFT: Copy */}
        <div className="landing-hero__copy" style={{ position: "relative", zIndex: 10 }}>

          {/* Eyebrow */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "20px", background: "rgba(154,92,46,0.07)", border: "1px solid rgba(154,92,46,0.18)", borderRadius: "999px", padding: "5px 14px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#9a5c2e", letterSpacing: "0.06em", textTransform: "uppercase" }}>AI Lead Automation — Live in 5–7 Days</span>
          </div>

          <h1
            className="landing-hero__headline"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 3.6vw, 3.4rem)",
              fontWeight: "700",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "#1b140d",
              marginBottom: "20px",
            }}
          >
            Stop Losing Leads to Slow Response —{" "}
            <span style={{ color: "#c8965c" }}>
              AI Systems That Convert 3x More Leads
            </span>
          </h1>

          {/* Shimmer divider */}
          <div style={{ height: "2px", borderRadius: "999px", marginBottom: "20px", background: "linear-gradient(90deg, rgba(200,150,92,0.7) 0%, rgba(245,217,168,0.9) 50%, rgba(200,150,92,0.4) 100%)", width: "60%", animation: "shimmer-fadein 0.9s ease 0.3s both" }} />
          <style>{`@keyframes shimmer-fadein{from{opacity:0;transform:scaleX(0.4)}to{opacity:1;transform:scaleX(1)}}`}</style>

          <p
            className="landing-hero__body"
            style={{
              fontSize: "clamp(0.9rem, 1.8vw, 1rem)",
              color: "rgba(27,20,13,0.68)",
              lineHeight: 1.7,
              marginBottom: "24px",
              maxWidth: "520px",
            }}
          >
            ClientSurge installs done-for-you AI conversion systems — instant response, automated follow-up, and guided booking flows — so every lead you already earn actually becomes a client.
          </p>

          {/* Stats row */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
            {statsRow.map(({ icon: Icon, value, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.75)", border: "1px solid rgba(154,92,46,0.15)", borderRadius: "12px", padding: "8px 14px", backdropFilter: "blur(8px)" }}>
                <Icon style={{ width: "14px", height: "14px", color: "#c8965c", flexShrink: 0 }} />
                <span style={{ fontSize: "15px", fontWeight: "800", color: "#1b140d", letterSpacing: "-0.02em" }}>{value}</span>
                <span style={{ fontSize: "11px", color: "rgba(27,20,13,0.5)", fontWeight: "500" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Checklist */}
          <div
            className="landing-hero__checklist hero-checklist"
            style={{ display: "grid", gridTemplateColumns: "1fr", gap: "7px", marginBottom: "28px" }}
          >
            {checklist.map((item, i) => (
              <CascadingChecklistItem key={item} item={item} index={i} />
            ))}
          </div>

          {/* CTA */}
          <div
            className="landing-hero__actions"
            style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}
          >
            <button
              type="button"
              onClick={demoBooking?.openDemoBooking}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                minHeight: "54px",
                padding: "0 30px",
                borderRadius: "9999px",
                border: "none",
                background: "linear-gradient(135deg, #7a4825 0%, #9a5c2e 46%, #c8965c 100%)",
                color: "#fff8ee",
                fontSize: "0.95rem",
                fontWeight: "700",
                boxShadow: BUTTON_STYLES.BROWN_GRADIENT.boxShadow,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = BUTTON_STYLES.BROWN_GRADIENT_HOVER.boxShadow; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = BUTTON_STYLES.BROWN_GRADIENT.boxShadow; }}
            >
              {BUTTON_TEXT.BOOK_DEMO}
              <ArrowRight style={{ width: "17px", height: "17px" }} />
            </button>
          </div>

          <p style={{ marginTop: "14px", fontSize: "11px", color: "rgba(27,20,13,0.42)", letterSpacing: "0.04em" }}>
            No contracts · Most clients go live in 5–7 business days
          </p>
        </div>

        {/* RIGHT: iPad + Phone visual */}
        <div
          className="landing-hero__visualWrap"
          style={{
            position: "relative",
            minHeight: "620px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Ambient glow */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              width: "90%",
              height: "72%",
              borderRadius: "36px",
              background: "radial-gradient(circle at center, rgba(200,150,92,0.2) 0%, rgba(154,92,46,0.08) 38%, transparent 72%)",
              filter: "blur(40px)",
              transform: "translateY(6%)",
            }}
          />

          {/* SMS Demo — phone */}
          <div style={{ position: "relative", zIndex: 3, display: "flex", justifyContent: "center" }}>
            <Suspense fallback={<div style={{ width: 300, height: 480 }} />}>
              <HeroSMSDemo />
            </Suspense>
          </div>

          {/* iPad shell — completely black border */}
          <div
            className="landing-hero__tablet"
            style={{
              position: "relative",
              width: "min(100%, 930px)",
              aspectRatio: "1.15 / 1",
              borderRadius: "36px",
              background: "#000000",
              boxShadow: "0 44px 110px rgba(0,0,0,0.65), 0 18px 44px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.6)",
              transform: "perspective(2400px) rotateY(-10deg) rotateX(4deg) rotateZ(1.4deg)",
            }}
          >
            {/* Subtle top edge */}
            <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), rgba(255,255,255,0.12), rgba(255,255,255,0.08), transparent)", borderRadius: "999px", zIndex: 10 }} />

            {/* Volume buttons — black */}
            <div style={{ position: "absolute", left: "-4px", top: "28%", width: "4px", height: "40px", borderRadius: "3px 0 0 3px", background: "#1a1a1a", boxShadow: "-1px 0 3px rgba(0,0,0,0.7)", zIndex: 20 }} />
            <div style={{ position: "absolute", left: "-4px", top: "40%", width: "4px", height: "40px", borderRadius: "3px 0 0 3px", background: "#1a1a1a", boxShadow: "-1px 0 3px rgba(0,0,0,0.7)", zIndex: 20 }} />
            {/* Power button — black */}
            <div style={{ position: "absolute", right: "-4px", top: "20%", width: "4px", height: "52px", borderRadius: "0 3px 3px 0", background: "#1a1a1a", boxShadow: "1px 0 3px rgba(0,0,0,0.7)", zIndex: 20 }} />

            {/* Screen inset */}
            <div style={{
              position: "absolute",
              inset: "10px",
              borderRadius: "28px",
              background: "#000",
              overflow: "hidden",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04), inset 0 2px 8px rgba(0,0,0,0.9)",
            }}>
              {/* Camera pill */}
              <div style={{ position: "absolute", top: "7px", left: "50%", transform: "translateX(-50%)", width: "60px", height: "16px", borderRadius: "999px", background: "#000", zIndex: 10, boxShadow: "0 0 0 1px rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#0d0d1a", border: "1px solid rgba(60,80,160,0.4)", boxShadow: "0 0 3px rgba(60,80,160,0.5)" }} />
                <div style={{ width: "14px", height: "3px", borderRadius: "2px", background: "#111" }} />
              </div>

              {/* Dashboard content */}
              <div style={{ position: "absolute", inset: "26px 0 0 0", borderRadius: "0 0 26px 26px", overflow: "hidden" }}>
                <Suspense fallback={<div className="w-full h-full bg-gradient-to-br from-gray-900 to-black animate-pulse" />}>
                  <HeroDashboardScreen />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Desktop two-column layout */
        @media (min-width: 1101px) {
          .landing-hero__inner {
            grid-template-columns: 1fr 1fr !important;
          }
          .landing-hero__copy {
            text-align: left !important;
          }
          .landing-hero__actions {
            justify-content: flex-start !important;
          }
        }

        /* Tablet and below — single column */
        @media (max-width: 1100px) {
          .landing-hero__inner {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
            min-height: auto !important;
            padding-top: clamp(4.5rem, 12vw, 6rem) !important;
          }
          .landing-hero__copy {
            text-align: center !important;
          }
          .landing-hero__actions {
            justify-content: center !important;
          }
          .landing-hero__visualWrap {
            display: none !important;
          }
        }

        @media (max-width: 720px) {
          .landing-hero__headline {
            font-size: clamp(2rem, 8.5vw, 3.4rem) !important;
            line-height: 1.05 !important;
          }
          .landing-hero__body {
            font-size: 1rem !important;
          }
          .landing-hero__checklist {
            gap: 8px !important;
          }
          .landing-hero__actions {
            flex-direction: column !important;
            align-items: stretch !important;
          }
        }

        @media (max-width: 390px) {
          .landing-hero__inner {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
          .landing-hero__headline {
            font-size: clamp(1.85rem, 9vw, 2.4rem) !important;
          }
        }
      `}</style>
    </section>
  );
}