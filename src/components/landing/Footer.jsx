import { ArrowUp, Mail, Phone, Shield, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import SocialIcons from "./SocialIcons";

const FOOTER_COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Browse AI Systems", href: "/pricing" },
      { label: "Automation Store", href: "/store" },
      { label: "Instant Lead Response", href: "/lead-capture-automation" },
      { label: "AI Voice Receptionist", href: "/ai-lead-follow-up" },
      { label: "AI Booking Agent", href: "/appointment-booking-automation" },
      { label: "Review Automation", href: "/review-automation" },
    ],
  },
  {
    title: "Industries",
    links: [
      { label: "HVAC & Home Services", href: "/hvac" },
      { label: "Roofing & Restoration", href: "/roofing" },
      { label: "Dental & Orthodontics", href: "/dental" },
      { label: "Med Spas & Aesthetics", href: "/med-spa" },
      { label: "Personal Injury Law", href: "/personal-injury" },
      { label: "Real Estate", href: "/real-estate" },
      { label: "View All Industries →", href: "/industries" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "FAQ", href: "/faq" },
      { label: "Proof & Results", href: "/proof" },
      { label: "Library", href: "/library" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Client Portal", href: "/client-portal" },
      { label: "Support", href: "/contact" },
    ],
  },
];

export default function Footer() {
  const navigate = useNavigate();

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleClick = (label, href) => {
    trackCTA(`footer_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "footer");
    window.scrollTo({ top: 0, behavior: "auto" });
    navigate(href);
  };

  return (
    <footer className="cs-footer">
      <div className="cs-footer-accent" />

      {/* ── System Banner CTA ── */}
      <section className="cs-footer-system" aria-labelledby="footer-system-heading">
        <div className="cs-footer-inner cs-footer-system-header">
          <div>
            <p className="cs-footer-eyebrow">ClientSurge Systems</p>
            <h3 id="footer-system-heading">
              Turn your website into an AI sales system that never sleeps.
            </h3>
          </div>
          <Link className="cs-footer-system-cta" to="/pricing">
            Select Your System
          </Link>
        </div>
      </section>

      {/* ── Main footer grid ── */}
      <div className="cs-footer-inner cs-footer-main">
        {/* Brand column */}
        <div className="cs-footer-brand">
          <div className="cs-footer-logo-row">
            <img
              src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png"
              alt="ClientSurge Systems"
              width="220"
              height="55"
              loading="lazy"
              decoding="async"
            />
          </div>
          <p>
            ClientSurge Systems transforms business websites into automated sales systems — AI-powered lead response, booking, and nurture workflows that capture every opportunity, 24/7.
          </p>
          <div className="cs-footer-contact-list" aria-label="Contact ClientSurge">
            <a href="tel:+16025843227" className="cs-footer-contact-link" aria-label="Call ClientSurge Systems">
              <span className="cs-footer-contact-icon" aria-hidden="true"><Phone /></span>
              <span>(602) 584-3227</span>
            </a>
            <a href="mailto:support@clientsurgesystems.com" className="cs-footer-contact-link" aria-label="Email ClientSurge Systems">
              <span className="cs-footer-contact-icon" aria-hidden="true"><Mail /></span>
              <span>support@clientsurgesystems.com</span>
            </a>
          </div>
          <SocialIcons size="sm" className="mt-4" />
        </div>

        {/* Nav columns */}
        <nav className="cs-footer-nav" aria-label="Footer navigation">
          {FOOTER_COLUMNS.map((col) => (
            <section key={col.title} className="cs-footer-nav-column" aria-labelledby={`footer-${col.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
              <h4 id={`footer-${col.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{col.title}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button type="button" onClick={() => handleClick(link.label, link.href)}>
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        {/* Bottom bar */}
        <div className="cs-footer-bottom">
          <div className="cs-footer-legal">
            <span>© {new Date().getFullYear()} ClientSurge Systems</span>
            <span aria-hidden="true">·</span>
            <Link to="/privacy">Privacy</Link>
            <span aria-hidden="true">·</span>
            <Link to="/terms">Terms</Link>
            <span aria-hidden="true">·</span>
            <Link to="/sms-terms">SMS Terms</Link>
            <span aria-hidden="true">·</span>
            <Link to="/refund-policy">Refund Policy</Link>
          </div>

          <div className="cs-footer-status">
            <div className="cs-footer-secure">
              <Shield aria-hidden="true" />
              <span>SSL Encrypted</span>
            </div>
            <div className="cs-footer-secure">
              <Zap aria-hidden="true" />
              <span>All Systems Operational</span>
            </div>
            <button
              onClick={scrollTop}
              className="cs-footer-top-button"
              title="Back to top"
              aria-label="Back to top"
            >
              <ArrowUp aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .cs-footer {
          background: #ffffff;
          border-top: 1px solid rgba(0, 174, 239, 0.12);
          color: #000000;
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .cs-footer, .cs-footer * { box-sizing: border-box; }
        .cs-footer a, .cs-footer button { color: inherit; text-decoration: none; }
        .cs-footer button { background: transparent; border: 0; padding: 0; font: inherit; cursor: pointer; text-align: left; }
        .cs-footer a:focus-visible, .cs-footer button:focus-visible { outline: 2px solid #00AEEF; outline-offset: 3px; box-shadow: 0 0 0 4px rgba(0, 174, 239, 0.18); }

        .cs-footer-accent {
          height: 3px;
          background: linear-gradient(90deg, transparent 0%, #00AEEF 25%, #006BB0 50%, #003B8F 75%, transparent 100%);
          box-shadow: 0 0 18px rgba(0, 174, 239, 0.45);
        }

        .cs-footer-inner { width: min(100% - 48px, 1180px); margin: 0 auto; }

        .cs-footer-system {
          background: linear-gradient(135deg, #003B8F 0%, #006BB0 52%, #00AEEF 100%);
          padding: 36px 0;
        }
        .cs-footer-system, .cs-footer-system h3, .cs-footer-system p, .cs-footer-system a {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }
        .cs-footer-system-header {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 24px;
        }
        .cs-footer-eyebrow {
          margin: 0 0 7px;
          color: rgba(255,255,255,.78);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .18em;
          line-height: 1.4;
          text-transform: uppercase;
        }
        .cs-footer-system h3 {
          margin: 0;
          max-width: 760px;
          font-size: clamp(1.4rem, 3vw, 2.1rem);
          line-height: 1.15;
          letter-spacing: -0.03em;
          font-weight: 800;
        }
        .cs-footer-system-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 0 24px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid #ffffff;
          color: #003B8F !important;
          -webkit-text-fill-color: #003B8F !important;
          font-size: 14px;
          font-weight: 800;
          white-space: nowrap;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
        .cs-footer-system-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.25);
        }

        .cs-footer-main {
          padding: 48px 0 24px;
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(400px, 1fr);
          gap: 40px;
        }

        .cs-footer-brand p {
          max-width: 480px;
          color: #475569;
          line-height: 1.65;
          font-size: 14px;
        }
        .cs-footer-logo-row img { display: block; max-width: 200px; height: auto; }
        .cs-footer-contact-list { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 18px; }
        .cs-footer-contact-link {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(0,174,239,.2);
          color: #075985 !important;
          font-size: 13px;
          font-weight: 700;
          transition: border-color 0.2s, background 0.2s;
        }
        .cs-footer-contact-link:hover {
          border-color: rgba(0,174,239,.4);
          background: rgba(0,174,239,.05);
        }
        .cs-footer-contact-icon svg { width: 15px; height: 15px; }

        .cs-footer-nav {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 24px;
        }
        .cs-footer-nav-column h4 {
          margin: 0 0 14px;
          color: #0f172a;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .13em;
          text-transform: uppercase;
        }
        .cs-footer-nav-column ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 10px;
        }
        .cs-footer-nav-column a, .cs-footer-nav-column button {
          color: #475569;
          font-size: 14px;
          font-weight: 600;
          transition: color 0.2s;
        }
        .cs-footer-nav-column a:hover, .cs-footer-nav-column button:hover {
          color: #00AEEF;
        }

        .cs-footer-bottom {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          border-top: 1px solid rgba(15,23,42,.09);
          padding-top: 22px;
          color: #64748b;
          font-size: 12px;
        }
        .cs-footer-legal, .cs-footer-status, .cs-footer-secure {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        .cs-footer-secure svg { width: 14px; height: 14px; color: #075985; }
        .cs-footer-secure span { font-weight: 600; }
        .cs-footer-top-button {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid rgba(0,174,239,.22) !important;
          color: #075985 !important;
          transition: background 0.2s, border-color 0.2s;
        }
        .cs-footer-top-button:hover {
          background: rgba(0,174,239,.08);
          border-color: rgba(0,174,239,.4) !important;
        }
        .cs-footer-top-button svg { width: 15px; height: 15px; }

        @media (max-width: 860px) {
          .cs-footer-system-header { grid-template-columns: 1fr; gap: 18px; }
          .cs-footer-main { grid-template-columns: 1fr; gap: 32px; }
          .cs-footer-bottom { align-items: flex-start; flex-direction: column; }
        }
        @media (max-width: 560px) {
          .cs-footer-inner { width: min(100% - 32px, 1180px); }
          .cs-footer-nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>
    </footer>
  );
}