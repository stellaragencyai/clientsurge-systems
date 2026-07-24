import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";


const HeroDashboardScreen = lazy(() => import("./HeroDashboardScreen"));

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

function HeroDashboardStaticPreview({ onActivate }) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <button
      type="button"
      className={`hero-dashboard-static-preview${reduceMotion ? "" : " hero-dashboard-static-preview--float"}`}
      data-cinematic-animation="dashboard-float-scan"
      aria-label="Preview ClientSurge automation dashboard"
      onClick={onActivate}
      onFocus={onActivate}
      onPointerEnter={onActivate}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "640px",
        padding: "14px",
        border: "none",
        borderRadius: "30px",
        background: "linear-gradient(160deg, #3a3a3e 0%, #1e1e21 48%, #171719 100%)",
        boxShadow: "0 34px 90px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.08)",
        cursor: "pointer",
        textAlign: "left"
      }}
    >
      <div
        style={{
          overflow: "hidden",
          borderRadius: "20px",
          background: "linear-gradient(150deg, #0d1f3c 0%, #0a2a5e 24%, #071535 58%, #061028 100%)",
          minHeight: "440px",
          color: "#ffffff",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          position: "relative"
        }}
      >
        <span
          aria-hidden="true"
          className={`hero-dashboard-static-preview__scan${reduceMotion ? "" : " hero-dashboard-static-preview__scan--animated"}`}
        />
        <div
          style={{
            height: "32px",
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 18px",
            fontSize: "12px",
            fontWeight: 700
          }}
        >
          <span>9:41 AM</span>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.76)" }}>71%</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 190px",
            gap: "16px",
            padding: "34px 18px 18px",
            minHeight: "420px"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", justifyContent: "center" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                alignSelf: "flex-start",
                borderRadius: "999px",
                padding: "5px 12px",
                background: "rgba(0,174,239,0.16)",
                border: "1px solid rgba(0,174,239,0.36)",
                color: "#66d9ff",
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.1em"
              }}
            >
              SPEED TO LEAD
            </span>
            <h2
              style={{
                margin: 0,
                maxWidth: "320px",
                fontSize: "clamp(1.3rem, 2.9vw, 2rem)",
                lineHeight: 1.1,
                fontWeight: 800,
                letterSpacing: "-0.02em"
              }}
            >
              AI follow-up visible from capture to booking.
            </h2>
            <p
              style={{
                margin: 0,
                maxWidth: "300px",
                fontSize: "12px",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.66)"
              }}
            >
              Illustrative flow showing the automation path from new lead to booked appointment.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxWidth: "330px" }}>
              {["Lead captured", "SMS sent", "Booking link shared"].map((label) => (
                <span
                  key={label}
                  style={{
                    borderRadius: "999px",
                    padding: "5px 9px",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.78)",
                    fontSize: "10px",
                    fontWeight: 700
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              alignSelf: "center",
              borderRadius: "18px",
              padding: "14px",
              background: "rgba(255,255,255,0.13)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 12px 32px rgba(0,0,0,0.24)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <p style={{ margin: 0, fontSize: "10px", fontWeight: 800 }}>Lead Conversion</p>
                <p style={{ margin: "2px 0 0", fontSize: "9px", color: "rgba(255,255,255,0.52)" }}>Live workflow</p>
              </div>
              <span style={{ color: "#4ade80", fontSize: "9px", fontWeight: 800 }}>LIVE</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
              {[["Leads", "24"], ["Booked", "18"]].map(([label, value]) => (
                <div key={label} style={{ borderRadius: "10px", padding: "8px", background: "rgba(255,255,255,0.09)" }}>
                  <p style={{ margin: "0 0 3px", fontSize: "8px", color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>{label}</p>
                  <p style={{ margin: 0, fontSize: "22px", lineHeight: 1, fontWeight: 900 }}>{value}</p>
                </div>
              ))}
            </div>
            {["New lead", "AI reply", "Appointment booked"].map((label, index) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: index === 0 ? 0 : "8px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "999px", background: index < 2 ? "#00AEEF" : "#4ade80" }} />
                <span style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.82)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            margin: "0 auto 12px",
            width: "46px",
            height: "5px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.28)"
          }}
        />
      </div>
    </button>
  );
}

function DeferredHeroDashboard() {
  const [isInteractive, setIsInteractive] = useState(false);

  if (!isInteractive) {
    return <HeroDashboardStaticPreview onActivate={() => setIsInteractive(true)} />;
  }

  return (
    <Suspense fallback={<HeroDashboardStaticPreview onActivate={() => {}} />}>
      <HeroDashboardScreen />
    </Suspense>
  );
}


export default function Hero() {
  const reduceMotion = usePrefersReducedMotion();
  const [heroReady, setHeroReady] = useState(reduceMotion);
  const demoBooking = useDemoBooking();

  useEffect(() => {
    if (reduceMotion) {
      setHeroReady(true);
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => setHeroReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, [reduceMotion]);

  return (
    <section
      className="landing-hero"
      style={{
        position: "relative",
        overflow: "visible",
        background: "#ffffff",
        paddingBottom: "clamp(2.25rem, 4vw, 3.5rem)"
      }}>

      <div
        aria-hidden="true"
        className="landing-hero__ambient"
        data-cinematic-animation="ambient-sweep"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none"
        }}>
        <div
          className="landing-hero__ambientSweep"
          style={{
            position: "absolute",
            top: "-18%",
            left: "-18%",
            width: "62%",
            height: "86%",
            borderRadius: "999px",
            background:
              "radial-gradient(circle at center, rgba(0,174,239,0.18) 0%, rgba(0,157,255,0.08) 34%, transparent 70%)",
            filter: "blur(28px)",
            animation: reduceMotion ? "none" : "heroAmbientSweep 8.8s ease-in-out infinite"
          }}
        />
        
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
            "radial-gradient(circle at 18% 20%, rgba(0,174,239,0.08) 0%, transparent 30%), radial-gradient(circle at 72% 22%, rgba(0,157,255,0.08) 0%, transparent 24%), radial-gradient(circle at 78% 56%, rgba(0,59,143,0.06) 0%, transparent 32%)"
          }} />
        
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
            "linear-gradient(to right, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.94) 40%, rgba(255,255,255,0.68) 60%, rgba(255,255,255,0.2) 100%)"
          }} />
        
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
            "linear-gradient(to bottom, rgba(255,255,255,0.18) 0%, transparent 28%, rgba(255,255,255,0.34) 100%)"
          }} />
        <div className="landing-hero__cinematicGrid" />
        
      </div>

      <div
        className="landing-hero__inner"
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "clamp(5.25rem, 8vw, 7rem) clamp(1.5rem, 5vw, 4rem) clamp(2.75rem, 5vw, 4.25rem)",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "clamp(22px, 4vw, 36px)",
          alignItems: "start",
          justifyItems: "center",
          minHeight: "auto"
        }}>
        
        <div
          className="landing-hero__copy"
          data-cinematic-animation="headline-sheen"
          style={{
            gridColumn: "1",
            marginBottom: "0px",
            textAlign: "center",
            maxWidth: "980px",
            position: "relative",
            zIndex: 10,
            opacity: heroReady ? 1 : 0,
            transform: heroReady ? "translateY(0)" : "translateY(28px)",
            transition: reduceMotion
              ? "none"
              : "opacity 740ms cubic-bezier(0.22, 1, 0.36, 1), transform 740ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "8px 16px",
              marginBottom: "20px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.82)",
              border: "1px solid rgba(0,107,176,0.12)",
              boxShadow: "0 10px 28px rgba(10,22,40,0.07)",
              color: "#0a2240",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase"
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "999px",
                background: "linear-gradient(135deg, #003B8F 0%, #00AEEF 100%)",
                boxShadow: "0 0 0 6px rgba(0,174,239,0.12)"
              }}
            />
            Most Trusted AI Lead System
          </div>

          <h1
            className="landing-hero__headline"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "clamp(3rem, 7vw, 5.8rem)",
              fontWeight: "800",
              lineHeight: 0.95,
              letterSpacing: "-0.045em",
              color: "#0a2240",
              marginBottom: "18px",
              maxWidth: "900px",
              marginLeft: "auto",
              marginRight: "auto",
              opacity: heroReady ? 1 : 0,
              transform: heroReady ? "translateY(0)" : "translateY(22px)",
              transition: reduceMotion
                ? "none"
                : "opacity 580ms cubic-bezier(0.22, 1, 0.36, 1) 80ms, transform 580ms cubic-bezier(0.22, 1, 0.36, 1) 80ms",
            }}>
            
            AI Lead Systems That Turn{" "}
            <span
              className="landing-hero__headlineAccent"
              style={{
                color: "#006BB0",
                display: "inline"
              }}>
              
              More Calls Into Revenue
            </span>
          </h1>

          {/* Visual enhancement: shimmer divider under headline */}
          <div
            aria-hidden="true"
            className="landing-hero__headlineBeam"
            style={{
              opacity: heroReady ? 1 : 0,
              transform: heroReady ? "translateY(0)" : "translateY(22px)",
              transition: reduceMotion
                ? "none"
                : "opacity 580ms cubic-bezier(0.22, 1, 0.36, 1) 160ms, transform 580ms cubic-bezier(0.22, 1, 0.36, 1) 160ms",
            }}
          />


          <p
            className="landing-hero__body"
            style={{
              fontSize: "clamp(1rem, 2vw, 1.14rem)",
              color: "rgba(10,22,40,0.76)",
              lineHeight: 1.62,
              maxWidth: "720px",
              margin: "0 auto 22px",
              opacity: heroReady ? 1 : 0,
              transform: heroReady ? "translateY(0)" : "translateY(22px)",
              transition: reduceMotion
                ? "none"
                : "opacity 580ms cubic-bezier(0.22, 1, 0.36, 1) 240ms, transform 580ms cubic-bezier(0.22, 1, 0.36, 1) 240ms",
            }}>
            
            ClientSurge installs the website, CRM handoff, and six AI automations that answer faster, recover missed calls, follow up automatically, book appointments, request reviews, and reactivate old opportunities.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "10px",
              marginBottom: "22px",
              opacity: heroReady ? 1 : 0,
              transform: heroReady ? "translateY(0)" : "translateY(22px)",
              transition: reduceMotion
                ? "none"
                : "opacity 580ms cubic-bezier(0.22, 1, 0.36, 1) 280ms, transform 580ms cubic-bezier(0.22, 1, 0.36, 1) 280ms",
            }}
          >
            {["Website + CRM handoff", "Six AI workflows", "Built for local service teams"].map((item) => (
              <span
                key={item}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "9px 14px",
                  borderRadius: "999px",
                  border: "1px solid rgba(0,107,176,0.12)",
                  background: "rgba(255,255,255,0.76)",
                  boxShadow: "0 8px 20px rgba(10,22,40,0.05)",
                  color: "#0a2240",
                  fontSize: "0.84rem",
                  fontWeight: 600
                }}
              >
                {item}
              </span>
            ))}
          </div>

          <div
            className="landing-hero__ctaRow"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              justifyContent: "center",
              opacity: heroReady ? 1 : 0,
              transform: heroReady ? "translateY(0)" : "translateY(22px)",
              transition: reduceMotion
                ? "none"
                : "opacity 580ms cubic-bezier(0.22, 1, 0.36, 1) 320ms, transform 580ms cubic-bezier(0.22, 1, 0.36, 1) 320ms",
            }}
          >
            <button
              type="button"
              onClick={() => demoBooking?.openDemoBooking()}
              className="landing-hero__ctaPrimary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                minHeight: "48px",
                padding: "0 20px",
                borderRadius: "999px",
                border: "1px solid rgba(0,107,176,0.18)",
                background: "linear-gradient(135deg, #003B8F 0%, #0088CC 56%, #00AEEF 100%)",
                boxShadow: "0 14px 36px rgba(0,107,176,0.24)",
                color: "#ffffff",
                fontSize: "0.95rem",
                fontWeight: 700,
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Book Free Audit
              <ArrowRight size={16} aria-hidden="true" />
            </button>

            <Link
              to="/automations"
              className="landing-hero__ctaSecondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "48px",
                padding: "0 20px",
                borderRadius: "999px",
                border: "1px solid rgba(0,107,176,0.16)",
                background: "rgba(255,255,255,0.84)",
                boxShadow: "0 10px 24px rgba(10,22,40,0.08)",
                color: "#0a2240",
                fontSize: "0.95rem",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              See Automations
            </Link>
          </div>
        </div>

        <div
          className="landing-hero__visualWrap"
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "1100px",
            minHeight: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gridColumn: "1",
            opacity: heroReady ? 1 : 0,
            transform: heroReady ? "translateY(0)" : "translateY(32px)",
            transition: reduceMotion
              ? "none"
              : "opacity 840ms cubic-bezier(0.22, 1, 0.36, 1) 360ms, transform 840ms cubic-bezier(0.22, 1, 0.36, 1) 360ms",
          }}>
          
          <div
            aria-hidden="true"
            className="landing-hero__visualGlow"
            style={{
              position: "absolute",
              width: "90%",
              height: "62%",
              borderRadius: "36px",
              background:
              "radial-gradient(circle at center, rgba(0,174,239,0.18) 0%, rgba(0,157,255,0.08) 38%, transparent 72%)",
              filter: "blur(36px)",
              transform: "translateY(-2%)",
              animation: reduceMotion ? "none" : "heroVisualGlowPulse 5.6s ease-in-out infinite"
            }} />
          



          {/* Dashboard visual */}
          <DeferredHeroDashboard />
















































          
        </div>
      </div>

      <style>{`
        @keyframes heroDashboardFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.015); }
        }
        @keyframes heroDashboardScan {
          0% { transform: translateX(-140%); opacity: 0; }
          25% { opacity: 1; }
          75% { opacity: 1; }
          100% { transform: translateX(150%); opacity: 0; }
        }
        @keyframes heroAmbientSweep {
          0%, 100% { transform: translateX(-22%); opacity: 0.54; }
          50% { transform: translateX(16%); opacity: 0.92; }
        }
        @keyframes heroVisualGlowPulse {
          0%, 100% { transform: translateY(-2%) scale(0.96); opacity: 0.78; }
          50% { transform: translateY(-2%) scale(1.06); opacity: 1; }
        }
        .hero-dashboard-static-preview--float {
          animation: heroDashboardFloat 6.5s ease-in-out infinite;
          transition: transform 220ms ease;
        }
        .hero-dashboard-static-preview--float:hover,
        .hero-dashboard-static-preview--float:focus-visible {
          transform: translateY(-10px) scale(1.015);
        }
        .hero-dashboard-static-preview__scan--animated {
          animation: heroDashboardScan 3.8s ease-in-out infinite;
        }
        /* Tablet and below — single column, centered */
        @media (max-width: 1024px) {
          .landing-hero__inner {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            min-height: auto !important;
            padding-top: clamp(4.5rem, 8vw, 5.75rem) !important;
            padding-bottom: 2rem !important;
          }
          .landing-hero__visualWrap {
            display: flex !important;
            grid-column: 1 !important;
            min-height: 360px !important;
          }
          .landing-hero__copy {
            max-width: 100% !important;
            text-align: center !important;
            grid-column: 1 !important;
          }
        }

        /* Hide tablet mock on small screens */
        @media (max-width: 720px) {
          .landing-hero {
            padding-bottom: 1.5rem !important;
          }
          .landing-hero__inner {
            gap: 18px !important;
            padding-top: calc(var(--cs-nav-height) + 1rem) !important;
            padding-bottom: 1rem !important;
          }
          .landing-hero__visualWrap {
            display: none !important;
          }
          .landing-hero__copy {
            text-align: left !important;
          }
          .landing-hero__headline {
            font-size: clamp(2rem, 7.5vw, 2.75rem) !important;
            line-height: 1.02 !important;
            letter-spacing: 0 !important;
            max-width: 11ch !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            overflow-wrap: normal !important;
            text-wrap: balance !important;
          }
          .landing-hero__headlineBeam {
            margin-bottom: 14px !important;
          }
          .landing-hero__body {
            font-size: 0.98rem !important;
            line-height: 1.55 !important;
            max-width: 34rem !important;
            margin-bottom: 14px !important;
          }
          .landing-hero__ctaRow {
            width: 100% !important;
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .landing-hero__ctaPrimary,
          .landing-hero__ctaSecondary {
            width: 100% !important;
          }
        }

        /* iPhone SE (375px) and smaller */
        @media (max-width: 390px) {
          .landing-hero__inner {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
            padding-top: calc(var(--cs-nav-height) + 0.8rem) !important;
          }
          .landing-hero__headline {
            font-size: clamp(1.8rem, 8vw, 2.25rem) !important;
            max-width: 10.5ch !important;
          }
          .landing-hero__body {
            font-size: 0.95rem !important;
          }
        }

        /* iPhone SE specific (320px) */
        @media (max-width: 360px) {
          .landing-hero__headline {
            font-size: 1.65rem !important;
            letter-spacing: 0 !important;
          }
        }
        .landing-hero__cinematicGrid {
          position: absolute;
          inset: 0;
          opacity: 0.24;
          background-image:
            linear-gradient(rgba(0,136,204,0.13) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,136,204,0.11) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: linear-gradient(to bottom, transparent 0%, black 22%, black 64%, transparent 100%);
          animation: heroCinematicGridDrift 14s linear infinite;
        }
        .landing-hero__headlineAccent {
          position: relative;
          background-image: linear-gradient(105deg, #006BB0 0%, #006BB0 35%, #00AEEF 50%, #003B8F 68%, #006BB0 100%);
          background-size: 260% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent !important;
          animation: heroHeadlineSheen 4.8s ease-in-out infinite;
        }
        .landing-hero__headlineBeam {
          width: min(420px, 72vw);
          height: 2px;
          margin: -2px 0 18px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(0,174,239,0.05), rgba(0,174,239,0.62), rgba(0,59,143,0.18), rgba(0,174,239,0.05));
          box-shadow: 0 0 22px rgba(0,174,239,0.26);
          transform-origin: left;
          animation: heroHeadlineBeam 3.4s ease-in-out infinite;
        }
        .hero-dashboard-static-preview__scan {
          position: absolute;
          inset: 14px;
          z-index: 2;
          border-radius: 20px;
          pointer-events: none;
          background: linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.16) 44%, rgba(0,174,239,0.42) 50%, rgba(255,255,255,0.12) 56%, transparent 100%);
          mix-blend-mode: screen;
          transform: skewX(-16deg);
        }
        @keyframes heroCinematicGridDrift {
          to { background-position: 42px 42px, 42px 42px; }
        }
        @keyframes heroHeadlineSheen {
          0%, 20% { background-position: 0% 50%; }
          64%, 100% { background-position: 100% 50%; }
        }
        @keyframes heroHeadlineBeam {
          0%, 100% { opacity: 0.5; transform: scaleX(0.72); }
          50% { opacity: 1; transform: scaleX(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .landing-hero__cinematicGrid,
          .landing-hero__headlineAccent,
          .landing-hero__headlineBeam {
            animation: none !important;
          }
          .hero-dashboard-static-preview__scan {
            display: none !important;
          }
        }
      `}</style>
    </section>);

}
