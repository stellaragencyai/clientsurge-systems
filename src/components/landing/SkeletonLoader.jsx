export function SectionSkeleton({ height = "400px" }) {
  return (
    <div style={{ height }} className="bg-gradient-to-r from-muted via-card to-muted animate-pulse rounded-xl" />
  );
}

export function SmallSectionSkeleton() {
  return <SectionSkeleton height="250px" />;
}

export function LargeSectionSkeleton() {
  return <SectionSkeleton height="600px" />;
}