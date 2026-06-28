import { useRef, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

/**
 * PullToRefresh — iOS-style pull-to-refresh wrapper.
 * Wraps a scrollable container and triggers onRefresh when the user
 * pulls down past the threshold at the top of the scroll.
 *
 * Props:
 *   onRefresh: async () => void  (called when pull threshold is exceeded)
 *   children: ReactNode
 *   threshold?: number (px to pull before triggering, default 70)
 *   className?: string
 */
export default function PullToRefresh({
  onRefresh,
  children,
  threshold = 70,
  className = "",
}) {
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const pullingRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleTouchStart = useCallback(
    (e) => {
      if (refreshing) return;
      const el = containerRef.current;
      if (!el || el.scrollTop > 0) return;
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    },
    [refreshing]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!pullingRef.current || refreshing) return;
      currentYRef.current = e.touches[0].clientY;
      const delta = currentYRef.current - startYRef.current;
      if (delta > 0) {
        // Dampen the pull — resistance increases as you pull further
        const dampened = Math.min(delta * 0.4, threshold * 1.5);
        setPullDistance(dampened);
      }
    },
    [refreshing, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current || refreshing) return;
    pullingRef.current = false;

    if (pullDistance >= threshold) {
      setRefreshing(true);
      setPullDistance(threshold * 0.6);
      try {
        await onRefresh();
      } catch (err) {
        console.warn("Pull-to-refresh failed:", err?.message);
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, refreshing, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);
  const showSpinner = refreshing || pullDistance > 0;

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ WebkitOverflowScrolling: "touch" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-none"
        style={{
          height: `${pullDistance}px`,
          opacity: showSpinner ? 1 : 0,
        }}
      >
        <RefreshCw
          className={`w-5 h-5 text-primary ${refreshing ? "animate-spin" : ""}`}
          style={{
            transform: `rotate(${progress * 360}deg)`,
            transition: refreshing ? "none" : "transform 0.1s ease-out",
          }}
        />
      </div>
      {children}
    </div>
  );
}