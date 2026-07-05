import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

const CTA_KEYWORDS = /(book|demo|contact|audit|pricing|call|learn|explore|start|route|review|message|send|chat|industry|plan|quote)/i;
const IGNORE_LABELS = /^(close|open navigation menu|close navigation menu|theme|back|next)$/i;

function normalizeLabel(text = "") {
  return text.replace(/\s+/g, " ").trim().slice(0, 120);
}

export default function AutoCTAAnalytics() {
  const location = useLocation();

  // Fix #26: Use refs to persist dedup state across effect re-runs (React StrictMode double-fire)
  const lastSignatureRef = useRef("");
  const lastTimestampRef = useRef(0);
  const firedForPathRef = useRef(false);

  useEffect(() => {
    // Reset per-path dedup so CTA impressions fire once per page view
    firedForPathRef.current = false;
  }, [location.pathname]);

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

      // Fix #26: Use refs to prevent double-fire across effect re-runs
      if (signature === lastSignatureRef.current && now - lastTimestampRef.current < 1000) {
        return;
      }

      lastSignatureRef.current = signature;
      lastTimestampRef.current = now;

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