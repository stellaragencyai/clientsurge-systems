export default function SectionDivider({ stat, label }) {
  return (
    <div
      className="w-full py-5 px-6 flex items-center justify-center gap-4"
      style={{
        background: "linear-gradient(135deg, #0f0e0c 0%, #1a1510 50%, #0f0e0c 100%)",
        borderTop: "1px solid rgba(154,92,46,0.2)",
        borderBottom: "1px solid rgba(154,92,46,0.2)",
      }}
    >
      <div className="h-px flex-1 max-w-24" style={{ background: "linear-gradient(to right, transparent, rgba(200,150,92,0.4))" }} />
      <div className="text-center">
        {stat && (
          <span
            className="font-display text-base font-bold tracking-tight"
            style={{ color: "#c8965c" }}
          >
            {stat}
          </span>
        )}
        {label && (
          <span className="text-xs font-semibold uppercase tracking-widest ml-2" style={{ color: "rgba(245,230,208,0.45)" }}>
            {label}
          </span>
        )}
      </div>
      <div className="h-px flex-1 max-w-24" style={{ background: "linear-gradient(to left, transparent, rgba(200,150,92,0.4))" }} />
    </div>
  );
}