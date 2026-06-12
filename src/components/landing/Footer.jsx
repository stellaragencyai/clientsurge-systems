import { ArrowUp, Mail, Phone, Shield, Zap, Calendar, RefreshCw, Star, Headphones } from "lucide-react";

import { useNavigate } from "react-router-dom";

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
      { label: "Free Automation Audit", href: "/book" },
    ],
  },
  {
    title: "Industries",
    links: [
      { label: "Med Spas & Aesthetics", href: "/med-spa" },
      { label: "Dental & Orthodontics", href: "/dental" },
      { label: "Chiropractic & PT", href: "/chiropractic" },
      { label: "HVAC & Home Services", href: "/hvac" },
      { label: "Plumbing & Drain Services", href: "/plumbing" },
      { label: "Roofing & Restoration", href: "/roofing" },
      { label: "Contractors & Trades", href: "/contractors" },
      { label: "Real Estate Agents", href: "/real-estate" },
      { label: "Personal Injury Law", href: "/personal-injury" },
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

  const handleNavClick = (e, href) => {
    e.preventDefault();
    if (href.startsWith("/#")) {
      const anchor = href.slice(1);
      navigate(`/${anchor}`);
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
      navigate(href);
    }
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="cs-footer">
      <div className="cs-footer-accent" />

      <section className="cs-footer-system" aria-labelledby="footer-system-heading">
        <div className="cs-footer-inner">
          <div className="cs-footer-system-header">
            <div>
              <p className="cs-footer-eyebrow">Our Full System Stack</p>
              <h3 id="footer-system-heading">Every automation you need to convert more leads, done for you.</h3>
            </div>
            <a className="cs-footer-system-cta" href="/automations" onClick={(e) => handleNavClick(e, "/automations")}>
              View automations
            </a>
          </div>

          <div className="cs-footer-automation-grid">
            {AUTOMATIONS.map(({ label, desc, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                onClick={(e) => handleNavClick(e, href)}
                className="cs-footer-automation-link"
              >
                <span className="cs-footer-automation-icon" aria-hidden="true"><Icon /></span>
                <div>
                  <strong>{label}</strong>
                  <span>{desc}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="cs-footer-inner cs-footer-main">
        <div className="cs-footer-brand">
          <div className="cs-footer-logo-row">
            <img
              src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png"
              alt="ClientSurge Systems"
              width="240"
              height="60"
              loading="lazy"
              decoding="async"
            />
          </div>
          <p>
            AI voice agents, missed-call recovery, follow-up, and booking automation that turn more local leads into booked jobs.
          </p>
          <div className="cs-footer-contact-list" aria-label="Contact ClientSurge">
            <a href="tel:+16025843227" className="cs-footer-contact-link">
              <span className="cs-footer-contact-icon" aria-hidden="true"><Phone /></span>
              <span>(602) 584-3227</span>
            </a>
            <a href="mailto:support@clientsurgesystems.com" className="cs-footer-contact-link">
              <span className="cs-footer-contact-icon" aria-hidden="true"><Mail /></span>
              <span>support@clientsurgesystems.com</span>
            </a>
          </div>
        </div>

        <nav className="cs-footer-nav" aria-label="Footer navigation">
          {navColumns.map((col) => (
            <section key={col.title} className="cs-footer-nav-column" aria-labelledby={`footer-${col.title.toLowerCase()}`}>
              <h4 id={`footer-${col.title.toLowerCase()}`}>{col.title}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} onClick={(e) => handleNavClick(e, link.href)}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        <div className="cs-footer-bottom">
          <div className="cs-footer-legal">
            <span>Copyright {new Date().getFullYear()} ClientSurge Systems</span>
            <span aria-hidden="true">/</span>
            <a href="/privacy-policy" onClick={(e) => handleNavClick(e, "/privacy-policy")}>Privacy</a>
            <span aria-hidden="true">/</span>
            <a href="/terms" onClick={(e) => handleNavClick(e, "/terms")}>Terms</a>
          </div>

          <div className="cs-footer-status">
            <div className="cs-footer-secure">
              <Shield aria-hidden="true" />
              <span>SSL Encrypted</span>
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
          color: #0a1628;
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        .cs-footer,
        .cs-footer * {
          box-sizing: border-box;
        }

        .cs-footer a {
          text-decoration: none;
        }

        .cs-footer a:focus-visible,
        .cs-footer button:focus-visible {
          outline: 2px solid #00AEEF;
          outline-offset: 3px;
          box-shadow: 0 0 0 4px rgba(0, 174, 239, 0.18);
        }

        .cs-footer-accent {
          height: 3px;
          background: linear-gradient(90deg, transparent 0%, #00AEEF 25%, #009DFF 50%, #003B8F 75%, transparent 100%);
        }

        .cs-footer-inner {
          width: min(100% - 48px, 1180px);
          margin: 0 auto;
        }

        .cs-footer-system {
          background: linear-gradient(135deg, #003B8F 0%, #006BB0 52%, #00AEEF 100%);
          padding: 34px 0;
        }

        .cs-footer-system-header {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: end;
          gap: 24px;
          margin-bottom: 22px;
        }

        .cs-footer-eyebrow {
          margin: 0 0 7px;
          color: rgba(255, 255, 255, 0.78);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.18em;
          line-height: 1.4;
          text-transform: uppercase;
        }

        .cs-footer-system h3 {
          margin: 0;
          max-width: 650px;
          color: #ffffff;
          font-size: 24px;
          font-weight: 800;
          line-height: 1.2;
        }

        .cs-footer-system-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          padding: 0 14px;
          border: 1px solid rgba(255, 255, 255, 0.26);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
          transition: background 160ms ease, border-color 160ms ease;
        }

        .cs-footer-system-cta:hover {
          background: rgba(255, 255, 255, 0.16);
          border-color: rgba(255, 255, 255, 0.38);
        }

        .cs-footer-automation-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .cs-footer-automation-link {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 10px;
          min-height: 82px;
          padding: 13px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          transition: background 160ms ease, border-color 160ms ease;
        }

        .cs-footer-automation-link:hover {
          background: rgba(255, 255, 255, 0.14);
          border-color: rgba(255, 255, 255, 0.28);
        }

        .cs-footer-automation-icon {
          display: inline-flex;
          width: 34px;
          height: 34px;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.14);
        }

        .cs-footer-automation-icon svg {
          width: 16px;
          height: 16px;
        }

        .cs-footer-automation-link strong,
        .cs-footer-automation-link span:not(.cs-footer-automation-icon) {
          display: block;
        }

        .cs-footer-automation-link strong {
          margin: 1px 0 3px;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.25;
        }

        .cs-footer-automation-link span:not(.cs-footer-automation-icon) {
          color: rgba(255, 255, 255, 0.82);
          font-size: 11px;
          line-height: 1.35;
        }

        .cs-footer-main {
          padding: 42px 0 28px;
          display: grid;
          grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.55fr);
          gap: 44px;
          align-items: start;
        }

        .cs-footer-brand {
          min-width: 0;
        }

        .cs-footer-logo-row {
          display: flex;
          align-items: center;
          margin-bottom: 18px;
        }

        .cs-footer-logo-row img {
          width: min(240px, 100%);
          height: auto;
          object-fit: contain;
          mix-blend-mode: multiply;
        }

        .cs-footer-brand p {
          margin: 0 0 20px;
          max-width: 380px;
          color: rgba(10, 22, 40, 0.72);
          font-size: 13px;
          line-height: 1.65;
        }

        .cs-footer-contact-list {
          display: grid;
          gap: 10px;
        }

        .cs-footer-contact-link {
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr);
          align-items: center;
          gap: 10px;
          width: fit-content;
          max-width: 100%;
          color: rgba(10, 22, 40, 0.76);
          font-size: 13px;
          font-weight: 700;
          line-height: 1.3;
        }

        .cs-footer-contact-link span:last-child {
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .cs-footer-contact-link:hover {
          color: #005f99;
        }

        .cs-footer-contact-icon {
          display: inline-flex;
          width: 32px;
          height: 32px;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0, 136, 204, 0.2);
          border-radius: 8px;
          background: rgba(0, 136, 204, 0.08);
          color: #0088CC;
        }

        .cs-footer-contact-icon svg {
          width: 14px;
          height: 14px;
        }

        .cs-footer-nav {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 28px;
          min-width: 0;
        }

        .cs-footer-nav-column {
          min-width: 0;
        }

        .cs-footer-nav-column h4 {
          margin: 0 0 14px;
          color: #005f99;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.16em;
          line-height: 1.3;
          text-transform: uppercase;
        }

        .cs-footer-nav-column ul {
          display: grid;
          gap: 9px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .cs-footer-nav-column a {
          display: inline-flex;
          max-width: 100%;
          color: rgba(10, 22, 40, 0.72);
          font-size: 13px;
          font-weight: 600;
          line-height: 1.35;
        }

        .cs-footer-nav-column a:hover {
          color: #005f99;
        }

        .cs-footer-bottom {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-top: 6px;
          padding-top: 22px;
          border-top: 1px solid rgba(0, 174, 239, 0.12);
        }

        .cs-footer-legal,
        .cs-footer-status {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          color: rgba(10, 22, 40, 0.66);
          font-size: 12px;
          line-height: 1.4;
        }

        .cs-footer-legal {
          flex-wrap: wrap;
        }

        .cs-footer-legal a {
          color: rgba(10, 22, 40, 0.68);
          font-weight: 700;
        }

        .cs-footer-legal a:hover {
          color: #005f99;
        }

        .cs-footer-secure {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .cs-footer-secure svg {
          width: 14px;
          height: 14px;
          color: #0088CC;
        }

        .cs-footer-top-button {
          display: inline-flex;
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0, 136, 204, 0.2);
          border-radius: 8px;
          background: rgba(0, 136, 204, 0.08);
          color: #0088CC;
          cursor: pointer;
          transition: background 160ms ease, transform 160ms ease;
        }

        .cs-footer-top-button:hover {
          background: rgba(0, 136, 204, 0.15);
          transform: translateY(-1px);
        }

        .cs-footer-top-button svg {
          width: 15px;
          height: 15px;
        }

        @media (max-width: 960px) {
          .cs-footer-automation-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .cs-footer-main {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .cs-footer-brand {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(240px, 0.9fr);
            gap: 22px;
            align-items: start;
          }

          .cs-footer-logo-row,
          .cs-footer-brand p {
            margin-bottom: 0;
          }
        }

        @media (max-width: 700px) {
          .cs-footer-inner {
            width: min(100% - 32px, 1180px);
          }

          .cs-footer-system {
            padding: 28px 0;
          }

          .cs-footer-system-header {
            grid-template-columns: 1fr;
            align-items: start;
            gap: 16px;
          }

          .cs-footer-system h3 {
            font-size: 21px;
          }

          .cs-footer-system-cta {
            width: 100%;
          }

          .cs-footer-automation-grid {
            grid-template-columns: 1fr;
          }

          .cs-footer-automation-link {
            min-height: 74px;
          }

          .cs-footer-main {
            padding: 34px 0 max(24px, calc(24px + env(safe-area-inset-bottom, 0px)));
          }

          .cs-footer-brand {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .cs-footer-brand p {
            max-width: none;
          }

          .cs-footer-contact-link {
            width: 100%;
          }

          .cs-footer-nav {
            grid-template-columns: 1fr;
            gap: 22px;
          }

          .cs-footer-nav-column {
            padding-top: 18px;
            border-top: 1px solid rgba(0, 174, 239, 0.1);
          }

          .cs-footer-nav-column ul {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            column-gap: 16px;
            row-gap: 10px;
          }

          .cs-footer-bottom {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
            margin-top: 4px;
            padding-top: 20px;
          }

          .cs-footer-legal,
          .cs-footer-status {
            justify-content: space-between;
            width: 100%;
          }

          .cs-footer-status {
            align-items: center;
          }
        }

        @media (max-width: 420px) {
          .cs-footer-nav-column ul {
            grid-template-columns: 1fr;
          }

          .cs-footer-legal {
            justify-content: center;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}