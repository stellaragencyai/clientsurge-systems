/**
 * SectionWrapper — unified container ensuring consistent vertical rhythm & spacing across landing page.
 * Applies standardized padding, max-width, and responsive breakpoints.
 */
export default function SectionWrapper({ 
  children, 
  id, 
  bgColor = "transparent",
  noPadding = false,
  innerPadding = true,
}) {
  return (
    <section
      id={id}
      style={{
        background: bgColor,
        scrollMarginTop: "var(--cs-anchor-offset)",
        paddingTop: noPadding ? 0 : "clamp(3rem, 8vw, 6rem)",
        paddingBottom: noPadding ? 0 : "clamp(3rem, 8vw, 6rem)",
      }}
    >
      {innerPadding ? (
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
}