import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Info, X } from "lucide-react";
import { CSButton } from "./CSProductPrimitives";

const cx = (...values) => values.filter(Boolean).join(" ");

function useEscape(handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") handler(event);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled, handler]);
}

function useBodyScrollLock(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [enabled]);
}

function useFocusReturn(open) {
  const previousFocus = useRef(null);
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement;
      return;
    }

    if (previousFocus.current instanceof HTMLElement) {
      previousFocus.current.focus();
      previousFocus.current = null;
    }
  }, [open]);
}

function CSOverlay({ open, onClose, labelledBy, describedBy, children, className, panelClassName, role = "dialog" }) {
  const panelRef = useRef(null);
  useBodyScrollLock(open);
  useFocusReturn(open);
  useEscape(() => onClose?.(), open);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      const firstFocusable = panelRef.current?.querySelector(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      (firstFocusable || panelRef.current)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className={cx("cs-overlay", className)} onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose?.();
    }}>
      <div
        ref={panelRef}
        className={cx("cs-overlay__panel", panelClassName)}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const focusable = Array.from(panelRef.current?.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ) || []);
          if (!focusable.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function CSModal({ open, onClose, title, description, children, footer, size = "md", closeLabel = "Close dialog" }) {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = description ? `${baseId}-description` : undefined;
  return (
    <CSOverlay open={open} onClose={onClose} labelledBy={titleId} describedBy={descriptionId} panelClassName={`cs-modal cs-modal--${size}`}>
      <header className="cs-dialog__header">
        <div>
          <h2 id={titleId}>{title}</h2>
          {description ? <p id={descriptionId}>{description}</p> : null}
        </div>
        <button type="button" className="cs-icon-button" onClick={onClose} aria-label={closeLabel}><X aria-hidden="true" /></button>
      </header>
      <div className="cs-dialog__body">{children}</div>
      {footer ? <footer className="cs-dialog__footer">{footer}</footer> : null}
    </CSOverlay>
  );
}

export function CSDrawer({ open, onClose, title, description, children, footer, side = "right", width = "md" }) {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = description ? `${baseId}-description` : undefined;
  return (
    <CSOverlay open={open} onClose={onClose} labelledBy={titleId} describedBy={descriptionId} className={`cs-overlay--drawer cs-overlay--drawer-${side}`} panelClassName={`cs-drawer cs-drawer--${width}`}>
      <header className="cs-dialog__header">
        <div><h2 id={titleId}>{title}</h2>{description ? <p id={descriptionId}>{description}</p> : null}</div>
        <button type="button" className="cs-icon-button" onClick={onClose} aria-label="Close drawer"><X aria-hidden="true" /></button>
      </header>
      <div className="cs-dialog__body cs-drawer__body">{children}</div>
      {footer ? <footer className="cs-dialog__footer">{footer}</footer> : null}
    </CSOverlay>
  );
}

export function CSConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", tone = "danger", loading = false }) {
  return (
    <CSModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={<><CSButton variant="secondary" onClick={onClose}>{cancelLabel}</CSButton><CSButton variant={tone === "danger" ? "danger" : "primary"} loading={loading} onClick={onConfirm}>{confirmLabel}</CSButton></>}
    />
  );
}

export function CSTabs({ tabs, value, onChange, ariaLabel = "Sections", className }) {
  const selectedIndex = Math.max(0, tabs.findIndex((tab) => tab.id === value));
  return (
    <div className={cx("cs-tabs", className)}>
      <div className="cs-tabs__list" role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`cs-tab-${tab.id}`}
            aria-selected={tab.id === value}
            aria-controls={`cs-panel-${tab.id}`}
            tabIndex={tab.id === value ? 0 : -1}
            className="cs-tabs__tab"
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              let nextIndex = index;
              if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
              if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
              if (event.key === "Home") nextIndex = 0;
              if (event.key === "End") nextIndex = tabs.length - 1;
              onChange(tabs[nextIndex].id);
              event.currentTarget.parentElement?.children[nextIndex]?.focus();
            }}
          >
            {tab.icon ? <span aria-hidden="true">{tab.icon}</span> : null}
            {tab.label}
            {tab.count !== undefined ? <span className="cs-tabs__count">{tab.count}</span> : null}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => tab.id === value ? (
        <div key={tab.id} id={`cs-panel-${tab.id}`} role="tabpanel" aria-labelledby={`cs-tab-${tab.id}`} tabIndex={0} className="cs-tabs__panel">
          {tab.content}
        </div>
      ) : null)}
    </div>
  );
}

export function CSDropdown({ label, items, align = "left", disabled = false, className }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const pendingMenuFocus = useRef(null);
  const menuId = useId();
  const focusMenuItem = useCallback((direction = "first") => {
    const menuItems = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]:not(:disabled)') || []);
    if (!menuItems.length) return;

    if (direction === "last") {
      menuItems[menuItems.length - 1].focus();
      return;
    }

    menuItems[0].focus();
  }, []);
  const closeMenu = useCallback((restoreFocus = false) => {
    setOpen(false);
    pendingMenuFocus.current = null;
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);
  useEscape(() => closeMenu(true), open);
  useEffect(() => {
    if (!open || !pendingMenuFocus.current) return undefined;
    const direction = pendingMenuFocus.current;
    const frame = window.requestAnimationFrame(() => {
      focusMenuItem(direction);
      pendingMenuFocus.current = null;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusMenuItem, open]);
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) closeMenu(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [closeMenu, open]);
  return (
    <div className={cx("cs-dropdown", className)} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="cs-dropdown__trigger"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          pendingMenuFocus.current = event.key === "ArrowUp" ? "last" : "first";
          setOpen(true);
        }}
      >
        {label}<ChevronDown aria-hidden="true" />
      </button>
      {open ? <div
        id={menuId}
        ref={menuRef}
        className={cx("cs-dropdown__menu", `cs-dropdown__menu--${align}`)}
        role="menu"
        onKeyDown={(event) => {
          const menuItems = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]:not(:disabled)') || []);
          if (!menuItems.length) return;

          const currentIndex = Math.max(0, menuItems.indexOf(document.activeElement));
          let nextIndex = currentIndex;
          if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % menuItems.length;
          else if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + menuItems.length) % menuItems.length;
          else if (event.key === "Home") nextIndex = 0;
          else if (event.key === "End") nextIndex = menuItems.length - 1;
          else if (event.key === "Escape") {
            event.preventDefault();
            closeMenu(true);
            return;
          } else {
            return;
          }

          event.preventDefault();
          menuItems[nextIndex].focus();
        }}
      >
        {items.map((item) => item.separator ? <div key={item.id} className="cs-dropdown__separator" role="separator" /> : (
          <button key={item.id} type="button" role="menuitem" className={cx("cs-dropdown__item", item.tone === "danger" && "cs-dropdown__item--danger")} disabled={item.disabled} onClick={() => { item.onSelect?.(); closeMenu(false); }}>
            {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}<span>{item.label}</span>{item.selected ? <Check aria-hidden="true" /> : null}
          </button>
        ))}
      </div> : null}
    </div>
  );
}

const ToastContext = createContext(null);

export function CSToastProvider({ children, duration = 5000 }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((items) => items.filter((item) => item.id !== id)), []);
  const notify = useCallback((toast) => {
    const id = toast.id || `${Date.now()}-${Math.random()}`;
    setToasts((items) => [...items, { tone: "info", ...toast, id }]);
    if (toast.persistent !== true) window.setTimeout(() => dismiss(id), toast.duration || duration);
    return id;
  }, [dismiss, duration]);
  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);
  return <ToastContext.Provider value={value}>{children}<div className="cs-toast-region" aria-live="polite" aria-label="Notifications">{toasts.map((toast) => <div key={toast.id} className={cx("cs-toast", `cs-toast--${toast.tone}`)} role={toast.tone === "danger" ? "alert" : "status"}><Info aria-hidden="true" /><div><strong>{toast.title}</strong>{toast.message ? <p>{toast.message}</p> : null}{toast.action ? <button type="button" onClick={toast.action.onClick}>{toast.action.label}</button> : null}</div><button type="button" className="cs-icon-button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification"><X aria-hidden="true" /></button></div>)}</div></ToastContext.Provider>;
}

export function useCSToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useCSToast must be used inside CSToastProvider");
  return context;
}

export function CSTooltip({ content, children, side = "top" }) {
  const tooltipId = useId();
  return <span className={cx("cs-tooltip", `cs-tooltip--${side}`)}>{React.cloneElement(children, { "aria-describedby": tooltipId })}<span id={tooltipId} role="tooltip" className="cs-tooltip__content">{content}</span></span>;
}
