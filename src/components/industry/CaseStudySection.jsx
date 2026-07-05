import { TrendingUp, CheckCircle2 } from 'lucide-react';
import SectionHeader from '@/components/design-system/SectionHeader';

export default function CaseStudySection({ industry }) {
  if (!industry?.case_study) return null;

  const cs = industry.case_study;

  return (
    <section className="py-14 md:py-20 px-4 md:px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          eyebrow="Case Study"
          title={cs.title}
          align="center"
        />

        {/* Big metric */}
        <div className="mt-8 mb-10 text-center">
          <div className="inline-flex flex-col items-center rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent px-8 py-6">
            <span className="text-4xl md:text-5xl font-titles font-black text-primary tracking-tight">{cs.metric}</span>
            <span className="text-sm font-bold text-muted-foreground mt-1 uppercase tracking-wide">{cs.metricLabel}</span>
          </div>
        </div>

        {/* Challenge & Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6 md:p-7">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 border border-red-200">
                <span className="text-red-600 font-black text-sm">!</span>
              </div>
              <h3 className="font-titles text-lg font-bold text-foreground">The Challenge</h3>
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{cs.challenge}</p>
          </div>

          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-6 md:p-7">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-titles text-lg font-bold text-foreground">The Solution</h3>
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{cs.solution}</p>
          </div>
        </div>

        {/* Results */}
        <div className="mt-8 rounded-2xl border border-primary/15 bg-gradient-to-br from-[#003b8f] to-[#00aeef] p-6 md:p-8">
          <h3 className="text-center text-white font-titles text-xl md:text-2xl font-bold mb-6">Results</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cs.results.map((result, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 p-4">
                <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <p className="text-sm md:text-base text-white font-semibold leading-relaxed">{result}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}