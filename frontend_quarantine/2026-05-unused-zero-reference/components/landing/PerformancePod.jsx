import { useEffect, useState } from "react";
import { Zap, TrendingUp, Calendar } from "lucide-react";

const METRICS = [
  {
    icon: Zap,
    label: "Avg. Response Time",
    value: "4.2 sec",
    color: "#f59e0b",
  },
  {
    icon: TrendingUp,
    label: "Booking Rate",
    value: "68%",
    color: "#22c55e",
  },
  {
    icon: Calendar,
    label: "Next Booking",
    value: "In 12 min",
    color: "#a78bfa",
  },
];

export default function PerformancePod() {
  const [activeMetric, setActiveMetric] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMetric((prev) => (prev + 1) % METRICS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const metric = METRICS[activeMetric];
  const Icon = metric.icon;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 30,
        perspective: "1200px",
      }}
    >
      {/* Glassmorphic card */}
      <div
        style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: "16px",
          border: "1.5px solid rgba(200,150,92,0.3)",
          padding: "16px 20px",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
          minWidth: "220px",
          animation: "podSlideIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {/* Live indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 8px #22c55e",
              animation: "hPulse 2s infinite",
            }}
          />
          <span
            style={{
              fontSize: "10px",
              fontWeight: "700",
              color: "#22c55e",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Live Updates
          </span>
        </div>

        {/* Metric display */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: `${metric.color}15`,
              border: `1.5px solid ${metric.color}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon style={{ width: "18px", height: "18px", color: metric.color }} />
          </div>
          <div>
            <p
              style={{
                fontSize: "10px",
                color: "rgba(26,18,9,0.55)",
                margin: "0 0 2px",
                fontWeight: "600",
              }}
            >
              {metric.label}
            </p>
            <p
              style={{
                fontSize: "18px",
                fontWeight: "800",
                color: metric.color,
                margin: 0,
              }}
            >
              {metric.value}
            </p>
          </div>
        </div>

        {/* Carousel dots */}
        <div style={{ display: "flex", gap: "4px" }}>
          {METRICS.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Show ${METRICS[idx].label} metric`}
              aria-current={idx === activeMetric ? "true" : undefined}
              onClick={() => setActiveMetric(idx)}
              style={{
                width: idx === activeMetric ? "12px" : "6px",
                height: "6px",
                borderRadius: "3px",
                border: "none",
                background:
                  idx === activeMetric
                    ? "linear-gradient(135deg,#9a5c2e,#c8965c)"
                    : "rgba(154,92,46,0.2)",
                cursor: "pointer",
                transition: "all 0.4s ease",
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes podSlideIn {
          from {
            opacity: 0;
            transform: translateY(24px) translateX(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0) translateX(0);
          }
        }
        @keyframes hPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
