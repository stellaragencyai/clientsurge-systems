import { useState } from "react";
import { ArrowUp, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const navColumns = [
  {
    title: "Industries",
    links: [
      { label: "Med Spas & Clinics", href: "/med-spa" },
      // FIX 3: Other industries link to the section — labels now clarify it's a preview
      { label: "Wellness Studios", href: "/#industries" },
      { label: "Real Estate", href: "/#industries" },
      { label: "HVAC & Home Services", href: "/#industries" },
      { label: "Contractors & Trades", href: "/#industries" },
      { label: "Local Service Businesses", href: "/#industries" },
    ],
  },
  {
    title: "Learn More",
    links: [
      { label: "How It Works", href: "/#how-it-works-section" },
      // FIX 8: Added "Our System" to match navbar
      { label: "Our System", href: "/#services" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
      // FIX 5: Added Testimonials link
      { label: "Testimonials", href: "/#testimonials" },
      { label: "Book a Demo", href: "/book" },
      { label: "Contact Us", href: "/contact" },
      { label: "Client Portal", href: "/client-portal" },
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

// FIX 6: socialLinks array removed — was declared but never rendered (dead code)

export default function Footer() {
  const [showTooltip, setShowTooltip] = useState(false);
  const navigate = useNavigate();

  const handleNavClick = (e, href) => {
    e.preventDefault();
    if (href.startsWith("/#")) {
      const anchor = href.slice(1);
      if (window.location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const el = document.querySelector(anchor);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 400);
      } else {
        const el = document.querySelector(anchor);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      // FIX 10: scroll to top when navigating to a new page
      window.scrollTo({ top: 0, behavior: "instant" });
      navigate(href);
    }
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer style={{ background: "hsl(40, 12%, 22%)" }} className="border-t border-primary/20">

      <div className="max-w-7xl mx-auto px-6 pt-14 pb-10">

        {/* Brand tagline */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <span className="text-white font-black text-sm">CS</span>
            </div>
            <span className="font-black text-sm text-amber-100">ClientSurge <span className="text-primary">Systems</span></span>
          </div>
          <p className="text-xs text-amber-100/45 max-w-sm mx-auto leading-relaxed">
            Done-for-you AI automation that turns leads into booked clients — for local service businesses across the US.
          </p>
        </div>

        {/* Navigation columns — centered, Learn More in middle */}
        <div className="flex flex-col sm:flex-row justify-center gap-16 md:gap-28 mb-12 text-center">
          {navColumns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#c8965c" }}>{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      aria-label={`Navigate to ${link.label}`}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="text-xs text-amber-100/60 hover:text-amber-100 hover:underline focus:ring-2 focus:ring-primary focus:outline-none rounded px-1 py-0.5 inline-block transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-7" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Contact info */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-amber-100/50">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3 h-3" />
              <a href="mailto:system@clientsurgesystems.com" className="hover:text-amber-100 hover:underline focus:outline-none transition-colors">
                system@clientsurgesystems.com
              </a>
            </span>
            <span className="hidden sm:inline text-amber-100/20">·</span>
            <span>Phoenix, Arizona</span>
          </div>

          {/* Copyright */}
          <p className="text-xs text-amber-100/35">
            © {new Date().getFullYear()} ClientSurge Systems. All rights reserved.
          </p>

          {/* Back to top with tooltip */}
          <div className="relative">
            <button
              onClick={scrollTop}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all focus:ring-2 focus:ring-primary focus:outline-none"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
              onMouseEnterCapture={(e) => { e.currentTarget.style.borderColor = "rgba(200,150,92,0.5)"; e.currentTarget.style.background = "rgba(200,150,92,0.15)"; }}
              onMouseLeaveCapture={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4 text-amber-100/70" />
            </button>
            {showTooltip && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-foreground text-background font-semibold px-2 py-1 rounded-md pointer-events-none">
                Back to top
              </div>
            )}
          </div>
        </div>
      </div>

    </footer>
  );
}