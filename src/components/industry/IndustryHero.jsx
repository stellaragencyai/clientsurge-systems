import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Reusable IndustryHero component template for cinematic, premium industry page heroes.
 * 
 * Props:
 *   - industryKey: string (e.g., 'roofing', 'hvac', 'dental') — used for feature detection
 *   - eyebrow: string (e.g., 'Roofing AI Automation')
 *   - headline: string (main heading)
 *   - subheadline: string (short description)
 *   - description: string (longer supporting text)
 *   - backgroundImage: string (image URL for hero wallpaper)
 *   - primaryCTA: { label, path } (e.g., { label: "Start Setup", path: "/start?industry=roofing" })
 *   - secondaryCTA: { label, path }
 *   - fallbackCTA: { label, path }
 */

export default function IndustryHero({
  industryKey,
  eyebrow,
  headline,
  subheadline,
  description,
  backgroundImage,
  primaryCTA,
  secondaryCTA,
  fallbackCTA,
}) {
  const navigate = useNavigate();

  // Determine if this hero uses cinematic wallpaper (any industry with a backgroundImage URL)
  const useCinematicHero = backgroundImage && industryKey;

  if (useCinematicHero) {
    return (
      <section
        className="cs-industry-hero relative w-full flex items-center justify-start min-h-[100svh] overflow-hidden"
        style={{
          backgroundImage: `url("${backgroundImage}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Cinematic overlay — lightens so the photo is clearly visible; deeper only on the left edge for text contrast */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(100deg, rgba(2,6,23,0.62) 0%, rgba(15,23,42,0.38) 40%, rgba(15,23,42,0.12) 68%, rgba(2,6,23,0.18) 100%)' }} />
        <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(2,6,23,0.55), transparent)' }} />

        {/* Content — left-aligned with substantial whitespace, clears the fixed navbar */}
        <div className="relative z-10 px-6 md:px-12 lg:px-16 max-w-2xl" style={{ paddingTop: 'calc(var(--cs-nav-height, 76px) + 2rem)' }}>
          {/* Eyebrow — with electric-blue accent bar */}
          <div className="mb-6 flex items-center gap-3">
            <span className="h-4 w-1 rounded-full" style={{ background: '#00AEEF', boxShadow: '0 0 12px rgba(0,174,239,0.7)' }} />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/95" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
              {eyebrow}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-bold text-white mb-6 leading-[1.05]" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.4)', fontFamily: 'Montserrat, sans-serif' }}>
            {headline}
          </h1>

          {/* Subheadline */}
          <p className="text-base md:text-lg lg:text-xl text-white/95 mb-8 leading-relaxed max-w-xl" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
            {subheadline}
          </p>

          {/* Description */}
          {description && (
            <p className="text-sm md:text-base text-white/85 mb-10 leading-relaxed max-w-2xl" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              {description}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {primaryCTA && (
              <button
                onClick={() => navigate(primaryCTA.path)}
                className="cs-btn-primary inline-flex items-center justify-center gap-2"
                style={{ background: '#ffffff', color: '#0f172a' }}
              >
                {primaryCTA.label}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {secondaryCTA && (
              <button
                onClick={() => navigate(secondaryCTA.path)}
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-white/90 rounded-lg text-white font-semibold hover:bg-white/10 transition backdrop-blur-sm"
                style={{ minHeight: 'unset' }}
              >
                {secondaryCTA.label}
              </button>
            )}
            {fallbackCTA && (
              <button
                onClick={() => navigate(fallbackCTA.path)}
                className="inline-flex items-center justify-center px-4 py-3 text-white/90 font-semibold hover:text-white transition underline decoration-white/50 hover:decoration-white"
              >
                {fallbackCTA.label}
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Fallback: standard centered hero (for industries without cinematic background)
  return (
    <section className="pt-32 pb-24 px-6 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-6 inline-block">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
            {eyebrow}
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
          {headline}
        </h1>
        <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto">
          {subheadline}
        </p>
        {description && (
          <p className="text-base text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {primaryCTA && (
            <button
              onClick={() => navigate(primaryCTA.path)}
              className="cs-btn-primary inline-flex items-center justify-center gap-2"
            >
              {primaryCTA.label}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {secondaryCTA && (
            <button
              onClick={() => navigate(secondaryCTA.path)}
              className="inline-flex items-center justify-center px-6 py-3 border border-slate-200 rounded-lg text-slate-900 font-semibold hover:bg-slate-50 transition"
            >
              {secondaryCTA.label}
            </button>
          )}
          {fallbackCTA && (
            <button
              onClick={() => navigate(fallbackCTA.path)}
              className="inline-flex items-center justify-center px-4 py-3 text-slate-600 font-semibold hover:text-slate-900 transition underline decoration-slate-300 hover:decoration-slate-600"
            >
              {fallbackCTA.label}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}