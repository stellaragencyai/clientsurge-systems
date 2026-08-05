/**
 * Honeypot + Rate Limiting field for lead capture forms.
 * Fixes FLAW #35: No rate-limiting or bot protection on lead capture forms.
 *
 * Usage:
 *   <HoneypotField form={form} setForm={setForm} />
 *   // In submit handler:
 *   if (form.website_url) return; // bot caught
 *   if (checkRateLimit("lead_capture")) { return "Too many submissions" }
 */

import { createElement, useEffect, useState } from "react";

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_SUBMITS = 3; // 3 submissions per minute per IP

/**
 * Check if the current IP/session has exceeded the rate limit for a given action.
 * Uses sessionStorage to track submissions within the time window.
 * @param {string} actionKey - e.g. "lead_capture", "demo_booking"
 * @returns {{ allowed: boolean, retryAfterMs: number }}
 */
export function checkRateLimit(actionKey) {
  if (typeof window === "undefined") return { allowed: true, retryAfterMs: 0 };

  const storageKey = `cs_ratelimit_${actionKey}`;
  const now = Date.now();

  try {
    const raw = window.sessionStorage.getItem(storageKey);
    const timestamps = raw ? JSON.parse(raw) : [];
    const recent = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

    if (recent.length >= RATE_LIMIT_MAX_SUBMITS) {
      const oldestInWindow = Math.min(...recent);
      const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - oldestInWindow);
      return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 0) };
    }

    recent.push(now);
    window.sessionStorage.setItem(storageKey, JSON.stringify(recent));
    return { allowed: true, retryAfterMs: 0 };
  } catch {
    return { allowed: true, retryAfterMs: 0 };
  }
}

/**
 * Format retry-after milliseconds into a human-readable message.
 * @param {number} ms
 * @returns {string}
 */
export function formatRetryAfter(ms) {
  if (ms < 1000) return "Please wait a moment";
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `Please wait ${seconds}s before trying again`;
  const minutes = Math.ceil(seconds / 60);
  return `Please wait ${minutes}m before trying again`;
}

/**
 * React hook to track honeypot + rate limit state.
 * @param {string} actionKey
 * @returns {{ honeypotValue: string, setHoneypotValue: function, checkSubmission: function }}
 */
export function useFormProtection(actionKey = "lead_capture") {
  const [honeypotValue, setHoneypotValue] = useState("");
  const [rateLimited, setRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  useEffect(() => {
    if (rateLimited && retryAfter > 0) {
      const timer = setTimeout(() => {
        setRateLimited(false);
        setRetryAfter(0);
      }, retryAfter);
      return () => clearTimeout(timer);
    }
  }, [rateLimited, retryAfter]);

  const checkSubmission = () => {
    // Honeypot check — if filled, it's a bot
    if (honeypotValue) {
      return { allowed: false, reason: "bot_detected", silent: true };
    }

    // Rate limit check
    const { allowed, retryAfterMs } = checkRateLimit(actionKey);
    if (!allowed) {
      setRateLimited(true);
      setRetryAfter(retryAfterMs);
      return { allowed: false, reason: "rate_limited", message: formatRetryAfter(retryAfterMs) };
    }

    return { allowed: true };
  };

  return {
    honeypotValue,
    setHoneypotValue,
    rateLimited,
    retryAfter,
    retryMessage: rateLimited ? formatRetryAfter(retryAfter) : "",
    checkSubmission,
  };
}

/**
 * Honeypot field component — hidden from real users, visible to bots.
 * Render inside any form to catch automated submissions.
 */
export function HoneypotField({ value, onChange, fieldName = "website_url" }) {
  return createElement("input", {
    type: "text",
    name: fieldName,
    value: value || "",
    onChange: (event) => onChange?.(event.target.value),
    tabIndex: -1,
    autoComplete: "off",
    className: "hidden",
    "aria-hidden": "true",
    style: { display: "none", position: "absolute", left: "-9999px" },
  });
}
