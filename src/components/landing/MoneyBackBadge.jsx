/**
 * MoneyBackBadge — persistent 30-day guarantee trust badge.
 * Appears near pricing CTAs and in the billing dashboard.
 */
export default function MoneyBackBadge({ variant = "default" }) {
  if (variant === "inline") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border"
        style={{
          background: "rgba(34,197,94,0.08)",
          borderColor: "rgba(34,197,94,0.25)",
          color: "#15803d",
        }}
      >
        🛡️ 30-Day Money-Back Guarantee
      </span>
    );
  }

  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3"
      style={{
        background: "rgba(34,197,94,0.06)",
        borderColor: "rgba(34,197,94,0.2)",
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
        style={{ background: "rgba(34,197,94,0.12)" }}
      >
        🛡️
      </div>
      <div>
        <p className="text-sm font-bold text-foreground">30-Day Money-Back Guarantee</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          If your system isn't fully installed and live within 30 days, you get a full refund. No questions asked.
        </p>
      </div>
    </div>
  );
}