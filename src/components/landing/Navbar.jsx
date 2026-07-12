import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import { usePageViewTracking } from "../../hooks/usePageViewTracking";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";
import { useAuth } from "@/lib/AuthContext";

const NAV_LINKS = [
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

  usePageViewTracking();

  const accountLabel = user ? "Client Portal" : "Client Login";
  const accountHref = user ? "/client-portal" : "/login";

  const isActivePage = (href) =>
    location.pathname === href || (href !== "/" && location.pathname.startsWith(`${href}/`));

  const closeMenu = () => setOpen(false);

  const navigateTo = (href) => {
    if (href.startsWith("/#")) {
      const id = href.slice(2);

      if (location.pathname === "/") {
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.replaceState(null, "", href);
          return;
        }
      }

      navigate(href);
      return;
    }

    if (href === location.pathname) {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      return;
    }

    navigate(href);
  };

  const handleLink = (event, item, source = "navbar") => {
    event.preventDefault();
    trackCTA(`nav_${analyticsKey(item.label)}`, source);
    closeMenu();
    navigateTo(item.href);
  };

  const handleLogo = (event) => {
    event.preventDefault();
    trackCTA("nav_logo", "navbar");
    closeMenu();

    if (location.pathname === "/") {
      if (location.hash) window.history.replaceState(null, "", "/");
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      return;
    }

    navigate("/");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    closeMenu();
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!open) return undefined;
    return acquireBodyScrollLock("landing-mobile-nav");
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 top-0 z-50 border-b transition-all duration-200"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.92)",
        borderColor: scrolled ? "rgba(148,163,184,0.24)" : "rgba(148,163,184,0.14)",
        boxShadow: scrolled ? "0 8px 28px rgba(15,23,42,0.07)" : "none",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <div
        className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 sm:px-8 lg:px-10"
        style={{ height: "var(--cs-nav-height, 76px)" }}
      >
        <a
          href="/"
          onClick={handleLogo}
          className="inline-flex shrink-0 items-center"
          aria-label="ClientSurge Systems home"
        >
          <img
            src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png"
            alt="ClientSurge Systems"
            width="480"
            height="224"
            decoding="async"
            className="block h-[44px] w-auto object-contain sm:h-[48px]"
          />
        </a>

        <div className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(event) => handleLink(event, item)}
              className="relative py-2 text-sm font-bold transition-colors hover:text-[#008fc9] focus:outline-none focus:ring-2 focus:ring-[#00AEEF] focus:ring-offset-2"
              style={{ color: isActivePage(item.href) ? "#008fc9" : "#334155" }}
            >
              {item.label}
              {isActivePage(item.href) && (
                <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-[#00AEEF]" aria-hidden="true" />
              )}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={accountHref}
            onClick={(event) => handleLink(event, { label: accountLabel, href: accountHref })}
            className="inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00AEEF] focus:ring-offset-2"
          >
            {accountLabel}
          </a>
          <a
            href="/#pricing"
            onClick={(event) => handleLink(event, { label: "Compare Packages", href: "/#pricing" })}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#009bd8] px-5 text-sm font-black text-white transition-colors hover:bg-[#008cc3] focus:outline-none focus:ring-2 focus:ring-[#00AEEF] focus:ring-offset-2"
          >
            Compare Packages
          </a>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <a
            href="/#pricing"
            onClick={(event) => handleLink(event, { label: "Compare Packages", href: "/#pricing" }, "mobile_nav_bar")}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#009bd8] px-4 text-xs font-black text-white transition-colors hover:bg-[#008cc3] focus:outline-none focus:ring-2 focus:ring-[#00AEEF] focus:ring-offset-2"
          >
            Compare
          </a>
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00AEEF] focus:ring-offset-2"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-controls="mobile-nav-drawer"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-[var(--cs-nav-height,76px)] z-40 bg-slate-950/25 lg:hidden"
            aria-label="Close navigation menu"
            onClick={closeMenu}
          />
          <div
            id="mobile-nav-drawer"
            className="relative z-50 border-t border-slate-100 bg-white px-5 pb-6 pt-3 shadow-[0_24px_50px_rgba(15,23,42,0.12)] sm:px-8 lg:hidden"
          >
            <div className="mx-auto max-w-[560px]">
              <div className="grid gap-1">
                {NAV_LINKS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(event) => handleLink(event, item, "mobile_nav")}
                    className="flex min-h-12 items-center rounded-xl px-3 text-base font-bold text-slate-800 transition-colors hover:bg-sky-50 hover:text-[#008fc9] focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
                  >
                    {item.label}
                  </a>
                ))}
              </div>

              <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <a
                  href={accountHref}
                  onClick={(event) => handleLink(event, { label: accountLabel, href: accountHref }, "mobile_nav")}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-800 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
                >
                  {accountLabel}
                </a>
                <a
                  href="/#pricing"
                  onClick={(event) => handleLink(event, { label: "Compare Packages", href: "/#pricing" }, "mobile_nav")}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#009bd8] px-5 text-sm font-black text-white transition-colors hover:bg-[#008cc3] focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
                >
                  Compare Packages
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
