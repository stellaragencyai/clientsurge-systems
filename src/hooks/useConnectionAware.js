/**
 * Connection-Aware Media Loader Hook
 * Fixes FLAW #100: Missing "Low Data Mode" optimization.
 * Fixes FLAW #62: Glow effects consuming CPU/GPU on older devices.
 *
 * Detects network conditions and device capabilities, returns whether
 * heavy media (videos, animations, glow effects) should be loaded.
 */
import { useEffect, useState } from "react";

export function useConnectionAware() {
  const [shouldLoadHeavyMedia, setShouldLoadHeavyMedia] = useState(true);
  const [shouldRenderAnimations, setShouldRenderAnimations] = useState(true);
  const [effectiveType, setEffectiveType] = useState("4g");

  useEffect(() => {
    if (typeof navigator === "undefined") return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setShouldRenderAnimations(false);
      setShouldLoadHeavyMedia(false);
      return;
    }

    // Check for reduced data preference
    const prefersReducedData = window.matchMedia?.("(prefers-reduced-data: reduce)").matches;
    if (prefersReducedData) {
      setShouldLoadHeavyMedia(false);
    }

    // Check network connection
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      const type = connection.effectiveType || "4g";
      setEffectiveType(type);
      if (type === "slow-2g" || type === "2g" || type === "3g") {
        setShouldLoadHeavyMedia(false);
      }
      if (connection.saveData) {
        setShouldLoadHeavyMedia(false);
      }
    }

    // Check device memory (if available)
    if (navigator.deviceMemory && navigator.deviceMemory < 4) {
      setShouldRenderAnimations(false);
    }

    // Check hardware concurrency (CPU cores)
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      setShouldRenderAnimations(false);
    }
  }, []);

  return {
    shouldLoadHeavyMedia,
    shouldRenderAnimations,
    effectiveType,
    isSlowConnection: effectiveType === "slow-2g" || effectiveType === "2g" || effectiveType === "3g",
  };
}