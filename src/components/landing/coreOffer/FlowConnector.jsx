import { useEffect, useRef, useState } from "react";

export default function FlowConnector({ systemCount = 8, activeIndex = 0 }) {
  const svgRef = useRef(null);
  const [pathLength, setPathLength] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const path = svg.querySelector("path");
    if (!path) return;

    const length = path.getTotalLength();
    setPathLength(length);

    const handleScroll = () => {
      const rect = svg.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      const distance = viewportCenter - elementCenter;
      const maxDistance = window.innerHeight / 2 + rect.height / 2;
      const progress = Math.max(0, Math.min(1, (maxDistance + distance) / (2 * maxDistance)));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const svgHeight = systemCount * 120;
  const pathD = `M 30 30 ${Array(systemCount - 1).fill(null).map((_, i) => `L 30 ${(i + 1) * 120 + 30}`).join(" ")}`;

  return (
    <svg
      ref={svgRef}
      width="60"
      height={svgHeight}
      style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        opacity: 0.6,
      }}
      viewBox={`0 0 60 ${svgHeight}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(154,92,46,0.2)" />
          <stop offset="50%" stopColor="rgba(200,150,92,0.6)" />
          <stop offset="100%" stopColor="rgba(154,92,46,0.2)" />
        </linearGradient>
      </defs>
      <path
        d={pathD}
        stroke="url(#lineGrad)"
        strokeWidth="2"
        fill="none"
        strokeDasharray={pathLength}
        strokeDashoffset={pathLength * (1 - scrollProgress)}
        style={{
          transition: "stroke-dashoffset 0.1s linear",
        }}
      />
    </svg>
  );
}