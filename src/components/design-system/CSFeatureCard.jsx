import { CheckCircle } from 'lucide-react';

/**
 * CSFeatureCard — Feature/benefit card with optional icon, title, description.
 * Uses the cs-feature-card CSS class from Sprint 1 design tokens.
 *
 * Props:
 *   icon         — lucide-react icon component (optional)
 *   title        — string
 *   description  — string
 *   children     — ReactNode (overrides description if provided)
 *   features     — array of strings (rendered as checkmark list)
 *   className    — string
 *   onClick      — function
 */
export default function CSFeatureCard({
  icon: Icon,
  title,
  description,
  children,
  features = [],
  className = '',
  onClick = null,
  ...props
}) {
  const classes = [
    'cs-feature-card',
    onClick ? 'cursor-pointer' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick} {...props}>
      {Icon && (
        <div className="cs-icon-glow inline-flex items-center justify-center w-11 h-11 rounded-2xl mb-4">
          <Icon className="w-5 h-5" style={{ color: 'var(--cs-brand)' }} />
        </div>
      )}
      {title && (
        <h3 className="cs-h4 mb-2" style={{ fontSize: '1.125rem' }}>
          {title}
        </h3>
      )}
      {description && (
        <p className="cs-body mb-4" style={{ fontSize: '0.9375rem' }}>
          {description}
        </p>
      )}
      {children}
      {features.length > 0 && (
        <ul className="space-y-2 mt-4">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--cs-brand)' }} />
              <span className="cs-small">{feature}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}