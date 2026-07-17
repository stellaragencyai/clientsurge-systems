import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import { usePageViewTracking } from "../../hooks/usePageViewTracking";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";
import { useAuth } from "@/lib/AuthContext";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { INDUSTRY_SELECTION_STORAGE_KEY } from "@/lib/industryRecommendations";
import { INDUSTRY_GROUPS } from "@/lib/industryNavConfig";

const sectionLinks = SITE_CONFIG.navigation.sections;
const menuItemClass = "w-full text-left flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-foreground border-l-2 border-transparent hover:border-[#00AEEF] hover:bg-[#00AEEF]/5 hover:text-foreground transition-colors bg-transparent cursor-pointer whitespace-nowrap";

function analyticsKey(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [industriesOpen, setIndustriesOpen] = useState(false);
  const [industryDropdownPos, setIndustryDropdownPos] = useState(null);
  const industriesTriggerRef = useRef(null);
  const industriesCloseTimerRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const mobileUserName = user?.full_name || user?.email?.split("@")[0] || null;
  const mobileUserRole = user?.role ? user.role.replace(/_/g, " ") : null;

  usePageViewTracking();

  const isActivePage = (href) => {
    if (href === "/") return location.pathname === "/";
    if (href.startsWith("/#")) return location.pathname === "/" && location.hash === href.replace("/", "");
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  const closeAll = () => {
    setIndustriesOpen(false);
    setOpen(false);
  };

  const clearIndustriesTimer = () => {
    if (industriesCloseTimerRef.current) {
      clearTimeout(industriesCloseTimerRef.current);
      industriesCloseTimerRef.current = null;
    }
  };

  const openIndustries = () => {
    clearIndustriesTimer();
    const rect = industriesTriggerRef.current?.getBoundingClientRect();
    setIndustryDropdownPos(rect ? { left: rect.left + rect.width / 2, top: rect.bottom + 6 } : null);
    setIndustriesOpen(true);
  };

  const closeIndustriesSoon = () => {
    clearIndustriesTimer();
    industriesCloseTimerRef.current = setTimeout(() => setIndustriesOpen(false), 180);
  };

  const navigateTo = (href) => {
    if (href.startsWith("/#") && location.pathname === "/") {
      const id = href.slice(2);
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", href);
        return;
      }
    }

    if (href === location.pathname) {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      return;
    }

    navigate(href);
  };

  const handleNavClick = (event, item, source = "navbar") => {
    event.preventDefault();
    trackCTA(`nav_${analyticsKey(item.label)}`, source);
    closeAll();
    navigateTo(item.href);
  };

  const handleLogoClick = (event) => {
    event.preventDefault();
    trackCTA("nav_logo", "navbar");
    closeAll();
    if (location.pathname === "/") {
      if (location.hash) window.history.replaceState(null, "", "/");
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      return;
    }
    navigate("/");
    setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" }), 50);
  };

  const handleIndustrySelect = (item, source) => {
    try {
      const slug = item.href.split("/").pop();
      window.sessionStorage.setItem(INDUSTRY_SELECTION_STORAGE_KEY, slug);
      window.dispatchEvent(new CustomEvent("clientsurge:industry-selected", { detail: { id: slug } }));
    } catch (_error) {}

    trackCTA(`industry_${analyticsKey(item.label)}`, source);
    closeAll();
    navigate(item.href);
  };

  useEffect(() => {
    return () => clearIndustriesTimer();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    return acquireBodyScrollLock("landing-mobile-nav");
  }, [open]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const IndustriesDropdown = industriesOpen && typeof document !== "undefined" ? createPortal(
    <div
      onMouseEnter={openIndustries}
      onMouseLeave={closeIndustriesSoon}
      className="fixed cs-dropdown-portal"
      style={{
        left: industryDropdownPos?.left ?? "50%",
        transform: "translateX(-50%)",
        top: industryDropdownPos?.top ?? "calc(var(--cs-nav-height) + 6px)",
        zIndex: 60,
      }}
    >
      <div
        className="rounded-xl border border-border/60 p-5 shadow-xl"
        role="menu"
        aria-label="Industries"
        style={{
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(20px) saturate(1.25)",
          WebkitBackdropFilter: "blur(20px) saturate(1.25)",
          boxShadow: "0 16px 48px rgba(15,23,42,0.14), 0 0 0 1px rgba(0,174,239,0.06)",
        }}
      >
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 min-w-[480px]">
          {INDUSTRY_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/60 mb-2 px-3">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.industries.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    onClick={() => handleIndustrySelect(item, "navbar_dropdown")}
                    className={menuItemClass}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border/50 text-center">
          <a
            href="/industries"
            onClick={(event) => handleNavClick(event, { label: "View All Industries", href: "/industries" }, "navbar_dropdown")}
            className="text-[12px] font-bold text-primary hover:underline"
          >
            View All Industries →
          </a>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        background: scrolled ? "rgba(255, 255, 255, 0.78)" : "rgba(255, 255, 255, 0.94)",
        backdropFilter: "blur(22px) saturate(1.35)",
        WebkitBackdropFilter: "blur(22px) saturate(1.35)",
        borderBottom: scrolled ? "1px solid rgba(15, 23, 42, 0.08)" : "1px solid rgba(0, 174, 239, 0.10)",
        boxShadow: scrolled ? "0 12px 36px rgba(15, 23, 42, 0.10)" : "0 4px 18px rgba(15, 23, 42, 0.04)",
        overflow: "visible",
      }}
    >
      <div
        className="w-full flex items-center justify-between px-4 md:px-6"
        style={{
          height: "var(--cs-nav-height)",
          paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
          paddingRight: "max(1.25rem, env(safe-area-inset-right))",
        }}
      >
        <a
          href="/"
          onClick={handleLogoClick}
          className="shrink-0 transition-transform duration-300 hover:-translate-y-0.5"
          aria-label="ClientSurge Systems home"
          style={{ display: "inline-flex", alignItems: "center", overflow: "visible" }}
        >
          <img
            src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png"
            alt="ClientSurge Systems"
            width="480"
            height="224"
            decoding="async"
            style={{ height: "clamp(84px, 10vw, 116px)", width: "auto", maxWidth: "100%", objectFit: "contain", display: "block" }}
          />
        </a>

        <div className="hidden xl:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
          {sectionLinks.filter((link) => link.label !== "Industries").map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => handleNavClick(event, link, "navbar")}
              className="text-xs lg:text-sm font-semibold transition-all duration-300 whitespace-nowrap relative pb-0.5"
              style={{ color: isActivePage(link.href) ? "#0095D9" : "#0F172A", textDecoration: "none" }}
            >
              {link.label}
              <span style={{ position: "absolute", bottom: "-6px", left: 0, right: isActivePage(link.href) ? 0 : "100%", height: "2px", borderRadius: "999px", background: "#00AEEF", boxShadow: "0 0 6px rgba(0,174,239,0.45)", transition: "right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
            </a>
          ))}

          <div className="relative" onMouseEnter={openIndustries} onMouseLeave={closeIndustriesSoon}>
            <button
              ref={industriesTriggerRef}
              type="button"
              onClick={() => (industriesOpen ? setIndustriesOpen(false) : openIndustries())}
              aria-expanded={industriesOpen}
              aria-haspopup="menu"
              className="text-xs lg:text-sm font-semibold transition-colors whitespace-nowrap relative pb-0.5 bg-transparent border-none cursor-pointer"
              style={{ color: industriesOpen || isActivePage("/industries") ? "#0095D9" : "#0F172A" }}
            >
              Industries
              <span style={{ position: "absolute", bottom: "-6px", left: 0, right: industriesOpen || isActivePage("/industries") ? 0 : "100%", height: "2px", borderRadius: "999px", background: "#00AEEF", boxShadow: "0 0 6px rgba(0,174,239,0.45)", transition: "right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
            </button>
            {IndustriesDropdown}
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              trackCTA("client_login", "navbar");
              closeAll();
              navigate("/login");
            }}
            className="hidden md:flex items-center gap-1.5 text-xs font-bold transition-all duration-300 px-4 py-1.5 rounded-lg"
            style={{
              minHeight: "unset",
              minWidth: "unset",
              color: "#0F172A",
              background: "rgba(255,255,255,0.64)",
              border: "1px solid rgba(15,23,42,0.12)",
              boxShadow: "0 6px 18px rgba(15,23,42,0.05)",
            }}
          >
            Client Login
          </button>
          <button
            type="button"
            onClick={() => {
              trackCTA("compare_packages", "navbar");
              closeAll();
              navigateTo("/#pricing");
            }}
            className="cs-btn-primary cs-nav-cta"
            style={{ minHeight: "unset", minWidth: "unset" }}
          >
            Compare Packages
          </button>
        </div>

        <div className="xl:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              trackCTA("compare_packages_mobile_bar", "navbar");
              closeAll();
              navigateTo("/#pricing");
            }}
            className="cs-btn-primary cs-nav-cta"
            style={{ minHeight: "unset", height: "36px", padding: "0 16px", fontSize: "0.75rem" }}
          >
            Compare
          </button>
          <button
            type="button"
            className="w-10 h-10 rounded-full border backdrop-blur-[3px] flex items-center justify-center shadow-sm transition-colors"
            onClick={() => setOpen(!open)}
            style={{
              borderColor: "rgba(15, 23, 42, 0.12)",
              background: "rgba(255, 255, 255, 0.62)",
              color: "#0F172A",
            }}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-controls="mobile-nav-drawer"
            aria-expanded={open}
          >
            {open ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            <span className="sr-only">{open ? "Close navigation menu" : "Open navigation menu"}</span>
          </button>
        </div>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40 xl:hidden bg-black/30" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            id="mobile-nav-drawer"
            className="xl:hidden px-5 pb-8 pt-2 relative z-50 mobile-nav-drawer"
            style={{
              maxWidth: "min(420px, 90vw)",
              maxHeight: "calc(100vh - var(--cs-nav-height) - env(safe-area-inset-top))",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
              background: "rgba(255,255,255,0.96)",
              backdropFilter: "blur(20px) saturate(1.2)",
              WebkitBackdropFilter: "blur(20px) saturate(1.2)",
              borderBottom: "1px solid rgba(0,174,239,0.12)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
            }}
          >
            <div className="pt-3 pb-2 space-y-0.5">
              {sectionLinks.filter((link) => link.label !== "Industries").map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center text-[15px] font-semibold text-black hover:text-[#00AEEF] focus:ring-2 focus:ring-primary focus:outline-none rounded-xl px-3 py-3 transition-colors hover:bg-[#00AEEF]/5"
                  style={{ minHeight: "44px" }}
                  onClick={(event) => handleNavClick(event, link, "mobile_nav")}
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="mt-2 mb-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
              {mobileUserName ? (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-1">Signed in</p>
                  <p className="text-sm font-semibold text-foreground truncate">{mobileUserName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{mobileUserRole || "client"}</p>
                  <button
                    type="button"
                    onClick={() => {
                      trackCTA("client_dashboard", "mobile_nav");
                      closeAll();
                      navigate("/client-portal");
                    }}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-[13px] font-bold transition-all hover:-translate-y-0.5"
                    style={{ background: "linear-gradient(135deg, #0088CC, #00AEEF)" }}
                  >
                    Go to Client Portal →
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      trackCTA("client_login", "mobile_nav");
                      closeAll();
                      navigate("/login");
                    }}
                    className="w-full inline-flex items-center justify-center rounded-xl border text-[14px] font-bold transition-all hover:-translate-y-0.5 focus:ring-2 focus:ring-primary focus:outline-none"
                    style={{
                      minHeight: "48px",
                      color: "#ffffff",
                      background: "linear-gradient(135deg, #0088CC, #00AEEF)",
                      borderColor: "rgba(53, 189, 241, 0.35)",
                      boxShadow: "0 8px 22px rgba(0,174,239,0.22)",
                    }}
                  >
                    Client Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      trackCTA("contact", "mobile_nav");
                      closeAll();
                      navigate("/contact");
                    }}
                    className="w-full inline-flex items-center justify-center rounded-xl border border-border text-[14px] font-bold text-foreground hover:bg-muted transition-colors"
                    style={{ minHeight: "48px" }}
                  >
                    Contact ClientSurge
                  </button>
                </div>
              )}
            </div>

            <div className="pt-3 mt-1 border-t border-border">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3 px-3" style={{ color: "#00AEEF" }}>Industries</p>
              <div className="space-y-3">
                {INDUSTRY_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5 px-3 text-muted-foreground/60">{group.label}</p>
                    <div className="grid grid-cols-1 gap-0.5">
                      {group.industries.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => handleIndustrySelect(item, "mobile_nav")}
                          className="w-full text-left flex items-center rounded-xl px-3 py-2.5 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:ring-2 focus:ring-primary focus:outline-none border-none bg-transparent cursor-pointer transition-colors"
                          style={{ minHeight: "44px" }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <a
                href="/industries"
                onClick={(event) => handleNavClick(event, { label: "View All Industries", href: "/industries" }, "mobile_nav")}
                className="block text-center text-[12px] font-bold text-primary hover:underline mt-3 py-2"
              >
                View All Industries →
              </a>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  trackCTA("compare_packages", "mobile_nav");
                  closeAll();
                  navigateTo("/#pricing");
                }}
                className="cs-btn-primary cs-nav-cta flex-1"
                style={{ minHeight: "unset" }}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", height: "40px" }}>
                  Compare Packages
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  trackCTA("automations", "mobile_nav");
                  closeAll();
                  navigate("/automations");
                }}
                className="inline-flex items-center justify-center rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                style={{ flex: "0 0 auto", minHeight: "unset", height: "48px", padding: "0 20px" }}
              >
                Automations
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
