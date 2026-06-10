import { lazy, Suspense, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { premiumEase } from "@/components/landing/PremiumHomepageMotion";


const HeroDashboardScreen = lazy(() => import("./HeroDashboardScreen"));

const heroCopyReveal = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.74,
      ease: premiumEase,
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
};

const heroRevealItem = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.58, ease: premiumEase },
  },
};

function HeroDashboardStaticPreview({ onActivate }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      className="hero-dashboard-static-preview"
      data-cinematic-animation="dashboard-float-scan"
      aria-label="Preview ClientSurge automation dashboard"
      onClick={onActivate}
      onFocus={onActivate}
      onPointerEnter={onActivate}
      initial={reduceMotion ? false : { opacity: 0, y: 34, rotateX: 4 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: [0, -8, 0], rotateX: 0 }}
      transition={{
        opacity: { duration: 0.74, ease: premiumEase, delay: 0.18 },
        y: { duration: 6.5, repeat: Infinity, ease: "easeInOut" },
        rotateX: { duration: 0.74, ease: premiumEase, delay: 0.18 },
      }}
      whileHover={reduceMotion ? undefined : { y: -10, scale: 1.015 }}
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
        <motion.span
          aria-hidden="true"
          className="hero-dashboard-static-preview__scan"
          animate={reduceMotion ? undefined : { x: ["-140%", "150%"], opacity: [0, 1, 0] }}
          transition={{ duration: 3.8, repeat: Infinity, repeatDelay: 1.8, ease: "easeInOut" }}
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
    </motion.button>
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
  const reduceMotion = useReducedMotion();

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
              "radial-gradient(circle at center, rgba(0,174,239,0.12) 0%, rgba(0,157,255,0.05) 34%, transparent 70%)",
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
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "clamp(6rem, 9vw, 8rem) clamp(1.5rem, 5vw, 4rem) clamp(2.5rem, 5vw, 4rem)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(32px, 5vw, 64px)",
          alignItems: "center",
          minHeight: "76svh"
        }}>
        
        <motion.div
          className="landing-hero__copy"
          data-cinematic-animation="headline-sheen"
          initial={reduceMotion ? false : "hidden"}
          animate={reduceMotion ? undefined : "visible"}
          variants={heroCopyReveal}
          style={{ gridColumn: "1", marginBottom: "0px", textAlign: "left", maxWidth: "100%", position: "relative", zIndex: 10 }}
        >


          <motion.h1
            className="landing-hero__headline"
            variants={heroRevealItem}
            style={{
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: "clamp(2.2rem, 4.5vw, 3.35rem)",
              fontWeight: "700",
              lineHeight: 1.03,
              letterSpacing: "0",
              color: "hsl(var(--foreground))",
              marginBottom: "16px"
            }}>
            
            AI Automation Systems for Faster Local Bookings{" "}
            <span
              className="landing-hero__headlineAccent"
              style={{
                color: "#006BB0",
                display: "inline"
              }}>
              
              and Recovered Revenue
            </span>
          </motion.h1>

          {/* Visual enhancement: shimmer divider under headline */}
          <motion.div
            aria-hidden="true"
            className="landing-hero__headlineBeam"
            variants={heroRevealItem}
          />


          <motion.p
            className="landing-hero__body"
            variants={heroRevealItem}
            style={{
              fontSize: "clamp(0.95rem, 2.2vw, 1.05rem)",
              color: "rgba(10,22,40,0.76)",
              lineHeight: 1.55,
              maxWidth: "540px",
              margin: "0 0 18px"
            }}>
            
            ClientSurge installs the website, CRM handoff, and six AI workflows that capture leads, recover missed calls, follow up, book appointments, request reviews, and reactivate old opportunities.
          </motion.p>
        </motion.div>

        <motion.div
          className="landing-hero__visualWrap"
          initial={reduceMotion ? false : { opacity: 0, x: 32 }}
          animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
          transition={{ duration: 0.84, delay: 0.26, ease: premiumEase }}
          style={{
            position: "relative",
            minHeight: "450px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gridColumn: "2"
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
              "radial-gradient(circle at center, rgba(0,174,239,0.14) 0%, rgba(0,157,255,0.06) 38%, transparent 72%)",
              transform: "translateY(-2%)"
            }} />
          



          {/* Dashboard visual */}
          <DeferredHeroDashboard />
















































          
        </motion.div>
      </div>

      <style>{`
        /* Tablet and below — single column, centered */
        @media (max-width: 1024px) {
          .landing-hero__inner {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            min-height: auto !important;
            padding-top: clamp(5.25rem, 11vw, 6.75rem) !important;
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
          .landing-hero__visualWrap {
            display: none !important;
          }
          .landing-hero__headline {
            font-size: clamp(2rem, 7.5vw, 2.75rem) !important;
            line-height: 1.02 !important;
            letter-spacing: 0 !important;
            max-width: 680px !important;
            margin-left: auto !important;
            margin-right: auto !important;
            overflow-wrap: normal !important;
            text-wrap: balance !important;
          }
          .landing-hero__body {
            font-size: 0.98rem !important;
            line-height: 1.55 !important;
          }
        }

        /* iPhone SE (375px) and smaller */
        @media (max-width: 390px) {
          .landing-hero__inner {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
          .landing-hero__headline {
            font-size: clamp(1.8rem, 8vw, 2.25rem) !important;
            max-width: 22rem !important;
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
          opacity: 0.22;
          background-image:
            linear-gradient(rgba(0,136,204,0.13) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,136,204,0.11) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: linear-gradient(to bottom, transparent 0%, black 22%, black 64%, transparent 100%);
          /* GPU: use translate instead of background-position — compositor-only */
          animation: heroCinematicGridDrift 14s linear infinite;
          will-change: transform;
          transform: translateZ(0);
        }
        /* Hide on mobile — saves ~20ms frame budget */
        @media (max-width: 768px) {
          .landing-hero__cinematicGrid { display: none !important; }
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
          /* Transform-based drift — GPU compositor, no CPU repaint */
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(42px, 42px, 0); }
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