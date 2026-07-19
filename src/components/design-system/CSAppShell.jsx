import { useEffect, useId, useState } from "react";
import { Menu, X } from "lucide-react";

/**
 * Shared white-dominant ClientSurge OS application shell.
 *
 * This component intentionally owns layout only. Authentication, routing,
 * tenant resolution, and data fetching remain with the consuming surface.
 */
export default function CSAppShell({
  brand,
  navigation = [],
  activeItem,
  onNavigate,
  topbar,
  children,
  footer,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigationId = useId();

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const handleNavigate = (item) => {
    setMobileOpen(false);
    onNavigate?.(item);
  };

  const sidebar = (
    <aside className="cs-app-shell__sidebar" aria-label="Primary navigation">
      <div className="cs-app-shell__brand">{brand}</div>
      <nav id={navigationId} className="cs-app-shell__nav">
        {navigation.map((item) => {
          const isActive = item.id === activeItem;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`cs-app-shell__nav-item cs-focusable${isActive ? " is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
              onClick={() => handleNavigate(item)}
            >
              {Icon ? <Icon aria-hidden="true" size={18} /> : null}
              <span>{item.label}</span>
              {item.badge ? <span className="cs-app-shell__badge">{item.badge}</span> : null}
            </button>
          );
        })}
      </nav>
      {footer ? <div className="cs-app-shell__sidebar-footer">{footer}</div> : null}
    </aside>
  );

  return (
    <div className="cs-app-shell">
      <div className="cs-app-shell__desktop-sidebar">{sidebar}</div>

      {mobileOpen ? (
        <div className="cs-app-shell__mobile-layer" role="presentation">
          <button
            className="cs-app-shell__backdrop"
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <div className="cs-app-shell__mobile-panel">
            <button
              type="button"
              className="cs-app-shell__mobile-close cs-focusable"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            >
              <X aria-hidden="true" size={22} />
            </button>
            {sidebar}
          </div>
        </div>
      ) : null}

      <section className="cs-app-shell__workspace">
        <header className="cs-app-shell__topbar">
          <button
            type="button"
            className="cs-app-shell__menu-button cs-focusable"
            aria-label="Open navigation"
            aria-controls={navigationId}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu aria-hidden="true" size={22} />
          </button>
          <div className="cs-app-shell__topbar-content">{topbar}</div>
        </header>
        <main className="cs-app-shell__main">{children}</main>
      </section>
    </div>
  );
}
