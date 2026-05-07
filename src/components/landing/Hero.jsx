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
        paddingBottom: "clamp(5rem, 8vw, 7rem)"
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
          padding: "clamp(7rem, 12vw, 10rem) clamp(1.5rem, 5vw, 4rem) clamp(3rem, 6vw, 5rem)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(32px, 5vw, 64px)",
          alignItems: "center",
          minHeight: "100svh"
        }}>
        
        <div className="landing-hero__copy" style={{ gridColumn: "1", marginBottom: "0px", textAlign: "left", maxWidth: "100%", position: "relative", zIndex: 10 }}>


          <h1
            className="landing-hero__headline"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "clamp(2rem, 5.2vw, 3.8rem)",
              fontWeight: "700",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "#1b140d",
              marginBottom: "16px"
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


          <p
            className="landing-hero__body"
            style={{
              fontSize: "clamp(0.95rem, 2.2vw, 1.05rem)",
              color: "rgba(27,20,13,0.74)",
              lineHeight: 1.65,
              maxWidth: "560px",
              margin: "0 0 18px"
            }}>
            
            ClientSurge installs AI-powered conversion systems that capture leads, respond instantly, follow up automatically, and turn more of your existing demand into booked clients.
          </p>

          <div
            className="landing-hero__checklist hero-checklist"
            style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", maxWidth: "640px", margin: "0 0 32px" }}>
            
            {checklist.map((item, i) =>
            <CascadingChecklistItem key={item} item={item} index={i} />
            )}
          </div>

          <div
            className="landing-hero__actions"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              justifyContent: "flex-start",
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
            minHeight: "520px",
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
              height: "72%",
              borderRadius: "36px",
              background:
              "radial-gradient(circle at center, rgba(0,174,239,0.18) 0%, rgba(0,157,255,0.08) 38%, transparent 72%)",
              filter: "blur(36px)",
              transform: "translateY(6%)"
            }} />
          



          {/* Dashboard visual */}
          <Suspense fallback={null}>
            <HeroDashboardScreen />
          </Suspense>
















































          
        </div>
      </div>

      <style>{`
        /* Tablet and below — single column, centered */
        @media (max-width: 1024px) {
          .landing-hero__inner {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            min-height: auto !important;
            padding-top: clamp(5rem, 12vw, 7rem) !important;
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
          .landing-hero__checklist {
            margin: 0 auto 32px !important;
          }
          .landing-hero__actions {
            justify-content: center !important;
          }
        }

        /* Hide tablet mock on small screens */
        @media (max-width: 720px) {
          .landing-hero__visualWrap {
            display: none !important;
          }
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