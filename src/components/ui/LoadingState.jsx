/**
 * Finding #116: Consistent loading state component.
 * Shows a skeleton matching the final layout for a smooth UX.
 */
import { Loader2 } from "lucide-react";

export function LoadingSpinner({ size = "default", className = "" }) {
  const sizeMap = {
    sm: "w-4 h-4",
    default: "w-8 h-8",
    lg: "w-12 h-12",
  };
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeMap[size] || sizeMap.default} animate-spin text-primary`} />
    </div>
  );
}

export function LoadingSkeleton({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-muted animate-pulse"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ className = "" }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-6 ${className}`}>
      <div className="h-6 w-48 rounded bg-muted animate-pulse mb-4" />
      <div className="h-4 w-full rounded bg-muted animate-pulse mb-2" />
      <div className="h-4 w-3/4 rounded bg-muted animate-pulse mb-4" />
      <div className="h-10 w-32 rounded-lg bg-muted animate-pulse" />
    </div>
  );
}

export function PageLoading({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}