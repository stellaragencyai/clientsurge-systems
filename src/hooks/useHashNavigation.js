/**
 * Hash Navigation & Scroll Restoration Hook
 * Fixes FLAW #97: Safari scrollRestoration conflicts.
 * Fixes FLAW #98: Broken back-button experience with hash navigation.
 *
 * Ensures hash anchors (#pricing, #faq) are treated as real history entries,
 * so the browser Back button navigates within the page rather than leaving.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useHashNavigation() {
  const location = useLocation();

  useEffect(() => {
    // Force scrollRestoration to manual so our JS controls it
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    // When navigating to a hash, push a real history entry
    // so Back button works within the page
    if (location.hash) {
      const targetId = location.hash.replace("#", "");
      const element = document.getElementById(targetId);
      if (element) {
        // Use replaceState to create a proper history entry
        // that the Back button can navigate to
        const currentState = { ...window.history.state, hash: location.hash };
        window.history.replaceState(currentState, "");
      }
    }
  }, [location.hash, location.pathname]);

  // Listen for popstate to handle Back button with hash navigation
  useEffect(() => {
    const handlePopState = (event) => {
      if (location.hash) {
        const targetId = location.hash.replace("#", "");
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else {
        // No hash — scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [location.hash]);
}