import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { COLORS, TYPOGRAPHY, COMPONENT_SIZES, BORDER_RADIUS, SHADOWS } from '@/lib/designSystem';

/**
 * MetricCard - Unified metric display component
 * 
 * Props:
 *   - title: string (e.g., "Conversion Rate")
 *   - value: string | number (e.g., "2.5%", 150)
 *   - delta: number | null (e.g., +5, -2, 0)
 *   - status: 'healthy' | 'degraded' | 'failed' | 'unknown'
 *   - unit: string (optional, e.g., "%", "$")
 *   - size: 'sm' | 'md' | 'lg'
 *   - onClick: function (optional)
 */
export default function MetricCard({ 
  title, 
  value, 
  delta = null, 
  status = 'unknown',
  unit = '',
  size = 'md',
  onClick = null,
}) {
  const statusColor = COLORS.status[status] || COLORS.status.unknown;
  const isDelta = delta !== null && delta !== 0;
  const deltaIsPositive = delta > 0;

  const sizeStyles = {
    sm: { padding: '12px 16px', titleSize: '0.875rem', valueSize: '1.5rem' },
    md: { padding: '16px 24px', titleSize: '0.9375rem', valueSize: '2rem' },
    lg: { padding: '24px 32px', titleSize: '1rem', valueSize: '2.5rem' },
  }[size];

  return (
    <div
      onClick={onClick}
      className={`
        rounded-lg border transition-all
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
      `}
      style={{
        padding: sizeStyles.padding,
        background: COLORS.background,
        border: `1px solid ${COLORS.border}`,
        boxShadow: SHADOWS.subtle,
        borderLeftColor: statusColor,
        borderLeftWidth: '4px',
      }}
    >
      {/* Title */}
      <p
        style={{
          fontSize: sizeStyles.titleSize,
          color: COLORS.foregroundMuted,
          fontWeight: 500,
          marginBottom: '8px',
        }}
      >
        {title}
      </p>

      {/* Value + Delta */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span
          style={{
            fontSize: sizeStyles.valueSize,
            fontWeight: 700,
            color: statusColor,
          }}
        >
          {value}
          {unit && <span style={{ fontSize: '0.6em', marginLeft: '4px' }}>{unit}</span>}
        </span>

        {isDelta && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {deltaIsPositive ? (
              <TrendingUp size={16} color={COLORS.success} />
            ) : delta < 0 ? (
              <TrendingDown size={16} color={COLORS.danger} />
            ) : (
              <Minus size={16} color={COLORS.foregroundMuted} />
            )}
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: deltaIsPositive ? COLORS.success : COLORS.danger,
              }}
            >
              {deltaIsPositive ? '+' : ''}{delta}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}