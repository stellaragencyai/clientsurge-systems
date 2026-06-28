const FORCED_DARK_CLASSES = [
  "dark",
  "theme-dark",
  "base44-dark",
  "ios-dark",
  "app-store-dark",
];

const FORCED_DARK_ATTRIBUTES = [
  "data-client-surge-dark-disabled",
  "data-client-surge-dark",
  "data-force-dark",
  "data-app-store-dark",
];

function normalizeRootTheme(root) {
  if (!root) return;

  FORCED_DARK_CLASSES.forEach((className) => root.classList?.remove(className));
  FORCED_DARK_ATTRIBUTES.forEach((attribute) => root.removeAttribute?.(attribute));

  if (root.getAttribute?.("data-theme") === "dark") {
    root.setAttribute("data-theme", "light");
  }
  if (root.getAttribute?.("data-color-scheme") === "dark") {
    root.setAttribute("data-color-scheme", "light");
  }

  if (root.style) {
    root.style.colorScheme = "light";
  }
}

function normalizeThemeColorMeta() {
  const head = document.head;
  if (!head) return;

  let meta = head.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    head.appendChild(meta);
  }
  meta.setAttribute("content", "#ffffff");
}

export function restoreLightTheme() {
  if (typeof document === "undefined") return;

  normalizeRootTheme(document.documentElement);
  normalizeRootTheme(document.body);
  normalizeThemeColorMeta();
}

export function installLightThemeGuard() {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;

  restoreLightTheme();

  const observer = new MutationObserver(() => restoreLightTheme());
  const options = {
    attributes: true,
    attributeFilter: [
      "class",
      "data-theme",
      "data-color-scheme",
      ...FORCED_DARK_ATTRIBUTES,
    ],
  };

  observer.observe(document.documentElement, options);
  if (document.body) observer.observe(document.body, options);

  window.addEventListener("pageshow", restoreLightTheme);
}
