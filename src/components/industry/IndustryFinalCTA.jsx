import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Premium final CTA section.
 * Renders industry-specific CTA with gradient background.
 *
 * Props:
 *   - finalCTA: { headline: string, body: string, buttonLabel: string }
 */
export default function IndustryFinalCTA({ finalCTA }) {
  const navigate = useNavigate();

  if (!finalCTA) return null;

  const { headline, body, buttonLabel } = finalCTA;

  return (
    <section className="py-16 md:py-24 px-4 md:px-6">
      <div className="max-w-4xl mx-auto text-center rounded-3xl border border-primary/15 bg-gradient-to-br from-[#003b8f] to-[#00aeef] p-8 md:p-12 text-white shadow-[0_24px_80px_rgba(0,107,176,0.24)]">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-white/75">Get Started</p>
        <h2 className="font-titles text-3xl md:text-4xl font-bold tracking-tight">{headline}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm md:text-base leading-relaxed text-white/82">{body}</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/pricing')}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-primary shadow-lg transition-transform hover:-translate-y-0.5"
            style={{ minHeight: '44px' }}
          >
            {buttonLabel}
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/automations')}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/30 bg-white/10 text-sm font-bold text-white backdrop-blur hover:bg-white/16 transition-colors"
            style={{ minHeight: '44px' }}
          >
            View Automation Stack
          </button>
        </div>
      </div>
    </section>
  );
}