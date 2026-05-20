/**
 * NotFound.jsx — #29
 * Redesigned 404: logo, links, helpful message.
 */
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>404</div>
      <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Page not found</h1>
      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, maxWidth: 380, lineHeight: 1.7, margin: "0 0 32px" }}>
        That page doesn't exist — but your leads still need responding to. Let's get you back on track.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { to: "/", label: "← Back home" },
          { to: "/pricing", label: "View pricing" },
          { to: "/store", label: "Browse services" },
          { to: "/book", label: "Book a demo" },
        ].map(({ to, label }) => (
          <Link key={to} to={to} style={{
            background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)",
            color: "#00D4FF", borderRadius: 9999, padding: "8px 18px", fontSize: 13,
            fontWeight: 600, textDecoration: "none",
          }}>{label}</Link>
        ))}
      </div>
    </div>
  );
}
