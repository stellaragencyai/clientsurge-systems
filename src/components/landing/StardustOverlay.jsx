import { useEffect, useRef, useState } from "react";

// Deterministic pseudo-random so stars don't shift on re-render
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const STAR_COUNT = 55;

export default function StardustOverlay({ seed = 42, opacity = 0.55 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(false);

  // Only render canvas when the section is in viewport — saves CPU on scroll
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { threshold: 0.01 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");

    const rand = seededRand(seed);

    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: rand(),
      y: rand(),
      r: rand() * 1.4 + 0.3,
      speed: rand() * 0.0003 + 0.0001,
      phase: rand() * Math.PI * 2,
      color: rand() > 0.65
        ? `rgba(0, 174, 239,`
        : rand() > 0.4
          ? `rgba(255, 255, 255,`
          : `rgba(0, 59, 143,`,
    }));

    let w = 0, h = 0;

    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w;
      canvas.height = h;
    };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      t += 1;
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * star.speed * 80 + star.phase));
        const alpha = twinkle * opacity;
        ctx.beginPath();
        ctx.arc(star.x * w, star.y * h, star.r, 0, Math.PI * 2);
        const grd = ctx.createRadialGradient(
          star.x * w, star.y * h, 0,
          star.x * w, star.y * h, star.r * 4
        );
        grd.addColorStop(0, `${star.color}${(alpha * 0.9).toFixed(3)})`);
        grd.addColorStop(1, `${star.color}0)`);
        ctx.fillStyle = grd;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [seed, opacity, visible]);

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {visible && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
      )}
    </div>
  );
}