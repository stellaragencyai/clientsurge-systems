export default function ServiceProgressRing({ currentStage, totalStages, size = 64 }) {
  const percent = totalStages > 1 ? currentStage / (totalStages - 1) : 0;
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * percent;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="rgba(0,136,204,0.12)" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="url(#ringGrad)" strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0077B6" />
            <stop offset="100%" stopColor="#00AEEF" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "12px", fontWeight: "800", color: "#0077B6",
      }}>
        {Math.round(percent * 100)}%
      </div>
    </div>
  );
}