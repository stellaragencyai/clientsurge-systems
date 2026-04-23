/**
 * LeadScoreBadge — displays a 1–100 lead score with color-coded tiers.
 *
 * 80–100  High intent   → emerald
 * 60–79   Good intent   → green
 * 40–59   Moderate      → amber
 * 20–39   Low           → orange
 *  1–19   Very low      → slate
 */

export default function LeadScoreBadge({ score, size = "sm" }) {
  if (score == null) return null;

  const tier =
    score >= 80 ? { label: "High", ring: "bg-emerald-100 text-emerald-800 border-emerald-300", dot: "bg-emerald-500" } :
    score >= 60 ? { label: "Good", ring: "bg-green-100 text-green-800 border-green-300", dot: "bg-green-500" } :
    score >= 40 ? { label: "Mid", ring: "bg-amber-100 text-amber-800 border-amber-300", dot: "bg-amber-500" } :
    score >= 20 ? { label: "Low", ring: "bg-orange-100 text-orange-800 border-orange-300", dot: "bg-orange-400" } :
                  { label: "Cold", ring: "bg-slate-100 text-slate-600 border-slate-300", dot: "bg-slate-400" };

  if (size === "lg") {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-semibold ${tier.ring}`}>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tier.dot}`} />
        <span className="text-sm">{score}<span className="opacity-50 font-normal">/100</span></span>
        <span className="text-xs opacity-70">{tier.label}</span>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold border ${tier.ring}`}
      title={`Lead score: ${score}/100 (${tier.label})`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tier.dot}`} />
      {score}
    </span>
  );
}