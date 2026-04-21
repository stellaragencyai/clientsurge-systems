import { useEffect, useState } from "react";
import { ChevronDown, Menu, Moon, Sun, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import LoginModal from "../forms/LoginModal";
import { trackCTA } from "@/lib/analytics";

const sectionLinks = [
  { label: "How It Works", href: "#how-it-works-section" },
  { label: "Our System", href: "#services" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const industryLinks = [
  { label: "Med Spas & Aesthetic Clinics", href: "/med-spa", live: true },
  { label: "Dental & Orthodontics", href: "/industries#dental", live: false },
  { label: "Chiropractic & Physical Therapy", href: "/industries#chiropractic", live: false },
  { label: "HVAC, Plumbing & Home Services", href: "/industries#hvac", live: false },
  { label: "Roofing & Restoration", href: "/industries#roofing", live: false },
  { label: "Contractors & Trades", href: "/industries#contractors", live: false },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [industriesOpen, setIndustriesOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleDark = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem("theme-preference", isDark ? "dark" : "light");
    if (isDark) {
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "hsl(220, 20%, 5%)";
    } else {
      document.body.style.backgroundImage = "url('https://media.base44.com/images/public/69dc4a79656fdba136d413d3/10c852a82_generated_image.png')";
      document.body.style.backgroundColor = "";
    }
  };

  const smoothScrollToHash = (href) => {
    const el = document.querySelector(href);
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
    const storedTheme = window.localStorage.getItem("theme-preference");
    const shouldUseDark = storedTheme === "dark";
    setDarkMode(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
    if (shouldUseDark) {
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "hsl(220, 20%, 5%)";
    } else {
      document.body.style.backgroundImage =
        "url('https://media.base44.com/images/public/69dc4a79656fdba136d413d3/10c852a82_generated_image.png')";
      document.body.style.backgroundColor = "";
    }
  }, []);

  useEffect(() => {
    if (!location.hash) return;
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
    <nav
      className={`sticky top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/40 backdrop-blur-2xl border-b border-white/30 shadow-lg"
          : "bg-white/15 backdrop-blur-md border-b border-white/20"
      }`}
    >
      <div className="w-full px-6 md:px-8 h-16 flex items-center justify-between">
        <button
          onClick={handleLogoClick}
          className="font-display font-bold tracking-tight text-foreground shrink-0 bg-none border-none cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
          style={{ fontSize: "1rem" }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <span className="text-white font-black text-sm">CS</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-black text-sm">ClientSurge</span>
            <span className="text-primary text-xs font-bold">Systems</span>
          </div>
        </button>

        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {sectionLinks.map((link) => (
            <a
              key={link.href}
              href={`/${link.href}`}
              onClick={(e) => handleSectionNavigation(e, link.href)}
              className="text-base font-medium text-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}

          <div
            className="relative"
            onMouseEnter={() => setIndustriesOpen(true)}
            onMouseLeave={() => setIndustriesOpen(false)}
          >
            <button
              onClick={() => setIndustriesOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 text-base font-medium text-foreground hover:text-primary transition-colors"
            >
              Industries
              <ChevronDown className={`w-4 h-4 transition-transform ${industriesOpen ? "rotate-180" : ""}`} />
            </button>

            {industriesOpen && (
              <div className="absolute top-full left-1/2 mt-3 w-60 -translate-x-1/2 rounded-2xl border border-border bg-background/95 backdrop-blur shadow-lg p-3">
                <div className="space-y-1">
                  {industryLinks.map((item) =>
                    item.live ? (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={() => trackCTA(`industry_${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "navbar_dropdown")}
                        className="block rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={() => {
                          trackCTA(`industry_${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "navbar_dropdown");
                          setIndustriesOpen(false);
                        }}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                      >
                        <span>{item.label}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide">Coming soon</span>
                      </a>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <button
            onClick={toggleDark}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
            aria-pressed={darkMode}
            className="h-9 rounded-full inline-flex items-center justify-center gap-2 border border-border bg-background/50 hover:bg-muted px-3 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {darkMode ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
            <span className="text-xs font-semibold text-foreground">Theme</span>
          </button>
          <button
            onClick={() => {
              trackCTA("login", "navbar");
              setShowLoginModal(true);
            }}
            className="text-sm font-semibold text-foreground hover:text-primary focus:ring-2 focus:ring-primary focus:outline-none rounded px-3 py-2 transition-colors"
          >
            Login
          </button>
          <button
            onClick={() => {
              trackCTA("book_your_free_demo", "navbar");
              navigate("/book");
            }}
            style={{ display: "inline-block", borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)", boxShadow: "0 4px 14px rgba(120,70,20,0.35)", transition: "box-shadow 0.3s ease, transform 0.3s ease", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 40px rgba(161,120,35,0.6), 0 4px 18px rgba(120,70,20,0.35)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 14px rgba(120,70,20,0.35)")}
            className="focus:ring-2 focus:ring-primary focus:outline-none rounded"
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 20px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "600", fontSize: "0.875rem", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
              Book Your Free Demo
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
        <div className="md:hidden bg-background border-b border-border px-6 pb-6 pt-2 space-y-4">
          {sectionLinks.map((link) => (
            <a
              key={link.href}
              href={`/${link.href}`}
              className="block text-sm text-muted-foreground hover:text-foreground focus:ring-2 focus:ring-primary focus:outline-none rounded px-2 py-1"
              onClick={(e) => handleSectionNavigation(e, link.href)}
            >
              {link.label}
            </a>
          ))}

          <div className="pt-2 border-t border-border">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-2">Industries</p>
            <div className="space-y-1">
              {industryLinks.map((item) =>
                item.live ? (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => {
                      trackCTA(`industry_${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "mobile_nav");
                      setOpen(false);
                    }}
                    className="block text-sm text-muted-foreground hover:text-foreground focus:ring-2 focus:ring-primary focus:outline-none rounded px-2 py-1"
                  >
                    {item.label}
                  </a>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between rounded px-2 py-1 text-sm text-muted-foreground/80 hover:text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                    onClick={() => {
                      trackCTA(`industry_${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, "mobile_nav");
                      setOpen(false);
                    }}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide">Soon</span>
                  </a>
                )
              )}
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
              trackCTA("book_your_free_demo", "mobile_nav");
              setOpen(false);
              navigate("/book");
            }}
            style={{ display: "block", borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)", boxShadow: "0 4px 14px rgba(120,70,20,0.35)", border: "none", cursor: "pointer", width: "100%" }}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", height: "40px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "600", fontSize: "0.875rem", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
              Book Your Free Demo
            </span>
          </button>
        </div>
      )}

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </nav>
  );
}
