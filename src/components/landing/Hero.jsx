import { useState, lazy, Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";
import { BUTTON_TEXT, BUTTON_STYLES } from "@/lib/constants";
import PulsingLeadOrb from "./visuals/PulsingLeadOrb";

const HeroDashboardScreen = lazy(() => import("./HeroDashboardScreen"));

const checklist = [
  "Every lead hears from you within 60 seconds — even after hours",
  "Missed calls instantly turn into text conversations, not dead ends",
  "14 days of automated follow-up keeps leads warm without manual work",
  "Guided booking flow converts ready prospects into confirmed appointments",
  "Fully built and live in 5–7 days — we handle everything",
];

export default function Hero() {
  const demoBooking = useDemoBooking();

  return (
    <section
      className="landing-hero"
      style={{
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, #fdfbf8 0%, #f8f3eb 46%, #fcfaf6 100%)",
      }}
    >
      <div
        aria-hidden="true"
        className="landing-hero__ambient"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 18% 20%, rgba(200,150,92,0.12) 0%, transparent 30%), radial-gradient(circle at 72% 22%, rgba(92,164,138,0.12) 0%, transparent 24%), radial-gradient(circle at 78% 56%, rgba(122,72,37,0.1) 0%, transparent 32%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, rgba(253,251,248,0.98) 0%, rgba(253,251,248,0.94) 40%, rgba(253,251,248,0.68) 60%, rgba(253,251,248,0.2) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.18) 0%, transparent 28%, rgba(255,255,255,0.34) 100%)",
          }}
        />
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
          gridTemplateColumns: "minmax(0, 560px) minmax(420px, 1fr)",
          gap: "clamp(24px, 4vw, 48px)",
          alignItems: "center",
          minHeight: "100svh",
        }}
      >
        <div className="landing-hero__copy" style={{ maxWidth: "560px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              borderRadius: "9999px",
              background: "rgba(255,255,255,0.74)",
              border: "1px solid rgba(154,92,46,0.14)",
              boxShadow: "0 10px 26px rgba(44,31,16,0.06)",
              marginBottom: "22px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "9999px",
                background: "#34c759",
                boxShadow: "0 0 0 6px rgba(52,199,89,0.12)",
              }}
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#7a4825",
              }}
            >
              AI Lead Response Systems
            </span>
          </div>

          <h1
            className="landing-hero__headline"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.3rem, 6.5vw, 5.2rem)",
              fontWeight: "700",
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              color: "#1b140d",
              marginBottom: "22px",
            }}
          >
            Stop Losing Leads to Slow Response —{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, #7a3f1a 0%, #c8965c 52%, #9a5c2e 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AI Systems That Book 3x More
            </span>
            {" "}Appointments
          </h1>

          {/* Visual enhancement: shimmer divider under headline */}
          <div style={{
            height: "2px",
            borderRadius: "999px",
            marginBottom: "22px",
            background: "linear-gradient(90deg, transparent 0%, rgba(200,150,92,0.5) 30%, rgba(245,217,168,0.9) 50%, rgba(200,150,92,0.5) 70%, transparent 100%)",
          }} />

          <p
            className="landing-hero__body"
            style={{
              fontSize: "1.14rem",
              color: "rgba(27,20,13,0.74)",
              lineHeight: 1.72,
              marginBottom: "28px",
              maxWidth: "34rem",
            }}
          >
            ClientSurge installs AI-powered conversion systems that capture leads, respond instantly, follow up automatically, and turn more of your existing demand into booked clients.
          </p>

          <div
            className="landing-hero__checklist"
            style={{ display: "grid", gap: "9px", marginBottom: "34px" }}
          >
            {checklist.map((item, i) => (
              <div
                key={item}
                className="hero-check-item"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "10px",
                  padding: "7px 14px 7px 10px",
                  borderRadius: "9999px",
                  background: "rgba(255,255,255,0.72)",
                  border: "1px solid rgba(200,150,92,0.22)",
                  boxShadow: "0 2px 8px rgba(122,72,37,0.06)",
                  width: "fit-content",
                  opacity: 0,
                  transform: "translateX(-18px)",
                  animation: `heroCheckIn 0.55s cubic-bezier(0.22,1,0.36,1) ${0.35 + i * 0.13}s forwards`,
                }}
              >
                <div
                  className="hero-check-circle"
                  style={{
                    width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg,#26b05f,#16a34a)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 12px rgba(34,199,89,0.4), 0 2px 6px rgba(34,197,94,0.25)",
                    animation: `heroCheckPop 0.4s cubic-bezier(0.34,1.56,0.64,1) ${0.55 + i * 0.13}s both`,
                  }}
                >
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "rgba(27,20,13,0.8)" }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
          <style>{`
            @keyframes heroCheckIn {
              to { opacity: 1; transform: translateX(0); }
            }
            @keyframes heroCheckPop {
              0% { transform: scale(0.4); }
              70% { transform: scale(1.15); }
              100% { transform: scale(1); }
            }
          `}</style>

          <div
            className="landing-hero__actions"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <button
              type="button"
              onClick={demoBooking?.openDemoBooking}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                minHeight: "58px",
                padding: "0 32px",
                borderRadius: "9999px",
                border: "none",
                background:
                  "linear-gradient(135deg, #7a4825 0%, #9a5c2e 46%, #c8965c 100%)",
                color: "#fff8ee",
                fontSize: "1rem",
                fontWeight: "700",
                boxShadow: BUTTON_STYLES.BROWN_GRADIENT.boxShadow,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = BUTTON_STYLES.BROWN_GRADIENT_HOVER.boxShadow;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = BUTTON_STYLES.BROWN_GRADIENT.boxShadow;
              }}
            >
              {BUTTON_TEXT.BOOK_DEMO}
              <ArrowRight style={{ width: "18px", height: "18px" }} />
            </button>
          </div>

          <p
            style={{
              marginTop: "18px",
              fontSize: "12px",
              color: "rgba(27,20,13,0.48)",
              letterSpacing: "0.04em",
            }}
          >
            No contracts · Most clients go live in 2–3 business days
          </p>
        </div>

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
          <div
            aria-hidden="true"
            className="landing-hero__visualGlow"
            style={{
              position: "absolute",
              width: "90%",
              height: "72%",
              borderRadius: "36px",
              background:
                "radial-gradient(circle at center, rgba(200,150,92,0.22) 0%, rgba(154,92,46,0.1) 38%, transparent 72%)",
              filter: "blur(36px)",
              transform: "translateY(6%)",
            }}
          />

          {/* Pulsing Lead Orb — floats top-right of the dashboard */}
          <div
            style={{
              position: "absolute",
              top: "6%",
              right: "-2%",
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            <PulsingLeadOrb size={220} />
          </div>

          <div
            className="landing-hero__tablet"
            style={{
              position: "relative",
              width: "min(100%, 860px)",
              aspectRatio: "1.15 / 1",
              borderRadius: "34px",
              padding: "3px",
              background:
                "linear-gradient(135deg, #a0714f 0%, #c8965c 25%, #f5d9a8 50%, #c8965c 75%, #7a4f2e 100%)",
              boxShadow:
                "0 44px 110px rgba(17,12,7,0.34), 0 18px 44px rgba(17,12,7,0.18), 0 0 60px rgba(200,150,92,0.18)",
              transform:
                "perspective(2400px) rotateY(-10deg) rotateX(4deg) rotateZ(1.4deg)",
            }}
          >
            <div style={{
              width: "100%",
              height: "100%",
              borderRadius: "32px",
              padding: "13px",
              background: "linear-gradient(160deg, #23263b 0%, #141722 58%, #0d0f16 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
              overflow: "hidden",
            }}>
            <div
              style={{
                position: "absolute",
                top: "8px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "88px",
                height: "4px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.14)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "9px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "8px",
                height: "8px",
                borderRadius: "999px",
                background: "#22252f",
                border: "1px solid rgba(255,255,255,0.16)",
              }}
            />

            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "20px",
                overflow: "hidden",
                background: "#f7f3ec",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
              }}
            >
              <Suspense fallback={<div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-100 animate-pulse" />}>
                <HeroDashboardScreen />
              </Suspense>
            </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Tablet and below — single column */
        @media (max-width: 1100px) {
          .landing-hero__inner {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
            min-height: auto !important;
            padding-top: clamp(4.5rem, 12vw, 6rem) !important;
          }
          .landing-hero__visualWrap {
            display: none !important;
          }
          .landing-hero__copy {
            max-width: 100% !important;
          }
        }

        /* Mobile — tighten everything */
        @media (max-width: 720px) {
          .landing-hero__headline {
            font-size: clamp(2rem, 8.5vw, 3.4rem) !important;
            line-height: 1.05 !important;
            letter-spacing: -0.025em !important;
          }
          .landing-hero__body {
            font-size: 1rem !important;
            line-height: 1.7 !important;
          }
          .landing-hero__checklist {
            gap: 8px !important;
          }
          .landing-hero__actions {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .landing-hero__actions > * {
            width: 100% !important;
            justify-content: center !important;
          }
          .hero-check-item {
            width: 100% !important;
            max-width: 100% !important;
            padding: 9px 14px 9px 10px !important;
          }
          .hero-check-item span {
            font-size: 13px !important;
          }
        }

        /* iPhone SE (375px) and smaller */
        @media (max-width: 390px) {
          .landing-hero__inner {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
          .landing-hero__headline {
            font-size: clamp(1.85rem, 9vw, 2.4rem) !important;
          }
          .landing-hero__body {
            font-size: 0.95rem !important;
          }
        }

        /* iPhone SE specific (320px) */
        @media (max-width: 360px) {
          .landing-hero__headline {
            font-size: 1.75rem !important;
            letter-spacing: -0.02em !important;
          }
        }
      `}</style>
    </section>
  );
}