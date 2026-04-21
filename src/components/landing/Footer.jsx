import { useState } from "react";
import { ArrowUp, Mail, Phone } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDemoBooking } from "./DemoBookingContext";

const navColumns = [
  {
    title: "Industries",
    links: [
      { label: "Med Spas & Aesthetic Clinics", href: "/med-spa" },
      { label: "Dental & Orthodontics", href: "/industries#dental" },
      { label: "Chiropractic & Physical Therapy", href: "/industries#chiropractic" },
      { label: "HVAC, Plumbing & Home Services", href: "/industries#hvac" },
      { label: "Roofing & Restoration", href: "/industries#roofing" },
      { label: "Contractors & Trades", href: "/industries#contractors" },
      { label: "All Industries", href: "/industries" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "How It Works", href: "/#problem-solution" },
      { label: "Our System", href: "/#services" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "Legal & Policies",
    links: [
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Cookie Policy", href: "/legal/cookies" },
    ],
  },
];

export default function Footer() {
  const [showTooltip, setShowTooltip] = useState(false);
  const demoBooking = useDemoBooking();
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
    <footer className="bg-background border-t border-primary/20">
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-10">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <span className="text-white font-black text-sm">CS</span>
            </div>
            <span className="font-black text-sm text-foreground">ClientSurge <span className="text-primary">Systems</span></span>
          </div>
          <p className="text-xs text-foreground/50 max-w-sm mx-auto leading-relaxed">
            Done-for-you AI automation that turns leads into booked clients for local service businesses across the US.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 md:gap-16 mb-10 text-center">
          {navColumns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-widest mb-5 text-primary">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      aria-label={`Navigate to ${link.label}`}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="text-xs text-foreground/55 hover:text-foreground hover:underline focus:ring-2 focus:ring-primary focus:outline-none rounded px-1 py-0.5 inline-block transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-foreground/55 mb-10">
          <a
            href="/book"
            onClick={(e) => {
              if (demoBooking && location.pathname === "/") {
                e.preventDefault();
                demoBooking.openDemoBooking();
                return;
              }
              handleNavClick(e, "/book");
            }}
            className="hover:text-foreground hover:underline focus:ring-2 focus:ring-primary focus:outline-none rounded px-1 py-0.5 transition-colors"
          >
            Book Your Free Demo
          </a>
          <span className="text-foreground/20">|</span>
          <a
            href="/client-portal"
            onClick={(e) => handleNavClick(e, "/client-portal")}
            className="hover:text-foreground hover:underline focus:ring-2 focus:ring-primary focus:outline-none rounded px-1 py-0.5 transition-colors"
          >
            Client Portal
          </a>
        </div>

        <div className="border-t border-white/10 mb-7" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-foreground/50">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3 h-3" />
              <a href="mailto:system@clientsurgesystems.com" className="hover:text-foreground hover:underline focus:outline-none transition-colors">
                system@clientsurgesystems.com
              </a>
            </span>
            <span className="hidden sm:inline text-foreground/20">&middot;</span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3 h-3" />
              <a href="tel:+16025874608" className="hover:text-foreground hover:underline focus:outline-none transition-colors">
                (602) 587-4608
              </a>
            </span>
            <span className="hidden sm:inline text-foreground/20">&middot;</span>
            <span>Phoenix, Arizona</span>
          </div>

          <p className="text-xs text-foreground/40">
            &copy; {new Date().getFullYear()} ClientSurge Systems. All rights reserved.
          </p>

          <div className="relative">
            <button
              onClick={scrollTop}
              onMouseEnter={(e) => { setShowTooltip(true); e.currentTarget.style.borderColor = "rgba(154,92,46,0.5)"; e.currentTarget.style.background = "rgba(154,92,46,0.1)"; }}
              onMouseLeave={(e) => { setShowTooltip(false); e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; e.currentTarget.style.background = "rgba(0,0,0,0.06)"; }}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all focus:ring-2 focus:ring-primary focus:outline-none"
              style={{ background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.12)" }}
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4 text-foreground/60" />
            </button>
            {showTooltip && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-foreground/90 text-background font-semibold px-2 py-1 rounded-md pointer-events-none">
                Back to top
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

