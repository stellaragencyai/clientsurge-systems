/**
 * CSSectionHeader — Atomic section header using Sprint 1 design tokens.
 *
 * Props:
 *   eyebrow    — string (small label above title)
 *   title      — string (required)
 *   subtitle   — string (body text below title)
 *   align      — 'center' | 'left' (default 'left')
 *   theme      — 'light' | 'dark' (for dark backgrounds)
 *   className  — string
 */
export default function CSSectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  theme = 'light',
  className = '',
}) {
  const isCentered = align === 'center';
  const isDark = theme === 'dark';

  return (
    <div
      className={[
        'cs-section-header',
        isCentered ? 'cs-section-header--center' : 'cs-section-header--left',
        className,
      ].filter(Boolean).join(' ')}
      data-theme={theme}
      style={isDark ? { '--cs-section-title-color': '#ffffff' } : undefined}
    >
      {eyebrow && <p className="cs-section-eyebrow">{eyebrow}</p>}

      <div className="cs-section-title-row">
        <span className="cs-section-bar" aria-hidden="true" />
        <h2
          className="cs-section-title"
          style={isDark ? { color: '#ffffff', WebkitTextFillColor: '#ffffff' } : undefined}
        >
          {title}
        </h2>
      </div>

      {subtitle && (
        <p
          className="cs-section-subtitle"
          style={isDark ? { color: 'rgba(255,255,255,0.82)' } : undefined}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}