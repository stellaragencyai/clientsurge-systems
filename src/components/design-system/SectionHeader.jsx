/**
 * Unified SectionHeader — the single source of truth for section titles.
 * Enforces: Montserrat black title, electric-blue vertical accent bar,
 * optional light-blue eyebrow, and consistent body copy styling.
 *
 * Usage:
 *   <SectionHeader eyebrow="Choose Your Industry" title="Built For Your Industry" subtitle="Pick your industry..." />
 *   <SectionHeader title="How It Works" />
 *   <SectionHeader eyebrow="The Cost of Waiting" title="Revenue you're losing right now." variant="dark" />
 */
export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  variant = 'light',
  className = '',
}) {
  const isCentered = align === 'center';
  const isDark = variant === 'dark';

  return (
    <div
      className={`cs-section-header ${isCentered ? 'cs-section-header--center' : 'cs-section-header--left'} ${className}`}
      data-variant={variant}
    >
      {eyebrow && (
        <p
          className="cs-section-eyebrow"
          style={isDark ? { color: 'rgba(0,174,239,0.85)' } : undefined}
        >
          {eyebrow}
        </p>
      )}

      <div className={`cs-section-title-row ${isCentered ? 'justify-center' : 'justify-start'}`}>
        <span className="cs-section-bar" aria-hidden="true" />
        <h2
          className="cs-section-title"
          style={isDark
            ? { color: '#ffffff', WebkitTextFillColor: '#ffffff' }
            : undefined
          }
        >
          {title}
        </h2>
      </div>

      {subtitle && (
        <p
          className="cs-section-subtitle"
          style={isDark ? { color: 'rgba(255,255,255,0.72)' } : undefined}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}