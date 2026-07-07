import { TrendingDown, AlertCircle } from 'lucide-react';
import CSSectionHeader from '@/components/design-system/CSSectionHeader';

/**
 * Revenue leak / missed lead section.
 * Creates industry-specific urgency without fabricated statistics.
 *
 * Props:
 *   - revenueLeak: { headline: string, body: string, points: string[] }
 */
export default function RevenueLeakSection({ revenueLeak }) {
  if (!revenueLeak) return null;

  return (
    <section className="py-14 md:py-20 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        <CSSectionHeader
          eyebrow="The Revenue Leak"
          title={revenueLeak.headline}
          align="center"
        />
        <div className="mt-8 rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/60 to-white p-6 md:p-10 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-red-100 border border-red-200">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <p className="text-sm md:text-base md:text-lg text-foreground/85 leading-relaxed">
              {revenueLeak.body}
            </p>
          </div>
          {revenueLeak.points && revenueLeak.points.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
              {revenueLeak.points.map((point, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-xl border border-red-100/80 bg-white/80 p-4">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/75 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}