import { lazy, Suspense, useState } from "react";
import { ArrowRight, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useDemoBooking } from "./DemoBookingContext";
import CascadingChecklistItem from "@/components/visual-effects/CascadingChecklistItem";
import { BUTTON_TEXT } from "@/lib/constants";


const HeroDashboardScreen = lazy(() => import("./HeroDashboardScreen"));

const checklist = [
  "Lead capture",
  "Missed-call text-back",
  "AI follow-up",
  "Appointment booking",
  "Review requests",
  "Customer reactivation",
];

const trustItems = [
  { icon: ShieldCheck, label: "No long-term contracts" },
  { icon: Clock, label: "Timeline confirmed after onboarding" },
  { icon: CheckCircle2, label: "Done-for-you launch support" },
];

function HeroDashboardStaticPreview({ onActivate }) {
  return (
    <button
      type="button"
      className="hero-dashboard-static-preview"
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
          padding: "clamp(6rem, 9vw, 8rem) clamp(1.5rem, 5vw, 4rem) clamp(2.5rem, 5vw, 4rem)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(32px, 5vw, 64px)",
          alignItems: "center",
          minHeight: "92svh"
        }}>
        
        <div className="landing-hero__copy" style={{ gridColumn: "1", marginBottom: "0px", textAlign: "left", maxWidth: "100%", position: "relative", zIndex: 10 }}>


          <h1
            className="landing-hero__headline"
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
              style={{
                color: "#006BB0",
                display: "inline"
              }}>
              
              and Recovered Revenue
            </span>
          </h1>

          {/* Visual enhancement: shimmer divider under headline */}


          <p
            className="landing-hero__body"
            style={{
              fontSize: "clamp(0.95rem, 2.2vw, 1.05rem)",
              color: "rgba(10,22,40,0.76)",
              lineHeight: 1.55,
              maxWidth: "540px",
              margin: "0 0 18px"
            }}>
            
            ClientSurge installs the website, CRM handoff, and six AI workflows that capture leads, recover missed calls, follow up, book appointments, request reviews, and reactivate old opportunities.
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
              marginTop: "24px"
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
            <Link
              to="/automations"
              className="inline-flex items-center justify-center"
              style={{
                minHeight: "58px",
                padding: "0 28px",
                borderRadius: "9999px",
                border: "1.5px solid rgba(0,136,204,0.28)",
                background: "rgba(255,255,255,0.86)",
                color: "#0050A0",
                fontSize: "0.95rem",
                fontWeight: "700",
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(0,80,160,0.08)"
              }}
            >
              View AI Automations
            </Link>
          </div>

          <div className="landing-hero__trustRow" aria-label="Trust details">
            {trustItems.map(({ icon: Icon, label }) => (
              <span key={label}>
                <Icon aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div
          className="landing-hero__visualWrap"
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
              "radial-gradient(circle at center, rgba(0,174,239,0.18) 0%, rgba(0,157,255,0.08) 38%, transparent 72%)",
              filter: "blur(36px)",
              transform: "translateY(-2%)"
            }} />
          



          {/* Dashboard visual */}
          <DeferredHeroDashboard />
















































          
        </div>
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
          .landing-hero__checklist {
            gap: 8px !important;
          }
          .landing-hero__actions {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
            margin-top: 20px !important;
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
          .landing-hero__trustRow {
            justify-content: center !important;
            gap: 8px !important;
          }
          .landing-hero__trustRow span {
            width: 100% !important;
            justify-content: center !important;
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
        .landing-hero__trustRow {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 18px;
        }
        .landing-hero__trustRow span {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          gap: 7px;
          border-radius: 999px;
          border: 1px solid rgba(0,136,204,0.16);
          background: rgba(0,174,239,0.06);
          padding: 7px 11px;
          color: rgba(10,22,40,0.74);
          font-size: 11px;
          font-weight: 700;
        }
        .landing-hero__trustRow svg {
          width: 14px;
          height: 14px;
          color: #0088CC;
          flex-shrink: 0;
        }
      `}</style>
    </section>);

}
