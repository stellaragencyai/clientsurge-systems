const BLOCKING_SELECTOR_PARTS = [
  "body",
  "span",
  "div",
  "h1",
  "button",
  "a",
];

function selectorLooksLikeGlobalOpacityClamp(selectorText = "") {
  const selector = String(selectorText);
  return BLOCKING_SELECTOR_PARTS.every((part) => selector.includes(part));
}

function removeBlockingOpacityImportantRules() {
  if (typeof document === "undefined") return;

  for (const sheet of Array.from(document.styleSheets || [])) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    if (!rules) continue;

    for (const rule of Array.from(rules)) {
      const style = rule?.style;
      const selectorText = rule?.selectorText;
      if (!style || !selectorText) continue;

      const opacity = style.getPropertyValue("opacity");
      const priority = style.getPropertyPriority("opacity");
      if (opacity === "1" && priority === "important" && selectorLooksLikeGlobalOpacityClamp(selectorText)) {
        style.removeProperty("opacity");
      }
    }
  }
}

export function installAnimationRestoreGuard() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const run = () => removeBlockingOpacityImportantRules();
  run();
  window.addEventListener("load", run, { once: true, passive: true });
  window.requestAnimationFrame(run);
  window.setTimeout(run, 250);
  window.setTimeout(run, 1000);
}
