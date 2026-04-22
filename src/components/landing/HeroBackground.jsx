import { useEffect, useRef } from "react";

// Layer 1: Floating keyword drift canvas (#2)
export function KeywordDriftCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const words = [
      "LEADS", "AI", "BOOKED", "FOLLOW-UP", "SMS", "REVENUE",
      "CLIENTS", "BOOKINGS", "RESPOND", "AUTOMATION", "$4,200",
      "+32", "NURTURE", "PIPELINE", "INSTANT", "SEQUENCE",
      "CONVERT", "SALES", "AGENTS", "CAPTURE",
    ];

    let particles = [];
    let animId;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function init() {
      resize();
      particles = Array.from({ length: 28 }, () => ({
        word: words[Math.floor(Math.random() * words.length)],
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 11 + 8,
        opacity: Math.random() * 0.055 + 0.018,
        speedX: (Math.random() - 0.5) * 0.18,
        speedY: (Math.random() - 0.5) * 0.12,
        rotation: (Math.random() - 0.5) * 0.4,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.font = `700 ${p.size}px 'Inter', sans-serif`;
        ctx.fillStyle = "#c8965c";
        ctx.letterSpacing = "0.08em";
        ctx.fillText(p.word, 0, 0);
        ctx.restore();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x > canvas.width + 100) p.x = -100;
        if (p.x < -100) p.x = canvas.width + 100;
        if (p.y > canvas.height + 40) p.y = -40;
        if (p.y < -40) p.y = canvas.height + 40;
      });
      animId = requestAnimationFrame(draw);
    }

    init();
    draw();

    const ro = new ResizeObserver(init);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

// Layer 4: Radial spotlight glow (#4)
export function RadialSpotlight() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 2 }}
      aria-hidden="true"
    >
      {/* Main warm amber spotlight centered-right */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "60%",
          transform: "translate(-50%, -50%)",
          width: "900px",
          height: "700px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(200,150,92,0.13) 0%, rgba(154,92,46,0.06) 40%, transparent 70%)",
          filter: "blur(2px)",
        }}
      />
      {/* Secondary deep amber left glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(120,70,20,0.10) 0%, transparent 65%)",
        }}
      />
      {/* Top-center highlight */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "45%",
          width: "600px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(200,150,92,0.07) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

// Layer 9: Grain texture overlay (#9)
export function GrainOverlay() {
  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="hero-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="overlay" />
        </filter>
      </svg>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 3,
          filter: "url(#hero-grain)",
          opacity: 0.035,
          background: "#fff",
          mixBlendMode: "overlay",
        }}
        aria-hidden="true"
      />
    </>
  );
}

// Layer 10: Giant watermark typography (#10)
export function WatermarkTypography() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      <span
        style={{
          position: "absolute",
          top: "-4%",
          right: "-5%",
          fontSize: "clamp(120px, 20vw, 280px)",
          fontWeight: "900",
          fontFamily: "'Inter', sans-serif",
          color: "rgba(200,150,92,0.032)",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          transform: "rotate(-8deg)",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        LEADS
      </span>
      <span
        style={{
          position: "absolute",
          bottom: "5%",
          left: "-2%",
          fontSize: "clamp(80px, 14vw, 200px)",
          fontWeight: "900",
          fontFamily: "'Inter', sans-serif",
          color: "rgba(200,150,92,0.025)",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          transform: "rotate(5deg)",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        BOOKED
      </span>
      <span
        style={{
          position: "absolute",
          top: "42%",
          left: "28%",
          fontSize: "clamp(60px, 10vw, 150px)",
          fontWeight: "900",
          fontFamily: "'Inter', sans-serif",
          color: "rgba(200,150,92,0.018)",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          transform: "rotate(-3deg)",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        AI
      </span>
    </div>
  );
}

// Layer 3: Ghost stat cards (#3)
export function GhostStatCards() {
  const cards = [
    {
      label: "New Lead",
      value: "Sarah M.",
      sub: "Via Instagram Ad · 2 sec ago",
      dot: "#22c55e",
      top: "12%",
      left: "4%",
      rotate: "-6deg",
    },
    {
      label: "Booking Confirmed",
      value: "Thu 3:00 PM ✓",
      sub: "Glow Med Spa · Laser Facial",
      dot: "#c8965c",
      top: "58%",
      left: "2%",
      rotate: "4deg",
    },
    {
      label: "AI Replied",
      value: "8 seconds",
      sub: "Before competitor responded",
      dot: "#a78bfa",
      top: "30%",
      right: "2%",
      rotate: "5deg",
    },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 4 }} aria-hidden="true">
      {cards.map((card, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: card.top,
            left: card.left,
            right: card.right,
            transform: `rotate(${card.rotate})`,
            width: "180px",
            background: "rgba(255,255,255,0.035)",
            border: "1px solid rgba(200,150,92,0.12)",
            borderRadius: "16px",
            padding: "12px 14px",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            opacity: 0.7,
            animation: `ghostFloat${i} ${4 + i * 1.2}s ease-in-out infinite`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: card.dot, flexShrink: 0 }} />
            <span style={{ fontSize: "8px", fontWeight: "700", color: "rgba(245,230,208,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {card.label}
            </span>
          </div>
          <p style={{ fontSize: "12px", fontWeight: "700", color: "rgba(245,230,208,0.55)", margin: "2px 0" }}>{card.value}</p>
          <p style={{ fontSize: "9px", color: "rgba(245,230,208,0.28)", lineHeight: 1.3 }}>{card.sub}</p>
        </div>
      ))}
      <style>{`
        @keyframes ghostFloat0 { 0%,100%{transform:rotate(-6deg) translateY(0)} 50%{transform:rotate(-6deg) translateY(-8px)} }
        @keyframes ghostFloat1 { 0%,100%{transform:rotate(4deg) translateY(0)} 50%{transform:rotate(4deg) translateY(-6px)} }
        @keyframes ghostFloat2 { 0%,100%{transform:rotate(5deg) translateY(0)} 50%{transform:rotate(5deg) translateY(-10px)} }
      `}</style>
    </div>
  );
}