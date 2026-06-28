import { useEffect, useRef } from "react";

export default function ScrollProgressBar() {
  const barRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const updateBar = () => {
      frameRef.current = null;
      const scrollTop = window.scrollY || window.pageYOffset || 0;
      const availableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scale = availableHeight > 0 ? Math.min(Math.max(scrollTop / availableHeight, 0), 1) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${scale})`;
    };

    const requestUpdate = () => {
      if (frameRef.current) return;
      frameRef.current = window.requestAnimationFrame(updateBar);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div
      ref={barRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "4px",
        background: "linear-gradient(90deg, #00AEEF 0%, #006BB0 50%, #003B8F 100%)",
        transform: "scaleX(0)",
        transformOrigin: "left center",
        transition: "transform 80ms linear",
        zIndex: 100,
        boxShadow: "0 0 20px rgba(0, 174, 239, 0.6), 0 0 40px rgba(0, 107, 176, 0.3)",
        willChange: "transform",
      }}
      aria-hidden="true"
    />
  );
}
