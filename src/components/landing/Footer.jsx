import { ArrowUp, Mail, Phone, Shield } from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";

const navColumns = [
  {
    title: "Storefront",
    links: [
      { label: "Home", href: "/" },
      { label: "Browse Systems", href: "/pricing" },
      { label: "Automation Store", href: "/store" },
      { label: "Automations", href: "/automations" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "How It Works", href: "/how-it-works" },
      { label: "About Us", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "FAQ", href: "/faq" },
      { label: "Testimonials", href: "/testimonials" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "SMS Terms", href: "/sms-terms" },
      { label: "Refund Policy", href: "/refund-policy" },
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

      <section className="cs-footer-system" aria-labelledby="footer-system-heading">
        <div className="cs-footer-inner cs-footer-system-header">
          <div>
            <p className="cs-footer-eyebrow">ClientSurge Systems</p>
            <h3 id="footer-system-heading">The Amazon of AI Services for Business — browse, add to cart, and check out. Done-for-you setup included.</h3>
          </div>
          <Link className="cs-footer-system-cta" to="/store">
            Browse the Store
          </Link>
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
            The Amazon of AI Services for Business. Browse packaged AI systems, add to cart, and check out — done-for-you setup included. No demos, no sales calls.
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

        <div className="cs-footer-bottom">
          <div className="cs-footer-legal">
            <span>Copyright {new Date().getFullYear()} ClientSurge Systems</span>
            <span aria-hidden="true">/</span>
            <Link to="/privacy">Privacy</Link>
            <span aria-hidden="true">/</span>
            <Link to="/terms">Terms</Link>
            <span aria-hidden="true">/</span>
            <Link to="/sms-terms">SMS Terms</Link>
            <span aria-hidden="true">/</span>
            <Link to="/refund-policy">Refund Policy</Link>
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

        .cs-footer, .cs-footer * { box-sizing: border-box; }
        .cs-footer a, .cs-footer button { color: inherit; text-decoration: none; }
        .cs-footer button { background: transparent; border: 0; padding: 0; font: inherit; cursor: pointer; text-align: left; }
        .cs-footer a:focus-visible, .cs-footer button:focus-visible { outline: 2px solid #00AEEF; outline-offset: 3px; box-shadow: 0 0 0 4px rgba(0, 174, 239, 0.18); }
        .cs-footer-accent { height: 3px; background: linear-gradient(90deg, transparent 0%, #00AEEF 25%, #009DFF 50%, #003B8F 75%, transparent 100%); box-shadow: 0 0 18px rgba(0, 174, 239, 0.45); }
        .cs-footer-inner { width: min(100% - 48px, 1180px); margin: 0 auto; }
        .cs-footer-system { background: linear-gradient(135deg, #003B8F 0%, #006BB0 52%, #00AEEF 100%); padding: 34px 0; }
        .cs-footer-system, .cs-footer-system h3, .cs-footer-system p, .cs-footer-system a { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
        .cs-footer-system-header { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 24px; }
        .cs-footer-eyebrow { margin: 0 0 7px; color: rgba(255,255,255,.78); font-size: 10px; font-weight: 800; letter-spacing: .18em; line-height: 1.4; text-transform: uppercase; }
        .cs-footer-system h3 { margin: 0; max-width: 760px; font-size: clamp(1.4rem, 3vw, 2.1rem); line-height: 1.1; letter-spacing: -0.04em; }
        .cs-footer-system-cta { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 24px; border-radius: 999px; background: #ffffff; border: 1px solid #ffffff; color: #003B8F !important; -webkit-text-fill-color: #003B8F !important; font-size: 14px; font-weight: 800; white-space: nowrap; transition: transform 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
        .cs-footer-system-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.25); }
        .cs-footer-main { padding: 48px 0 26px; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(320px, .85fr); gap: 40px; }
        .cs-footer-brand p { max-width: 560px; color: #475569; line-height: 1.65; }
        .cs-footer-logo-row img { display: block; max-width: 240px; height: auto; }
        .cs-footer-contact-list { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
        .cs-footer-contact-link { display: inline-flex; align-items: center; gap: 9px; padding: 10px 12px; border-radius: 999px; border: 1px solid rgba(0,174,239,.2); color: #075985 !important; font-size: 13px; font-weight: 800; }
        .cs-footer-contact-icon svg { width: 15px; height: 15px; }
        .cs-footer-nav { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
        .cs-footer-nav-column h4 { margin: 0 0 14px; color: #0f172a; font-size: 12px; font-weight: 900; letter-spacing: .13em; text-transform: uppercase; }
        .cs-footer-nav-column ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
        .cs-footer-nav-column a, .cs-footer-nav-column button { color: #475569; font-size: 14px; font-weight: 700; }
        .cs-footer-nav-column a:hover, .cs-footer-nav-column button:hover { color: #075985; }
        .cs-footer-bottom { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 18px; border-top: 1px solid rgba(15,23,42,.09); padding-top: 22px; color: #64748b; font-size: 12px; }
        .cs-footer-legal, .cs-footer-status, .cs-footer-secure { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
        .cs-footer-secure svg { width: 14px; height: 14px; color: #075985; }
        .cs-footer-top-button { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; border: 1px solid rgba(0,174,239,.22) !important; color: #075985 !important; }
        .cs-footer-top-button svg { width: 15px; height: 15px; }
        @media (max-width: 860px) { .cs-footer-system-header, .cs-footer-main { display: block; } .cs-footer-system-cta { margin-top: 18px; } .cs-footer-nav { margin-top: 32px; } .cs-footer-bottom { align-items: flex-start; flex-direction: column; } }
        @media (max-width: 560px) { .cs-footer-inner { width: min(100% - 32px, 1180px); } .cs-footer-nav { grid-template-columns: 1fr; } }
        @media (max-width: 860px) { .cs-footer-nav { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      `}</style>
    </footer>
  );
}