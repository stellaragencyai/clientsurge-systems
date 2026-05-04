import { lazy, Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";
import CascadingChecklistItem from "@/components/visual-effects/CascadingChecklistItem";
import { BUTTON_TEXT } from "@/lib/constants";


const HeroDashboardScreen = lazy(() => import("./HeroDashboardScreen"));

const checklist = [
"Every lead hears from you within 60 seconds — even after hours",
"Missed calls instantly turn into text conversations, not dead ends",
"14 days of automated follow-up keeps leads warm without manual work",
"Guided booking flow converts ready prospects into confirmed appointments",
"Fully built and live in 24–48 hours — we handle everything"];


export default function Hero() {
  const demoBooking = useDemoBooking();

  return (
    <section
      className="landing-hero"
      style={{
        position: "relative",
        overflow: "visible",
        background: "#ffffff",
        paddingBottom: "clamp(3rem, 6vw, 5rem)"
      }}>

      <div
        aria-hidden="true"
        className="landing-hero__ambient"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none"
        }}>
        
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
        
      </div>

      <div
        className="landing-hero__inner"
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "clamp(8rem, 16vw, 11rem) clamp(1rem, 5vw, 3rem) clamp(3rem, 6vw, 5.5rem)",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "clamp(24px, 4vw, 48px)",
          alignItems: "center",
          minHeight: "100svh"
        }}>
        
        <div className="landing-hero__copy" style={{ gridColumn: "1 / -1", marginBottom: "0px", textAlign: "center", maxWidth: "100%", position: "relative", zIndex: 10 }}>


          <h1
            className="landing-hero__headline"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "clamp(2rem, 5.2vw, 3.8rem)",
              fontWeight: "700",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "#1b140d",
              marginBottom: "16px",
              gridColumn: "1 / -1"
            }}>
            
            Stop Losing Leads to Slow Response —{" "}
            <span
              style={{
                color: "#00AEEF",
                display: "inline"
              }}>
              
              AI Systems That Convert 3x More Leads Into Bookings
            </span>
          </h1>

          {/* Visual enhancement: shimmer divider under headline */}
          <div style={{
            height: "2px",
            borderRadius: "999px",
            marginBottom: "22px",
            background: "linear-gradient(90deg, transparent 0%, rgba(0,174,239,0.4) 30%, rgba(0,200,255,0.8) 50%, rgba(0,174,239,0.4) 70%, transparent 100%)",
            animation: "shimmer-fadein 0.9s ease 0.3s both"
          }} />
          <style>{`@keyframes shimmer-fadein{from{opacity:0;transform:scaleX(0.4)}to{opacity:1;transform:scaleX(1)}}`}</style>

          <p
            className="landing-hero__body"
            style={{
              fontSize: "clamp(0.95rem, 2.2vw, 1.05rem)",
              color: "rgba(27,20,13,0.74)",
              lineHeight: 1.65,
              marginBottom: "18px",
              maxWidth: "600px",
              margin: "0 auto 18px"
            }}>
            
            ClientSurge installs AI-powered conversion systems that capture leads, respond instantly, follow up automatically, and turn more of your existing demand into booked clients.
          </p>

          <div
            className="landing-hero__checklist hero-checklist"
            style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginBottom: "32px", maxWidth: "640px", margin: "0 auto 32px" }}>
            
            {checklist.map((item, i) => (
              <CascadingChecklistItem key={item} item={item} index={i} />
            ))}
          </div>

          <div
            className="landing-hero__actions"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              justifyContent: "center",
              WebkitTapHighlightColor: "transparent",
              marginTop: "32px"
            }}>
            
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
                "linear-gradient(135deg, #0088CC 0%, #006BB0 46%, #00AEEF 100%)",
                color: "#ffffff",
                fontSize: "1rem",
                fontWeight: "700",
                boxShadow: "0 4px 18px rgba(0,174,239,0.4)",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,174,239,0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,174,239,0.4)";
              }}>
              
              {BUTTON_TEXT.BOOK_DEMO}
              <ArrowRight style={{ width: "18px", height: "18px" }} />
            </button>
          </div>

          <p
            style={{
              marginTop: "18px",
              fontSize: "12px",
              color: "rgba(27,20,13,0.48)",
              letterSpacing: "0.04em"
            }}>
            No contracts · Most clients go live in 24–48 hours
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
            gridColumn: "1 / -1"
          }}>
          
          <div
            aria-hidden="true"
            className="landing-hero__visualGlow"
            style={{
              position: "absolute",
              width: "90%",
              height: "72%",
              borderRadius: "36px",
              background:
              "radial-gradient(circle at center, rgba(0,174,239,0.18) 0%, rgba(0,157,255,0.08) 38%, transparent 72%)",
              filter: "blur(36px)",
              transform: "translateY(6%)"
            }} />
          



          {/* iPad shell — Space Gray aluminum body */}
          <div
            className="landing-hero__tablet"
            style={{
              position: "relative",
              width: "min(100%, 930px)",
              aspectRatio: "1.15 / 1",
              borderRadius: "36px",
              /* Space gray aluminum gradient */
              background: "linear-gradient(160deg, #4a4a4c 0%, #3a3a3c 30%, #2c2c2e 60%, #1c1c1e 100%)",
              boxShadow:
                "0 44px 110px rgba(0,0,0,0.55), 0 18px 44px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.4)",
              transform: "perspective(2400px) rotateY(-10deg) rotateX(4deg) rotateZ(1.4deg)",
            }}>

            {/* Top edge highlight (aluminum sheen) */}
            <div style={{
              position: "absolute", top: 0, left: "8%", right: "8%", height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), rgba(255,255,255,0.5), rgba(255,255,255,0.35), transparent)",
              borderRadius: "999px", zIndex: 10,
            }} />

            {/* Left side — volume buttons */}
            <div style={{ position: "absolute", left: "-4px", top: "28%", width: "4px", height: "40px", borderRadius: "3px 0 0 3px", background: "linear-gradient(to left, #3a3a3c, #5a5a5c)", boxShadow: "-2px 0 5px rgba(0,0,0,0.5), inset 1px 0 1px rgba(255,255,255,0.12)", zIndex: 20 }} />
            <div style={{ position: "absolute", left: "-4px", top: "40%", width: "4px", height: "40px", borderRadius: "3px 0 0 3px", background: "linear-gradient(to left, #3a3a3c, #5a5a5c)", boxShadow: "-2px 0 5px rgba(0,0,0,0.5), inset 1px 0 1px rgba(255,255,255,0.12)", zIndex: 20 }} />
            {/* Right side — power/top button */}
            <div style={{ position: "absolute", right: "-4px", top: "20%", width: "4px", height: "52px", borderRadius: "0 3px 3px 0", background: "linear-gradient(to right, #3a3a3c, #5a5a5c)", boxShadow: "2px 0 5px rgba(0,0,0,0.5), inset -1px 0 1px rgba(255,255,255,0.12)", zIndex: 20 }} />

            {/* Screen area — inset with proper bezel */}
            <div style={{
              position: "absolute",
              inset: "10px",
              borderRadius: "28px",
              background: "#000",
              overflow: "hidden",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 2px 8px rgba(0,0,0,0.8)",
            }}>
              {/* Front camera dot centered at top bezel */}
              <div style={{
                position: "absolute", top: "7px", left: "50%", transform: "translateX(-50%)",
                width: "8px", height: "8px", borderRadius: "50%", zIndex: 10,
                background: "radial-gradient(circle at 35% 35%, #1a2040, #05070f)",
                border: "1px solid rgba(80,100,180,0.4)",
                boxShadow: "0 0 4px rgba(60,80,160,0.5)",
              }} />

              {/* The actual dashboard content */}
              <div style={{ position: "absolute", inset: "22px 0 0 0", borderRadius: "0 0 26px 26px", overflow: "hidden" }}>
                <Suspense fallback={<div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse" />}>
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
    </section>);

}