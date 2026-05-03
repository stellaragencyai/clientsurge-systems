export default function PortalLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Top bar */}
      <div className="h-16 bg-white border-b border-border px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 rounded bg-muted" />
            <div className="h-2 w-16 rounded bg-muted" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-full bg-muted" />
          <div className="hidden sm:block space-y-1.5">
            <div className="h-2 w-24 rounded bg-muted" />
            <div className="h-2 w-32 rounded bg-muted" />
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="px-6 py-10 bg-gradient-to-r from-amber-900/20 to-amber-700/20">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="h-2.5 w-24 rounded bg-white/20" />
          <div className="h-7 w-64 rounded bg-white/20" />
          <div className="h-3 w-48 rounded bg-white/10" />
        </div>
      </div>

      {/* Tabs */}
      <div className="h-14 bg-white border-b border-border px-6 flex gap-6 items-end">
        {[80, 64, 72, 56, 48, 64].map((w, i) => (
          <div key={i} className={`h-8 rounded-t bg-muted`} style={{ width: `${w}px` }} />
        ))}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="h-6 w-48 rounded bg-muted" />
        <div className="rounded-2xl border border-border bg-card p-8 space-y-4">
          {[100, 85, 90, 70, 95, 60, 80].map((w, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 rounded bg-muted" style={{ width: `${w}%` }} />
                <div className="h-2.5 w-3/4 rounded bg-muted/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}