import { useEffect, useRef, useState } from "react";

export default function AnimatedSectionRule() {
  const lineRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isVisible) {
        setIsVisible(true);
      }
    }, { threshold: 0.3 });

    if (lineRef.current) {
      observer.observe(lineRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <svg
      ref={lineRef}
      width="40"
      height="2"
      viewBox="0 0 40 2"
      style={{
        display: "block",
        margin: "12px auto",
      }}
    >
      <line
        x1="0"
        y1="1"
        x2="40"
        y2="1"
        stroke="url(#gradient)"
        strokeWidth="2"
        strokeLinecap="round"
        style={{
          strokeDasharray: "40",
          strokeDashoffset: isVisible ? "0" : "40",
          transition: "stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c8965c" />
          <stop offset="50%" stopColor="#f5d9a8" />
          <stop offset="100%" stopColor="#c8965c" />
        </linearGradient>
      </defs>
    </svg>
  );
}