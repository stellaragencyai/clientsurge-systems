import { useState } from "react";
import { ArrowUp, Mail, Phone, Shield, Facebook, Instagram, Linkedin, Twitter, FileText, Lock, HelpCircle } from "lucide-react";
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
      { label: "Med Spas & Aesthetic Clinics", href: "/med-spa" },
      { label: "Dental & Orthodontics", href: "/industries#dental" },
      { label: "Chiropractic & PT", href: "/industries#chiropractic" },
      { label: "HVAC & Home Services", href: "/industries#hvac" },
      { label: "All Industries", href: "/industries" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "Login", href: "/client-portal" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
    ],
  },
];

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com/clientsurgesystems", label: "Facebook" },
  { icon: Instagram, href: "https://instagram.com/clientsurgesystems", label: "Instagram" },
  { icon: Linkedin, href: "https://linkedin.com/company/clientsurgesystems", label: "LinkedIn" },
  { icon: Twitter, href: "https://twitter.com/clientsurge", label: "Twitter" },
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

  const navLinks = [
    { icon: HelpCircle, label: "How It Works", href: "/#problem-solution" },
    { icon: FileText, label: "Pricing", href: "/#pricing" },
    { icon: Lock, label: "Privacy", href: "/legal/privacy" },
  ];

  return (
    <footer
      className="relative bg-background/98 backdrop-blur-md border-t border-primary/10"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Enhancement 1: Gradient top accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-0.5 pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent 0%, #9a5c2e 25%, #c8965c 50%, #9a5c2e 75%, transparent 100%)" }}
      />

      {/* Main Footer Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <span className="text-white font-black text-xs">CS</span>
          </div>
          <span className="font-display font-bold text-xs hidden sm:inline">ClientSurge</span>
        </div>

        {/* Center: Icon Navigation (Progressive Disclosure) */}
        <div className="flex items-center gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                title={link.label}
                className="group relative w-8 h-8 rounded-lg border border-primary/15 flex items-center justify-center text-foreground/50 hover:text-primary hover:border-primary/40 transition-all"
              >
                <Icon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                {/* Tooltip on hover */}
                <span className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                  {link.label}
                </span>
              </a>
            );
          })}
        </div>

        {/* Right: Social + Utility Icons */}
        <div className="flex items-center gap-2">
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                title={social.label}
                className="group w-7 h-7 rounded-lg border border-primary/15 flex items-center justify-center text-foreground/50 hover:text-primary hover:border-primary/40 transition-all"
              >
                <Icon className="w-3 h-3 group-hover:scale-110 transition-transform" />
              </a>
            );
          })}
          
          <button
            onClick={scrollTop}
            title="Back to top"
            className="group w-7 h-7 rounded-lg border border-primary/15 flex items-center justify-center text-foreground/50 hover:text-primary hover:border-primary/40 transition-all ml-1"
          >
            <ArrowUp className="w-3 h-3 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Expanded Menu (Always Visible) */}
      <div className="border-t border-primary/10 bg-background/98 backdrop-blur-md animate-in fade-in duration-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 text-xs">
          {navColumns.map((col) => (
            <div key={col.title} className="flex flex-col gap-2">
              <h4 className="font-bold uppercase tracking-widest text-primary text-[10px]">{col.title}</h4>
              <div className="flex flex-col gap-1.5">
                {col.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-foreground/60 hover:text-foreground transition-colors text-[11px]"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
          
          {/* Contact Column */}
          <div className="flex flex-col gap-2">
            <h4 className="font-bold uppercase tracking-widest text-primary text-[10px]">Contact</h4>
            <a href="tel:+16025874608" className="text-foreground/60 hover:text-foreground text-[11px] flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-primary" />
              (602) 587-4608
            </a>
            <a href="mailto:system@clientsurgesystems.com" className="text-foreground/60 hover:text-foreground text-[11px] flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-primary" />
              system@clientsurgesystems.com
            </a>
          </div>
        </div>
        
        {/* Enhancement 2: Rich bottom strip with mini-CTA + trust badges */}
        <div
          className="border-t border-primary/10 px-4 md:px-6 py-5"
          style={{ background: "linear-gradient(135deg, rgba(154,92,46,0.04) 0%, rgba(200,150,92,0.02) 100%)" }}
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Trust badges row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              {[
                "🔒 No long-term contracts",
                "⚡ Live in 5–7 days",
                "💬 SMS + Email included",
              ].map((badge) => (
                <span
                  key={badge}
                  className="text-[10px] font-semibold px-3 py-1.5 rounded-full"
                  style={{
                    background: "rgba(154,92,46,0.07)",
                    border: "1px solid rgba(154,92,46,0.14)",
                    color: "rgba(154,92,46,0.85)",
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>
            {/* Copyright */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-[9px] text-foreground/40">
              <span>&copy; {new Date().getFullYear()} ClientSurge Systems</span>
              <span className="text-foreground/20">·</span>
              <a href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</a>
              <span className="text-foreground/20">·</span>
              <a href="/legal/terms" className="hover:text-foreground transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}