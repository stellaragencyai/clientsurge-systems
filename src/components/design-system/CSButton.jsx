import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * CSButton — Unified atomic button component using Sprint 1 design tokens.
 *
 * Variants: primary | secondary | outline | ghost
 * Sizes:    sm | md | lg
 *
 * Props:
 *   variant   — 'primary' | 'secondary' | 'outline' | 'ghost'
 *   size      — 'sm' | 'md' | 'lg'
 *   icon      — lucide-react icon component (optional)
 *   iconRight — lucide-react icon component (optional, placed after text)
 *   loading   — boolean (shows spinner, disables interaction)
 *   disabled  — boolean
 *   href      — string (renders <a> instead of <button>)
 *   to        — string (renders react-router <Link> for SPA navigation)
 *   onClick   — function
 *   children  — ReactNode
 *   className — string (appended to base classes)
 */
const VARIANT_CLASS = {
  primary: 'cs-btn-primary',
  secondary: 'cs-btn-secondary',
  outline: 'cs-btn-outline',
  ghost: 'cs-btn-ghost',
};

const SIZE_CLASS = {
  sm: 'cs-btn-sm',
  md: 'cs-btn-md',
  lg: 'cs-btn-lg',
};

export default function CSButton({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  href,
  to,
  onClick,
  children,
  className = '',
  ...props
}) {
  const classes = [
    VARIANT_CLASS[variant] || VARIANT_CLASS.primary,
    SIZE_CLASS[size] || SIZE_CLASS.md,
    className,
  ].filter(Boolean).join(' ');

  const isDisabled = disabled || loading;
  const content = (
    <>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      {children}
      {IconRight && <IconRight className="w-4 h-4 flex-shrink-0" />}
    </>
  );

  if (to && !isDisabled) {
    return (
      <Link
        to={to}
        className={classes}
        onClick={onClick}
        data-loading={loading || undefined}
        {...props}
      >
        {content}
      </Link>
    );
  }

  if (href && !isDisabled) {
    return (
      <a
        href={href}
        className={classes}
        onClick={onClick}
        data-loading={loading || undefined}
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      data-loading={loading || undefined}
      className={classes}
      {...props}
    >
      {content}
    </button>
  );
}