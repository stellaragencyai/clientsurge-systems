/**
 * PortalSkeleton.jsx — #14
 * Branded skeleton loader for ClientPortal (replaces raw spinner).
 */
export default function PortalSkeleton({ rows = 4 }) {
  const pulse = {
    background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
    backgroundSize: "200% 100%",
    animation: "skeleton-pulse 1.4s ease-in-out infinite",
    borderRadius: 8,
  };

  return (
    <>
      <style>{`@keyframes skeleton-pulse { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div style={{ padding: "32px 24px" }}>
        {/* Header skeleton */}
        <div style={{ ...pulse, height: 28, width: "40%", marginBottom: 24 }} />
        {/* Card skeletons */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 20px", marginBottom: 12 }}>
            <div style={{ ...pulse, height: 14, width: "60%", marginBottom: 10 }} />
            <div style={{ ...pulse, height: 10, width: "35%", marginBottom: 6 }} />
            <div style={{ ...pulse, height: 10, width: "25%" }} />
          </div>
        ))}
      </div>
    </>
  );
}
