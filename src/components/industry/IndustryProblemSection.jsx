import { AlertTriangle } from 'lucide-react';
import CSSectionHeader from '@/components/design-system/CSSectionHeader';

/**
 * Premium industry problem section.
 * Renders 3 industry-specific pain points with numbered cards.
 *
 * Props:
 *   - painPoints: Array<{ title: string, desc: string }> (3 items)
 */
export default function IndustryProblemSection({ painPoints }) {
  if (!painPoints || !painPoints.length) return null;

  return (
    <section className="relative overflow-hidden py-14 md:py-20 px-4 md:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="max-w-6xl mx-auto">
        <CSSectionHeader
          eyebrow="The Lead Leak"
          title="Where Opportunities Slip Away"
          align="center"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-8">
          {painPoints.map((point, i) => (
            <div
              key={i}
              className="cs-glow-card p-6 md:p-7"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500 font-black">
                  {i + 1}
                </div>
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="font-titles text-lg md:text-xl font-bold text-foreground mb-2 tracking-tight">
                {point.title}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {point.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}