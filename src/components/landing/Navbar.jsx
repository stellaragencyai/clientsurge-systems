import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import { usePageViewTracking } from "../../hooks/usePageViewTracking";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";
import { useAuth } from "@/lib/AuthContext";
import { SITE_CONFIG } from "@/lib/siteConfig";

const sectionLinks = SITE_CONFIG.navigation.sections.filter((link) => link.label !== "Industries");

const DESKTOP_NAV = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Automations", href: "/automations" },
  { label: "Industries", href: "/industries" },
  { label: "Pricing", href: "/pricing" },
];

function analyticsKey(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
    setOpen(false);
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

  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        background: scrolled ? "rgba(255, 255, 255, 0.78)" : "rgba(255, 255, 255, 0.94)",
        backdropFilter: "blur(22px) saturate(1.35)",
        WebkitBackdropFilter: "blur(22px) saturate(1.35)",
        borderBottom: scrolled ? "1px solid rgba(0, 212, 255, 0.12)" : "1px solid rgba(0, 212, 255, 0.10)",
        boxShadow: scrolled ? "0 12px 36px rgba(0, 212, 255, 0.10)" : "0 4px 18px rgba(0, 212, 255, 0.04)",
        overflow: "visible",
      }}
    >
      <div
        className="nav-container w-full flex items-center justify-between"
        style={{
          height: "var(--cs-nav-height)",
        }}
      >
        <a
          href="/"
          onClick={handleLogoClick}
          className="shrink-0"
          aria-label="ClientSurge Systems home"
          style={{ display: "inline-flex", alignItems: "center", height: "100%" }}
        >
          <img
            src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/908ae3da9_Gemini_Generated_Image_a681cra681cra681.png"
            alt="ClientSurge Systems"
            width="480"
            height="224"
            decoding="async"
            style={{ height: "clamp(30px, 4vw, 36px)", width: "auto", maxWidth: "100%", objectFit: "contain", display: "block" }}
          />
        </a>

        <div className="hidden lg:flex items-center gap-6 xl:gap-8 flex-1 justify-center">
          {DESKTOP_NAV.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => handleNavClick(event, link, "navbar")}
              className="text-sm transition-all duration-300 whitespace-nowrap relative pb-0.5"
              style={{ color: isActivePage(link.href) ? "#00D4FF" : "#1a1a1a", fontWeight: 500, textDecoration: "none" }}
            >
              {link.label}
              <span style={{ position: "absolute", bottom: "-2px", left: 0, right: isActivePage(link.href) ? 0 : "100%", height: "2px", borderRadius: "999px", background: "#00D4FF", boxShadow: "0 0 6px rgba(0,212,255,0.45)", transition: "right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
            </a>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              trackCTA("client_login", "navbar");
              closeAll();
              navigate("/login");
            }}
            className="hidden md:flex items-center gap-1.5 transition-all duration-300 hover:-translate-y-0.5"
            style={{
              minHeight: "unset",
              minWidth: "unset",
              padding: "0.55rem 1.1rem",
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "#0047AB",
              background: "rgba(255,255,255,0.6)",
              border: "1.5px solid #0047AB",
              borderRadius: "0.625rem",
              boxShadow: "0 4px 14px rgba(0,71,171,0.18)",
            }}
          >
            Client Login
          </button>
          <button
            type="button"
            onClick={() => {
              trackCTA("get_my_lead_system", "navbar");
              closeAll();
              navigate("/pricing");
            }}
            className="transition-colors duration-200"
            style={{
              minHeight: "unset",
              minWidth: "unset",
              padding: "0.55rem 1.1rem",
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "#ffffff",
              background: "linear-gradient(90deg, #0047AB 0%, #00D4FF 100%)",
              borderRadius: "0.625rem",
              boxShadow: "0 6px 18px rgba(0,212,255,0.28)",
            }}
          >
            Compare Packages
          </button>
        </div>

        <div className="lg:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              trackCTA("get_my_lead_system_mobile_bar", "navbar");
              closeAll();
              navigate("/pricing");
            }}
            className="cs-btn-primary cs-nav-cta"
            style={{ minHeight: "44px", height: "44px", padding: "0 14px", fontSize: "0.7rem" }}
          >
            Compare Packages
          </button>
          <button
            type="button"
            className="w-11 h-11 rounded-full border backdrop-blur-[3px] flex items-center justify-center shadow-sm transition-colors"
            onClick={() => setOpen(!open)}
            style={{
              borderColor: "rgba(15, 23, 42, 0.12)",
              background: open ? "rgba(0, 212, 255, 0.10)" : "rgba(255, 255, 255, 0.62)",
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
          <div className="fixed inset-0 z-40 lg:hidden bg-slate-950/35 backdrop-blur-[2px]" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            id="mobile-nav-drawer"
            className="lg:hidden fixed z-50 overflow-hidden rounded-[1.75rem] border mobile-nav-drawer"
            style={{
              animation: "navDrawerSlideIn 0.32s cubic-bezier(0.16, 1, 0.3, 1)",
              top: "calc(var(--cs-nav-height) + env(safe-area-inset-top) + 12px)",
              left: "max(12px, env(safe-area-inset-left))",
              right: "max(12px, env(safe-area-inset-right))",
              maxHeight: "calc(100dvh - var(--cs-nav-height) - env(safe-area-inset-top) - 28px)",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              padding: "14px",
              paddingBottom: "max(14px, calc(14px + env(safe-area-inset-bottom)))",
              background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(247,252,255,0.98) 100%)",
              borderColor: "rgba(0,212,255,0.16)",
              backdropFilter: "blur(24px) saturate(1.25)",
              WebkitBackdropFilter: "blur(24px) saturate(1.25)",
              boxShadow: "0 28px 80px rgba(15,23,42,0.22), 0 0 0 1px rgba(255,255,255,0.7)",
            }}
          >
            <div className="flex items-start justify-between gap-4 rounded-2xl border px-4 py-3"
              style={{ background: "rgba(255,255,255,0.78)", borderColor: "rgba(0,212,255,0.14)" }}>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: "#0047AB" }}>
                  Menu
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  Choose where you want to go next.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-sky-50"
                style={{ borderColor: "rgba(15,23,42,0.12)", color: "#0F172A" }}
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-3 grid gap-2">
              {sectionLinks.map((link) => {
                const active = isActivePage(link.href);
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-2xl border px-4 py-3.5 text-[15px] font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                    style={{
                      minHeight: "52px",
                      color: active ? "#0079C1" : "#0F172A",
                      background: active ? "rgba(0,212,255,0.09)" : "rgba(255,255,255,0.72)",
                      borderColor: active ? "rgba(0,212,255,0.28)" : "rgba(15,23,42,0.08)",
                      boxShadow: active ? "0 10px 26px rgba(0,212,255,0.10)" : "none",
                    }}
                    onClick={(event) => handleNavClick(event, link, "mobile_nav")}
                  >
                    <span>{link.label}</span>
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs"
                      style={{
                        background: active ? "#00D4FF" : "rgba(15,23,42,0.05)",
                        color: active ? "#fff" : "#64748B",
                      }}
                    >
                      →
                    </span>
                  </a>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border px-4 py-4" style={{ background: "rgba(0,212,255,0.06)", borderColor: "rgba(0,212,255,0.16)" }}>
              {mobileUserName ? (
                <>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/70">Signed in</p>
                  <p className="mt-1 truncate text-sm font-bold text-slate-950">{mobileUserName}</p>
                  <p className="text-xs capitalize text-slate-500">{mobileUserRole || "client"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => { trackCTA("quick_portal", "mobile_nav"); closeAll(); navigate("/client-portal"); }}
                      className="rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
                      style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", color: "#002D62", minHeight: "36px" }}
                    >My Portal</button>
                    <button
                      type="button"
                      onClick={() => { trackCTA("quick_automations", "mobile_nav"); closeAll(); navigate("/automations"); }}
                      className="rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
                      style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", color: "#002D62", minHeight: "36px" }}
                    >Automations</button>
                    <button
                      type="button"
                      onClick={() => { trackCTA("quick_support", "mobile_nav"); closeAll(); navigate("/contact"); }}
                      className="rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
                      style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", color: "#002D62", minHeight: "36px" }}
                    >Support</button>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        trackCTA("client_dashboard", "mobile_nav");
                        closeAll();
                        navigate("/client-portal");
                      }}
                      className="w-full rounded-xl text-[14px] font-black text-white transition-all hover:-translate-y-0.5"
                      style={{ minHeight: "48px", background: "linear-gradient(135deg, #0047AB, #00D4FF)", boxShadow: "0 12px 26px rgba(0,212,255,0.24)" }}
                    >
                      Go to Client Portal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        trackCTA("get_my_lead_system", "mobile_nav");
                        closeAll();
                        navigate("/pricing");
                      }}
                      className="w-full rounded-xl border bg-white text-[14px] font-black text-slate-950 transition-colors hover:bg-sky-50"
                      style={{ minHeight: "48px", borderColor: "rgba(0,212,255,0.20)" }}
                    >
                      Compare Packages
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/70">Client access</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">Log in to your portal or compare packages.</p>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        trackCTA("client_login", "mobile_nav");
                        closeAll();
                        navigate("/login");
                      }}
                      className="w-full rounded-xl text-[14px] font-black text-white transition-all hover:-translate-y-0.5"
                      style={{ minHeight: "48px", background: "linear-gradient(135deg, #0047AB, #00D4FF)", boxShadow: "0 12px 26px rgba(0,212,255,0.24)" }}
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
                      className="w-full rounded-xl border bg-white text-[14px] font-black text-slate-950 transition-colors hover:bg-sky-50"
                      style={{ minHeight: "48px", borderColor: "rgba(0,212,255,0.20)" }}
                    >
                      Contact
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                trackCTA("get_my_lead_system", "mobile_nav_footer");
                closeAll();
                navigate("/pricing");
              }}
              className="mt-3 flex w-full items-center justify-center rounded-2xl text-[15px] font-black text-white transition-colors"
              style={{
                minHeight: "52px",
                background: "linear-gradient(135deg,#002D62 0%,#00D4FF 100%)",
                boxShadow: "0 16px 34px rgba(0,212,255,0.28)",
              }}
            >
              Compare Packages
            </button>
          </div>
        </>
      )}

      <style>{`
        .nav-container {
          padding-left: max(1rem, env(safe-area-inset-left));
          padding-right: max(1rem, env(safe-area-inset-right));
        }
        @media (min-width: 640px) {
          .nav-container {
            padding-left: max(1.25rem, env(safe-area-inset-left));
            padding-right: max(1.25rem, env(safe-area-inset-right));
          }
        }
        @media (min-width: 1024px) {
          .nav-container {
            padding-left: max(1.5rem, env(safe-area-inset-left));
            padding-right: max(1.5rem, env(safe-area-inset-right));
          }
        }
        @media (min-width: 1200px) {
          .nav-container {
            padding-left: max(2rem, env(safe-area-inset-left));
            padding-right: max(2rem, env(safe-area-inset-right));
          }
        }
        @keyframes navDrawerSlideIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          #mobile-nav-drawer { animation: none !important; }
        }
      `}</style>
    </nav>
  );
}
