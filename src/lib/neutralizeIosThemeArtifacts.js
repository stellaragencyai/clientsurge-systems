const IOS_APP_CLASSES = [
  "ios-app-layout",
  "ios-shell-layout",
  "app-store-layout",
  "base44-ios-layout",
  "clientsurge-ios-layout",
  "ios-dark",
  "app-store-dark",
  "base44-dark",
  "theme-dark",
];

const IOS_APP_ATTRIBUTES = [
  "data-ios-app-layout",
  "data-app-store-layout",
  "data-force-dark",
  "data-app-store-dark",
  "data-client-surge-dark",
  "data-client-surge-dark-disabled",
];

function cleanRoot(root) {
  if (!root) return;
  IOS_APP_CLASSES.forEach((className) => root.classList?.remove(className));
  IOS_APP_ATTRIBUTES.forEach((attribute) => root.removeAttribute?.(attribute));

  if (root.getAttribute?.("data-theme") === "dark") root.setAttribute("data-theme", "light");
  if (root.getAttribute?.("data-color-scheme") === "dark") root.setAttribute("data-color-scheme", "light");

  if (root.style) {
    root.style.colorScheme = "light";
    root.style.removeProperty("background");
    root.style.removeProperty("background-color");
  }
}

export function neutralizeIosThemeArtifacts() {
  if (typeof document === "undefined") return;
  cleanRoot(document.documentElement);
  cleanRoot(document.body);
}

export function installIosThemeArtifactGuard() {
  if (typeof document === "undefined") return;
  neutralizeIosThemeArtifacts();

  if (typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver(() => neutralizeIosThemeArtifacts());
    const options = {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme", "data-color-scheme", ...IOS_APP_ATTRIBUTES],
    };
    observer.observe(document.documentElement, options);
    if (document.body) observer.observe(document.body, options);
  }

  window.addEventListener("pageshow", neutralizeIosThemeArtifacts, { passive: true });
}
