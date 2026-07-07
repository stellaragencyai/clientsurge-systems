/**
 * CSFormContainer — Premium glass container with ClientSurge branding for forms.
 *
 * Provides consistent form wrapping with:
 *   - Glassmorphism card surface
 *   - ClientSurge logo placement
 *   - Title + subtitle header
 *   - Consistent spacing
 *   - Mobile-responsive padding
 *
 * Props:
 *   title       — string (form heading)
 *   subtitle    — string (optional)
 *   logoUrl     — string (optional logo image URL; defaults to text "CS" badge)
 *   children    — form content
 *   className   — string
 *   maxWidth    — string (CSS max-width, default '480px')
 */
export default function CSFormContainer({
  title,
  subtitle,
  logoUrl,
  children,
  className = '',
  maxWidth = '480px',
}) {
  return (
    <div
      className={`cs-form-container relative rounded-2xl overflow-hidden ${className}`}
      style={{
        maxWidth,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
        border: '1px solid rgba(0, 174, 239, 0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,174,239,0.04)',
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          height: '4px',
          background: 'linear-gradient(90deg, #0088CC 0%, #00AEEF 50%, #003B8F 100%)',
          boxShadow: '0 0 12px rgba(0,174,239,0.3)',
        }}
      />

      {/* Header with logo */}
      {(title || logoUrl) && (
        <div className="flex items-start gap-3 p-5 md:p-6 pb-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="ClientSurge Systems"
              width="40"
              height="40"
              className="rounded-lg flex-shrink-0"
              style={{ objectFit: 'contain' }}
              loading="eager"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #0088CC, #003B8F)',
                boxShadow: '0 4px 12px rgba(0,136,204,0.25)',
              }}
            >
              <span
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 900,
                  color: '#ffffff',
                  fontSize: '0.875rem',
                }}
              >
                CS
              </span>
            </div>
          )}

          {title && (
            <div>
              <span
                className="block font-semibold text-sm"
                style={{ color: '#475569', fontFamily: "'Inter', sans-serif" }}
              >
                ClientSurge Systems
              </span>
              <h2
                className="font-bold text-xl mt-0.5"
                style={{ color: '#000000', fontFamily: "'Montserrat', sans-serif" }}
              >
                {title}
              </h2>
            </div>
          )}
        </div>
      )}

      {/* Form content */}
      <div className="p-5 md:p-6">
        {subtitle && (
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  );
}