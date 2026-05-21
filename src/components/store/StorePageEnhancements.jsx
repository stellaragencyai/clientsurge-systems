/**
 * StorePageEnhancements.jsx — #10 #41 #54
 * #10: intersection-observer lazy rendering for 8+ products
 * #41: 6 skeleton cards for 300ms then reveal
 * #54: DemoBookingModal date/time inputs min-height:48px
 */
import { useState, useEffect, useRef } from "react";

// #10 #41: LazyProductGrid
export function LazyProductGrid({ products = [], renderCard, className = "" }) {
  const [visible, setVisible] = useState(false);
  const [skeletonDone, setSkeletonDone] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // #41: show skeleton for 300ms then reveal
    const skeletonTimer = setTimeout(() => setSkeletonDone(true), 300);

    // #10: intersection observer for lazy rendering
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: "200px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { clearTimeout(skeletonTimer); observer.disconnect(); };
  }, []);

  const pulse = {
    background: "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)",
    backgroundSize: "200% 100%",
    animation: "skeleton-pulse 1.4s ease-in-out infinite",
    borderRadius: 12,
  };

  if (!skeletonDone) {
    return (
      <>
        <style>{`@keyframes skeleton-pulse{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div ref={ref} className={className}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ ...pulse, height: 220 }} />
          ))}
        </div>
      </>
    );
  }

  if (!visible) {
    return <div ref={ref} style={{ minHeight: 200 }} />;
  }

  return (
    <div ref={ref} className={className}>
      {products.map((p, i) => renderCard(p, i))}
    </div>
  );
}

// #54: accessible date/time inputs
export const inputStyle = {
  minHeight: 48,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#fff",
  borderRadius: 10,
  padding: "0 14px",
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
};
