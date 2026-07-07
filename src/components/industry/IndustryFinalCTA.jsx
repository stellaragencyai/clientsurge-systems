import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CSButton from '@/components/design-system/CSButton';

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
          <CSButton
            onClick={() => navigate('/pricing')}
            variant="primary"
            size="md"
            iconRight={ArrowRight}
            className="!bg-white !text-[#003b8f] !shadow-lg"
          >
            {buttonLabel}
          </CSButton>
          <CSButton
            onClick={() => navigate('/automations')}
            variant="outline"
            size="md"
            className="!border-white/30 !bg-white/10 !text-white backdrop-blur"
          >
            View Automation Stack
          </CSButton>
        </div>
      </div>
    </section>
  );
}