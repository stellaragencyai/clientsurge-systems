import { useEffect, useRef } from "react";

export default function HeroBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animFrame;
    let particles = [];
    let w, h;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function createParticles() {
      particles = [];
      const count = Math.floor((w * h) / 7000);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.6 + 0.3,
          speed: Math.random() * 0.25 + 0.05,
          opacity: Math.random() * 0.6 + 0.2,
          drift: (Math.random() - 0.5) * 0.12,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }

    let t = 0;

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // Deep space gradient base
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#020818");
      grad.addColorStop(0.35, "#030d24");
      grad.addColorStop(0.65, "#050f30");
      grad.addColorStop(1, "#020a1a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Nebula glow — top left
      const glow1 = ctx.createRadialGradient(w * 0.08, h * 0.12, 0, w * 0.08, h * 0.12, w * 0.55);
      glow1.addColorStop(0, "rgba(0,120,255,0.13)");
      glow1.addColorStop(0.5, "rgba(0,80,200,0.06)");
      glow1.addColorStop(1, "transparent");
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, w, h);

      // Nebula glow — right
      const glow2 = ctx.createRadialGradient(w * 0.85, h * 0.3, 0, w * 0.85, h * 0.3, w * 0.45);
      glow2.addColorStop(0, "rgba(0,174,239,0.1)");
      glow2.addColorStop(0.5, "rgba(0,100,200,0.04)");
      glow2.addColorStop(1, "transparent");
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, w, h);

      // Bottom aurora glow
      const aurora = ctx.createLinearGradient(0, h * 0.7, 0, h);
      aurora.addColorStop(0, "transparent");
      aurora.addColorStop(0.5, "rgba(0,80,160,0.07)");
      aurora.addColorStop(1, "rgba(0,40,100,0.12)");
      ctx.fillStyle = aurora;
      ctx.fillRect(0, 0, w, h);

      // Grid lines — horizontal
      ctx.strokeStyle = "rgba(0,174,239,0.04)";
      ctx.lineWidth = 1;
      const gridSize = 72;
      for (let gx = 0; gx < w; gx += gridSize) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      // Animated horizontal scan line
      const scanY = ((t * 0.4) % (h + 100)) - 50;
      const scanGrad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60);
      scanGrad.addColorStop(0, "transparent");
      scanGrad.addColorStop(0.5, "rgba(0,174,239,0.06)");
      scanGrad.addColorStop(1, "transparent");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 60, w, 120);

      // Draw particles (stars)
      t += 0.8;
      for (let p of particles) {
        p.y -= p.speed;
        p.x += p.drift;
        p.pulse += 0.02;
        if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;

        const pulsedOpacity = p.opacity * (0.75 + 0.25 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,220,255,${pulsedOpacity})`;
        ctx.fill();

        // Bright core for larger stars
        if (p.r > 1.2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${pulsedOpacity * 0.9})`;
          ctx.fill();
        }
      }

      animFrame = requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    const handleResize = () => { resize(); createParticles(); };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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