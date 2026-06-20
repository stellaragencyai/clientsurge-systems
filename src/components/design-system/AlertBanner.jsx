import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { COLORS, SPACING } from '@/lib/designSystem';

/**
 * AlertBanner - System alerts and critical messages
 * 
 * Props:
 *   - type: 'error' | 'warning' | 'success' | 'info'
 *   - title: string
 *   - message: string
 *   - action: ReactNode (optional, button/link)
 *   - onClose: function
 */
export default function AlertBanner({ type = 'info', title, message, action = null, onClose = null }) {
  const typeStyles = {
    error: {
      background: COLORS.dangerLight,
      border: COLORS.danger,
      icon: AlertCircle,
      color: COLORS.danger,
    },
    warning: {
      background: COLORS.warningLight,
      border: COLORS.warning,
      icon: AlertTriangle,
      color: COLORS.warning,
    },
    success: {
      background: COLORS.successLight,
      border: COLORS.success,
      icon: CheckCircle,
      color: COLORS.success,
    },
    info: {
      background: COLORS.primaryLight,
      border: COLORS.primary,
      icon: Info,
      color: COLORS.primary,
    },
  }[type];

  const Icon = typeStyles.icon;

  return (
    <div
      style={{
        background: typeStyles.background,
        border: `1px solid ${typeStyles.border}`,
        borderRadius: '8px',
        padding: SPACING.lg,
        display: 'flex',
        alignItems: 'flex-start',
        gap: SPACING.lg,
        marginBottom: SPACING.xl,
      }}
    >
      <Icon size={20} style={{ color: typeStyles.color, flexShrink: 0, marginTop: '2px' }} />

      <div style={{ flex: 1 }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9375rem', fontWeight: 700, color: typeStyles.color }}>
          {title}
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', color: COLORS.foregroundMuted }}>
          {message}
        </p>
      </div>

      {action && <div style={{ marginLeft: SPACING.lg }}>{action}</div>}

      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: typeStyles.color,
            fontSize: '1.25rem',
            padding: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}