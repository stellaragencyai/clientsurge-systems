import { lazy, Suspense, memo } from "react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

/**
 * DeferredSection — only mounts children when the section enters viewport.
 * Eliminates wasted render cycles for below-fold sections.
 * Pass a minHeight to prevent layout shift while content loads.
 */
const DeferredSection = memo(function DeferredSection({
  children,
  minHeight = "300px",
  fallback,
}) {
  const [ref, isVisible] = useIntersectionObserver({ rootMargin: "200px" });

  const skeleton = fallback || (
    <div
      style={{ minHeight }}
      className="cs-section-skeleton"
      aria-hidden="true"
    />
  );

  return (
    <div ref={ref}>
      {isVisible ? (
        <Suspense fallback={skeleton}>{children}</Suspense>
      ) : (
        skeleton
      )}
    </div>
  );
});

export default DeferredSection;