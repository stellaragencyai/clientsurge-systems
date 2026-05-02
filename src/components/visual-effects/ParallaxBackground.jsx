import { useRef, useEffect, useState } from "react";

/**
 * ParallaxBackground - Blurred background image with foreground content
 * Creates depth with slower-moving background and faster foreground
 */
export default function ParallaxBackground({ 
  backgroundImage, 
  children, 
  intensity = 0.08,
  blur = "blur(12px)"
}) {
  const containerRef = useRef(null);
  const bgRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const elementScrolled = window.scrollY - rect.top + window.innerHeight;
        setScrollY(elementScrolled * intensity);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [intensity]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100%",
      }}
    >
      {/* Blurred Background Layer */}
      <div
        ref={bgRef}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: blur,
          transform: `translate3d(0, ${scrollY}px, 0) scale(1.2)`,
          willChange: "transform",
          transition: "transform 0.1s linear",
          zIndex: 0,
        }}
      />

      {/* Content Layer */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}