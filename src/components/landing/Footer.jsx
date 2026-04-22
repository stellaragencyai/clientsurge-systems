import { useState } from "react";
import { ArrowUp, Mail, Phone, Shield, Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDemoBooking } from "./DemoBookingContext";

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
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Twitter, href: "#", label: "Twitter" },
];

export default function Footer() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
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
      <div className="max-w-7xl mx-auto px-6 py-16">
        
        {/* Premium Header Section */}
        <div className="grid md:grid-cols-5 gap-12 mb-12">
          
          {/* Brand + CTA Section */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <span className="text-white font-black text-sm">CS</span>
              </div>
              <span className="font-display font-bold text-sm">ClientSurge</span>
            </div>
            <p className="text-xs text-foreground/60 font-medium">Ready to transform your lead game?</p>
            <button
              onClick={() => demoBooking?.openDemoBooking?.()}
              className="rounded-full px-4 py-2 bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all"
            >
              Book Demo
            </button>
          </div>

          {/* Link Columns */}
          {navColumns.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary">{col.title}</h3>
              <div className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-xs text-foreground/60 hover:text-foreground font-medium transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}

          {/* Contact Column */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Contact</h3>
            <div className="flex flex-col gap-2.5">
              <a
                href="tel:+16025874608"
                className="flex items-center gap-2 text-xs text-foreground/60 hover:text-foreground font-medium transition-colors group"
              >
                <Phone className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                (602) 587-4608
              </a>
              <a
                href="mailto:system@clientsurgesystems.com"
                className="flex items-center gap-2 text-xs text-foreground/60 hover:text-foreground font-medium transition-colors group"
              >
                <Mail className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                system@clientsurgesystems.com
              </a>
            </div>
          </div>
        </div>

        {/* Premium Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mb-8" />

        {/* Social + Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Social Icons */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-full border border-primary/20 flex items-center justify-center text-foreground/50 hover:text-primary hover:border-primary/50 transition-all group"
                >
                  <Icon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                </a>
              );
            })}
          </div>

          {/* Copyright + Privacy */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-foreground/40">
            <span>&copy; {new Date().getFullYear()} ClientSurge Systems</span>
            <span className="text-foreground/20">·</span>
            <a href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</a>
            <span className="text-foreground/20">·</span>
            <a href="/legal/terms" className="hover:text-foreground transition-colors">Terms</a>
            <span className="text-foreground/20">·</span>
            
            {/* Privacy Choices Toggle */}
            <button
              onClick={() => setPrivacyOpen(!privacyOpen)}
              className="flex items-center gap-1 hover:text-foreground transition-colors group"
              title="Privacy choices"
            >
              My Privacy Choices
              <Shield className="w-2.5 h-2.5 group-hover:scale-110 transition-transform" />
            </button>

            {/* Back to Top */}
            <span className="text-foreground/20">·</span>
            <button
              onClick={scrollTop}
              className="flex items-center gap-1 hover:text-foreground transition-colors group"
              title="Back to top"
            >
              <ArrowUp className="w-2.5 h-2.5 group-hover:scale-110 transition-transform" />
              Top
            </button>
          </div>
        </div>

        {/* System Requirements Footer */}
        <div className="mt-8 pt-6 border-t border-border/30 text-center">
          <p className="text-[9px] text-foreground/30 font-medium tracking-wide uppercase">
            ClientSurge Systems © 2026 | Automating lead follow-up for service businesses
          </p>
        </div>
      </div>
    </footer>
  );
}