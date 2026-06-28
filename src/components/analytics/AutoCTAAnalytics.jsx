import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getPageKey, trackConversionProof, trackEvent } from "@/lib/analytics";

const CTA_KEYWORDS = /(book|demo|contact|audit|pricing|price|checkout|buy|purchase|call|learn|explore|start|signup|sign up|route|review|message|send|chat|industry|plan|quote|package|automations)/i;
const IGNORE_LABELS = /^(close|open navigation menu|close navigation menu|theme|back|next)$/i;

function normalizeLabel(text = "") {
  return text.replace(/\s+/g, " ").trim().slice(0, 120);
}

function inferCtaEventType(label = "", destination = "", pathname = "") {
  const combined = `${label} ${destination} ${pathname}`.toLowerCase();
  if (combined.includes("pricing") || combined.includes("price") || destination === "/pricing") return "cta_click";
  if (combined.includes("checkout") || combined.includes("buy") || combined.includes("purchase") || combined.includes("product-signup") || combined.includes("signup")) return "checkout_click";
  return "cta_click";
}

export default function AutoCTAAnalytics() {
  const location = useLocation();

  useEffect(() => {
    const pageKey = getPageKey(location.pathname);
    if (!pageKey) return;

    trackEvent("page_view", {
      page_path: location.pathname,
      page_key: pageKey,
    });
    trackConversionProof("page_view", {
      pathname: location.pathname,
      event_label: `${pageKey}_page_view`,
      dedupe_window_ms: 60_000,
    });

    if (pageKey === "pricing") {
      trackEvent("pricing_view", {
        page_path: location.pathname,
        page_key: pageKey,
      });
      trackConversionProof("pricing_view", {
        pathname: location.pathname,
        event_label: "pricing_page_view",
        dedupe_window_ms: 60_000,
      });
    }
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
      if (signature === lastSignature && now - lastTimestamp < 1000) {
        return;
      }

      lastSignature = signature;
      lastTimestamp = now;

      const eventType = inferCtaEventType(label, destination, location.pathname);
      trackEvent(eventType, {
        cta_label: label,
        cta_location: location.pathname,
        destination,
      });
      trackConversionProof(eventType, {
        pathname: location.pathname,
        event_label: label,
        metadata: { destination },
      });
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [location.pathname]);

  useEffect(() => {
    const handleSubmit = (event) => {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (!form) return;
      const formLabel = form.getAttribute("data-form-label") || form.id || form.name || "public_form";
      trackEvent("form_submit", {
        form_id: form.id || form.name || undefined,
        page_path: location.pathname,
      });
      trackConversionProof("form_submit", {
        pathname: location.pathname,
        event_label: formLabel,
      });
    };

    document.addEventListener("submit", handleSubmit, true);
    return () => document.removeEventListener("submit", handleSubmit, true);
  }, [location.pathname]);

  return null;
}
