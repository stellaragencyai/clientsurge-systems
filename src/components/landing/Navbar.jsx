import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import PortalLoginModal from "../forms/PortalLoginModal";
import DemoBookingModal from "../forms/DemoBookingModal";
import { trackCTA } from "@/lib/analytics";
import { usePageViewTracking } from "../../hooks/usePageViewTracking";
import { BUTTON_TEXT } from "@/lib/constants";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";


const sectionLinks = [
{ label: "How It Works", href: "#problem-solution" },
{ label: "AI Store", href: "/store", isPage: true },
{ label: "Pricing", href: "#pricing" },
{ label: "FAQ", href: "#faq" }];


const industryLinks = [
{ label: "Med Spas & Aesthetic Clinics", href: "/med-spa", live: true },
{ label: "Dental & Orthodontics", href: "/dental", live: true },
{ label: "Chiropractic & Physical Therapy", href: "/chiropractic", live: true },
{ label: "HVAC, Plumbing & Home Services", href: "/hvac", live: true },
{ label: "Roofing & Restoration", href: "/roofing", live: true },
{ label: "Contractors & Trades", href: "/contractors", live: true }];


const SAFE_SECTION_HASHES = new Set([
"#problem-solution",
"#services",
"#pricing",
"#faq",
"#testimonials",
"#industries",
"#book-demo"]
);

function safeGetThemePreference() {
  try {
    return window.localStorage.getItem("theme-preference");
  } catch {
    return null;
  }
}

function safeSetThemePreference(value) {
  try {
    window.localStorage.setItem("theme-preference", value);
  } catch {




    // Ignore storage failures in embedded preview environments.
  }}function safeApplyTheme(isDark) {try {
    document.documentElement.classList.toggle("dark", isDark);
  } catch {




    // Ignore DOM theme failures in preview environments.
  }}function getSafeHashTarget(hash) {if (!hash || !SAFE_SECTION_HASHES.has(hash)) {
    return null;
  }

  const elementId = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!elementId) {
    return null;
  }

  try {
    return document.getElementById(elementId);
  } catch {
    return null;
  }
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    return acquireBodyScrollLock("landing-mobile-nav");
  }, [open]);
  const [scrolled, setScrolled] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [industriesOpen, setIndustriesOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Track page views
  usePageViewTracking();



  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);







  const handleSectionNavigation = (e, href) => {
    e.preventDefault();
    trackCTA(`nav_${href.replace("#", "")}`, "navbar");
    setOpen(false);
    setIndustriesOpen(false);

    if (location.pathname === "/") {
      // Already on home — scroll directly
      const id = href.startsWith("#") ? href.slice(1) : href;
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // Navigate to home only — no auto-scroll
      navigate("/");
    }
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    trackCTA("nav_logo", "navbar");
    navigate("/");
  };

  return (
    <nav
      className="fixed top-4 left-4 right-4 z-50 rounded-[28px] border"
      style={{
        borderColor: scrolled ? "rgba(0,174,239,0.2)" : "rgba(0,174,239,0)",
        backgroundColor: scrolled ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0)",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        paddingTop: "env(safe-area-inset-top)",
        boxShadow: scrolled ? "0 20px 60px rgba(0,100,200,0.1)" : "none",
        transition: "background-color 0.35s ease-out, box-shadow 0.35s ease-out, border-color 0.35s ease-out"
      }}>
      
      <div className="w-full h-[100px] md:h-[116px] flex items-center justify-between px-4 md:px-6" style={{ paddingLeft: "max(1.25rem, env(safe-area-inset-left))", paddingRight: "max(1.25rem, env(safe-area-inset-right))" }}>
        <button
          onClick={handleLogoClick}
          className="shrink-0 bg-none border-none cursor-pointer transition-transform duration-300 hover:-translate-y-0.5"
          style={{ minHeight: "unset", minWidth: "unset", background: "none", padding: 0 }}>
          <img
            src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png"
            alt="ClientSurge Systems"
            fetchPriority="high"
            decoding="async"
            style={{
              height: "clamp(80px, 10vw, 110px)",
              width: "auto",
              objectFit: "contain",
              mixBlendMode: "multiply",
              display: "block",
            }}
          />
        </button>

        <div className="hidden lg:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
          {sectionLinks.map((link) =>
          link.isPage ?
          <a
            key={link.href}
            href={link.href}
            onClick={() => {trackCTA("ai_store", "navbar");}}
            className="text-xs lg:text-sm font-semibold text-primary hover:text-primary/80 transition-colors border border-primary/25 px-2 lg:px-3 py-1 rounded-full hover:bg-primary/5 whitespace-nowrap">
            
                {link.label} ✦
              </a> :

          <a
            key={link.href}
            href={`/${link.href}`}
            onClick={(e) => handleSectionNavigation(e, link.href)}
            className="text-xs lg:text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap relative group"
            style={{ position: "relative", paddingBottom: "2px" }}>
            
                {link.label}
                <span
              className="group-hover:[transform:scaleX(1)]"
              style={{
                position: "absolute",
                bottom: "-2px",
                left: 0,
                height: "2px",
                width: "100%",
                background: "linear-gradient(90deg, #c8965c, #f5d9a8, #c8965c)",
                borderRadius: "1px",
                transform: "scaleX(0)",
                transformOrigin: "left",
                transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                display: "block"
              }} />
            
              </a>

          )}

          <div
            className="relative"
            onMouseEnter={() => setIndustriesOpen(true)}
            onMouseLeave={() => setIndustriesOpen(false)}
            onKeyDown={(e) => {if (e.key === "Escape") setIndustriesOpen(false);}}>
            
            <button
              onClick={() => setIndustriesOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs lg:text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap">
              
              Industries
              <ChevronDown className={`w-4 h-4 transition-transform ${industriesOpen ? "rotate-180" : ""}`} />
            </button>

            {industriesOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2" style={{ zIndex: 200 }}>
                <div
                className="rounded-2xl border border-border p-4 shadow-xl"
                style={{
                  background: "rgba(255,255,255,0.98)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  width: "460px"
                }}>
                  <div className="grid grid-cols-2 gap-1">
                    {industryLinks.map((item) =>
                  <button
                    key={item.label}
                    onClick={() => {
                      trackCTA(`industry_${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "navbar_dropdown");
                      navigate(item.href);
                      setIndustriesOpen(false);
                    }}
                    className="w-full text-left block rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-primary/8 hover:text-primary transition-colors border-none bg-transparent cursor-pointer">
                        {item.label}
                      </button>
                  )}
                  </div>
                </div>
              </div>)
            }
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
          <button
            onClick={() => {trackCTA("client_dashboard", "navbar");navigate("/client-dashboard");}}
            className="hidden lg:block text-xs font-semibold text-muted-foreground hover:text-primary border border-border hover:border-primary/40 bg-background/50 focus:ring-2 focus:ring-primary focus:outline-none rounded-full px-3 py-1.5 transition-colors">
            
            Dashboard
          </button>
          <button
            onClick={() => {
              trackCTA("login", "navbar");
              setShowLoginModal(true);
            }}
            className="hidden lg:block text-sm font-semibold text-foreground hover:text-primary border border-border hover:border-primary/40 bg-background/50 focus:ring-2 focus:ring-primary focus:outline-none rounded-full px-4 py-1.5 transition-colors">
            
            Login
          </button>
          <button
            onClick={() => {
              trackCTA("book_demo", "navbar");
              setShowBookingModal(true);
            }}
            style={{ display: "inline-block", borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#00AEEF 0%,#009DFF 45%,#003B8F 100%)", backgroundSize: "200% 100%", animation: "rotateBorderGlow 4s ease-in-out infinite", boxShadow: "0 4px 14px rgba(0,174,239,0.4)", transition: "box-shadow 0.3s ease, transform 0.3s ease", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,174,239,0.55)"}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,174,239,0.4)"}
            className="hidden md:inline-block focus:ring-2 focus:ring-primary focus:outline-none rounded">
            
            <span style={{ display: "flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 16px", borderRadius: "9999px", background: "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)", color: "#ffffff", fontWeight: "600", fontSize: "0.75rem", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
              {BUTTON_TEXT.BOOK_DEMO_SHORT}
            </span>
          </button>
        </div>

        <button
          className="md:hidden w-10 h-10 rounded-full border bg-background/90 backdrop-blur flex items-center justify-center text-foreground shadow-sm"
          onClick={() => setOpen(!open)}
          style={{ borderColor: "rgba(200,150,92,0.2)" }}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}>
          
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open &&
      <>
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)} />
        <div className="md:hidden bg-background border-b border-border px-5 pb-safe-bottom pb-6 pt-2 space-y-1 relative z-50" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
          {sectionLinks.map((link) =>
          link.isPage ?
          <a
            key={link.href}
            href={link.href}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground focus:ring-2 focus:ring-primary focus:outline-none rounded-xl px-3 py-3 transition-colors hover:bg-muted/50"
            style={{ minHeight: "44px" }}
            onClick={() => {
              trackCTA("ai_store", "mobile_nav");
              setOpen(false);
            }}>
            
                {link.label}
              </a> :

          <a
            key={link.href}
            href={`/${link.href}`}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground focus:ring-2 focus:ring-primary focus:outline-none rounded-xl px-3 py-3 transition-colors hover:bg-muted/50"
            style={{ minHeight: "44px" }}
            onClick={(e) => {
              handleSectionNavigation(e, link.href);
              setOpen(false);
            }}>
            
                {link.label}
              </a>

          )}

          <div className="pt-2 border-t border-border">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-2" style={{ color: "#00AEEF" }}>Industries</p>
            <div className="space-y-1">
              {industryLinks.map((item) =>
              <button
                key={item.label}
                onClick={() => {
                  trackCTA(`industry_${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "mobile_nav");
                  navigate(item.href);
                  setOpen(false);
                }}
                className="w-full text-left flex items-center rounded-xl px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:ring-2 focus:ring-primary focus:outline-none border-none bg-transparent cursor-pointer transition-colors"
                style={{ minHeight: "44px" }}>
                
                  {item.label}
                </button>
              )}
            </div>
          </div>



          <button
            onClick={() => {
              trackCTA("book_demo", "mobile_nav");
              setOpen(false);
              setShowBookingModal(true);
            }}
            style={{ display: "block", borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#00AEEF 0%,#009DFF 45%,#003B8F 100%)", boxShadow: "0 4px 14px rgba(0,174,239,0.4)", border: "none", cursor: "pointer", width: "100%" }}>
            
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", height: "40px", borderRadius: "9999px", background: "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)", color: "#ffffff", fontWeight: "600", fontSize: "0.875rem", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
              {BUTTON_TEXT.BOOK_DEMO}
            </span>
          </button>
        </div>
        </>
      }

      {showLoginModal && <PortalLoginModal onClose={() => setShowLoginModal(false)} />}
      {showBookingModal && <DemoBookingModal onClose={() => setShowBookingModal(false)} />}
    </nav>);

}