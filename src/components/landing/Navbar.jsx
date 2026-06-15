import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import PortalLoginModal from "../forms/PortalLoginModal";
import LaunchCountdownTimer from "@/components/campaign/LaunchCountdownTimer";
import { trackCTA } from "@/lib/analytics";
import { usePageViewTracking } from "../../hooks/usePageViewTracking";
import { BUTTON_TEXT } from "@/lib/constants";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { SITE_CONFIG } from "@/lib/siteConfig";

const sectionLinks = SITE_CONFIG.navigation.sections;
const solutionsLinks = SITE_CONFIG.navigation.solutions;
const industryLinks = SITE_CONFIG.industries;




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
  const [industriesOpen, setIndustriesOpen] = useState(false);
  const [industriesMenuPosition, setIndustriesMenuPosition] = useState({ left: 0, top: 0, width: 560 });
  const industriesCloseTimerRef = useRef(null);
  const industriesTriggerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const mobileUserName = user?.full_name || user?.email?.split("@")[0] || null;
  const mobileUserRole = user?.role ? user.role.replace(/_/g, " ") : null;

  const isActivePage = (href) => {
    if (href === "/" ) return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  // Track page views
  usePageViewTracking();



  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!industriesOpen) {
      return undefined;
    }

    const updateIndustriesMenuPosition = () => {
      const trigger = industriesTriggerRef.current;
      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
      const menuWidth = Math.min(560, Math.max(320, viewportWidth - 32));
      const preferredLeft = rect.left + rect.width / 2 - menuWidth / 2;
      const left = Math.min(Math.max(preferredLeft, 16), Math.max(16, viewportWidth - menuWidth - 16));

      setIndustriesMenuPosition({
        left,
        top: rect.bottom + 10,
        width: menuWidth,
      });
    };

    updateIndustriesMenuPosition();
    window.addEventListener("resize", updateIndustriesMenuPosition);
    window.addEventListener("scroll", updateIndustriesMenuPosition, { passive: true });

    return () => {
      window.removeEventListener("resize", updateIndustriesMenuPosition);
      window.removeEventListener("scroll", updateIndustriesMenuPosition);
    };
  }, [industriesOpen]);

  useEffect(() => {
    return () => {
      if (industriesCloseTimerRef.current) {
        window.clearTimeout(industriesCloseTimerRef.current);
      }
    };
  }, []);

  const clearIndustriesCloseTimer = () => {
    if (industriesCloseTimerRef.current) {
      window.clearTimeout(industriesCloseTimerRef.current);
      industriesCloseTimerRef.current = null;
    }
  };

  const handleDemoClientLogin = () => {
    navigate("/client-portal");
  };

  const openIndustriesMenu = () => {
    clearIndustriesCloseTimer();
    setIndustriesOpen(true);
  };

  const closeIndustriesMenuSoon = () => {
    clearIndustriesCloseTimer();
    industriesCloseTimerRef.current = window.setTimeout(() => {
      setIndustriesOpen(false);
    }, 120);
  };







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
    setOpen(false);
    setIndustriesOpen(false);
    if (location.pathname === "/" && location.hash === "") {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      return;
    }
    // Reset to home and smooth scroll to top
    navigate("/");
    setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" }), 0);
  };

  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        background: scrolled || open ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.85)",
        backdropFilter: "blur(8px) saturate(1.2)",
        WebkitBackdropFilter: "blur(8px) saturate(1.2)",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "none",
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
          <div className="relative" onKeyDown={(e) => {if (e.key === "Escape") setIndustriesOpen(false);}}>
            <button
              type="button"
              onClick={() => setIndustriesOpen(!industriesOpen)}
              aria-expanded={industriesOpen}
              aria-haspopup="menu"
              className="inline-flex items-center gap-1 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap relative pb-0.5"
              style={{ color: isActivePage("/store") || isActivePage("/automations") || isActivePage("/pricing") ? "#00AEEF" : "#0a1628" }}>
              Solutions
              <ChevronDown className={`w-4 h-4 transition-transform ${industriesOpen ? "rotate-180" : ""}`} />
              {(isActivePage("/store") || isActivePage("/automations") || isActivePage("/pricing")) && (
                <span style={{ position: "absolute", bottom: "-6px", left: 0, right: 0, height: "2px", borderRadius: "999px", background: "#00AEEF", boxShadow: "0 0 6px rgba(0,174,239,0.7)" }} />
              )}
            </button>
            {industriesOpen && typeof document !== "undefined" && createPortal((
            <div
              className="fixed rounded-lg border border-border p-3 shadow-xl"
              role="menu"
              aria-label="Solutions"
              style={{
                left: "50%",
                transform: "translateX(-50%)",
                top: "calc(var(--cs-nav-height) + 10px)",
                background: "rgba(255,255,255,0.97)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                zIndex: 200,
              }}>
              <div className="flex flex-col gap-1">
                {solutionsLinks.map((item) =>
                <a
                   key={item.href}
                   href={item.href}
                   role="menuitem"
                   onClick={(e) => {
                     e.preventDefault();
                     trackCTA(`nav_${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "solutions_dropdown");
                     navigate(item.href);
                     setIndustriesOpen(false);
                   }}
                   className="w-full text-left flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-primary/8 hover:text-primary transition-colors border-none bg-transparent cursor-pointer whitespace-nowrap">
                   {item.label}
                </a>
                )}
              </div>
            </div>), document.body)}
          </div>

          <div
            className="relative"
            onMouseEnter={openIndustriesMenu}
            onMouseLeave={closeIndustriesMenuSoon}
            onKeyDown={(e) => {if (e.key === "Escape") setIndustriesOpen(false);}}>
            
            <button
              ref={industriesTriggerRef}
              type="button"
              onClick={openIndustriesMenu}
              aria-expanded={industriesOpen}
              aria-haspopup="menu"
              className="inline-flex items-center gap-1 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap relative pb-0.5"
              style={{ color: "#0a1628" }}>
              Industries
              <ChevronDown className={`w-4 h-4 transition-transform ${industriesOpen ? "rotate-180" : ""}`} />
            </button>

            {industriesOpen && typeof document !== "undefined" && createPortal((
            <div
              className="fixed"
              onMouseEnter={openIndustriesMenu}
              onMouseLeave={closeIndustriesMenuSoon}
              style={{
                left: `${industriesMenuPosition.left}px`,
                top: `${industriesMenuPosition.top}px`,
                width: `${industriesMenuPosition.width}px`,
                zIndex: 200,
              }}>
                <div
                className="rounded-lg border border-border p-3 shadow-xl"
                role="menu"
                aria-label="Industries"
                style={{
                  background: "rgba(255,255,255,0.97)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)"
                }}>
                  <div className="grid grid-cols-2 gap-2">
                    {industryLinks.map((item) =>
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      trackCTA(`industry_${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "navbar_dropdown");
                      navigate(item.href);
                      setIndustriesOpen(false);
                    }}
                    className="w-full text-left flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-primary/8 hover:text-primary transition-colors border-none bg-transparent cursor-pointer whitespace-nowrap">
                        {item.label}
                      </button>
                  )}
                  </div>
                </div>
              </div>), document.body)
            }
          </div>

          {sectionLinks.map((link) => (
          <a
          key={link.href}
          href={link.href}
          onClick={(e) => { 
          e.preventDefault(); 
          trackCTA(`nav_${link.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "navbar");
          setIndustriesOpen(false);
          setOpen(false);
          navigate(link.href); 
          }}
          className="text-xs lg:text-sm font-medium transition-all duration-300 whitespace-nowrap relative pb-0.5"
          style={{ color: isActivePage(link.href) ? "#00AEEF" : "#0a1628", textDecoration: "none" }}
          >
          {link.label}
          <span style={{ position: "absolute", bottom: "-6px", left: 0, right: isActivePage(link.href) ? 0 : "100%", height: "2px", borderRadius: "999px", background: "#00AEEF", boxShadow: "0 0 6px rgba(0,174,239,0.7)", transition: "right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
          </a>
          ))}
        </div>

        <div className="hidden xl:flex items-center gap-2 shrink-0">
          <button
            onClick={() => { trackCTA("client_dashboard", "navbar"); navigate("/client-portal"); }}
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors"
            style={{ minHeight: "unset", minWidth: "unset", borderColor: "rgba(0,174,239,0.35)", color: "#005f99", background: "rgba(0,174,239,0.07)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Client Dashboard
          </button>
          <button
            onClick={() => { trackCTA("login", "navbar"); setShowLoginModal(true); }}
            className="hidden md:block text-xs font-semibold text-foreground/70 hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/8 border border-white/20 hover:border-primary/30"
            style={{ minHeight: "unset", minWidth: "unset" }}>
            Login
          </button>
          <button
            onClick={() => { trackCTA("book_free_audit", "navbar"); navigate("/book"); }}
            className="hidden md:inline-flex items-center focus:ring-2 focus:ring-primary focus:outline-none rounded-lg px-5 py-2.5"
            style={{
              background: "linear-gradient(135deg, #0088CC 0%, #006BB0 40%, #003B8F 100%)",
              color: "#ffffff",
              fontWeight: "800",
              fontSize: "0.8125rem",
              letterSpacing: "0.01em",
              boxShadow: "0 0 0 1px rgba(0,174,239,0.5), 0 0 14px rgba(0,174,239,0.4), 0 2px 8px rgba(0,107,176,0.3)",
              border: "none",
              cursor: "pointer",
              transition: "box-shadow 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)",
              minHeight: "unset",
              minWidth: "unset",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 0 1.5px rgba(0,174,239,0.85), 0 0 32px rgba(0,159,212,0.7), 0 4px 20px rgba(0,159,212,0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 0 1px rgba(0,174,239,0.5), 0 0 14px rgba(0,174,239,0.4), 0 2px 8px rgba(0,107,176,0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}>
            Get Free Automation Audit
          </button>
        </div>

        <button
          className="xl:hidden w-10 h-10 rounded-full border bg-background/15 backdrop-blur-[3px] flex items-center justify-center text-foreground shadow-sm"
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
        <div
          className="xl:hidden border-b border-white/25 px-5 pb-safe-bottom pb-6 pt-2 space-y-1 relative z-50"
          style={{
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
            background: "rgba(255,255,255,0.10)",
            backdropFilter: "blur(3px) saturate(1.05)",
            WebkitBackdropFilter: "blur(3px) saturate(1.05)",
          }}>
          <div className="pt-2 border-t border-border">
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--cs-electric)" }}>Solutions</p>
            <div className="space-y-1">
              {solutionsLinks.map((link) =>
              <a
                key={link.href}
                href={link.href}
                className="w-full text-left flex items-center rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:ring-2 focus:ring-primary focus:outline-none border-none bg-transparent cursor-pointer transition-colors"
                style={{ minHeight: "44px" }}
                onClick={(e) => {
                  e.preventDefault();
                  trackCTA(`nav_${link.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "mobile_nav");
                  navigate(link.href);
                  setOpen(false);
                }}>
                {link.label}
              </a>
              )}
            </div>
          </div>

          {sectionLinks.map((link) =>
          <a
            key={link.href}
            href={link.href}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground focus:ring-2 focus:ring-primary focus:outline-none rounded-xl px-3 py-3 transition-colors hover:bg-muted/50"
            style={{ minHeight: "44px" }}
            onClick={(e) => {
              e.preventDefault();
              trackCTA(`nav_${link.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "mobile_nav");
              navigate(link.href);
              setOpen(false);
            }}>
            {link.label}
          </a>
          )}

          <div className="pt-2 border-t border-border">
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--cs-electric)" }}>Industries</p>
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
              trackCTA("client_dashboard", "mobile_nav");
              setOpen(false);
              navigate("/client-portal");
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold border"
            style={{ borderColor: "rgba(0,174,239,0.35)", color: "#005f99", background: "rgba(0,174,239,0.07)", minHeight: "44px" }}>
            Client Dashboard
          </button>
          <button
            onClick={() => {
              trackCTA("book_demo", "mobile_nav");
              setOpen(false);
              navigate("/book");
            }}
            className="cs-btn-primary" style={{ width: "100%", display: "block" }}>
            <span className="cs-btn-primary-inner" style={{ height: "40px", gap: "6px", fontSize: "0.875rem" }}>
              {BUTTON_TEXT.BOOK_DEMO}
            </span>
          </button>
        </div>
        </>
      }

      {showLoginModal && <PortalLoginModal onClose={() => setShowLoginModal(false)} />}
    </nav>);

}