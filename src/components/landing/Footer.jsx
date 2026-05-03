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
  { label: "Get Your Free Audit", href: "/contact" }]

},
{
  title: "Industries",
  links: [
  { label: "Med Spas & Aesthetics", href: "/med-spa" },
  { label: "Dental & Orthodontics", href: "/dental" },
  { label: "Chiropractic & PT", href: "/chiropractic" },
  { label: "HVAC & Home Services", href: "/hvac" },
  { label: "All Industries", href: "/industries" }]

},
{
  title: "Company",
  links: [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
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

  return (
    <footer
      className="relative"
      style={{
        background: "linear-gradient(180deg, #0A1628 0%, #050d1a 100%)",
        paddingBottom: "env(safe-area-inset-bottom)"
      }}>
      
      {/* Top gradient accent */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background:
          "linear-gradient(90deg, transparent 0%, #9a5c2e 25%, #c8965c 50%, #9a5c2e 75%, transparent 100%)"
        }} />
      

      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 md:gap-12">
          {/* Brand column */}
          <div className="lg:col-span-1 flex flex-col gap-6">


            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              Done-for-you AI automation that turns missed leads into booked
              appointments — built for service businesses.
            </p>

            {/* Contact */}
            <div className="flex flex-col gap-3">
              <a
                href="tel:+16025843227"
                className="flex items-center gap-3 group transition-colors"
                style={{ color: "rgba(255,255,255,0.55)" }}>
                
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-primary/30"
                  style={{
                    background: "rgba(154,92,46,0.15)",
                    border: "1px solid rgba(154,92,46,0.25)"
                  }}>
                  
                  <Phone className="w-3.5 h-3.5" style={{ color: "#c8965c" }} />
                </div>
                <span className="text-sm font-medium group-hover:text-white transition-colors">
                  (602) 584-3227
                </span>
              </a>
              <a
                href="mailto:support@clientsurgesystems.com"
                className="flex items-center gap-3 group transition-colors"
                style={{ color: "rgba(255,255,255,0.55)" }}>
                
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-primary/30"
                  style={{
                    background: "rgba(154,92,46,0.15)",
                    border: "1px solid rgba(154,92,46,0.25)"
                  }}>
                  
                  <Mail className="w-3.5 h-3.5" style={{ color: "#c8965c" }} />
                </div>
                <span className="text-xs font-medium group-hover:text-white transition-colors break-all">
                  support@clientsurgesystems.com
                </span>
              </a>
            </div>
          </div>

          {/* Nav columns */}
          <div className="footer-nav-grid lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {navColumns.map((col) =>
            <div key={col.title} className="flex flex-col gap-4">
                <h4
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ color: "#ffffff" }}>
                
                  {col.title}
                </h4>
                <div className="flex flex-col gap-2.5">
                  {col.links.map((link) =>
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-sm transition-colors hover:translate-x-0.5 duration-150"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                  onMouseEnter={(e) =>
                  e.currentTarget.style.color = "rgba(255,255,255,0.9)"
                  }
                  onMouseLeave={(e) =>
                  e.currentTarget.style.color =
                  "rgba(255,255,255,0.5)"
                  }>
                  
                      {link.label}
                    </a>
                )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          
          <div
            className="flex items-center gap-4 text-xs"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            
            <span>© {new Date().getFullYear()} ClientSurge Systems</span>
            <span className="hidden sm:inline">·</span>
            <a
              href="/legal/privacy" className="hidden sm:inline hover:text-white transition-colors hidden">
              
              
              Privacy
            </a>
            <span className="hidden sm:inline">·</span>
            <a
              href="/legal/terms" className="hidden sm:inline hover:text-white transition-colors hidden">

              
              Terms
            </a>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "rgba(255,255,255,0.3)" }}>
              
              <Shield className="w-3 h-3" style={{ color: "#c8965c" }} />
              <span>SSL Encrypted</span>
            </div>
            <button
              onClick={scrollTop}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: "rgba(154,92,46,0.2)",
                border: "1px solid rgba(154,92,46,0.3)"
              }}
              title="Back to top">
              
              <ArrowUp className="w-3.5 h-3.5" style={{ color: "#c8965c" }} />
            </button>
          </div>
        </div>
      </div>
    </footer>);

}