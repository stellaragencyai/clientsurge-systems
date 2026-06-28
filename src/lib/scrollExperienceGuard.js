import { releaseAllBodyScrollLocks } from "./bodyScrollLock";

const LAYOUT_CLASSES = [
  "ios-app-layout",
  "ios-shell-layout",
  "app-store-layout",
  "base44-ios-layout",
  "clientsurge-ios-layout",
];

const LAYOUT_ATTRIBUTES = [
  "data-ios-app-layout",
  "data-app-store-layout",
  "data-force-reduced-motion",
  "data-disable-animations",
  "data-clientsurge-motion-disabled",
];

function overlayIsOpen() {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.querySelector(".mobile-nav-drawer") ||
    document.querySelector('[role="dialog"][aria-modal="true"]') ||
    document.querySelector("[data-radix-dialog-content]")
  );
}

function cleanRoot(root) {
  if (!root) return;
  LAYOUT_CLASSES.forEach((className) => root.classList?.remove(className));
  LAYOUT_ATTRIBUTES.forEach((attribute) => root.removeAttribute?.(attribute));
}

function clearBodyScrollClamp() {
  if (typeof document === "undefined") return;
  const body = document.body;
  const html = document.documentElement;

  if (html?.style) {
    html.style.scrollBehavior = "auto";
    html.style.removeProperty("overflow-y");
    html.style.removeProperty("position");
  }

  if (body?.style) {
    body.style.removeProperty("overflow");
    body.style.removeProperty("overflow-y");
    body.style.removeProperty("position");
    body.style.removeProperty("top");
    body.style.removeProperty("left");
    body.style.removeProperty("right");
    body.style.removeProperty("width");
    body.style.removeProperty("height");
  }
}

export function repairScrollExperience({ unlock = false } = {}) {
  if (typeof document === "undefined") return;

  const overlayOpen = overlayIsOpen();
  cleanRoot(document.documentElement);
  cleanRoot(document.body);

  if ((unlock || document.body?.classList.contains("nav-open")) && !overlayOpen) {
    releaseAllBodyScrollLocks({ restoreScroll: !unlock });
  }

  if (!overlayOpen) {
    clearBodyScrollClamp();
  }
}

export function installScrollExperienceGuard() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  repairScrollExperience();

  const unlockIfDesktop = () => {
    if (window.matchMedia("(min-width: 1280px)").matches) {
      repairScrollExperience({ unlock: true });
    }
  };

  const repairAfterNavigation = () => window.setTimeout(() => repairScrollExperience({ unlock: true }), 80);

  window.addEventListener("wheel", () => repairScrollExperience(), { passive: true });
  window.addEventListener("touchmove", () => repairScrollExperience(), { passive: true });
  window.addEventListener("pageshow", () => repairScrollExperience({ unlock: true }), { passive: true });
  window.addEventListener("resize", unlockIfDesktop, { passive: true });
  window.addEventListener("orientationchange", () => repairScrollExperience({ unlock: true }), { passive: true });
  window.addEventListener("popstate", repairAfterNavigation, { passive: true });
  window.addEventListener("hashchange", repairAfterNavigation, { passive: true });

  if (typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver(() => repairScrollExperience());
    const options = { attributes: true, attributeFilter: ["class", "style", ...LAYOUT_ATTRIBUTES] };
    observer.observe(document.documentElement, options);
    if (document.body) observer.observe(document.body, options);
  }
}
