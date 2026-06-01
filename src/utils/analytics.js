/**
 * utils/analytics.js — #77 dedup
 * Canonical analytics utilities live in lib/analytics.js.
 * This file re-exports from there to avoid breaking any existing imports.
 */
export { trackEvent, trackCTA } from "@/lib/analytics";