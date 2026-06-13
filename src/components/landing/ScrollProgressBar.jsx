/**
 * Thin scroll progress indicator at the top of the page (#24).
 * Uses a passive scroll listener + CSS transform for 60fps performance.
 */
import { useEffect, useRef } from "react";

export default function ScrollProgressBar() {
  const barRef = useRef(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const onScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
      bar.style.transform = `scaleX(${progress})`;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: "linear-gradient(90deg, #00AEEF, #009DFF, #003B8F)",
        transformOrigin: "left",
        transform: "scaleX(0)",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  );
}