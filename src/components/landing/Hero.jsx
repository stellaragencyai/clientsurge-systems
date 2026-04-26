import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";
import HeroDashboardScreen from "./HeroDashboardScreen";

const checklist = [
  "Instant SMS response to every new lead",
  "14-day automated follow-up sequence",
  "Missed call text-back so fewer leads go cold",
  "Live in 5-7 business days, fully built for you",
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
          padding: "112px 48px 88px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 560px) minmax(420px, 1fr)",
          gap: "48px",
          alignItems: "center",
          minHeight: "100vh",
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
              fontSize: "clamp(3.1rem, 5.2vw, 5.2rem)",
              fontWeight: "700",
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              color: "#1b140d",
              marginBottom: "22px",
            }}
          >
            Turn Every Lead Into a{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, #7a3f1a 0%, #c8965c 52%, #9a5c2e 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Booked Appointment
            </span>{" "}
            Automatically
          </h1>

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
            We build AI-powered systems that respond in seconds, nurture leads
            for 14 days, and fill your calendar without you lifting a finger.
          </p>

          <div
            className="landing-hero__checklist"
            style={{
              display: "grid",
              gap: "12px",
              marginBottom: "34px",
            }}
          >
            {checklist.map((item) => (
              <div
                key={item}
                style={{ display: "flex", alignItems: "center", gap: "11px" }}
              >
                <CheckCircle2
                  style={{
                    width: "18px",
                    height: "18px",
                    color: "#26b05f",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: "rgba(27,20,13,0.8)",
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>

          <div
            className="landing-hero__actions"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
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
                boxShadow: "0 16px 36px rgba(122,72,37,0.24)",
                cursor: "pointer",
              }}
            >
              Book Your Free Demo
              <ArrowRight style={{ width: "18px", height: "18px" }} />
            </button>

            <a
              href="#services"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "58px",
                padding: "0 28px",
                borderRadius: "9999px",
                border: "1.5px solid rgba(154,92,46,0.22)",
                background: "rgba(255,255,255,0.72)",
                color: "rgba(27,20,13,0.75)",
                fontSize: "14px",
                fontWeight: "700",
                textDecoration: "none",
                boxShadow: "0 10px 24px rgba(44,31,16,0.04)",
              }}
            >
              See how it works
            </a>
          </div>

          <p
            style={{
              marginTop: "18px",
              fontSize: "12px",
              color: "rgba(27,20,13,0.48)",
              letterSpacing: "0.04em",
            }}
          >
            No contracts · Most clients see ROI within 30 days
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

          <div
            className="landing-hero__tablet"
            style={{
              position: "relative",
              width: "min(100%, 860px)",
              aspectRatio: "1.15 / 1",
              borderRadius: "34px",
              padding: "16px",
              background:
                "linear-gradient(160deg, #23263b 0%, #141722 58%, #0d0f16 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow:
                "0 44px 110px rgba(17,12,7,0.34), 0 18px 44px rgba(17,12,7,0.18), inset 0 1px 0 rgba(255,255,255,0.12)",
              transform:
                "perspective(2400px) rotateY(-10deg) rotateX(4deg) rotateZ(1.4deg)",
              overflow: "hidden",
            }}
          >
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
              <HeroDashboardScreen />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .landing-hero__inner {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
            min-height: auto !important;
            padding: 104px 28px 64px !important;
          }

          .landing-hero__visualWrap {
            display: none !important;
          }

          .landing-hero__copy {
            max-width: 100% !important;
          }
        }

        @media (max-width: 720px) {
          .landing-hero__inner {
            padding: 96px 20px 56px !important;
          }

          .landing-hero__headline {
            font-size: clamp(2.7rem, 12vw, 4rem) !important;
            line-height: 0.99 !important;
          }

          .landing-hero__body {
            font-size: 1rem !important;
            line-height: 1.66 !important;
          }

          .landing-hero__actions {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .landing-hero__actions > * {
            width: 100% !important;
          }
        }
      `}</style>
    </section>
  );
}
