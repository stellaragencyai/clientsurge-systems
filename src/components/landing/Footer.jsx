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
      <div className="max-w-5xl mx-auto px-6 py-7 flex flex-col items-center gap-5">

        {/* Nav columns — centered, inline */}
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
          {navColumns.map((col) => (
            <div key={col.title} className="flex flex-col items-center gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{col.title}</p>
              {col.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  aria-label={`Navigate to ${link.label}`}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-[11px] text-foreground/50 hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className="w-full border-t border-border/40" />

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-foreground/40">
          <a href="mailto:system@clientsurgesystems.com" className="hover:text-foreground transition-colors">system@clientsurgesystems.com</a>
          <span className="text-foreground/20">·</span>
          <a href="tel:+16025874608" className="hover:text-foreground transition-colors">(602) 587-4608</a>
          <span className="text-foreground/20">·</span>
          <span>Phoenix, AZ</span>
          <span className="text-foreground/20">·</span>
          <span>&copy; {new Date().getFullYear()} ClientSurge Systems</span>
          <button
            onClick={scrollTop}
            onMouseEnter={(e) => { setShowTooltip(true); }}
            onMouseLeave={(e) => { setShowTooltip(false); }}
            className="relative ml-2 w-7 h-7 rounded-full flex items-center justify-center border border-border hover:border-primary/40 hover:bg-primary/5 transition-all focus:ring-2 focus:ring-primary focus:outline-none"
            aria-label="Back to top"
          >
            <ArrowUp className="w-3 h-3 text-foreground/50" />
            {showTooltip && (
              <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-foreground/90 text-background font-semibold px-2 py-0.5 rounded pointer-events-none">
                Back to top
              </div>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}