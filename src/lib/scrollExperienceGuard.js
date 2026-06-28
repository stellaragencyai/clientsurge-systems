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

export function repairScrollExperience({ unlock = false } = {}) {
  if (typeof document === "undefined") return;

  cleanRoot(document.documentElement);
  cleanRoot(document.body);

  if ((unlock || document.body?.classList.contains("nav-open")) && !overlayIsOpen()) {
    releaseAllBodyScrollLocks({ restoreScroll: !unlock });
  }

  if (document.documentElement?.style) {
    document.documentElement.style.scrollBehavior = "auto";
  }

  if (document.body?.style) {
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("position");
    document.body.style.removeProperty("top");
    document.body.style.removeProperty("left");
    document.body.style.removeProperty("right");
    document.body.style.removeProperty("width");
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

  window.addEventListener("wheel", () => repairScrollExperience(), { passive: true });
  window.addEventListener("pageshow", () => repairScrollExperience({ unlock: true }), { passive: true });
  window.addEventListener("resize", unlockIfDesktop, { passive: true });
  window.addEventListener("orientationchange", () => repairScrollExperience({ unlock: true }), { passive: true });

  if (typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver(() => repairScrollExperience());
    const options = { attributes: true, attributeFilter: ["class", ...LAYOUT_ATTRIBUTES] };
    observer.observe(document.documentElement, options);
    if (document.body) observer.observe(document.body, options);
  }
}
