export default function SectionDivider({ stat, label }) {
  return (
    <div
      className="w-full py-5 px-6 flex items-center justify-center gap-4"
      style={{
        background: "linear-gradient(135deg, #06152d 0%, #08275a 50%, #06152d 100%)",
        borderTop: "1px solid rgba(0,174,239,0.2)",
        borderBottom: "1px solid rgba(0,174,239,0.2)",
      }}
    >
      <div className="h-px flex-1 max-w-24" style={{ background: "linear-gradient(to right, transparent, rgba(0,174,239,0.4))" }} />
      <div className="text-center">
        {stat && (
          <span
            className="font-display text-base font-bold tracking-tight"
            style={{ color: "#7ddcff" }}
          >
            {stat}
          </span>
        )}
        {label && (
          <span className="text-xs font-semibold uppercase tracking-widest ml-2" style={{ color: "rgba(225,245,255,0.58)" }}>
            {label}
          </span>
        )}
      </div>
      <div className="h-px flex-1 max-w-24" style={{ background: "linear-gradient(to left, transparent, rgba(0,174,239,0.4))" }} />
    </div>
  );
}
