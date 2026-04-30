import { useEffect, useState } from "react";
import { motion, useScroll, useMotionValueEvent, useTransform } from "framer-motion";
import { ChevronDown, Menu, Moon, Sun, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import PortalLoginModal from "../forms/PortalLoginModal";
import DemoBookingModal from "../forms/DemoBookingModal";
import { trackCTA } from "@/lib/analytics";
import { usePageViewTracking } from "../../hooks/usePageViewTracking";
import { BUTTON_TEXT, BUTTON_STYLES } from "@/lib/constants";

const sectionLinks = [
  { label: "How It Works", href: "#problem-solution" },
  { label: "AI Store", href: "/store", isPage: true },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const industryLinks = [
  { label: "Med Spas & Aesthetic Clinics", href: "/med-spa", live: true },
  { label: "Dental & Orthodontics", href: "/dental", live: true },
  { label: "Chiropractic & Physical Therapy", href: "/chiropractic", live: true },
  { label: "HVAC, Plumbing & Home Services", href: "/hvac", live: true },
  { label: "Roofing & Restoration", href: "/roofing", live: true },
  { label: "Contractors & Trades", href: "/contractors", live: true },
];

const SAFE_SECTION_HASHES = new Set([
  "#problem-solution",
  "#services",
  "#pricing",
  "#faq",
  "#testimonials",
  "#industries",
  "#book-demo",
]);

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
  }
}

function safeApplyTheme(isDark) {
  try {
    document.documentElement.classList.toggle("dark", isDark);
  } catch {
    // Ignore DOM theme failures in preview environments.
  }
}

function getSafeHashTarget(hash) {
  if (!hash || !SAFE_SECTION_HASHES.has(hash)) {
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
  const [scrolled, setScrolled] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [industriesOpen, setIndustriesOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { scrollY } = useScroll();
  const navOpacity = useTransform(scrollY, [0, 50], [0.15, 0.6]);
  const navBlur = useTransform(scrollY, [0, 50], [8, 22]);

  // Track page views
  usePageViewTracking();

  const toggleDark = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    safeApplyTheme(isDark);
    safeSetThemePreference(isDark ? "dark" : "light");
    // Also update document attribute for CSS targeting
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    }
  };

  const smoothScrollToHash = (href) => {
    const el = getSafeHashTarget(href);
    if (!el) return false;

    const start = window.scrollY;
    const target = el.getBoundingClientRect().top + window.scrollY - 64;
    const distance = target - start;
    const duration = 900;
    let startTime = null;
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      window.scrollTo(0, start + distance * ease(progress));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
    return true;
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Prevent body scroll when nav is open
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  useEffect(() => {
    // Check stored preference first, then system preference
    const storedTheme = safeGetThemePreference();
    let shouldUseDark = storedTheme === "dark";
    
    if (!storedTheme && typeof window !== "undefined") {
      // Fallback to system preference if no stored preference
      shouldUseDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    
    setDarkMode(shouldUseDark);
    safeApplyTheme(shouldUseDark);
  }, []);

  useEffect(() => {
    if (!location.hash || !SAFE_SECTION_HASHES.has(location.hash)) return;
    const timer = window.setTimeout(() => {
      smoothScrollToHash(location.hash);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [location.hash]);

  const handleSectionNavigation = (e, href) => {
    e.preventDefault();
    trackCTA(`nav_${href.replace("#", "")}`, "navbar");
    if (location.pathname !== "/") {
      navigate(`/${href}`);
      setOpen(false);
      setIndustriesOpen(false);
      return;
    }

    smoothScrollToHash(href);
    window.history.replaceState({}, "", `/${href}`);
    setOpen(false);
    setIndustriesOpen(false);
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    trackCTA("nav_logo", "navbar");
    if (location.pathname !== "/") {
      navigate("/");
      return;
    }

    // Always scroll to top smoothly
    const start = window.scrollY;
    const distance = -start;
    const duration = 900;
    let startTime = null;
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      window.scrollTo(0, start + distance * ease(progress));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  return (
    <motion.nav
      className="sticky top-4 left-4 right-4 z-50 rounded-2xl border border-white/20"
      style={{
        backgroundColor: navOpacity.get() > 0.4 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        paddingTop: "env(safe-area-inset-top)",
        boxShadow: scrolled ? "0 20px 60px rgba(0,0,0,0.12)" : "0 8px 32px rgba(0,0,0,0.06)",
        transition: "all 0.35s ease-out",
      }}
      onScroll={(scrollProgress) => {
        const threshold = 50;
        if (typeof window !== "undefined") {
          const isBelowThreshold = window.scrollY > threshold;
          if (isBelowThreshold && !scrolled) setScrolled(true);
          if (!isBelowThreshold && scrolled) setScrolled(false);
        }
      }}
    >
      <div className="w-full h-14 md:h-16 flex items-center justify-between px-4 md:px-6" style={{ paddingLeft: "max(1.25rem, env(safe-area-inset-left))", paddingRight: "max(1.25rem, env(safe-area-inset-right))" }}>
        <button
          onClick={handleLogoClick}
          className="font-display font-bold tracking-tight text-foreground shrink-0 bg-none border-none cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1.5 md:gap-2"
          style={{ fontSize: "1rem", minHeight: "unset", minWidth: "unset" }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <span className="text-white font-black text-sm">CS</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-black text-sm">ClientSurge</span>
            <span className="text-primary text-xs font-bold">Systems</span>
          </div>
        </button>

        <div className="hidden lg:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
          {sectionLinks.map((link) => (
            link.isPage ? (
              <a
                key={link.href}
                href={link.href}
                onClick={() => { trackCTA("ai_store", "navbar"); }}
                className="text-xs lg:text-sm font-semibold text-primary hover:text-primary/80 transition-colors border border-primary/25 px-2 lg:px-3 py-1 rounded-full hover:bg-primary/5 whitespace-nowrap"
              >
                {link.label} ✦
              </a>
            ) : (
              <a
                key={link.href}
                href={`/${link.href}`}
                onClick={(e) => handleSectionNavigation(e, link.href)}
                className="text-xs lg:text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                {link.label}
              </a>
            )
          ))}

          <div
            className="relative"
            onMouseEnter={() => setIndustriesOpen(true)}
            onMouseLeave={() => setIndustriesOpen(false)}
            onKeyDown={(e) => { if (e.key === "Escape") setIndustriesOpen(false); }}
          >
            <button
              onClick={() => setIndustriesOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs lg:text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap"
            >
              Industries
              <ChevronDown className={`w-4 h-4 transition-transform ${industriesOpen ? "rotate-180" : ""}`} />
            </button>

            {industriesOpen && (
              <div className="absolute top-full left-1/2 mt-3 w-60 -translate-x-1/2 rounded-2xl border border-border bg-background/95 backdrop-blur shadow-lg p-3">
                <div className="space-y-1">
                  {industryLinks.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        trackCTA(`industry_${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "navbar_dropdown");
                        navigate(item.href);
                        setIndustriesOpen(false);
                      }}
                      className={`w-full text-left block rounded-xl px-3 py-2 text-sm transition-colors border-none bg-transparent cursor-pointer ${
                        item.live ? "font-medium text-foreground hover:bg-muted" : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
          <button
            onClick={toggleDark}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
            aria-pressed={darkMode}
            className="w-9 h-9 rounded-full inline-flex items-center justify-center border border-border bg-background/50 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {darkMode ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
          </button>
          <a
            href="/client-dashboard"
            className="hidden lg:block text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded border border-dashed border-border hover:border-primary/40"
            title="Temp: Member Dashboard"
          >
            📊 Dashboard
          </a>
          <button
            onClick={() => {
              trackCTA("login", "navbar");
              setShowLoginModal(true);
            }}
            className="hidden lg:block text-sm font-semibold text-foreground hover:text-primary border border-border hover:border-primary/40 bg-background/50 focus:ring-2 focus:ring-primary focus:outline-none rounded-full px-4 py-1.5 transition-colors"
          >
            Login
          </button>
          <button
            onClick={() => {
              trackCTA("book_demo", "navbar");
              setShowBookingModal(true);
            }}
            style={{ display: "inline-block", borderRadius: "9999px", padding: "2px", background: "linear-gradient(90deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)", backgroundSize: "200% 100%", animation: "rotateBorderGlow 4s ease-in-out infinite", boxShadow: "0 4px 14px rgba(120,70,20,0.35)", transition: "box-shadow 0.3s ease, transform 0.3s ease", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = BUTTON_STYLES.BROWN_GRADIENT_HOVER.boxShadow)}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 14px rgba(120,70,20,0.35)")}
            className="hidden md:inline-block focus:ring-2 focus:ring-primary focus:outline-none rounded"
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 16px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "600", fontSize: "0.75rem", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
              {BUTTON_TEXT.BOOK_DEMO_SHORT}
            </span>
          </button>
        </div>

        <button
          className="md:hidden w-10 h-10 rounded-full border border-border bg-background/70 backdrop-blur flex items-center justify-center text-foreground shadow-sm"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)} />
        <div className="md:hidden bg-background border-b border-border px-5 pb-safe-bottom pb-6 pt-2 space-y-1 relative z-50" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
          {sectionLinks.map((link) => (
            link.isPage ? (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground focus:ring-2 focus:ring-primary focus:outline-none rounded-xl px-3 py-3 transition-colors hover:bg-muted/50"
                style={{ minHeight: "44px" }}
                onClick={() => {
                  trackCTA("ai_store", "mobile_nav");
                  setOpen(false);
                }}
              >
                {link.label}
              </a>
            ) : (
              <a
                key={link.href}
                href={`/${link.href}`}
                className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground focus:ring-2 focus:ring-primary focus:outline-none rounded-xl px-3 py-3 transition-colors hover:bg-muted/50"
                style={{ minHeight: "44px" }}
                onClick={(e) => {
                  handleSectionNavigation(e, link.href);
                  setOpen(false);
                }}
              >
                {link.label}
              </a>
            )
          ))}

          <div className="pt-2 border-t border-border">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-2">Industries</p>
            <div className="space-y-1">
              {industryLinks.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    trackCTA(`industry_${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "mobile_nav");
                    navigate(item.href);
                    setOpen(false);
                  }}
                  className="w-full text-left flex items-center rounded-xl px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:ring-2 focus:ring-primary focus:outline-none border-none bg-transparent cursor-pointer transition-colors"
                  style={{ minHeight: "44px" }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={toggleDark}
            className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-foreground hover:text-primary border border-border rounded-full py-2 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
            Theme
          </button>

          <button
            onClick={() => {
              trackCTA("login", "mobile_nav");
              setOpen(false);
              setShowLoginModal(true);
            }}
            className="w-full text-sm font-semibold text-foreground hover:text-primary border border-border rounded-full py-2 transition-colors"
          >
            Login
          </button>
          <button
            onClick={() => {
              trackCTA("book_demo", "mobile_nav");
              setOpen(false);
              setShowBookingModal(true);
            }}
            style={{ display: "block", borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)", boxShadow: "0 4px 14px rgba(120,70,20,0.35)", border: "none", cursor: "pointer", width: "100%" }}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", height: "40px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "600", fontSize: "0.875rem", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
              {BUTTON_TEXT.BOOK_DEMO}
            </span>
          </button>
        </div>
        </>
      )}

      {showLoginModal && <PortalLoginModal onClose={() => setShowLoginModal(false)} />}
      {showBookingModal && <DemoBookingModal onClose={() => setShowBookingModal(false)} />}
    </motion.nav>
  );
}