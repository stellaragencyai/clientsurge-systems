import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import PortalLoginModal from "../forms/PortalLoginModal";
import DemoBookingModal from "../forms/DemoBookingModal";
import { trackCTA } from "@/lib/analytics";
import { usePageViewTracking } from "../../hooks/usePageViewTracking";
import { BUTTON_TEXT } from "@/lib/constants";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";
import { useAuth } from "@/lib/AuthContext";


const sectionLinks = [
{ label: "Automations", href: "/automations", isPage: true },
{ label: "Pricing", href: "#pricing" },
{ label: "About", href: "/about", isPage: true },
{ label: "Contact", href: "/contact", isPage: true }];


const industryLinks = [
{ label: "Med Spas & Aesthetic Clinics", href: "/med-spa", live: true },
{ label: "Dental & Orthodontics", href: "/dental", live: true },
{ label: "Chiropractic & Physical Therapy", href: "/chiropractic", live: true },
{ label: "HVAC, Plumbing & Home Services", href: "/hvac", live: true },
{ label: "Roofing & Restoration", href: "/roofing", live: true },
{ label: "Contractors & Trades", href: "/contractors", live: true }];


const SAFE_SECTION_HASHES = new Set([
"#problem-solution",
"#six-automations",
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
  const { user } = useAuth();

  const mobileUserName = user?.full_name || user?.email?.split("@")[0] || null;
  const mobileUserRole = user?.role ? user.role.replace(/_/g, " ") : null;

  // Track page views
  usePageViewTracking();



  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);







  const handleSectionNavigation = (e, href) => {
    e.preventDefault();
    trackCTA(`nav_${href.replace("#", "")}`, "navbar");
    setOpen(false);
    setIndustriesOpen(false);

    navigate(`/${href}`);
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    trackCTA("nav_logo", "navbar");
    navigate("/");
  };

  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        background: scrolled || open ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.82)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: scrolled || open ? "1px solid rgba(0,136,204,0.14)" : "1px solid rgba(0,136,204,0.08)",
        boxShadow: scrolled ? "0 14px 40px rgba(0,45,90,0.08)" : "0 1px 0 rgba(0,136,204,0.04)",
        overflow: "visible",
      }}>
      
      <div className="w-full flex items-center justify-between px-4 md:px-6" style={{ height: "var(--cs-nav-height)", paddingLeft: "max(1.25rem, env(safe-area-inset-left))", paddingRight: "max(1.25rem, env(safe-area-inset-right))" }}>
        <button
          onClick={handleLogoClick}
          className="shrink-0 bg-none border-none cursor-pointer transition-transform duration-300 hover:-translate-y-0.5"
          style={{ minHeight: "unset", minWidth: "unset", background: "none", padding: 0, overflow: "visible" }}>
          <span
            style={{
              display: "block",
              width: "clamp(132px, 17vw, 204px)",
              height: "clamp(44px, 5.2vw, 64px)",
              overflow: "hidden",
            }}
          >
            <img
              src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png"
              alt="ClientSurge Systems"
              width="240"
              height="72"
              decoding="async"
              style={{
                height: "clamp(80px, 9.5vw, 112px)",
                width: "auto",
                maxWidth: "none",
                objectFit: "contain",
                display: "block",
                transform: "translate(-15px, -20px)",
              }}
            />
          </span>
        </button>

        <div className="hidden xl:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
          {sectionLinks.map((link) =>
          link.isPage ?
          <a
            key={link.href}
            href={link.href}
            onClick={() => {trackCTA(`nav_${link.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "navbar");}}
            className="text-xs lg:text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap">
            
                {link.label}
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
                background: "linear-gradient(90deg, #00AEEF, #009DFF, #003B8F)",
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

        <div className="hidden xl:flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              trackCTA("login", "navbar");
              setShowLoginModal(true);
            }}
            className="hidden md:block text-sm font-semibold text-foreground hover:text-primary border border-border hover:border-primary/40 bg-background/50 focus:ring-2 focus:ring-primary focus:outline-none rounded-full px-4 py-1.5 transition-colors">
            Login
          </button>
          <button
            onClick={() => {
              trackCTA("book_free_audit", "navbar");
              setShowBookingModal(true);
            }}
            style={{ display: "inline-block", borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#00AEEF 0%,#009DFF 45%,#003B8F 100%)", backgroundSize: "200% 100%", animation: "rotateBorderGlow 4s ease-in-out infinite", boxShadow: "0 4px 14px rgba(0,174,239,0.4)", transition: "box-shadow 0.3s ease, transform 0.3s ease", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,174,239,0.55)"}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,174,239,0.4)"}
            className="hidden md:inline-block focus:ring-2 focus:ring-primary focus:outline-none rounded">
            <span style={{ display: "flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 16px", borderRadius: "9999px", background: "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)", color: "#ffffff", fontWeight: "600", fontSize: "0.75rem", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
              Book Free Audit
            </span>
          </button>
        </div>

        <button
          className="xl:hidden w-10 h-10 rounded-full border bg-background/90 backdrop-blur flex items-center justify-center text-foreground shadow-sm"
          onClick={() => setOpen(!open)}
          style={{ borderColor: "rgba(0,136,204,0.22)" }}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}>
          
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open &&
      <>
          <div className="fixed inset-0 z-40 xl:hidden" aria-hidden="true" onClick={() => setOpen(false)} />
        <div className="xl:hidden bg-background border-b border-border px-5 pb-safe-bottom pb-6 pt-2 space-y-1 relative z-50" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
          {sectionLinks.map((link) =>
          link.isPage ?
          <a
            key={link.href}
            href={link.href}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground focus:ring-2 focus:ring-primary focus:outline-none rounded-xl px-3 py-3 transition-colors hover:bg-muted/50"
            style={{ minHeight: "44px" }}
            onClick={() => {
              trackCTA(`nav_${link.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "mobile_nav");
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

          {mobileUserName && (
            <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-1">Signed in</p>
              <p className="text-sm font-semibold text-foreground truncate">{mobileUserName}</p>
              <p className="text-xs text-muted-foreground capitalize">{mobileUserRole || "client"}</p>
            </div>
          )}

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
