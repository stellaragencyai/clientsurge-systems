/**
 * SkeletonLoader — GPU-accelerated shimmer skeletons.
 * Uses transform-based animation (not background-position) for 60fps shimmer.
 * Min-heights prevent CLS while lazy sections load.
 */

export function SectionSkeleton({ height = "360px" }) {
  return (
    <div
      aria-hidden="true"
      style={{ minHeight: height }}
      className="cs-section-skeleton"
    />
  );
}

export function SmallSectionSkeleton() {
  return <SectionSkeleton height="200px" />;
}

export function LargeSectionSkeleton() {
  return <SectionSkeleton height="500px" />;
}

export function CardRowSkeleton({ count = 3 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${count}, 1fr)`, gap: "1.5rem", padding: "2rem 0" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="cs-section-skeleton" style={{ minHeight: "200px", borderRadius: "16px" }} aria-hidden="true" />
      ))}
    </div>
  );
}