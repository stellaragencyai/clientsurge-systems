export default function Hero() {
  return (
    <section
      style={{
        minHeight: "100svh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #003B8F 0%, #006BB0 45%, #0088CC 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "820px",
          margin: "0 auto",
          padding: "clamp(6rem, 12vw, 10rem) clamp(1.5rem, 5vw, 3rem)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Eyebrow */}
        <p className="cs-eyebrow" style={{ color: "rgba(0,174,239,0.9)", marginBottom: "1rem" }}>
          AI services marketplace for local service businesses
        </p>

        <h1
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
            fontWeight: "900",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "#ffffff",
            margin: "0",
          }}
        >
          Browse, choose, and activate AI automation systems built to recover more leads.
        </h1>
        <p style={{ 
          fontSize: "clamp(0.95rem, 1.8vw, 1.1rem)", 
          lineHeight: 1.6, 
          color: "rgba(255,255,255,0.75)", 
          maxWidth: "620px",
          margin: "1.25rem auto 0"
        }}>
          ClientSurge brings lead capture, missed-call text-back, AI follow-up, booking, review requests, and lead reactivation into one storefront so local businesses can build the automation stack they need.
        </p>

        {/* CTA buttons */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          justifyContent: "center",
          marginTop: "2rem",
        }}>
          <a
            href="/store"
            className="cs-btn-primary"
            style={{
              padding: "0 32px",
              height: "52px",
              fontSize: "0.95rem",
            }}
          >
            Browse AI Services →
          </a>
          <a
            href="/automations"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0 28px",
              height: "52px",
              borderRadius: "8px",
              border: "1.5px solid rgba(255,255,255,0.28)",
              background: "rgba(255,255,255,0.08)",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "0.9rem",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            View Automation Categories
          </a>
        </div>

        {/* Trust micro-bar */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 24px",
          justifyContent: "center",
          marginTop: "2rem",
        }}>
          {[
            "✓ Lead capture systems",
            "✓ Missed-call recovery",
            "✓ AI follow-up",
            "✓ Booking automation",
            "✓ Review request systems",
            "✓ Lead reactivation",
          ].map((item) => (
            <span key={item} style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "rgba(255,255,255,0.65)",
            }}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}