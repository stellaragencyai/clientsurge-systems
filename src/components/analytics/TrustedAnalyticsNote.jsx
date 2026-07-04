import { Info, ShieldCheck } from "lucide-react";

/**
 * Dashboard note explaining the distinction between Base44 platform
 * analytics (which may include internal or automated traffic) and the
 * app's trusted internal analytics (which applies path / referrer /
 * user-agent filtering).
 *
 * Drop-in component — does not fetch or mutate any data.
 */
export default function TrustedAnalyticsNote() {
  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-blue-900"
      role="note"
    >
      <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
      <div>
        <p className="font-semibold text-blue-900">
          Trusted internal analytics vs Base44 platform analytics
        </p>
        <p className="mt-1 text-blue-800">
          Base44 platform analytics may include internal or automated traffic.
          Trusted internal analytics applies filtering on path, referrer, and
          user agent to exclude non-page technical requests and obvious bots,
          so the numbers below reflect real visitor activity. Metrics are never
          fabricated — if trusted data is too sparse, an explicit note is shown.
        </p>
      </div>
    </div>
  );
}

/**
 * Empty-state shown when trusted analytics filtering excluded too many
 * events to display reliable metrics. Does not invent or estimate numbers.
 */
export function InsufficientTrustedData({
  message = "Insufficient trusted data.",
  detail = "Trusted analytics filtering excluded too many events to display reliable metrics.",
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
      <Info className="mb-2 h-5 w-5 text-muted-foreground" />
      <p className="text-sm font-semibold text-foreground">{message}</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}