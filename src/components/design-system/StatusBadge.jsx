import { COLORS } from '@/lib/designSystem';

/**
 * StatusBadge - Unified status indicator
 * 
 * Props:
 *   - status: 'healthy' | 'degraded' | 'failed' | 'pending' | 'unknown' | 'live'
 *   - label: string
 *   - size: 'sm' | 'md'
 */
export default function StatusBadge({ status = 'unknown', label, size = 'md' }) {
  const statusColor = COLORS.status[status] || COLORS.status.unknown;
  const statusLight = COLORS[`${status}Light`] || 'rgba(0, 0, 0, 0.05)';

  const sizeStyles = {
    sm: { padding: '4px 8px', fontSize: '0.75rem' },
    md: { padding: '6px 12px', fontSize: '0.875rem' },
  }[size];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: sizeStyles.padding,
        fontSize: sizeStyles.fontSize,
        fontWeight: 600,
        borderRadius: '6px',
        background: statusLight,
        color: statusColor,
        border: `1px solid ${statusColor}40`,
      }}
    >
      {/* Status dot */}
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: statusColor,
        }}
      />
      {label}
    </div>
  );
}