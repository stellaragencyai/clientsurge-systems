import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { GA4_EVENTS, trackGa4PageView } from "@/lib/ga4";

const CTA_KEYWORDS = /(book|demo|contact|audit|pricing|call|learn|explore|start|route|review|message|send|chat|industry|plan|quote|checkout|buy)/i;
const IGNORE_LABELS = /^(close|open navigation menu|close navigation menu|theme|back|next)$/i;

function normalizeLabel(text = "") {
  return text.replace(/\s+/g, " ").trim().slice(0, 120);
}

export default function AutoCTAAnalytics() {
  const location = useLocation();
  const lastSignatureRef = useRef("");
  const lastTimestampRef = useRef(0);

  useEffect(() => {
    trackGa4PageView({
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      title: document.title,
      location: window.location.href,
    });

    if (location.pathname.toLowerCase() === "/pricing") {
      trackEvent(GA4_EVENTS.PRICING_VIEW, {
        page_path: `${location.pathname}${location.search}`,
      });
    }
  }, [location.hash, location.pathname, location.search]);

  useEffect(() => {
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
      if (signature === lastSignatureRef.current && now - lastTimestampRef.current < 1000) {
        return;
      }

      lastSignatureRef.current = signature;
      lastTimestampRef.current = now;

      trackEvent(GA4_EVENTS.CTA_CLICK, {
        cta_label: label,
        cta_location: location.pathname,
        destination,
        tracking_method: "automatic",
      });
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [location.pathname]);

  return null;
}
