export function SectionSkeleton({ height = "400px" }) {
  return (
    <div style={{ minHeight: height }} className="cs-section-skeleton" />
  );
}

export function SmallSectionSkeleton() {
  return <SectionSkeleton height="250px" />;
}

export function LargeSectionSkeleton() {
  return <SectionSkeleton height="360px" />;
}
