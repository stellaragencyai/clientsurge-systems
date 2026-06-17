import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import PortalLoginModal from "../forms/PortalLoginModal";
import { trackCTA } from "@/lib/analytics";
import { usePageViewTracking } from "../../hooks/usePageViewTracking";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";
import { useAuth } from "@/lib/AuthContext";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { INDUSTRY_SELECTION_STORAGE_KEY } from "@/lib/industryRecommendations";

const sectionLinks = SITE_CONFIG.navigation.sections;
const solutionsLinks = SITE_CONFIG.navigation.solutions;
const industryLinks = SITE_CONFIG.industries;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [industriesOpen, setIndustriesOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ solutions: null, industries: null });

  const solutionsTriggerRef = useRef(null);
  const industriesTriggerRef = useRef(null);
  const solutionsCloseTimerRef = useRef(null);
  const industriesCloseTimerRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const mobileUserName = user?.full_name || user?.email?.split("@")[0] || null;
  const mobileUserRole = user?.role ? user.role.replace(/_/g, " ") : null;

  const isActivePage = (href) => {
    if (href === "/") return location.pathname === "/";
    if (href.startsWith("/#")) return location.pathname === "/" && location.hash === href.replace("/", "");
    return location.pathname.startsWith(href);
  };

  const closeAll = () => {
    setSolutionsOpen(false);
    setIndustriesOpen(false);
    setOpen(false);
  };

  const handleHashLinkClick = (e, href) => {
    e.preventDefault();
    const hash = href.replace("/", "");
    trackCTA(`nav_${hash.replace("#", "")}`, "navbar");
    closeAll();

    if (location.pathname === "/") {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", `/${hash}`);
      }
    } else {
      navigate(`/${hash}`);
    }
  };

  usePageViewTracking();

  // ── Clear timers on unmount ──
  useEffect(() => {
    return () => {
      if (solutionsCloseTimerRef.current) clearTimeout(solutionsCloseTimerRef.current);
      if (industriesCloseTimerRef.current) clearTimeout(industriesCloseTimerRef.current);
    };
  }, []);

  // ── Scroll detection ──
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Body scroll lock ──
  useEffect(() => {
    if (!open) return undefined;
    return acquireBodyScrollLock("landing-mobile-nav");
  }, [open]);



  // ── Shared helpers ──
  const clearTimer = (ref) => { if (ref.current) { clearTimeout(ref.current); ref.current = null; } };

  const openSolutions = () => {
    clearTimer(solutionsCloseTimerRef);
    setIndustriesOpen(false);
    const rect = solutionsTriggerRef.current?.getBoundingClientRect();
    setDropdownPos(prev => ({ ...prev, solutions: rect ? { left: rect.left + rect.width / 2, top: rect.bottom + 6 } : null }));
    setSolutionsOpen(true);
  };
  const closeSolutionsSoon = () => { clearTimer(solutionsCloseTimerRef); solutionsCloseTimerRef.current = setTimeout(() => setSolutionsOpen(false), 250); };
  const openIndustries = () => {
    clearTimer(industriesCloseTimerRef);
    setSolutionsOpen(false);
    const rect = industriesTriggerRef.current?.getBoundingClientRect();
    setDropdownPos(prev => ({ ...prev, industries: rect ? { left: rect.left + rect.width / 2, top: rect.bottom + 6 } : null }));
    setIndustriesOpen(true);
  };
  const closeIndustriesSoon = () => { clearTimer(industriesCloseTimerRef); industriesCloseTimerRef.current = setTimeout(() => setIndustriesOpen(false), 250); };

  const handleLogoClick = (e) => {
    e.preventDefault();
    trackCTA("nav_logo", "navbar");
    closeAll();
    if (location.pathname === "/" && location.hash === "") {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      return;
    }
    navigate("/");
    setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" }), 0);
  };

  // ── Dropdown menu item style with blue vertical spine ──
  const menuItemClass = "w-full text-left flex items-center px-3 py-2.5 text-sm font-medium text-foreground border-l-2 border-transparent hover:border-[#00AEEF] hover:bg-[#00AEEF]/5 hover:text-foreground transition-colors bg-transparent cursor-pointer whitespace-nowrap";

  // ── Solutions dropdown portal ──
  const SolutionsDropdown = solutionsOpen && typeof document !== "undefined" ? createPortal(
    <div
      onMouseEnter={openSolutions}
      onMouseLeave={closeSolutionsSoon}
      className="fixed rounded-lg border border-border/60 p-3 shadow-xl cs-dropdown-portal"
      role="menu"
      aria-label="Solutions"
      style={{
        left: dropdownPos.solutions?.left ?? "50%",
        transform: "translateX(-50%)",
        top: dropdownPos.solutions?.top ?? "calc(var(--cs-nav-height) + 6px)",
        background: "rgba(255,255,255,0.98)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,174,239,0.08)",
      }}
    >
      <div className="flex flex-col gap-0.5 min-w-[180px]">
        {solutionsLinks.map((item) => (
          <a
            key={item.href}
            href={item.href}
            role="menuitem"
            onClick={(e) => {
              if (item.isHashLink) { handleHashLinkClick(e, item.href); return; }
              e.preventDefault();
              trackCTA(`nav_${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "solutions_dropdown");
              navigate(item.href);
              setSolutionsOpen(false);
            }}
            className={menuItemClass}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>,
    document.body
  ) : null;

  // ── Industries dropdown portal ──
  const IndustriesDropdown = industriesOpen && typeof document !== "undefined" ? createPortal(
    <div
      onMouseEnter={openIndustries}
      onMouseLeave={closeIndustriesSoon}
      className="fixed cs-dropdown-portal"
      style={{
        left: dropdownPos.industries?.left ?? "50%",
        transform: "translateX(-50%)",
        top: dropdownPos.industries?.top ?? "calc(var(--cs-nav-height) + 6px)",
      }}
    >
      <div
        className="rounded-lg border border-border/60 p-4 shadow-xl"
        role="menu"
        aria-label="Industries"
        style={{
          background: "rgba(255,255,255,0.98)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,174,239,0.08)",
        }}
      >
        <div className="grid grid-cols-2 gap-1 min-w-[420px]">
          {industryLinks.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                const slug = item.href.split("/").pop();
                window.sessionStorage.setItem(INDUSTRY_SELECTION_STORAGE_KEY, slug);
                window.dispatchEvent(new CustomEvent("clientsurge:industry-selected", { detail: { id: slug } }));
                trackCTA(`industry_${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "navbar_dropdown");
                navigate(item.href);
                setIndustriesOpen(false);
              }}
              className={menuItemClass}
            >
              {item.label}
            </button>
          ))}
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
        background: scrolled || open ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.85)",
        backdropFilter: "blur(8px) saturate(1.2)",
        WebkitBackdropFilter: "blur(8px) saturate(1.2)",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
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
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="shrink-0 bg-none border-none cursor-pointer transition-transform duration-300 hover:-translate-y-0.5"
          style={{ minHeight: "unset", minWidth: "unset", background: "none", padding: 0, overflow: "visible" }}
        >
          <span style={{ display: "block", width: "clamp(132px, 17vw, 204px)", height: "clamp(44px, 5.2vw, 64px)", overflow: "hidden" }}>
            <img
              src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png"
              alt="ClientSurge Systems"
              width="240"
              height="72"
              decoding="async"
              style={{ height: "clamp(80px, 9.5vw, 112px)", width: "auto", maxWidth: "none", objectFit: "contain", display: "block", transform: "translate(-15px, -20px)" }}
            />
          </span>
        </button>

        {/* Desktop center links */}
        <div className="hidden xl:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
          {sectionLinks.filter(l => l.label !== "Industries").map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                if (link.isHashLink) { handleHashLinkClick(e, link.href); return; }
                e.preventDefault();
                trackCTA(`nav_${link.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "navbar");
                closeAll();
                navigate(link.href);
              }}
              className="text-xs lg:text-sm font-medium transition-all duration-300 whitespace-nowrap relative pb-0.5"
              style={{ color: isActivePage(link.href) ? "#00AEEF" : "#0a1628", textDecoration: "none" }}
            >
              {link.label}
              <span style={{ position: "absolute", bottom: "-6px", left: 0, right: isActivePage(link.href) ? 0 : "100%", height: "2px", borderRadius: "999px", background: "#00AEEF", boxShadow: "0 0 6px rgba(0,174,239,0.7)", transition: "right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
            </a>
          ))}

          {/* Industries dropdown (no text link — only hover/click opens it) */}
          <div className="relative" onMouseEnter={openIndustries} onMouseLeave={closeIndustriesSoon}>
            <button
              ref={industriesTriggerRef}
              type="button"
              onClick={() => setIndustriesOpen(!industriesOpen)}
              aria-expanded={industriesOpen}
              aria-haspopup="menu"
              className="text-xs lg:text-sm font-medium transition-colors whitespace-nowrap relative pb-0.5 bg-transparent border-none cursor-pointer"
              style={{ color: industriesOpen ? "#00AEEF" : "#0a1628" }}
            >
              Industries
              <span style={{ position: "absolute", bottom: "-6px", left: 0, right: industriesOpen ? 0 : "100%", height: "2px", borderRadius: "999px", background: "#00AEEF", boxShadow: "0 0 6px rgba(0,174,239,0.7)", transition: "right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
            </button>
            {IndustriesDropdown}
          </div>
        </div>

        {/* Desktop right actions */}
        <div className="hidden xl:flex items-center gap-2 shrink-0">
          <button
            onClick={() => { trackCTA("login", "navbar"); setShowLoginModal(true); }}
            className="hidden md:block text-xs font-semibold text-foreground/70 hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/8 border border-white/20 hover:border-primary/30"
            style={{ minHeight: "unset", minWidth: "unset" }}
          >
            Login
          </button>
          <button
            onClick={() => {
              trackCTA("compare_packages", "navbar");
              if (location.pathname === "/") {
                const el = document.getElementById("pricing");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              } else {
                navigate("/#pricing");
              }
            }}
            className="cs-btn-primary"
            style={{ fontSize: "0.8125rem", minHeight: "unset", minWidth: "unset", whiteSpace: "nowrap" }}
          >
            Compare Packages
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="xl:hidden w-10 h-10 rounded-full border bg-background/15 backdrop-blur-[3px] flex items-center justify-center text-foreground shadow-sm"
          onClick={() => setOpen(!open)}
          style={{ borderColor: "rgba(0,174,239,0.22)" }}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 xl:hidden bg-black/30" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            className="xl:hidden px-5 pb-8 pt-2 relative z-50 mobile-nav-drawer"
            style={{
              maxWidth: "min(420px, 90vw)",
              paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
              background: "rgba(255,255,255,0.98)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderBottom: "1px solid rgba(0,174,239,0.12)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
            }}
          >
            {/* Primary nav pages */}
            <div className="pt-3 pb-2 space-y-0.5">
              {sectionLinks.filter(l => l.label !== "Industries").map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center text-[15px] font-semibold text-[#0a1628] hover:text-[#00AEEF] focus:ring-2 focus:ring-primary focus:outline-none rounded-xl px-3 py-3 transition-colors hover:bg-[#00AEEF]/5"
                  style={{ minHeight: "44px" }}
                  onClick={(e) => {
                    if (link.isHashLink) { handleHashLinkClick(e, link.href); return; }
                    e.preventDefault();
                    trackCTA(`nav_${link.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "mobile_nav");
                    navigate(link.href);
                    setOpen(false);
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Industries compact section */}
            <div className="pt-3 mt-1 border-t border-border">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3 px-3" style={{ color: "#00AEEF" }}>Industries</p>
              <div className="grid grid-cols-2 gap-0.5">
                {industryLinks.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      const slug = item.href.split("/").pop();
                      window.sessionStorage.setItem(INDUSTRY_SELECTION_STORAGE_KEY, slug);
                      window.dispatchEvent(new CustomEvent("clientsurge:industry-selected", { detail: { id: slug } }));
                      trackCTA(`industry_${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "mobile_nav");
                      navigate(item.href);
                      setOpen(false);
                    }}
                    className="w-full text-left flex items-center rounded-xl px-3 py-2.5 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:ring-2 focus:ring-primary focus:outline-none border-none bg-transparent cursor-pointer transition-colors"
                    style={{ minHeight: "44px" }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {mobileUserName && (
              <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-1">Signed in</p>
                <p className="text-sm font-semibold text-foreground truncate">{mobileUserName}</p>
                <p className="text-xs text-muted-foreground capitalize">{mobileUserRole || "client"}</p>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  trackCTA("compare_packages", "mobile_nav");
                  setOpen(false);
                  if (location.pathname === "/") {
                    setTimeout(() => {
                      const el = document.getElementById("pricing");
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 100);
                  } else {
                    navigate("/#pricing");
                  }
                }}
                className="cs-btn-primary flex-1"
                style={{ minHeight: "unset" }}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", height: "40px", fontSize: "0.875rem" }}>
                  Compare Packages
                </span>
              </button>
              <button
                onClick={() => { trackCTA("contact", "mobile_nav"); setOpen(false); navigate("/contact"); }}
                className="inline-flex items-center justify-center rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                style={{ flex: "0 0 auto", minHeight: "unset", height: "48px", padding: "0 20px" }}
              >
                Contact
              </button>
            </div>
          </div>
        </>
      )}

      {showLoginModal && <PortalLoginModal onClose={() => setShowLoginModal(false)} />}
    </nav>
  );
}