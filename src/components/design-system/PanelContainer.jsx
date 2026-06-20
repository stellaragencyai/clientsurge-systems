import { COLORS, COMPONENT_SIZES, BORDER_RADIUS, SHADOWS, SPACING } from '@/lib/designSystem';

/**
 * PanelContainer - Unified section wrapper for dashboards
 * 
 * Props:
 *   - title: string
 *   - description: string (optional)
 *   - children: ReactNode
 *   - action: ReactNode (optional, right-aligned button/menu)
 *   - isCollapsible: boolean
 *   - isCollapsed: boolean (controlled)
 *   - onToggleCollapse: function
 */
export default function PanelContainer({
  title,
  description,
  children,
  action = null,
  isCollapsible = false,
  isCollapsed = false,
  onToggleCollapse = null,
}) {
  return (
    <div
      style={{
        background: COLORS.background,
        border: `1px solid ${COLORS.border}`,
        borderRadius: BORDER_RADIUS.lg,
        boxShadow: SHADOWS.subtle,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: SPACING.xl,
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.lg,
          cursor: isCollapsible ? 'pointer' : 'default',
        }}
        onClick={() => isCollapsible && onToggleCollapse?.()}
      >
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.125rem', fontWeight: 700, color: COLORS.foreground }}>
            {title}
          </h3>
          {description && (
            <p style={{ margin: 0, fontSize: '0.875rem', color: COLORS.foregroundMuted }}>
              {description}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      {/* Content */}
      {!isCollapsed && <div style={{ padding: SPACING.xl }}>{children}</div>}
    </div>
  );
}