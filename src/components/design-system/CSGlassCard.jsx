/**
 * CSGlassCard — Glassmorphism card for overlay/hero contexts.
 * Uses the cs-glass-card CSS class from Sprint 1 design tokens.
 *
 * Props:
 *   children  — ReactNode
 *   className — string
 *   hover     — boolean (enable hover lift, default true)
 */
export default function CSGlassCard({
  children,
  className = '',
  hover = true,
  ...props
}) {
  const classes = [
    'cs-glass-card',
    !hover ? 'cs-no-hover' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}