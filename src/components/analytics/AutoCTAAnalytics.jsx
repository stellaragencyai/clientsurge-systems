import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

const CTA_KEYWORDS = /(book|demo|contact|audit|pricing|call|learn|explore|start|route|review|message|send|chat|industry|plan|quote)/i;
const IGNORE_LABELS = /^(close|open navigation menu|close navigation menu|theme|back|next)$/i;

function normalizeLabel(text = "") {
  return text.replace(/\s+/g, " ").trim().slice(0, 120);
}

export default function AutoCTAAnalytics() {
  const location = useLocation();

  useEffect(() => {
    let lastSignature = "";
    let lastTimestamp = 0;

    const handleClick = (event) => {
      const target = event.target instanceof Element ? event.target.closest("a, button, [role='button']") : null;
      if (!target) return;
      if (target.closest("[data-no-cta-track='true']")) return;

      const label = normalizeLabel(
        target.getAttribute("data-cta-label") ||
          target.getAttribute("aria-label") ||
          target.textContent ||
          ""
      );

      if (!label || IGNORE_LABELS.test(label) || !CTA_KEYWORDS.test(label)) {
        return;
      }

      const destination =
        target instanceof HTMLAnchorElement
          ? target.getAttribute("href") || location.pathname
          : target.getAttribute("data-cta-destination") || location.pathname;

      const signature = `${location.pathname}|${label}|${destination}`;
      const now = Date.now();
      if (signature === lastSignature && now - lastTimestamp < 1000) {
        return;
      }

      lastSignature = signature;
      lastTimestamp = now;

      trackEvent("cta_click_auto", {
        cta_label: label,
        cta_location: location.pathname,
        destination,
      });
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [location.pathname]);

  return null;
}
