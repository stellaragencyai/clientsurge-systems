import { ArrowUp, Mail, Phone, Shield, Zap, Calendar, RefreshCw, Star, Headphones } from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";

const AUTOMATIONS = [
  { label: "AI Voice Agents", desc: "AI phone receptionist for inbound lead capture.", href: "/automations", icon: Headphones },
  { label: "Missed Call Text-Back", desc: "Recover missed calls automatically.", href: "/automations", icon: Phone },
  { label: "Instant Lead Response", desc: "Reply to every lead in under 60 seconds.", href: "/automations", icon: Zap },
  { label: "AI Booking Agent", desc: "Turns conversations into appointments.", href: "/automations", icon: Calendar },
  { label: "Lead Reactivation", desc: "Wake up cold leads from up to 90 days.", href: "/automations", icon: RefreshCw },
  { label: "Review Request System", desc: "Auto-request reviews after every appointment.", href: "/automations", icon: Star },
];

const navColumns = [
  {
    title: "Platform",
    links: [
      { label: "How It Works", href: "/#problem-solution" },
      { label: "Our System", href: "/#services" },
      { label: "AI Automations", href: "/automations" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
      { label: "Blog", href: "/blog" },
      { label: "Book Free Audit", href: "/book" },
    ],
  },
  {
    title: "Industries",
    links: [
      { label: "Med Spas & Aesthetics", href: "/med-spa" },
      { label: "Dental & Orthodontics", href: "/dental" },
      { label: "Chiropractic & PT", href: "/chiropractic" },
      { label: "HVAC & Home Services", href: "/hvac" },
      { label: "Roofing & Restoration", href: "/roofing" },
      { label: "Contractors & Trades", href: "/contractors" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact Us", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (e, href) => {
    e.preventDefault();
    if (href.startsWith("/#")) {
      const anchor = href.slice(1);
      if (location.pathname !== "/") {
        navigate(`/${anchor}`);
        return;
      }
      const el = document.querySelector(anchor);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState({}, "", `/${anchor}`);
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
      navigate(href);
    }
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer style={{ background: "#ffffff", borderTop: "1px solid rgba(0,174,239,0.12)" }}>

      {/* Top accent line */}
      <div style={{
        height: "3px",
        background: "linear-gradient(90deg, transparent 0%, #00AEEF 25%, #009DFF 50%, #003B8F 75%, transparent 100%)",
      }} />

      {/* Automation highlight strip */}
      <div style={{ background: "linear-gradient(135deg, #003B8F 0%, #006BB0 50%, #00AEEF 100%)", padding: "40px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <p style={{ fontSize: "10px", fontWeight: "800", color: "rgba(255,255,255,0.82)", textTransform: "uppercase", letterSpacing: "0.2em", margin: "0 0 6px" }}>Our Full System Stack</p>
            <h3 style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: "800", color: "#ffffff", margin: 0, lineHeight: 1.2 }}>
              Every automation you need to convert more leads — done for you.
            </h3>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
            {AUTOMATIONS.map(({ label, desc, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                onClick={(e) => handleNavClick(e, href)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "10px",
                  padding: "14px 18px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  textDecoration: "none",
                  transition: "all 0.2s",
                  minWidth: "180px", flex: "1 1 180px", maxWidth: "240px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                }}
              >
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon style={{ width: "14px", height: "14px", color: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#ffffff", marginBottom: "2px" }}>{label}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.86)", lineHeight: 1.3 }}>{desc}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer body */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "64px 24px 40px" }}>
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "40px" }}>

          {/* Brand column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <img
              src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png"
              alt="ClientSurge Systems"
              width="240"
              height="60"
              style={{ height: "60px", width: "auto", objectFit: "contain", mixBlendMode: "multiply" }}
            />
            <p style={{ fontSize: "13px", color: "rgba(10,22,40,0.72)", lineHeight: 1.65, margin: 0 }}>
              AI voice agents, missed-call recovery, follow-up, and booking automation that turn more local leads into booked jobs.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="tel:+16025843227" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "rgba(10,22,40,0.74)", transition: "color 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#005f99"}
                onMouseLeave={(e) => e.currentTarget.style.color = "rgba(10,22,40,0.74)"}
              >
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(0,136,204,0.08)", border: "1px solid rgba(0,136,204,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Phone style={{ width: "13px", height: "13px", color: "#0088CC" }} />
                </div>
                <span style={{ fontSize: "13px", fontWeight: "600" }}>(602) 584-3227</span>
              </a>
              <a href="mailto:support@clientsurgesystems.com" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "rgba(10,22,40,0.74)", transition: "color 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#005f99"}
                onMouseLeave={(e) => e.currentTarget.style.color = "rgba(10,22,40,0.74)"}
              >
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(0,136,204,0.08)", border: "1px solid rgba(0,136,204,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Mail style={{ width: "13px", height: "13px", color: "#0088CC" }} />
                </div>
                <span style={{ fontSize: "12px", fontWeight: "600" }}>support@clientsurgesystems.com</span>
              </a>
            </div>
          </div>

          {/* Nav columns */}
          {navColumns.map((col) => (
            <div key={col.title} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h4 style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.18em", color: "#005f99", margin: 0 }}>
                {col.title}
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {col.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    style={{ fontSize: "13px", color: "rgba(10,22,40,0.72)", textDecoration: "none", fontWeight: "500", transition: "color 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#005f99"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "rgba(10,22,40,0.72)"}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid rgba(0,174,239,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "rgba(10,22,40,0.68)" }}>© {new Date().getFullYear()} ClientSurge Systems</span>
            <a href="/privacy-policy" onClick={(e) => handleNavClick(e, "/privacy-policy")} style={{ fontSize: "12px", color: "rgba(10,22,40,0.68)", textDecoration: "none" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#005f99"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(10,22,40,0.68)"}>
              Privacy
            </a>
            <a href="/terms" onClick={(e) => handleNavClick(e, "/terms")} style={{ fontSize: "12px", color: "rgba(10,22,40,0.68)", textDecoration: "none" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#005f99"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(10,22,40,0.68)"}>
              Terms
            </a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "rgba(10,22,40,0.68)" }}>
              <Shield style={{ width: "13px", height: "13px", color: "#0088CC" }} />
              <span>SSL Encrypted</span>
            </div>
            <button
              onClick={scrollTop}
              style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,136,204,0.08)", border: "1px solid rgba(0,136,204,0.2)", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,136,204,0.15)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,136,204,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
              title="Back to top"
            >
              <ArrowUp style={{ width: "14px", height: "14px", color: "#0088CC" }} />
            </button>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          footer .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          footer .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
