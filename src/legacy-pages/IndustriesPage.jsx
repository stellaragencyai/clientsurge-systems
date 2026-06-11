/**
 * IndustriesPageEnhancements.jsx — #31 #39 #83
 * #31: gradient hero + industry grid icons
 * #39: industry-specific CTA headline copy
 * #83: all 6 industry cards link to correct routes
 */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { forceScrollToTop } from "@/lib/scroll";

const INDUSTRIES = [
  {
    key: "med-spa",
    route: "/med-spa",
    icon: "✨",
    label: "Med Spa",
    accent: "#00D4FF",
    cta: "Stop losing botox & filler leads to voicemail. AI responds in 60 seconds.",
    stat: "4.2x more bookings",
  },
  {
    key: "dental",
    route: "/dental",
    icon: "🦷",
    label: "Dental",
    accent: "#00FFB3",
    cta: "Every missed new patient call costs you $800+. We fix that automatically.",
    stat: "3x new patients",
  },
  {
    key: "tanning",
    route: "/industries",
    icon: "☀️",
    label: "Tanning Salon",
    accent: "#F59E0B",
    cta: "Turn Instagram DMs and website visitors into booked sessions automatically.",
    stat: "40% more sessions",
  },
  {
    key: "hvac",
    route: "/hvac",
    icon: "❄️",
    label: "HVAC",
    accent: "#A78BFA",
    cta: "Phoenix summers mean 3am emergency calls. AI dispatches and follows up — 24/7.",
    stat: "60% faster dispatch",
  },
  {
    key: "plumbing",
    route: "/plumbing",
    icon: "🚰",
    label: "Plumbing",
    accent: "#22D3EE",
    cta: "Emergency leaks, drain calls, and water heater requests need faster response.",
    stat: "Urgent lead capture",
  },
  {
    key: "roofing",
    route: "/roofing",
    icon: "🏠",
    label: "Roofing",
    accent: "#FB923C",
    cta: "After every storm, leads flood in. AI captures every single one before competitors do.",
    stat: "5x lead capture",
  },
  {
    key: "contractors",
    route: "/contractors",
    icon: "🔨",
    label: "Contractors",
    accent: "#34D399",
    cta: "Estimates, follow-ups, and scheduling — all automated while you're on the job.",
    stat: "2x estimate rate",
  },
];

export function IndustriesHero() {
  return (
    <section style={{ background: "linear-gradient(180deg,rgba(0,212,255,0.06) 0%,transparent 100%)", padding: "80px 20px 48px", textAlign: "center" }}>
      <p style={{ color: "rgba(0,212,255,0.6)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 12 }}>Who We Work With</p>
      <h1 style={{ color: "#fff", fontSize: "clamp(26px,5vw,48px)", fontWeight: 900, margin: "0 0 14px", lineHeight: 1.1 }}>
        AI automation for<br /><span style={{ background: "linear-gradient(135deg,#00D4FF,#00FFB3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>local service businesses</span>
      </h1>
      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, maxWidth: 480, margin: "0 auto" }}>
        Every industry, every inquiry — responded to in under 60 seconds. 24/7.
      </p>
    </section>
  );
}

export function IndustriesGrid() {
  const navigate = useNavigate();
  const handleIndustryNavigation = (route) => {
    forceScrollToTop();
    navigate(route);
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16, maxWidth: 960, margin: "0 auto", padding: "0 20px 80px" }}>
      {INDUSTRIES.map((ind, i) => (
        <motion.div key={ind.key} onClick={() => handleIndustryNavigation(ind.route)}
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -2 }}
          style={{ background: "linear-gradient(160deg,rgba(13,27,46,0.95),rgba(6,13,24,0.98))", border: `1px solid ${ind.accent}20`, borderRadius: 18, padding: "24px 22px", cursor: "pointer", position: "relative", overflow: "hidden" }}>
          {/* Accent glow */}
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, background: `${ind.accent}10`, borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ fontSize: 32, marginBottom: 12 }}>{ind.icon}</div>
          <h3 style={{ color: "#fff", fontSize: 17, fontWeight: 800, margin: "0 0 8px" }}>{ind.label}</h3>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.6, margin: "0 0 14px" }}>{ind.cta}</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ background: `${ind.accent}15`, color: ind.accent, border: `1px solid ${ind.accent}30`, borderRadius: 9999, padding: "3px 10px", fontSize: 10, fontWeight: 800 }}>{ind.stat}</span>
            <span style={{ color: ind.accent, fontSize: 12, fontWeight: 600 }}>Learn more →</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function IndustriesPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E" }}>
      <IndustriesHero />
      <IndustriesGrid />
    </div>
  );
}

export { INDUSTRIES };
