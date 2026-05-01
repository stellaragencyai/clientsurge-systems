import { useState } from "react";
import { ArrowUp, Mail, Phone, Shield, FileText, Lock, HelpCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navColumns = [
{
  title: "Platform",
  links: [
  { label: "How It Works", href: "/#problem-solution" },
  { label: "Our System", href: "/#services" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
  { label: "Demos & Setup", href: "/book" }]

},
{
  title: "Industries",
  links: [
  { label: "Med Spas & Aesthetic Clinics", href: "/med-spa" },
  { label: "Dental & Orthodontics", href: "/dental" },
  { label: "Chiropractic & PT", href: "/chiropractic" },
  { label: "HVAC & Home Services", href: "/hvac" },
  { label: "All Industries", href: "/industries" }]

},
{
  title: "Resources",
  links: [
  { label: "Contact Us", href: "/contact" },
  { label: "Login", href: "/client-portal" },
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Terms of Service", href: "/legal/terms" }]

}];




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
  { icon: Lock, label: "Privacy", href: "/legal/privacy" }];


  return (
    <footer
      className="relative bg-background/98 backdrop-blur-md border-t border-primary/10"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      
      {/* Enhancement 1: Gradient top accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-0.5 pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent 0%, #9a5c2e 25%, #c8965c 50%, #9a5c2e 75%, transparent 100%)" }} />
      

      {/* Main Footer Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between hidden">
        
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
                className="group relative w-8 h-8 rounded-lg border border-primary/15 flex items-center justify-center text-foreground/50 hover:text-primary hover:border-primary/40 transition-all">
                
                <Icon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                {/* Tooltip on hover */}
                <span className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                  {link.label}
                </span>
              </a>);

          })}
        </div>

        {/* Right: Social + Utility Icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={scrollTop}
            title="Back to top"
            className="group w-7 h-7 rounded-lg border border-primary/15 flex items-center justify-center text-foreground/50 hover:text-primary hover:border-primary/40 transition-all ml-1">
            
            <ArrowUp className="w-3 h-3 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Expanded Menu (Two Column Layout) */}
      <div className="border-t border-primary/10 bg-background/98 backdrop-blur-md animate-in fade-in duration-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 hidden">
          
          {/* Left: Navigation Columns */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-8">
            {navColumns.map((col) =>
            <div key={col.title} className="flex flex-col gap-3">
                <h4 className="font-bold uppercase tracking-widest text-primary text-[10px]">{col.title}</h4>
                <div className="flex flex-col gap-2">
                  {col.links.map((link) =>
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-foreground/60 hover:text-foreground transition-colors text-[11px] hover:translate-x-0.5">
                  
                      {link.label}
                    </a>
                )}
                </div>
              </div>
            )}
          </div>
          
          {/* Right: Contact Card */}
          <div className="lg:col-span-1">
            <div
              className="rounded-2xl p-5 h-full flex flex-col gap-4"
              style={{
                background: "linear-gradient(135deg, rgba(154,92,46,0.08) 0%, rgba(200,150,92,0.04) 100%)",
                border: "1px solid rgba(154,92,46,0.15)"
              }}>
              
              <h4 className="font-bold uppercase tracking-widest text-primary text-[10px]">Get in Touch</h4>
              <div className="flex flex-col gap-3">
                <a href="tel:+16025843227" className="flex items-start gap-3 text-foreground/70 hover:text-foreground transition-colors group">
                  <Phone className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-primary/70 uppercase tracking-wider">Phone</span>
                    <span className="text-[12px] font-semibold group-hover:text-primary">(602) 584-3227</span>
                  </div>
                </a>
                <a href="mailto:nolan@clientsurgesystems.com" className="flex items-start gap-3 text-foreground/70 hover:text-foreground transition-colors group">
                  <Mail className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-primary/70 uppercase tracking-wider">Email</span>
                    <span className="text-[11px] font-semibold group-hover:text-primary break-all">nolan@clientsurgesystems.com</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhancement 2: Rich bottom strip with trust badges + security info */}
        <div className="border-t border-primary/10 px-4 md:px-6 py-6 hidden"

        style={{ background: "linear-gradient(135deg, rgba(154,92,46,0.06) 0%, rgba(200,150,92,0.03) 100%)" }}>
          
          <div className="max-w-7xl mx-auto">
            {/* Trust badges row */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
              {[
              { icon: "🔒", text: "No long-term contracts" },
              { icon: "⚡", text: "Live in 5–7 days" },
              { icon: "💬", text: "SMS + Email included" }].
              map((badge) =>
              <div
                key={badge.text}
                className="flex items-center gap-2 text-[11px] font-semibold px-4 py-2 rounded-full"
                style={{
                  background: "rgba(154,92,46,0.09)",
                  border: "1px solid rgba(154,92,46,0.18)",
                  color: "rgba(154,92,46,0.9)"
                }}>
                
                  <span className="text-sm">{badge.icon}</span>
                  <span className=" hidden">{badge.text}</span>
                </div>
              )}
            </div>

            {/* Copyright + Security */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[9px] text-foreground/40 pt-5 border-t border-primary/8 hidden">
              <div className="flex items-center gap-1.5">
                <span>&copy; {new Date().getFullYear()} ClientSurge Systems</span>
                <span>·</span>
                <a href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</a>
                <span>·</span>
                <a href="/legal/terms" className="hover:text-foreground transition-colors">Terms</a>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-primary/60" />
                <span>Secure & SSL Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>);

}