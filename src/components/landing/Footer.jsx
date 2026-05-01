import { ArrowUp, Mail, Phone, Shield } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navColumns = [
  {
    title: "Platform",
    links: [
      { label: "How It Works", href: "/#problem-solution" },
      { label: "Our System", href: "/#services" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
      { label: "Demos & Setup", href: "/book" },
    ],
  },
  {
    title: "Industries",
    links: [
      { label: "Med Spas & Aesthetics", href: "/med-spa" },
      { label: "Dental & Orthodontics", href: "/dental" },
      { label: "Chiropractic & PT", href: "/chiropractic" },
      { label: "HVAC & Home Services", href: "/hvac" },
      { label: "All Industries", href: "/industries" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "Client Portal", href: "/client-portal" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
    ],
  },
];

const trustBadges = [
  { icon: "🔒", text: "No long-term contracts" },
  { icon: "⚡", text: "Live in 5–7 business days" },
  { icon: "💬", text: "SMS + Email included" },
  { icon: "🎯", text: "Done-for-you setup" },
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
    <footer
      className="relative"
      style={{
        background: "linear-gradient(180deg, #1a0f05 0%, #0f0905 100%)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Top gradient accent */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #9a5c2e 25%, #c8965c 50%, #9a5c2e 75%, transparent 100%)",
        }}
      />

      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 md:gap-12">
          {/* Brand column */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, #9a5c2e 0%, #c8965c 100%)",
                }}
              >
                <span className="text-white font-black text-sm">CS</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-display font-bold text-white text-base">
                  ClientSurge
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#c8965c" }}
                >
                  Systems
                </span>
              </div>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              Done-for-you AI automation that turns missed leads into booked
              appointments — built for service businesses.
            </p>

            {/* Contact */}
            <div className="flex flex-col gap-3">
              <a
                href="tel:+16025843227"
                className="flex items-center gap-3 group transition-colors"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-primary/30"
                  style={{
                    background: "rgba(154,92,46,0.15)",
                    border: "1px solid rgba(154,92,46,0.25)",
                  }}
                >
                  <Phone className="w-3.5 h-3.5" style={{ color: "#c8965c" }} />
                </div>
                <span className="text-sm font-medium group-hover:text-white transition-colors">
                  (602) 584-3227
                </span>
              </a>
              <a
                href="mailto:nolan@clientsurgesystems.com"
                className="flex items-center gap-3 group transition-colors"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-primary/30"
                  style={{
                    background: "rgba(154,92,46,0.15)",
                    border: "1px solid rgba(154,92,46,0.25)",
                  }}
                >
                  <Mail className="w-3.5 h-3.5" style={{ color: "#c8965c" }} />
                </div>
                <span className="text-xs font-medium group-hover:text-white transition-colors break-all">
                  nolan@clientsurgesystems.com
                </span>
              </a>
            </div>
          </div>

          {/* Nav columns */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {navColumns.map((col) => (
              <div key={col.title} className="flex flex-col gap-4">
                <h4
                  className="text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: "#c8965c" }}
                >
                  {col.title}
                </h4>
                <div className="flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="text-sm transition-colors hover:translate-x-0.5 duration-150"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "rgba(255,255,255,0.9)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color =
                          "rgba(255,255,255,0.5)")
                      }
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div
          className="mt-12 pt-8 flex flex-wrap gap-3 justify-center"
          style={{ borderTop: "1px solid rgba(154,92,46,0.15)" }}
        >
          {trustBadges.map((badge) => (
            <div
              key={badge.text}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
              style={{
                background: "rgba(154,92,46,0.1)",
                border: "1px solid rgba(154,92,46,0.2)",
                color: "rgba(200,150,92,0.9)",
              }}
            >
              <span>{badge.icon}</span>
              <span>{badge.text}</span>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="flex items-center gap-4 text-xs"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            <span>© {new Date().getFullYear()} ClientSurge Systems</span>
            <span className="hidden sm:inline">·</span>
            <a
              href="/legal/privacy"
              className="hidden sm:inline hover:text-white transition-colors"
            >
              Privacy
            </a>
            <span className="hidden sm:inline">·</span>
            <a
              href="/legal/terms"
              className="hidden sm:inline hover:text-white transition-colors"
            >
              Terms
            </a>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              <Shield className="w-3 h-3" style={{ color: "#c8965c" }} />
              <span>SSL Encrypted</span>
            </div>
            <button
              onClick={scrollTop}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: "rgba(154,92,46,0.2)",
                border: "1px solid rgba(154,92,46,0.3)",
              }}
              title="Back to top"
            >
              <ArrowUp className="w-3.5 h-3.5" style={{ color: "#c8965c" }} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}