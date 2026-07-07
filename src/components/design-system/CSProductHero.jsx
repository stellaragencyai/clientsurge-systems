import CSHero from '@/components/design-system/CSHero';

/**
 * CSProductHero — Hero for automation/product pages and the store.
 *
 * Extends CSHero with a centered layout, product-focused content,
 * automation pills, and optional logo marquee.
 *
 * Props:
 *   eyebrow          — string
 *   title            — string
 *   subtitle         — string
 *   description      — string (optional small text)
 *   primaryCTA       — { label, onClick, href, to, icon }
 *   secondaryCTA     — { label, onClick, href, to, icon }
 *   automationPills  — array of strings (e.g. ["Lead Capture", "Missed-Call Recovery"])
 *   stats            — array of { value, label }
 *   trustBadges      — array of strings
 *   children         — extra content (logo marquee, etc.)
 */
export default function CSProductHero({
  eyebrow = 'The Amazon of AI Services for Business',
  title,
  subtitle,
  description,
  primaryCTA,
  secondaryCTA,
  automationPills = [],
  stats,
  trustBadges,
  children,
}) {
  return (
    <CSHero
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      description={description}
      primaryCTA={primaryCTA}
      secondaryCTA={secondaryCTA}
      stats={stats}
      trustBadges={trustBadges}
      backgroundType="light"
      align="center"
      minHeight="calc(100svh - var(--cs-nav-height))"
    >
      {automationPills.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl px-2">
          {automationPills.map((pill) => (
            <span
              key={pill}
              className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={{
                borderColor: 'rgba(0,107,176,0.2)',
                background: 'rgba(0,174,239,0.06)',
                color: '#006BB0',
              }}
            >
              {pill}
            </span>
          ))}
        </div>
      )}
      {children}
    </CSHero>
  );
}