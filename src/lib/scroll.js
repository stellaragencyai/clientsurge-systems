/**
 * Centralized scroll utility — single source of truth for all scroll behavior.
 * Prevents race conditions between CSS smooth-scroll and JS scroll calls.
 */

let _rafId = null;

/**
 * Scroll to a section by ID or hash string (e.g. "#pricing" or "pricing").
 * Uses requestAnimationFrame to debounce and avoid race conditions.
 * @param {string} hash - The section id with or without leading "#"
 * @param {number} delay - Optional delay in ms before scrolling (default 0)
 */
export function scrollToSection(hash, delay = 0) {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!id) return;

  const execute = () => {
    if (_rafId) cancelAnimationFrame(_rafId);
    _rafId = requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        // Update URL without triggering another navigation
        window.history.replaceState({}, "", `#${id}`);
      }
      _rafId = null;
    });
  };

  if (delay > 0) {
    setTimeout(execute, delay);
  } else {
    execute();
  }
}

/**
 * Scroll to the top of the page instantly (for route changes).
 */
export function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/**
 * FIX #16: Re-assert the top position across the browser's route/layout settling window.
 * Clears hash first to prevent browser auto-restoring scroll to anchors.
 * Returns a cleanup function for React effects.
 */
export function forceScrollToTop({ delays = [0, 50, 150, 350, 700] } = {}) {
  // Clear hash without triggering a navigation so browser won't re-scroll to anchor
  if (typeof window !== "undefined" && window.location.hash) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  const run = () => scrollToTop();
  run();

  const frameId = window.requestAnimationFrame(run);
  const timers = delays.map((delay) => window.setTimeout(run, delay));

  return () => {
    window.cancelAnimationFrame(frameId);
    timers.forEach((timerId) => window.clearTimeout(timerId));
  };
}