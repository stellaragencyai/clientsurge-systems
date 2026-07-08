import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Menu, X, ChevronDown, Zap, PhoneMissed, Calendar, Star, RefreshCw,
  FileText, HelpCircle, ShieldCheck, Info, Mail,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import { usePageViewTracking } from "../../hooks/usePageViewTracking";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";
import { useAuth } from "@/lib/AuthContext";
import { INDUSTRY_SELECTION_STORAGE_KEY } from "@/lib/industryRecommendations";
import { INDUSTRY_GROUPS } from "@/lib/industryNavConfig";
import SocialIcons from "./SocialIcons";

// ── Nav configuration ──
const SOLUTIONS_LINKS = [
  { label: "Instant Lead Response", href: "/lead-capture-automation", icon: Zap, desc: "Respond to leads in 8 seconds" },
  { label: "Missed Call Text Back", href: "/missed-call-text-back", icon: PhoneMissed, desc: "Recover every missed call" },
  { label: "AI Booking Agent", href: "/appointment-booking-automation", icon: Calendar, desc: "Book appointments 24/7" },
  { label: "Review Automation", href: "/review-automation", icon: Star, desc: "Get more 5-star reviews" },
  { label: "Customer Reactivation", href: "/customer-reactivation", icon: RefreshCw, desc: "Win back past customers" },
];

const RESOURCES_LINKS = [
  { label: "Blog", href: "/blog", icon: FileText, desc: "Growth insights & guides" },
  { label: "FAQ", href: "/faq", icon: HelpCircle, desc: "Answers to common questions" },
  { label: "Proof", href: "/proof", icon: ShieldCheck, desc: "Real results & case studies" },
  { label: "About Us", href: "/about", icon: Info, desc: "Our mission & story" },
  { label: "Contact", href: "/contact", icon: Mail, desc: "Get in touch with us" },
];

const PLAIN_LINKS = [
  { label: "Systems", href: "/store" },
  { label: "Pricing", href: "/pricing" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [industriesOpen, setIndustriesOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ solutions: null, industries: null, resources: null });

  const solutionsTriggerRef = useRef(null);
  const industriesTriggerRef = useRef(null);
  const resourcesTriggerRef = useRef(null);
  const solutionsCloseTimerRef = useRef(null);
  const industriesCloseTimerRef = useRef(null);
  const resourcesCloseTimerRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const mobileUserName = user?.full_name || user?.email?.split("@")[0] || null;

  const isActivePage = (href) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  const closeAll = () => {
    setSolutionsOpen(false);
    setIndustriesOpen(false);
    setResourcesOpen(false);
    setOpen(false);
  };

  usePageViewTracking();

  // ── Cleanup timers ──
  useEffect(() => {
    return () => {
      if (solutionsCloseTimerRef.current) clearTimeout(solutionsCloseTimerRef.current);
      if (industriesCloseTimerRef.current) clearTimeout(industriesCloseTimerRef.current);
      if (resourcesCloseTimerRef.current) clearTimeout(resourcesCloseTimerRef.current);
    };
  }, []);

  // ── Scroll detection ──
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Body scroll lock for mobile drawer ──
  useEffect(() => {
    if (!open) return undefined;
    return acquireBodyScrollLock("landing-mobile-nav");
  }, [open]);

  // ── Escape key ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Dropdown helpers ──
  const clearTimer = (ref) => { if (ref.current) { clearTimeout(ref.current); ref.current = null; } };

  const openDropdown = (which) => {
    // Close others
    if (which !== "solutions") { clearTimer(solutionsCloseTimerRef); setSolutionsOpen(false); }
    if (which !== "industries") { clearTimer(industriesCloseTimerRef); setIndustriesOpen(false); }
    if (which !== "resources") { clearTimer(resourcesCloseTimerRef); setResourcesOpen(false); }
    clearTimer(which === "solutions" ? solutionsCloseTimerRef : which === "industries" ? industriesCloseTimerRef : resourcesCloseTimerRef);

    const ref = which === "solutions" ? solutionsTriggerRef : which === "industries" ? industriesTriggerRef : resourcesTriggerRef;
    const rect = ref.current?.getBoundingClientRect();
    setDropdownPos(prev => ({
      ...prev,
      [which]: rect ? { left: rect.left + rect.width / 2, top: rect.bottom + 8 } : null,
    }));

    if (which === "solutions") setSolutionsOpen(true);
    else if (which === "industries") setIndustriesOpen(true);
    else setResourcesOpen(true);
  };

  const closeDropdownSoon = (which) => {
    const ref = which === "solutions" ? solutionsCloseTimerRef : which === "industries" ? industriesCloseTimerRef : resourcesCloseTimerRef;
    clearTimer(ref);
    ref.current = setTimeout(() => {
      if (which === "solutions") setSolutionsOpen(false);
      else if (which === "industries") setIndustriesOpen(false);
      else setResourcesOpen(false);
    }, 200);
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    trackCTA("nav_logo", "navbar");
    closeAll();
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      return;
    }
    navigate("/");
    setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" }), 50);
  };

  const handleNavClick = (e, href, label, isDropdown = false) => {
    e.preventDefault();
    trackCTA(`nav_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, isDropdown ? "navbar_dropdown" : "navbar");
    closeAll();
    navigate(href);
  };

  const handleIndustryClick = (e, item) => {
    e.preventDefault();
    const slug = item.href.split("/").pop();
    window.sessionStorage.setItem(INDUSTRY_SELECTION_STORAGE_KEY, slug);
    window.dispatchEvent(new CustomEvent("clientsurge:industry-selected", { detail: { id: slug } }));
    trackCTA(`industry_${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "navbar_dropdown");
    closeAll();
    navigate(item.href);
  };

  const handleSelectSystem = () => {
    trackCTA("select_your_system", "navbar");
    closeAll();
    if (location.pathname === "/") {
      const el = document.getElementById("pricing");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/pricing");
    }
  };

  const handleClientPortal = () => {
    trackCTA("client_portal", "navbar");
    closeAll();
    navigate("/client-portal");
  };

  // ── Shared dropdown item class ──
  const dropdownItemClass = "w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-[#00AEEF]/8 hover:text-[#00AEEF] transition-all duration-200 cursor-pointer whitespace-nowrap";

  // ── Glass dropdown surface style ──
  const glassDropdownStyle = {
    background: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(20px) saturate(1.8)",
    WebkitBackdropFilter: "blur(20px) saturate(1.8)",
    border: "1px solid rgba(0,174,239,0.12)",
    borderRadius: "0.75rem",
    boxShadow: "0 12px 40px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,174,239,0.06)",
  };

  // ── Render glass dropdown portal ──
  const renderDropdown = (isOpen, pos, onClose, children, ariaLabel) => {
    if (!isOpen || typeof document === "undefined") return null;
    return createPortal(
      <div
        onMouseEnter={() => clearTimer(
          ariaLabel === "Solutions" ? solutionsCloseTimerRef :
          ariaLabel === "Industries" ? industriesCloseTimerRef :
          resourcesCloseTimerRef
        )}
        onMouseLeave={onClose}
        className="fixed z-50 animate-fade-in"
        style={{
          left: pos?.left ?? "50%",
          transform: "translateX(-50%)",
          top: pos?.top ?? "calc(var(--cs-nav-height) + 8px)",
          animation: "fadeInUp 0.2s ease-out forwards",
        }}
      >
        <div className="p-2" role="menu" aria-label={ariaLabel} style={glassDropdownStyle}>
          {children}
        </div>
      </div>,
      document.body
    );
  };

  // ── Desktop nav link class ──
  const navLinkClass = (href) =>
    `text-[13px] xl:text-sm font-semibold transition-colors duration-200 whitespace-nowrap relative pb-0.5 cursor-pointer ${
      isActivePage(href) ? "text-[#00AEEF]" : "text-slate-700 hover:text-[#00AEEF]"
    }`;

  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        background: scrolled
          ? "rgba(255,255,255,0.82)"
          : "rgba(255,255,255,0.72)",
        backdropFilter: "blur(20px) saturate(1.8)",
        WebkitBackdropFilter: "blur(20px) saturate(1.8)",
        borderBottom: scrolled
          ? "1px solid rgba(0,174,239,0.15)"
          : "1px solid rgba(0,0,0,0.04)",
        boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.06)" : "none",
        overflow: "visible",
      }}
    >
      <div
        className="w-full flex items-center justify-between px-4 md:px-6"
        style={{
          height: "var(--cs-nav-height)",
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="shrink-0 border-none cursor-pointer transition-transform duration-300 hover:-translate-y-0.5"
          style={{ minHeight: "unset", minWidth: "unset", background: "none", padding: 0, overflow: "visible" }}
        >
          <span style={{ display: "flex", alignItems: "center", height: "clamp(36px, 4.5vw, 46px)", overflow: "hidden" }}>
            <img
              src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png"
              alt="ClientSurge Systems"
              width="220"
              height="92"
              decoding="async"
              style={{ height: "clamp(36px, 4.5vw, 46px)", width: "auto", maxWidth: "100%", objectFit: "contain", display: "block" }}
            />
          </span>
        </button>

        {/* Desktop center links */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-7 absolute left-1/2 -translate-x-1/2">
          {/* Solutions dropdown */}
          <div
            className="relative"
            onMouseEnter={() => openDropdown("solutions")}
            onMouseLeave={() => closeDropdownSoon("solutions")}
          >
            <button
              ref={solutionsTriggerRef}
              type="button"
              onClick={() => openDropdown("solutions")}
              aria-expanded={solutionsOpen}
              aria-haspopup="menu"
              className={`${navLinkClass("/automations")} flex items-center gap-1 border-none bg-transparent cursor-pointer`}
            >
              Solutions
              <ChevronDown className="w-3.5 h-3.5" style={{ transition: "transform 0.2s", transform: solutionsOpen ? "rotate(180deg)" : "none" }} />
            </button>
          </div>

          {/* Industries dropdown */}
          <div
            className="relative"
            onMouseEnter={() => openDropdown("industries")}
            onMouseLeave={() => closeDropdownSoon("industries")}
          >
            <button
              ref={industriesTriggerRef}
              type="button"
              onClick={() => openDropdown("industries")}
              aria-expanded={industriesOpen}
              aria-haspopup="menu"
              className={`${navLinkClass("/industries")} flex items-center gap-1 border-none bg-transparent cursor-pointer`}
            >
              Industries
              <ChevronDown className="w-3.5 h-3.5" style={{ transition: "transform 0.2s", transform: industriesOpen ? "rotate(180deg)" : "none" }} />
            </button>
          </div>

          {/* Plain links */}
          {PLAIN_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={(e) => handleNavClick(e, link.href, link.label)}
              className={navLinkClass(link.href)}
              style={{ background: "none", border: "none" }}
            >
              {link.label}
            </button>
          ))}

          {/* Resources dropdown */}
          <div
            className="relative"
            onMouseEnter={() => openDropdown("resources")}
            onMouseLeave={() => closeDropdownSoon("resources")}
          >
            <button
              ref={resourcesTriggerRef}
              type="button"
              onClick={() => openDropdown("resources")}
              aria-expanded={resourcesOpen}
              aria-haspopup="menu"
              className={`${navLinkClass("/blog")} flex items-center gap-1 border-none bg-transparent cursor-pointer`}
            >
              Resources
              <ChevronDown className="w-3.5 h-3.5" style={{ transition: "transform 0.2s", transform: resourcesOpen ? "rotate(180deg)" : "none" }} />
            </button>
          </div>
        </div>

        {/* Desktop right actions */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <button
            onClick={handleClientPortal}
            className="text-[13px] font-semibold text-slate-600 hover:text-[#00AEEF] transition-colors px-4 py-2 rounded-lg hover:bg-[#00AEEF]/5"
            style={{ minHeight: "unset", minWidth: "unset", background: "none", border: "none", cursor: "pointer" }}
          >
            {mobileUserName ? "My Portal" : "Client Portal"}
          </button>
          <button
            onClick={handleSelectSystem}
            className="cs-btn-primary cs-nav-cta"
            style={{ minHeight: "unset", minWidth: "unset" }}
          >
            Select Your System
          </button>
        </div>

        {/* Mobile: compact CTA + hamburger */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={handleSelectSystem}
            className="cs-btn-primary cs-nav-cta"
            style={{ minHeight: "unset", height: "36px", padding: "0 16px", fontSize: "0.75rem" }}
          >
            Select System
          </button>
          <button
            className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors"
            onClick={() => setOpen(!open)}
            style={{
              borderColor: "rgba(0,174,239,0.25)",
              background: "rgba(0,174,239,0.06)",
              color: "#1e293b",
            }}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
          >
            {open ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* ── Solutions Dropdown ── */}
      {renderDropdown(
        solutionsOpen, dropdownPos.solutions, () => closeDropdownSoon("solutions"),
        <div className="flex flex-col gap-0.5 min-w-[280px]">
          {SOLUTIONS_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                role="menuitem"
                onClick={(e) => handleNavClick(e, item.href, item.label, true)}
                className={dropdownItemClass}
                style={{ background: "none", border: "none" }}
              >
                <span className="w-8 h-8 rounded-lg bg-[#00AEEF]/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#00AEEF]" />
                </span>
                <span>
                  <span className="block text-foreground font-semibold">{item.label}</span>
                  <span className="block text-xs text-muted-foreground font-normal">{item.desc}</span>
                </span>
              </button>
            );
          })}
        </div>,
        "Solutions"
      )}

      {/* ── Industries Dropdown ── */}
      {renderDropdown(
        industriesOpen, dropdownPos.industries, () => closeDropdownSoon("industries"),
        <div className="min-w-[480px]">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            {INDUSTRY_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#00AEEF]/60 mb-2 px-3">
                  {group.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.industries.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      role="menuitem"
                      onClick={(e) => handleIndustryClick(e, item)}
                      className={dropdownItemClass}
                      style={{ background: "none", border: "none" }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border/50 text-center">
            <button
              onClick={(e) => handleNavClick(e, "/industries", "all_industries", true)}
              className="text-[12px] font-bold text-[#00AEEF] hover:underline"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              View All Industries →
            </button>
          </div>
        </div>,
        "Industries"
      )}

      {/* ── Resources Dropdown ── */}
      {renderDropdown(
        resourcesOpen, dropdownPos.resources, () => closeDropdownSoon("resources"),
        <div className="flex flex-col gap-0.5 min-w-[280px]">
          {RESOURCES_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                role="menuitem"
                onClick={(e) => handleNavClick(e, item.href, item.label, true)}
                className={dropdownItemClass}
                style={{ background: "none", border: "none" }}
              >
                <span className="w-8 h-8 rounded-lg bg-[#00AEEF]/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#00AEEF]" />
                </span>
                <span>
                  <span className="block text-foreground font-semibold">{item.label}</span>
                  <span className="block text-xs text-muted-foreground font-normal">{item.desc}</span>
                </span>
              </button>
            );
          })}
        </div>,
        "Resources"
      )}

      {/* ── Mobile drawer backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)" }}
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div
        className="lg:hidden fixed top-0 right-0 h-full z-50 mobile-nav-drawer"
        style={{
          width: "min(380px, 90vw)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)",
          background: "rgba(255,255,255,0.98)",
          backdropFilter: "blur(24px) saturate(1.8)",
          WebkitBackdropFilter: "blur(24px) saturate(1.8)",
          borderLeft: "1px solid rgba(0,174,239,0.12)",
          boxShadow: "0 0 60px rgba(0,0,0,0.15)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          paddingTop: "calc(env(safe-area-inset-top) + var(--cs-nav-height))",
          paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
          pointerEvents: open ? "auto" : "none",
          visibility: open ? "visible" : "hidden",
        }}
      >
        <div className="px-5 py-4">
          {/* Account section */}
          <div className="mb-4 rounded-2xl border border-[#00AEEF]/15 bg-[#00AEEF]/5 px-4 py-3">
            {mobileUserName ? (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#00AEEF]/70 mb-1">Signed in</p>
                <p className="text-sm font-semibold text-foreground truncate">{mobileUserName}</p>
                <button
                  onClick={() => { trackCTA("client_dashboard", "mobile_nav"); closeAll(); navigate("/client-dashboard"); }}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-[13px] font-bold transition-all hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #0088CC, #00AEEF)" }}
                >
                  Go to Dashboard →
                </button>
              </>
            ) : (
              <button
                onClick={handleClientPortal}
                className="w-full inline-flex items-center justify-center rounded-xl text-[14px] font-bold transition-all hover:-translate-y-0.5"
                style={{
                  minHeight: "48px",
                  color: "#ffffff",
                  background: "linear-gradient(135deg, #0088CC, #00AEEF)",
                  border: "1px solid rgba(0,174,239,0.35)",
                  boxShadow: "0 8px 22px rgba(0,174,239,0.22)",
                }}
              >
                Login to Client Portal
              </button>
            )}
          </div>

          {/* Solutions section */}
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2 px-1 text-[#00AEEF]">Solutions</p>
          <div className="space-y-0.5 mb-4">
            {SOLUTIONS_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={(e) => handleNavClick(e, item.href, item.label)}
                  className="w-full text-left flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium text-slate-700 hover:text-[#00AEEF] hover:bg-[#00AEEF]/5 transition-colors"
                  style={{ minHeight: "44px", background: "none", border: "none", cursor: "pointer" }}
                >
                  <Icon className="w-4 h-4 text-[#00AEEF] flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Industries section */}
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2 px-1 text-[#00AEEF] border-t border-border pt-4">Industries</p>
          <div className="space-y-3 mb-4">
            {INDUSTRY_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5 px-1 text-muted-foreground/60">{group.label}</p>
                <div className="grid grid-cols-1 gap-0.5">
                  {group.industries.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={(e) => handleIndustryClick(e, item)}
                      className="w-full text-left flex items-center rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-600 hover:text-[#00AEEF] hover:bg-[#00AEEF]/5 transition-colors"
                      style={{ minHeight: "44px", background: "none", border: "none", cursor: "pointer" }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={(e) => handleNavClick(e, "/industries", "all_industries")}
            className="block text-center text-[12px] font-bold text-[#00AEEF] hover:underline w-full py-2"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            View All Industries →
          </button>

          {/* Resources section */}
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2 px-1 text-[#00AEEF] border-t border-border pt-4">Resources</p>
          <div className="space-y-0.5 mb-4">
            {RESOURCES_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={(e) => handleNavClick(e, item.href, item.label)}
                  className="w-full text-left flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium text-slate-700 hover:text-[#00AEEF] hover:bg-[#00AEEF]/5 transition-colors"
                  style={{ minHeight: "44px", background: "none", border: "none", cursor: "pointer" }}
                >
                  <Icon className="w-4 h-4 text-[#00AEEF] flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Systems & Pricing */}
          <div className="flex gap-2 mb-6 border-t border-border pt-4">
            {PLAIN_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={(e) => handleNavClick(e, link.href, link.label)}
                className="flex-1 inline-flex items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                style={{ minHeight: "44px", background: "none", cursor: "pointer" }}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Primary CTA */}
          <button
            onClick={handleSelectSystem}
            className="cs-btn-primary cs-nav-cta w-full"
            style={{ minHeight: "48px" }}
          >
            Select Your System
          </button>

          {/* Social links */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3 text-muted-foreground/60 text-center">Follow ClientSurge</p>
            <SocialIcons size="sm" className="justify-center" />
          </div>
        </div>
      </div>
    </nav>
  );
}