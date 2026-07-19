import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(container) {
  if (!container) return [];

  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter((element) => {
    const isHidden = element.getAttribute("aria-hidden") === "true";
    return !isHidden && element.getClientRects().length > 0;
  });
}

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
  const shellId = useId();
  const desktopNavigationId = `${shellId}-desktop-navigation`;
  const mobileDrawerId = `${shellId}-mobile-navigation-drawer`;
  const mobileNavigationId = `${shellId}-mobile-navigation`;
  const menuButtonRef = useRef(null);
  const mobilePanelRef = useRef(null);
  const lastFocusedElementRef = useRef(null);
  const shouldRestoreFocusRef = useRef(false);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const releaseScrollLock = acquireBodyScrollLock("cs-app-shell-mobile-navigation");
    const panel = mobilePanelRef.current;
    const [firstFocusable] = getFocusableElements(panel);

    window.requestAnimationFrame(() => {
      (firstFocusable ?? panel)?.focus({ preventScroll: true });
    });

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobileNavigation();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const focusableElements = getFocusableElements(panel);
      if (focusableElements.length === 0) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (!panel.contains(activeElement) || activeElement === firstElement)) {
        event.preventDefault();
        lastElement.focus({ preventScroll: true });
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      releaseScrollLock();
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (mobileOpen || !shouldRestoreFocusRef.current) return;

    shouldRestoreFocusRef.current = false;
    const focusTarget = lastFocusedElementRef.current ?? menuButtonRef.current;
    window.requestAnimationFrame(() => {
      if (focusTarget?.isConnected) {
        focusTarget.focus({ preventScroll: true });
      }
    });
  }, [mobileOpen]);

  const openMobileNavigation = () => {
    lastFocusedElementRef.current = document.activeElement;
    shouldRestoreFocusRef.current = true;
    setMobileOpen(true);
  };

  const closeMobileNavigation = () => {
    shouldRestoreFocusRef.current = true;
    setMobileOpen(false);
  };

  const handleNavigate = (item) => {
    closeMobileNavigation();
    onNavigate?.(item);
  };

  const renderSidebar = (navigationId) => (
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

  const inertBackgroundProps = mobileOpen ? { inert: "", "aria-hidden": "true" } : {};

  return (
    <div className="cs-app-shell">
      <div className="cs-app-shell__desktop-sidebar" {...inertBackgroundProps}>
        {renderSidebar(desktopNavigationId)}
      </div>

      {mobileOpen ? (
        <div className="cs-app-shell__mobile-layer" role="presentation">
          <button
            className="cs-app-shell__backdrop"
            type="button"
            aria-label="Close navigation"
            onClick={closeMobileNavigation}
          />
          <div
            id={mobileDrawerId}
            ref={mobilePanelRef}
            className="cs-app-shell__mobile-panel"
            role="dialog"
            aria-label="Primary navigation"
            aria-modal="true"
            tabIndex={-1}
          >
            <button
              type="button"
              className="cs-app-shell__mobile-close cs-focusable"
              aria-label="Close navigation"
              onClick={closeMobileNavigation}
            >
              <X aria-hidden="true" size={22} />
            </button>
            {renderSidebar(mobileNavigationId)}
          </div>
        </div>
      ) : null}

      <section className="cs-app-shell__workspace" {...inertBackgroundProps}>
        <header className="cs-app-shell__topbar">
          <button
            ref={menuButtonRef}
            type="button"
            className="cs-app-shell__menu-button cs-focusable"
            aria-label="Open navigation"
            aria-controls={mobileDrawerId}
            aria-expanded={mobileOpen}
            onClick={openMobileNavigation}
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
