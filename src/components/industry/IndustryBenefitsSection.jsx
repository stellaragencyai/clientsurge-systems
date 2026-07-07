import { CheckCircle } from 'lucide-react';
import SectionHeader from '@/components/design-system/SectionHeader';

const PREMIUM_SURFACE = 'rounded-2xl border border-primary/10 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)]';

/**
 * Premium benefits section.
 * Renders industry-specific benefits with checkmark icons.
 *
 * Props:
 *   - benefits: Array<{ title: string, desc: string }> (3 items)
 */
export default function IndustryBenefitsSection({ benefits }) {
  if (!benefits || !benefits.length) return null;

  return (
    <section className="py-14 md:py-20 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          eyebrow="What Changes"
          title="What Changes When Leads Get Automated"
          align="center"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-8">
          {benefits.map((benefit, i) => (
            <div
              key={i}
              className={`${PREMIUM_SURFACE} p-6 md:p-7 transition-transform duration-200 hover:-translate-y-1`}
            >
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-primary/15 bg-primary/8 text-primary">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="font-titles text-lg md:text-xl font-bold text-foreground mb-2 tracking-tight">
                {benefit.title}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {benefit.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}