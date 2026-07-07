import { CheckCircle, Zap, Phone, Calendar, Send, Star, MessageSquare, RotateCw, AlertCircle, FileCheck, Thermometer } from 'lucide-react';
import CSSectionHeader from '@/components/design-system/CSSectionHeader';

const ICON_MAP = {
  CheckCircle, Zap, Phone, Calendar, Send, Star, MessageSquare, RotateCw, AlertCircle, FileCheck, Thermometer,
};

/**
 * Premium automation solution section.
 * Renders industry-specific automation solutions with icons and descriptions.
 *
 * Props:
 *   - solutions: Array<{ title: string, desc: string }> (3-4 items)
 *   - industryName: string (used in section title)
 */
export default function IndustrySolutionSection({ solutions, industryName }) {
  if (!solutions || !solutions.length) return null;

  return (
    <section className="py-14 md:py-20 px-4 md:px-6 bg-white/70">
      <div className="max-w-6xl mx-auto">
        <CSSectionHeader
          eyebrow="Operating Layer"
          title={`How ClientSurge Automates ${industryName} Lead Response`}
          align="center"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-8">
          {solutions.map((solution, i) => {
            return (
              <div key={i} className="cs-glow-card p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-11 h-11 md:w-13 md:h-13 rounded-2xl bg-gradient-to-br from-primary/12 to-sky-100 text-primary border border-primary/20 shadow-sm">
                      <Zap className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-titles text-lg md:text-xl font-bold text-foreground mb-2 tracking-tight">
                      {solution.title}
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      {solution.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}