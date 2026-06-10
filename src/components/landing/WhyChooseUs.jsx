import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

const ROWS = [
  {
    feature: "Website Creation",
    diy: "You build it yourself",
    cs: "We build and optimize it",
  },
  {
    feature: "AI Setup",
    diy: "You configure everything",
    cs: "We handle setup and testing",
  },
  {
    feature: "Monitoring",
    diy: "You fix problems",
    cs: "We monitor and improve",
  },
  {
    feature: "Lead Follow-Up",
    diy: "Manual management",
    cs: "Automated and managed",
  },
  {
    feature: "Optimization",
    diy: "You figure it out",
    cs: "Continuous improvement",
  },
];

export default function WhyChooseUs() {
  return (
    <section
      id="why-choose-us"
      style={{
        padding: "clamp(4rem, 8vw, 6rem) clamp(1.5rem, 5vw, 4rem)",
        background: "linear-gradient(180deg, hsl(210,60%,98%) 0%, hsl(var(--background)) 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div aria-hidden="true" style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "70%", height: "50%", borderRadius: "999px",
        background: "radial-gradient(ellipse at center, rgba(0,174,239,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "960px", margin: "0 auto", position: "relative" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "clamp(2.5rem, 5vw, 3.5rem)" }}>
          <span style={{
            display: "inline-block",
            background: "rgba(0,107,176,0.1)", border: "1px solid rgba(0,107,176,0.25)",
            borderRadius: "999px", padding: "5px 16px",
            fontSize: "11px", fontWeight: 800, color: "#006BB0",
            letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "16px",
          }}>
            Clear Comparison
          </span>
          <h2 style={{
            fontSize: "clamp(1.85rem, 4.5vw, 2.85rem)",
            fontWeight: 800, lineHeight: 1.08,
            color: "hsl(var(--foreground))",
            fontFamily: "var(--font-display)",
            marginBottom: "14px",
          }}>
            Why Businesses Choose{" "}
            <span style={{
              background: "linear-gradient(105deg, #003B8F, #00AEEF)",
              WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
            }}>
              ClientSurge
            </span>
          </h2>
          <p style={{
            fontSize: "clamp(0.95rem, 2vw, 1.05rem)",
            color: "hsl(var(--muted-foreground))",
            maxWidth: "540px", margin: "0 auto", lineHeight: 1.6,
          }}>
            Stop spending nights and weekends wrestling with software. We handle it — you focus on your business.
          </p>
        </div>

        {/* Comparison Table */}
        <div style={{
          borderRadius: "20px",
          overflow: "hidden",
          border: "1px solid hsl(var(--border))",
          boxShadow: "0 8px 40px rgba(0,59,143,0.08)",
        }}>

          {/* Table Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1fr",
            background: "hsl(var(--foreground))",
          }}>
            <div style={{ padding: "18px 24px" }} />
            <div style={{
              padding: "18px 24px",
              borderLeft: "1px solid rgba(255,255,255,0.1)",
            }}>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                DIY Tools
              </p>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>
                Client installs and manages everything
              </p>
            </div>
            <div style={{
              padding: "18px 24px",
              borderLeft: "1px solid rgba(255,255,255,0.1)",
              background: "linear-gradient(135deg, rgba(0,174,239,0.25), rgba(0,59,143,0.4))",
              position: "relative",
            }}>
              <div style={{
                position: "absolute", top: "10px", right: "14px",
                background: "#00AEEF", borderRadius: "999px",
                padding: "2px 8px", fontSize: "9px", fontWeight: 800,
                color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase",
              }}>
                Recommended
              </div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                ClientSurge Systems
              </p>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#fff", lineHeight: 1.4 }}>
                Done-For-You
              </p>
            </div>
          </div>

          {/* Table Rows */}
          {ROWS.map((row, i) => (
            <div
              key={row.feature}
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr 1fr",
                background: i % 2 === 0 ? "hsl(var(--card))" : "hsl(var(--background))",
                borderTop: "1px solid hsl(var(--border))",
              }}
            >
              {/* Feature label */}
              <div style={{
                padding: "18px 24px",
                display: "flex", alignItems: "center",
              }}>
                <span style={{
                  fontSize: "14px", fontWeight: 700,
                  color: "hsl(var(--foreground))",
                }}>
                  {row.feature}
                </span>
              </div>

              {/* DIY column */}
              <div style={{
                padding: "18px 24px",
                borderLeft: "1px solid hsl(var(--border))",
                display: "flex", alignItems: "center", gap: "10px",
              }}>
                <XCircle size={16} style={{ color: "#ef4444", flexShrink: 0 }} />
                <span style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", lineHeight: 1.5 }}>
                  {row.diy}
                </span>
              </div>

              {/* ClientSurge column */}
              <div style={{
                padding: "18px 24px",
                borderLeft: "1px solid rgba(0,174,239,0.2)",
                background: "rgba(0,174,239,0.04)",
                display: "flex", alignItems: "center", gap: "10px",
              }}>
                <CheckCircle2 size={16} style={{ color: "#006BB0", flexShrink: 0 }} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "hsl(var(--foreground))", lineHeight: 1.5 }}>
                  {row.cs}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Closing statement */}
        <div style={{
          textAlign: "center",
          marginTop: "clamp(2rem, 4vw, 2.5rem)",
          padding: "clamp(1.5rem, 3vw, 2rem) clamp(1.5rem, 4vw, 3rem)",
          background: "linear-gradient(135deg, hsl(220,80%,10%), hsl(201,100%,20%))",
          borderRadius: "16px",
          boxShadow: "0 12px 40px rgba(0,59,143,0.2)",
        }}>
          <p style={{
            margin: "0 0 1.5rem",
            fontSize: "clamp(1.15rem, 2.5vw, 1.45rem)",
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1.3,
            fontStyle: "italic",
            fontFamily: "var(--font-display)",
          }}>
            "We're not software. We're your outsourced AI growth team."
          </p>
          <a
            href="/book"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "14px 28px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, #00AEEF, #006BB0)",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 800,
              textDecoration: "none",
              boxShadow: "0 6px 24px rgba(0,174,239,0.4)",
              transition: "transform 160ms ease, box-shadow 160ms ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(0,174,239,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,174,239,0.4)"; }}
          >
            Book Free AI Website Audit <ArrowRight size={16} />
          </a>
        </div>

      </div>

      {/* Mobile responsive override */}
      <style>{`
        @media (max-width: 640px) {
          #why-choose-us [style*="grid-template-columns: 1.2fr 1fr 1fr"] {
            grid-template-columns: 1fr 1fr !important;
          }
          #why-choose-us [style*="grid-template-columns: 1.2fr 1fr 1fr"] > div:first-child {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}