import CSHero from '@/components/design-system/CSHero';

/**
 * CSIndustryHero — Hero for industry landing pages.
 *
 * Extends CSHero with a cinematic background image, left-aligned content,
 * and dark overlay for text readability over photography.
 *
 * Props:
 *   eyebrow          — string (e.g. "Roofing AI Automation")
 *   title            — string (main heading)
 *   subtitle         — string (short description)
 *   description      — string (longer supporting text)
 *   backgroundImage  — string URL for hero wallpaper
 *   primaryCTA       — { label, onClick, href, to, icon }
 *   secondaryCTA     — { label, onClick, href, to, icon }
 *   fallbackCTA      — { label, onClick, href, to } (text-only link)
 *
 * If no backgroundImage is provided, falls back to a centered light hero.
 */
export default function CSIndustryHero({
  eyebrow,
  title,
  subtitle,
  description,
  backgroundImage,
  primaryCTA,
  secondaryCTA,
  fallbackCTA,
}) {
  const hasImage = Boolean(backgroundImage);

  return (
    <CSHero
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      description={description}
      primaryCTA={primaryCTA}
      secondaryCTA={secondaryCTA}
      backgroundType={hasImage ? 'image' : 'gradient'}
      backgroundImage={backgroundImage}
      align={hasImage ? 'left' : 'center'}
      minHeight="100svh"
    >
      {fallbackCTA && (
        <div className={hasImage ? '' : 'flex justify-center'}>
          <button
            onClick={fallbackCTA.onClick}
            type="button"
            className="inline-flex items-center justify-center px-4 py-3 font-semibold underline transition"
            style={{
              color: hasImage ? 'rgba(255,255,255,0.9)' : '#475569',
              textDecorationColor: hasImage ? 'rgba(255,255,255,0.5)' : '#cbd5e1',
              minHeight: 'unset',
              minWidth: 'unset',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {fallbackCTA.label}
          </button>
        </div>
      )}
    </CSHero>
  );
}