import { useEffect, useRef } from "react";

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const rand = seededRand(seed);

    // Generate stars once
    const stars = Array.from({ length: STAR_COUNT }, (_, i) => ({
      x: rand(),          // 0-1 relative
      y: rand(),
      r: rand() * 1.4 + 0.3,
      speed: rand() * 0.0003 + 0.0001,
      phase: rand() * Math.PI * 2,
      color: rand() > 0.65
        ? `rgba(245, 217, 168,`   // warm gold
        : rand() > 0.4
          ? `rgba(255, 240, 200,`  // pale cream
          : `rgba(0, 174, 239,`,  // blue
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
      stars.forEach((star) => {
        const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * star.speed * 80 + star.phase));
        const alpha = twinkle * opacity;
        ctx.beginPath();
        ctx.arc(star.x * w, star.y * h, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color}${alpha.toFixed(3)})`;
        // Soft outer glow
        const grd = ctx.createRadialGradient(
          star.x * w, star.y * h, 0,
          star.x * w, star.y * h, star.r * 4
        );
        grd.addColorStop(0, `${star.color}${(alpha * 0.9).toFixed(3)})`);
        grd.addColorStop(1, `${star.color}0)`);
        ctx.fillStyle = grd;
        ctx.fill();
      });
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [seed, opacity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}