/**
 * Admin Loading Skeletons
 * Fixes Audit Issue #46: No loading skeletons for async data in admin panels
 *
 * Reusable skeleton placeholders that match common admin panel layouts.
 */

export function TableSkeleton({ rows = 8, cols = 5 }) {
  return (
    <div className="w-full">
      {/* Header skeleton */}
      <div className="flex gap-2 pb-3 border-b border-border">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1 h-4 bg-muted rounded animate-pulse" />
        ))}
      </div>
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-2 py-3 border-b border-border/50">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="flex-1 h-4 bg-muted/70 rounded animate-pulse"
              style={{ animationDelay: `${rowIdx * 50}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-32 rounded-xl border border-border bg-card p-4 space-y-2 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-6 w-32 bg-muted/70 rounded" />
          <div className="h-3 w-24 bg-muted/50 rounded mt-4" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3.5 rounded-lg border border-border animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-3 w-48 bg-muted/70 rounded" />
          </div>
          <div className="h-6 w-16 bg-muted/50 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="h-64 rounded-xl border border-border bg-card p-4 animate-pulse">
      <div className="h-4 w-32 bg-muted rounded mb-4" />
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-muted/70 rounded-t"
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default TableSkeleton;