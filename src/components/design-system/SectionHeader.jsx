/**
 * Unified SectionHeader — the single source of truth for section titles.
 * Enforces: Montserrat black title, electric-blue vertical accent bar,
 * optional light-blue eyebrow, and consistent body copy styling.
 *
 * Usage:
 *   <SectionHeader eyebrow="Choose Your Industry" title="Built For Your Industry" subtitle="Pick your industry..." />
 *   <SectionHeader title="How It Works" />
 */
export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className = '',
}) {
  const isCentered = align === 'center';

  return (
    <div
      className={`cs-section-header ${isCentered ? 'cs-section-header--center' : 'cs-section-header--left'} ${className}`}
    >
      {eyebrow && (
        <p className="cs-section-eyebrow">{eyebrow}</p>
      )}

      <div className={`cs-section-title-row ${isCentered ? 'justify-center' : 'justify-start'}`}>
        <span className="cs-section-bar" aria-hidden="true" />
        <h2 className="cs-section-title">{title}</h2>
      </div>

      {subtitle && (
        <p className="cs-section-subtitle">{subtitle}</p>
      )}
    </div>
  );
}