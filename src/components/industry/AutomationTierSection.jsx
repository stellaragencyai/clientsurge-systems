import { CheckCircle, Zap, Phone, Calendar, Send, Star, MessageSquare } from 'lucide-react';
import SectionHeader from '@/components/design-system/SectionHeader';

const ICON_MAP = { Zap, Phone, Calendar, Send, Star, MessageSquare };

export default function AutomationTierSection({ industry }) {
  if (!industry?.automation_tiers) return null;

  const tiers = industry.automation_tiers;
  const tierEntries = [
    { key: 'starter', data: tiers.starter, badge: null, highlight: false },
    { key: 'growth', data: tiers.growth, badge: 'Most Popular', highlight: true },
    { key: 'pro', data: tiers.pro, badge: 'Best Value', highlight: false },
  ];

  return (
    <section className="py-14 md:py-20 px-4 md:px-6 bg-gradient-to-b from-white to-blue-50/40">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          eyebrow="Automation Packages"
          title={`Choose Your ${industry.industry_name} System`}
          subtitle="Every system includes a high-converting website with AI automations built in. Pick 2, 4, or 6 automations depending on your plan."
          align="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {tierEntries.map(({ key, data, badge, highlight }) => (
            <div
              key={key}
              className={`relative rounded-2xl border p-6 md:p-8 transition-all duration-300 ${
                highlight
                  ? 'border-primary/30 bg-white shadow-[0_20px_60px_rgba(0,107,176,0.16)] md:-translate-y-2'
                  : 'border-primary/10 bg-white/90 shadow-[0_10px_40px_rgba(15,23,42,0.06)]'
              }`}
            >
              {badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wide text-white shadow-lg"
                    style={{ background: 'linear-gradient(90deg, #0079c1, #005691)' }}
                  >
                    {badge}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{data.label}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl md:text-4xl font-titles font-black text-foreground">{data.price}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{data.setup}</p>
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
                  {data.count} Automations Included
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {data.automations.map((automation) => {
                  const Icon = ICON_MAP[automation.icon] || CheckCircle;
                  return (
                    <div key={automation.key} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/8 border border-primary/15">
                          <Icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground leading-tight">{automation.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{automation.description}</p>
                      </div>
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                    </div>
                  );
                })}
              </div>

              <a
                href={`/product-signup?package=${key}_system`}
                className={`block w-full text-center rounded-full px-6 py-3 text-sm font-black transition-all duration-300 ${
                  highlight
                    ? 'text-white shadow-lg hover:-translate-y-0.5'
                    : 'border-2 border-primary/20 text-primary hover:bg-primary/5'
                }`}
                style={highlight ? { background: 'linear-gradient(90deg, #0079c1, #005691)' } : {}}
              >
                Get {data.label}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Every package includes a high-converting website with your automations built in.
          Cancel anytime. 30-day money-back guarantee.
        </p>
      </div>
    </section>
  );
}