import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const glowRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(max-width: 768px)").matches) {
      return;
    }

    const handleMouseMove = (e) => {
      if (!glowRef.current) return;
      glowRef.current.style.left = `${e.clientX}px`;
      glowRef.current.style.top = `${e.clientY}px`;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={glowRef}
      style={{
        position: "fixed",
        pointerEvents: "none",
        zIndex: -1,
        width: "300px",
        height: "300px",
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,150,92,0.2) 0%, transparent 70%)",
        filter: "blur(40px)",
        transition: "none",
      }}
    />
  );
}