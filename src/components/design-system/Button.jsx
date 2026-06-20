import { COLORS, COMPONENT_SIZES, BORDER_RADIUS } from '@/lib/designSystem';

/**
 * Button - Unified button component
 * 
 * Props:
 *   - variant: 'primary' | 'secondary' | 'danger'
 *   - size: 'sm' | 'md' | 'lg'
 *   - disabled: boolean
 *   - onClick: function
 *   - children: ReactNode
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick = null,
  children,
  className = '',
  ...props
}) {
  const sizeConfig = COMPONENT_SIZES.button[size];

  const variantStyles = {
    primary: {
      background: COLORS.primary,
      color: '#ffffff',
      hoverBackground: COLORS.primaryDark,
      borderColor: 'transparent',
    },
    secondary: {
      background: COLORS.backgroundAlt,
      color: COLORS.foreground,
      hoverBackground: COLORS.border,
      borderColor: COLORS.border,
    },
    danger: {
      background: COLORS.dangerLight,
      color: COLORS.danger,
      hoverBackground: 'rgba(239, 68, 68, 0.2)',
      borderColor: COLORS.danger,
    },
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        padding: sizeConfig.padding,
        minHeight: sizeConfig.minHeight,
        fontSize: sizeConfig.fontSize,
        fontWeight: 600,
        borderRadius: BORDER_RADIUS.md,
        border: `1px solid ${variantStyles.borderColor}`,
        background: variantStyles.background,
        color: variantStyles.color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => !disabled && (e.target.style.background = variantStyles.hoverBackground)}
      onMouseLeave={(e) => !disabled && (e.target.style.background = variantStyles.background)}
      {...props}
    >
      {children}
    </button>
  );
}