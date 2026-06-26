import { ArrowUp, Mail, Phone, Shield, Zap, Calendar, RefreshCw, Star, Headphones } from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";

const AUTOMATIONS = [
  { label: "AI Voice Agents", desc: "AI phone receptionist for inbound lead capture.", href: "/automations", icon: Headphones },
  { label: "Missed Call Text-Back", desc: "Recover missed calls automatically.", href: "/automations", icon: Phone },
  { label: "Instant Lead Response", desc: "Reply to every lead in under 60 seconds.", href: "/automations", icon: Zap },
  { label: "AI Scheduling Agent", desc: "Turns conversations into appointments.", href: "/automations", icon: Calendar },
  { label: "Lead Reactivation", desc: "Wake up cold leads from up to 90 days.", href: "/automations", icon: RefreshCw },
  { label: "Review Request System", desc: "Auto-request reviews after every appointment.", href: "/automations", icon: Star },
];

const navColumns = [
  {
    title: "Platform",
    links: [
      { label: "Home", href: "/" },
      { label: "Automations", href: "/automations" },
      { label: "Pricing", href: "/pricing" },
      { label: "Proof", href: "/proof" },
      { label: "Industries", href: "/industries" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Proof", href: "/proof" },
      { label: "Contact Us", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Client Login", href: "/login" },
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
              <p className="cs-footer-eyebrow">Included Automation Modules</p>
              <h3 id="footer-system-heading">Every automation included across our three growth systems, powered by a catalog of modules.</h3>
            </div>
            <Link className="cs-footer-system-cta" to="/pricing">
              Compare Packages
            </Link>
          </div>

          <div className="cs-footer-automation-grid">
            {AUTOMATIONS.map(({ label, desc, href, icon: Icon }) => (
              <Link
                key={label}
                to={href}
                className="cs-footer-automation-link"
              >
                <span className="cs-footer-automation-icon" aria-hidden="true"><Icon /></span>
                <div>
                  <strong>{label}</strong>
                  <span>{desc}</span>
                </div>
              </Link>
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
            AI voice agents, missed-call recovery, follow-up, and scheduling automation that turn more local leads into booked jobs.
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
        </div>

        <nav className="cs-footer-nav" aria-label="Footer navigation">
          {navColumns.map((col) => (
            <section key={col.title} className="cs-footer-nav-column" aria-labelledby={`footer-${col.title.toLowerCase()}`}>
              <h4 id={`footer-${col.title.toLowerCase()}`}>{col.title}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      onClick={() => trackCTA(`footer_${link.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "footer")}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        <div className="cs-footer-bottom">
          <div className="cs-footer-legal">
            <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>Copyright {new Date().getFullYear()} ClientSurge Systems</span>
            <span aria-hidden="true">/</span>
            <Link to="/privacy-policy" style={{ display: "flex", alignItems: "center" }}>Privacy</Link>
            <span aria-hidden="true">/</span>
            <Link to="/terms" style={{ display: "flex", alignItems: "center" }}>Terms</Link>
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
          color: #000000;
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        .cs-footer::before {
          content: '';
          position: absolute;
          inset: 0;
          background: transparent;
          pointer-events: none;
          z-index: 0;
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
          box-shadow: 0 0 18px rgba(0, 174, 239, 0.45);
        }

        .cs-footer-inner {
          width: min(100% - 48px, 1180px);
          margin: 0 auto;
        }

        .cs-footer-system {
          background: linear-gradient(135deg, #003B8F 0%, #006BB0 52%, #00AEEF 100%);
          padding: 34px 0;
        }

        /* Force all text inside the blue system section to white for contrast */
        .cs-footer-system,
        .cs-footer-system h3,
        .cs-footer-system p,
        .cs-footer-system span,
        .cs-footer-system a,
        .cs-footer-system strong,
        .cs-footer-system li {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
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
          padding: 48px 0 36px;
          display: grid;
          grid-template-columns: 1fr 2.2fr;
          gap: 52px;
          align-items: start;
          position: relative;
          z-index: 1;
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
          margin: 0 0 24px;
          max-width: 35ch;
          color: rgba(10, 22, 40, 0.68);
          font-size: 13px;
          line-height: 1.7;
          font-weight: 500;
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
          color: #00AEEF;
        }

        .cs-footer-contact-icon {
          display: inline-flex;
          width: 32px;
          height: 32px;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0, 174, 239, 0.2);
          border-radius: 8px;
          background: rgba(0, 174, 239, 0.08);
          color: #00AEEF;
        }

        .cs-footer-contact-icon svg {
          width: 14px;
          height: 14px;
        }

        .cs-footer-nav {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
          min-width: 0;
          align-items: start;
        }

        .cs-footer-nav-column {
          min-width: 0;
        }

        .cs-footer-nav-column h4 {
          margin: 0 0 18px;
          color: #00AEEF;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.15em;
          line-height: 1.4;
          text-transform: uppercase;
          text-shadow: 0 0 14px rgba(0, 174, 239, 0.55), 0 0 28px rgba(0, 174, 239, 0.25);
        }

        .cs-footer-nav-column ul {
          display: grid;
          gap: 11px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .cs-footer-nav-column a {
          display: inline-flex;
          max-width: 100%;
          color: rgba(10, 22, 40, 0.7);
          font-size: 13px;
          font-weight: 500;
          line-height: 1.5;
          transition: color 200ms ease, transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .cs-footer-nav-column a:hover {
          color: #00AEEF;
          transform: translateX(4px);
        }

        .cs-footer-nav-column a:focus-visible {
          outline: 2px solid #00AEEF;
          outline-offset: 2px;
        }

        .cs-footer-bottom {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-top: 16px;
          padding-top: 24px;
          border-top: 1px solid rgba(0, 174, 239, 0.12);
          flex-wrap: wrap;
        }

        .cs-footer-legal,
        .cs-footer-status {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          color: rgba(10, 22, 40, 0.6);
          font-size: 12px;
          line-height: 1.5;
        }

        .cs-footer-legal {
          flex-wrap: wrap;
          justify-self: start;
        }

        .cs-footer-legal a {
          color: rgba(10, 22, 40, 0.65);
          font-weight: 600;
          transition: color 160ms ease;
        }

        .cs-footer-legal a:hover {
          color: #00AEEF;
        }

        .cs-footer-legal a:focus-visible {
          outline: 2px solid #00AEEF;
          outline-offset: 2px;
        }

        .cs-footer-status {
          justify-self: end;
        }

        .cs-footer-secure {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          white-space: nowrap;
          padding: 7px 12px;
          border-radius: 6px;
          background: rgba(0, 174, 239, 0.06);
          border: 1px solid rgba(0, 174, 239, 0.15);
        }

        .cs-footer-secure svg {
          width: 13px;
          height: 13px;
          color: #00AEEF;
          flex-shrink: 0;
        }

        .cs-footer-top-button {
          display: inline-flex;
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0, 174, 239, 0.2);
          border-radius: 8px;
          background: rgba(0, 174, 239, 0.07);
          color: #00AEEF;
          cursor: pointer;
          transition: all 160ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .cs-footer-top-button:hover {
          background: rgba(0, 174, 239, 0.14);
          border-color: rgba(0, 174, 239, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 0 12px rgba(0, 174, 239, 0.2);
        }

        .cs-footer-top-button:focus-visible {
          outline: 2px solid #00AEEF;
          outline-offset: 3px;
        }

        .cs-footer-top-button svg {
          width: 16px;
          height: 16px;
        }

        @media (max-width: 1080px) {
          .cs-footer-main {
            grid-template-columns: 1fr;
            gap: 40px;
          }
        }

        @media (max-width: 960px) {
          .cs-footer-automation-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .cs-footer-brand {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 28px;
            align-items: start;
          }

          .cs-footer-logo-row,
          .cs-footer-brand p {
            margin-bottom: 0;
          }

          .cs-footer-nav {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 32px;
            min-width: 0;
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
            padding: 40px 0 max(28px, calc(28px + env(safe-area-inset-bottom, 0px)));
            grid-template-columns: 1fr;
            gap: 28px;
          }

          .cs-footer-brand {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .cs-footer-brand p {
            max-width: none;
          }

          .cs-footer-contact-link {
            width: 100%;
          }

          .cs-footer-nav {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 24px;
          }

          .cs-footer-nav-column {
            min-width: 0;
          }

          .cs-footer-nav-column ul {
            gap: 10px;
          }

          .cs-footer-bottom {
            grid-template-columns: 1fr;
            gap: 16px;
            margin-top: 0;
            padding-top: 24px;
          }

          .cs-footer-legal {
            justify-self: start;
            flex-wrap: wrap;
          }

          .cs-footer-status {
            justify-self: start;
          }
        }

        @media (max-width: 480px) {
          .cs-footer-nav {
            grid-template-columns: 1fr;
          }

          .cs-footer-bottom {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .cs-footer-legal {
            justify-content: center;
          }

          .cs-footer-status {
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
}