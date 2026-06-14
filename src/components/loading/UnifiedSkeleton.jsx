/**
 * Centralized skeleton/loading component
 * Standardizes loading states across the entire app to avoid duplication
 * Replaces scattered SectionSkeleton definitions
 */

export function CardSkeleton({ count = 1 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border p-4 animate-pulse">
          <div className="h-6 bg-muted rounded w-2/3 mb-3" />
          <div className="h-4 bg-muted rounded w-full mb-2" />
          <div className="h-4 bg-muted rounded w-5/6" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="flex-1 h-10 bg-muted rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SectionSkeleton() {
  return (
    <div className="cs-section-skeleton" />
  );
}

export function ListSkeleton({ itemCount = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: itemCount }).map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="w-12 h-12 bg-muted rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-muted rounded w-1/3 mb-2" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ cols = 3, count = 6 }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border p-4 animate-pulse">
          <div className="w-full h-32 bg-muted rounded mb-3" />
          <div className="h-5 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-full" />
        </div>
      ))}
    </div>
  );
}