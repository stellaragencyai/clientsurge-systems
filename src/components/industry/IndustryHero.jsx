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

  // Determine if this hero uses cinematic wallpaper (roofing and future hero-image industries)
  const useCinematicHero = backgroundImage && industryKey && ['roofing'].includes(industryKey.toLowerCase());

  if (useCinematicHero) {
    return (
      <section
        className="relative w-full pt-32 pb-24 flex items-center justify-start min-h-[70vh] md:min-h-[80vh] bg-cover bg-center"
        style={{
          backgroundImage: `url("${backgroundImage}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark gradient overlay — strongest at bottom and slight left */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-slate-900/50 to-slate-950/85 pointer-events-none" />

        {/* Content — lower-left alignment with substantial whitespace */}
        <div className="relative z-10 px-6 md:px-12 max-w-2xl">
          {/* Eyebrow */}
          <div className="mb-6 inline-block">
            <span className="text-xs font-bold uppercase tracking-widest text-white/90">
              {eyebrow}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight drop-shadow-lg">
            {headline}
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/95 mb-6 leading-relaxed max-w-xl drop-shadow">
            {subheadline}
          </p>

          {/* Description */}
          {description && (
            <p className="text-base md:text-lg text-white/85 mb-10 leading-relaxed max-w-2xl drop-shadow">
              {description}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {primaryCTA && (
              <button
                onClick={() => navigate(primaryCTA.path)}
                className="cs-btn-primary inline-flex items-center justify-center gap-2 bg-white text-slate-900 hover:bg-blue-50"
              >
                {primaryCTA.label}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {secondaryCTA && (
              <button
                onClick={() => navigate(secondaryCTA.path)}
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-white rounded-lg text-white font-semibold hover:bg-white/10 transition"
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