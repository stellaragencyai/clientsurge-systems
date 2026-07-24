import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import { usePageViewTracking } from "../../hooks/usePageViewTracking";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";
import { useAuth } from "@/lib/AuthContext";
import { SITE_CONFIG } from "@/lib/siteConfig";

const sectionLinks = SITE_CONFIG.navigation.sections.filter((link) => link.label !== "Industries");

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
          {sectionLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => handleNavClick(event, link, "navbar")}
              className="text-sm transition-all duration-300 whitespace-nowrap relative pb-0.5"
              style={{ color: isActivePage(link.href) ? "#00AEEF" : "#4a4a4a", fontWeight: 500, textDecoration: "none" }}
            >
              {link.label}
              <span style={{ position: "absolute", bottom: "-6px", left: 0, right: isActivePage(link.href) ? 0 : "100%", height: "2px", borderRadius: "999px", background: "#00AEEF", boxShadow: "0 0 6px rgba(0,174,239,0.45)", transition: "right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
            </a>
          ))}
        </div>

        <div className="hidden xl:flex items-center gap-2 shrink-0">
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
              color: "#ffffff",
              background: "#000000",
              borderRadius: "0.625rem",
              boxShadow: "0 6px 18px rgba(15,23,42,0.18)",
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
            className="transition-all duration-300 hover:-translate-y-0.5"
            style={{
              minHeight: "unset",
              minWidth: "unset",
              padding: "0.55rem 1.1rem",
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "#ffffff",
              background: "linear-gradient(90deg, #0079c1 0%, #00AEEF 100%)",
              borderRadius: "0.625rem",
              boxShadow: "0 6px 18px rgba(0,174,239,0.28)",
            }}
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
              background: open ? "rgba(0, 174, 239, 0.10)" : "rgba(255, 255, 255, 0.62)",
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
          <div className="fixed inset-0 z-40 xl:hidden bg-slate-950/35 backdrop-blur-[2px]" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            id="mobile-nav-drawer"
            className="xl:hidden fixed z-50 overflow-hidden rounded-[1.75rem] border mobile-nav-drawer"
            style={{
              top: "calc(var(--cs-nav-height) + env(safe-area-inset-top) + 12px)",
              left: "max(12px, env(safe-area-inset-left))",
              right: "max(12px, env(safe-area-inset-right))",
              maxHeight: "calc(100dvh - var(--cs-nav-height) - env(safe-area-inset-top) - 28px)",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              padding: "14px",
              paddingBottom: "max(14px, calc(14px + env(safe-area-inset-bottom)))",
              background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(247,252,255,0.98) 100%)",
              borderColor: "rgba(0,174,239,0.16)",
              backdropFilter: "blur(24px) saturate(1.25)",
              WebkitBackdropFilter: "blur(24px) saturate(1.25)",
              boxShadow: "0 28px 80px rgba(15,23,42,0.22), 0 0 0 1px rgba(255,255,255,0.7)",
            }}
          >
            <div className="flex items-start justify-between gap-4 rounded-2xl border px-4 py-3"
              style={{ background: "rgba(255,255,255,0.78)", borderColor: "rgba(0,174,239,0.14)" }}>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: "#0088CC" }}>
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
                      background: active ? "rgba(0,174,239,0.09)" : "rgba(255,255,255,0.72)",
                      borderColor: active ? "rgba(0,174,239,0.28)" : "rgba(15,23,42,0.08)",
                      boxShadow: active ? "0 10px 26px rgba(0,174,239,0.10)" : "none",
                    }}
                    onClick={(event) => handleNavClick(event, link, "mobile_nav")}
                  >
                    <span>{link.label}</span>
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs"
                      style={{
                        background: active ? "#00AEEF" : "rgba(15,23,42,0.05)",
                        color: active ? "#fff" : "#64748B",
                      }}
                    >
                      →
                    </span>
                  </a>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border px-4 py-4" style={{ background: "rgba(0,174,239,0.06)", borderColor: "rgba(0,174,239,0.16)" }}>
              {mobileUserName ? (
                <>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/70">Signed in</p>
                  <p className="mt-1 truncate text-sm font-bold text-slate-950">{mobileUserName}</p>
                  <p className="text-xs capitalize text-slate-500">{mobileUserRole || "client"}</p>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        trackCTA("client_dashboard", "mobile_nav");
                        closeAll();
                        navigate("/client-portal");
                      }}
                      className="w-full rounded-xl text-[14px] font-black text-white transition-all hover:-translate-y-0.5"
                      style={{ minHeight: "48px", background: "linear-gradient(135deg, #0088CC, #00AEEF)", boxShadow: "0 12px 26px rgba(0,174,239,0.24)" }}
                    >
                      Go to Client Portal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        trackCTA("compare_packages", "mobile_nav");
                        closeAll();
                        navigateTo("/#pricing");
                      }}
                      className="w-full rounded-xl border bg-white text-[14px] font-black text-slate-950 transition-colors hover:bg-sky-50"
                      style={{ minHeight: "48px", borderColor: "rgba(0,174,239,0.20)" }}
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
                      style={{ minHeight: "48px", background: "linear-gradient(135deg, #0088CC, #00AEEF)", boxShadow: "0 12px 26px rgba(0,174,239,0.24)" }}
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
                      style={{ minHeight: "48px", borderColor: "rgba(0,174,239,0.20)" }}
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
                trackCTA("compare_packages", "mobile_nav_footer");
                closeAll();
                navigateTo("/#pricing");
              }}
              className="mt-3 flex w-full items-center justify-center rounded-2xl text-[15px] font-black text-white transition-all hover:-translate-y-0.5"
              style={{
                minHeight: "52px",
                background: "linear-gradient(135deg,#006BB0 0%,#00AEEF 100%)",
                boxShadow: "0 16px 34px rgba(0,174,239,0.28)",
              }}
            >
              Compare Packages
            </button>
          </div>
        </>
      )}
    </nav>
  );
}