import { ArrowRight, ArrowUp, Clock3, Mail, Phone, Shield, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";

const navColumns = [
  {
    title: "Platform",
    links: [
      { label: "Home", href: "/" },
      { label: "AI Packages", href: "/pricing" },
      { label: "Automations", href: "/automations" },
      { label: "Industries", href: "/industries" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "How It Works", href: "/how-it-works" },
      { label: "Proof Standards", href: "/proof" },
      { label: "FAQ", href: "/faq" },
      { label: "Testimonials", href: "/testimonials" },
      { label: "Blog", href: "/blog" },
      { label: "About", href: "/about" },
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
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleClick = (label) => {
    trackCTA(`footer_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "footer");
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  return (
    <footer className="cs-footer">
      <div className="cs-footer-inner cs-footer-main">
        <div className="cs-footer-brand">
          <div className="cs-footer-brand-glow" aria-hidden="true" />
          <div className="cs-footer-logo-row">
            <img
              src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png"
              alt="ClientSurge Systems"
              width="284"
              height="71"
              loading="lazy"
              decoding="async"
            />
          </div>
          <p className="cs-footer-brand-copy">
            Helping local service businesses respond faster, recover missed opportunities, and turn more leads into booked appointments with practical AI automation.
          </p>

          <div className="cs-footer-contact-list" aria-label="Contact ClientSurge">
            <a href="tel:+16025843227" className="cs-footer-contact-card" aria-label="Call ClientSurge Systems at 602-584-3227">
              <span className="cs-footer-contact-icon" aria-hidden="true"><Phone /></span>
              <span className="cs-footer-contact-content">
                <span className="cs-footer-contact-kicker">Call us</span>
                <strong>(602) 584-3227</strong>
                <small>Monday–Friday support</small>
              </span>
              <ArrowRight className="cs-footer-contact-arrow" aria-hidden="true" />
            </a>

            <a href="mailto:support@clientsurgesystems.com" className="cs-footer-contact-card" aria-label="Email ClientSurge Systems support">
              <span className="cs-footer-contact-icon" aria-hidden="true"><Mail /></span>
              <span className="cs-footer-contact-content">
                <span className="cs-footer-contact-kicker">Email support</span>
                <strong>support@clientsurgesystems.com</strong>
                <small>Direct help from our team</small>
              </span>
              <ArrowRight className="cs-footer-contact-arrow" aria-hidden="true" />
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
                    <Link to={link.href} onClick={() => handleClick(link.label)}>
                      <span>{link.label}</span>
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        <div className="cs-footer-bottom">
          <div className="cs-footer-legal">
            <span>© {new Date().getFullYear()} ClientSurge Systems</span>
            <span className="cs-footer-legal-divider" aria-hidden="true" />
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/sms-terms">SMS Terms</Link>
            <Link to="/refund-policy">Refund Policy</Link>
          </div>

          <div className="cs-footer-status">
            <div className="cs-footer-status-item">
              <Shield aria-hidden="true" />
              <span>Secure HTTPS</span>
            </div>
            <div className="cs-footer-status-item">
              <Sparkles aria-hidden="true" />
              <span>AI-powered systems</span>
            </div>
            <div className="cs-footer-status-item">
              <Clock3 aria-hidden="true" />
              <span>Responsive support</span>
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
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 18% 34%, rgba(0, 174, 239, 0.09), transparent 28%),
            linear-gradient(180deg, #ffffff 0%, #fbfdff 54%, #f6f9fd 100%);
          border-top: 1px solid rgba(0, 174, 239, 0.12);
          color: #000000;
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        .cs-footer, .cs-footer * { box-sizing: border-box; }
        .cs-footer a, .cs-footer button { color: inherit; text-decoration: none; }
        .cs-footer button { background: transparent; border: 0; padding: 0; font: inherit; cursor: pointer; text-align: left; }
        .cs-footer a:focus-visible, .cs-footer button:focus-visible { outline: 2px solid #00AEEF; outline-offset: 3px; box-shadow: 0 0 0 4px rgba(0, 174, 239, 0.18); }
        .cs-footer-accent { height: 3px; background: linear-gradient(90deg, transparent 0%, #00AEEF 25%, #009DFF 50%, #006BB0 75%, transparent 100%); box-shadow: 0 0 18px rgba(0, 174, 239, 0.45); }
        .cs-footer-inner { width: min(100% - 48px, 1180px); margin: 0 auto; }
        .cs-footer-system { background: linear-gradient(135deg, #006BB0 0%, #0088CC 52%, #00AEEF 100%); padding: 34px 0; }
        .cs-footer-system, .cs-footer-system h3, .cs-footer-system p, .cs-footer-system a { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
        .cs-footer-system-header { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 24px; }
        .cs-footer-eyebrow { margin: 0 0 7px; color: rgba(255,255,255,.78); font-size: 10px; font-weight: 800; letter-spacing: .18em; line-height: 1.4; text-transform: uppercase; }
        .cs-footer-system h3 { margin: 0; max-width: 760px; font-size: clamp(1.4rem, 3vw, 2.1rem); line-height: 1.1; letter-spacing: -0.04em; }
        .cs-footer-system-cta { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 24px; border-radius: 999px; background: #ffffff; border: 1px solid #ffffff; color: #006BB0 !important; -webkit-text-fill-color: #006BB0 !important; font-size: 14px; font-weight: 800; white-space: nowrap; transition: transform 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
        .cs-footer-system-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.25); }

        .cs-footer-main { padding: 58px 0 28px; display: grid; grid-template-columns: minmax(0, 1.12fr) minmax(420px, .88fr); align-items: start; gap: 52px; }
        .cs-footer-brand { position: relative; padding-right: 52px; border-right: 1px solid rgba(15, 23, 42, 0.09); }
        .cs-footer-brand-glow { position: absolute; width: 280px; height: 180px; top: -52px; left: -48px; pointer-events: none; background: radial-gradient(circle, rgba(0, 174, 239, 0.16), transparent 68%); filter: blur(12px); }
        .cs-footer-logo-row { position: relative; margin-bottom: 22px; }
        .cs-footer-logo-row img { display: block; width: min(100%, 284px); height: auto; filter: drop-shadow(0 10px 24px rgba(0, 59, 143, 0.12)); }
        .cs-footer-brand-copy { position: relative; max-width: 510px; margin: 0; color: #334155; font-size: 15px; line-height: 1.75; }

        .cs-footer-contact-list { position: relative; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 26px; }
        .cs-footer-contact-card { min-width: 0; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 15px; border-radius: 12px; border: 1px solid rgba(0, 174, 239, 0.18); background: rgba(255, 255, 255, 0.72); box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,.9); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease, background .22s ease; }
        .cs-footer-contact-card:hover { transform: translateY(-3px); border-color: rgba(0, 174, 239, 0.45); background: rgba(255, 255, 255, 0.94); box-shadow: 0 16px 38px rgba(0, 59, 143, 0.12), inset 0 1px 0 #ffffff; }
        .cs-footer-contact-icon { width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; border-radius: 12px; color: #0088CC; background: linear-gradient(145deg, rgba(0,174,239,.14), rgba(0,59,143,.08)); border: 1px solid rgba(0,174,239,.16); }
        .cs-footer-contact-icon svg { width: 17px; height: 17px; }
        .cs-footer-contact-content { min-width: 0; display: grid; gap: 2px; }
        .cs-footer-contact-kicker { color: #64748b; font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
        .cs-footer-contact-content strong { overflow: hidden; color: #0f172a; font-size: 12px; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
        .cs-footer-contact-content small { color: #64748b; font-size: 10px; line-height: 1.3; }
        .cs-footer-contact-arrow { width: 15px; height: 15px; color: #94a3b8; transition: transform .22s ease, color .22s ease; }
        .cs-footer-contact-card:hover .cs-footer-contact-arrow { color: #0088CC; transform: translateX(3px); }

        .cs-footer-nav { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: start; gap: 26px; padding-top: 8px; }
        .cs-footer-nav-column h4 { margin: 0 0 18px; color: #0f172a; font-size: 11px; font-weight: 900; letter-spacing: .15em; text-transform: uppercase; }
        .cs-footer-nav-column ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 5px; }
        .cs-footer-nav-column li { min-width: 0; }
        .cs-footer-nav-column a { position: relative; width: 100%; display: inline-flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 0; color: #334155; font-size: 13px; font-weight: 700; transition: color .2s ease, transform .2s ease; }
        .cs-footer-nav-column a::after { content: ""; position: absolute; left: 0; right: 100%; bottom: 3px; height: 1px; background: linear-gradient(90deg, #00AEEF, #006BB0); transition: right .24s ease; }
        .cs-footer-nav-column a svg { width: 13px; height: 13px; opacity: 0; transform: translateX(-5px); transition: opacity .2s ease, transform .2s ease; }
        .cs-footer-nav-column a:hover { color: #0088CC; transform: translateX(3px); }
        .cs-footer-nav-column a:hover::after { right: 0; }
        .cs-footer-nav-column a:hover svg { opacity: 1; transform: translateX(0); }

        .cs-footer-bottom { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 22px; border-top: 1px solid rgba(15,23,42,.09); margin-top: 8px; padding-top: 22px; color: #64748b; font-size: 11px; }
        .cs-footer-legal, .cs-footer-status { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
        .cs-footer-legal a { transition: color .2s ease; }
        .cs-footer-legal a:hover { color: #0088CC; text-decoration: underline; text-underline-offset: 3px; }
        .cs-footer-legal-divider { width: 1px; height: 14px; background: rgba(15,23,42,.16); }
        .cs-footer-status { justify-content: flex-end; }
        .cs-footer-status-item { display: inline-flex; align-items: center; gap: 6px; color: #64748b; white-space: nowrap; }
        .cs-footer-status-item svg { width: 13px; height: 13px; color: #0088CC; }
        .cs-footer-top-button { width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; border: 1px solid rgba(0,174,239,.24) !important; color: #006BB0 !important; background: rgba(255,255,255,.72) !important; box-shadow: 0 6px 18px rgba(15,23,42,.06); transition: transform .2s ease, box-shadow .2s ease, background .2s ease; }
        .cs-footer-top-button:hover { transform: translateY(-3px); background: #ffffff !important; box-shadow: 0 10px 24px rgba(0,59,143,.12); }
        .cs-footer-top-button svg { width: 15px; height: 15px; }

        @media (max-width: 1020px) {
          .cs-footer-main { grid-template-columns: minmax(0, 1fr) minmax(350px, .9fr); gap: 34px; }
          .cs-footer-brand { padding-right: 34px; }
          .cs-footer-contact-list { grid-template-columns: 1fr; }
        }
        @media (max-width: 860px) {
          .cs-footer-system-header, .cs-footer-main { display: block; }
          .cs-footer-system-cta { margin-top: 18px; }
          .cs-footer-brand { padding-right: 0; padding-bottom: 34px; border-right: 0; border-bottom: 1px solid rgba(15,23,42,.09); }
          .cs-footer-contact-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .cs-footer-nav { margin-top: 34px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .cs-footer-bottom { align-items: flex-start; flex-direction: column; margin-top: 32px; }
          .cs-footer-status { justify-content: flex-start; }
        }
        @media (max-width: 640px) {
          .cs-footer-contact-list { grid-template-columns: 1fr; }
          .cs-footer-nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .cs-footer-status-item:nth-child(3) { display: none; }
        }
        @media (max-width: 560px) {
          .cs-footer-inner { width: min(100% - 32px, 1180px); }
          .cs-footer-main { padding-top: 44px; }
          .cs-footer-logo-row img { width: min(100%, 250px); }
          .cs-footer-nav { grid-template-columns: 1fr; }
          .cs-footer-legal-divider { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cs-footer *, .cs-footer *::before, .cs-footer *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </footer>
  );
}