/**
 * PageHero.jsx — #18
 * Ensures hero headline always renders as semantic <h1>.
 * Import and use in ALL industry sub-pages (MedSpa, Dental, Tanning, etc.)
 * so the page has exactly one <h1> for SEO.
 */
export default function PageHero({ headline, subheadline, cta, badge, style = {} }) {
  return (
    <section style={{ position: "relative", padding: "80px 20px 60px", textAlign: "center", ...style }}>
      {badge && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16,
          background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)",
          borderRadius: 9999, padding: "5px 14px",
          fontSize: 11, fontWeight: 700, color: "#00D4FF", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {badge}
        </div>
      )}
      {/* #18: semantic h1 — exactly one per industry page */}
      <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, color: "#FFFFFF",
        lineHeight: 1.15, margin: "0 0 16px", maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}>
        {headline}
      </h1>
      {subheadline && (
        <p style={{ fontSize: "clamp(14px, 2vw, 18px)", color: "rgba(255,255,255,0.6)",
          lineHeight: 1.7, maxWidth: 560, margin: "0 auto 32px" }}>
          {subheadline}
        </p>
      )}
      {cta}
    </section>
  );
}
