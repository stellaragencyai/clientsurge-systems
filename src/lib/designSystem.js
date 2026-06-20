/**
 * ClientSurge Design System
 * 
 * Unified design tokens, spacing, typography, colors, and visual rules
 * for all UI across Admin Dashboard, Client Portal, Landing Pages, and Analytics
 */

// ─────────────────────────────────────────────────────────────────
// TYPOGRAPHY SCALE
// ─────────────────────────────────────────────────────────────────
export const TYPOGRAPHY = {
  h1: {
    fontSize: 'clamp(2rem, 6vw, 3.5rem)',
    fontWeight: 900,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: 'clamp(1.5rem, 4.5vw, 2.5rem)',
    fontWeight: 800,
    lineHeight: 1.15,
    letterSpacing: '-0.015em',
  },
  h3: {
    fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  h4: {
    fontSize: '1.125rem',
    fontWeight: 700,
    lineHeight: 1.25,
  },
  body: {
    fontSize: '0.9375rem',
    fontWeight: 400,
    lineHeight: 1.6,
  },
  bodySmall: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
};

// ─────────────────────────────────────────────────────────────────
// SPACING SYSTEM (4px base grid)
// ─────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
};

// ─────────────────────────────────────────────────────────────────
// COLOR SYSTEM
// ─────────────────────────────────────────────────────────────────
export const COLORS = {
  // Primary (Actions, CTAs, Navigation)
  primary: '#00AEEF',
  primaryDark: '#0088CC',
  primaryLight: 'rgba(0, 174, 239, 0.1)',

  // Success (Positive metrics, healthy state)
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.1)',

  // Warning (Degradation, caution)
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.1)',

  // Danger (Critical, errors, revenue loss)
  danger: '#EF4444',
  dangerLight: 'rgba(239, 68, 68, 0.1)',

  // Neutral (Backgrounds, text, borders)
  foreground: '#0f172a',
  foregroundMuted: '#475569',
  background: '#ffffff',
  backgroundAlt: '#f8fafc',
  border: '#e2e8f0',
  borderDark: '#cbd5e1',

  // Status mapping
  status: {
    healthy: '#10B981',
    degraded: '#F59E0B',
    failed: '#EF4444',
    pending: '#6B7280',
    unknown: '#9CA3AF',
    live: '#10B981',
  },
};

// ─────────────────────────────────────────────────────────────────
// BORDER RADIUS SCALE
// ─────────────────────────────────────────────────────────────────
export const BORDER_RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
};

// ─────────────────────────────────────────────────────────────────
// SHADOW SYSTEM
// ─────────────────────────────────────────────────────────────────
export const SHADOWS = {
  subtle: '0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.03)',
  medium: '0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.06)',
  elevated: '0 12px 24px rgba(0, 0, 0, 0.1), 0 20px 40px rgba(0, 0, 0, 0.08)',
};

// ─────────────────────────────────────────────────────────────────
// INFORMATION HIERARCHY TIERS
// ─────────────────────────────────────────────────────────────────
export const HIERARCHY = {
  TIER_1: {
    name: 'Critical Action Required',
    accentColor: COLORS.danger,
    placement: 'top',
    visible: true,
    priority: 1,
  },
  TIER_2: {
    name: 'Insights / Optimization',
    accentColor: COLORS.primary,
    placement: 'middle',
    visible: true,
    priority: 2,
  },
  TIER_3: {
    name: 'Logs / Raw Data',
    accentColor: COLORS.foregroundMuted,
    placement: 'bottom',
    visible: false,
    priority: 3,
    collapsible: true,
  },
};

// ─────────────────────────────────────────────────────────────────
// COMPONENT SIZING
// ─────────────────────────────────────────────────────────────────
export const COMPONENT_SIZES = {
  button: {
    sm: {
      padding: `${SPACING.sm} ${SPACING.lg}`,
      minHeight: '32px',
      fontSize: TYPOGRAPHY.bodySmall.fontSize,
    },
    md: {
      padding: `${SPACING.md} ${SPACING.xl}`,
      minHeight: '40px',
      fontSize: TYPOGRAPHY.body.fontSize,
    },
    lg: {
      padding: `${SPACING.lg} ${SPACING.xl}`,
      minHeight: '48px',
      fontSize: TYPOGRAPHY.body.fontSize,
    },
  },
  card: {
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    shadow: SHADOWS.subtle,
  },
  input: {
    padding: `${SPACING.md} ${SPACING.lg}`,
    borderRadius: BORDER_RADIUS.md,
    minHeight: '40px',
  },
};

// ─────────────────────────────────────────────────────────────────
// BREAKPOINTS
// ─────────────────────────────────────────────────────────────────
export const BREAKPOINTS = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
  ultraWide: '1536px',
};

export default {
  TYPOGRAPHY,
  SPACING,
  COLORS,
  BORDER_RADIUS,
  SHADOWS,
  HIERARCHY,
  COMPONENT_SIZES,
  BREAKPOINTS,
};