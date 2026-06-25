import { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { setPageMetadata } from '@/lib/seo';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import MobileCallBar from '@/components/landing/MobileCallBar';

const PAIN_POINTS = [
  'Missed calls = missed cases — competitor law firms answer before you do',
  'No instant response — prospects get impatient and call other firms',
  'Manual follow-up overwhelms the team — cases fall through cracks',
  'No appointment confirmation — no-shows waste staff time',
  'Old cases never get revisited — past prospects never contacted again'
];

const BENEFITS = [
  'Instant lead capture — answer prospects in 60 seconds 24/7 with AI',
  'Automated case routing — SMS qualifies injury type and routes to right attorney',
  'Multi-step follow-up — SMS & email sequences nurture prospects automatically',
  'Consultation scheduling — AI books appointments directly into your calendar',
  'Case reactivation — reach out to old prospects from weeks or months ago'
];

export default function PersonalInjury() {
  useEffect(() => {
    const cleanup = setPageMetadata({
      title: 'Personal Injury Law Firm Automation Systems | ClientSurge Systems',
      description: 'AI automation for personal injury law firms: immediate lead response, case type routing, consultation scheduling, missed-call recovery, and old lead reactivation.',
      canonicalPath: '/personal-injury',
      ogTitle: 'Personal Injury Law Firm Automation',
      ogDescription: 'Automate lead response, case routing, and scheduling for personal injury law practices.'
    });
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-[calc(var(--cs-nav-height)+28px)]">
        {/* Hero */}
        <section className="px-4 md:px-6 py-16 md:py-24 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-primary mb-3">Personal Injury Automation</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-titles">
              More Cases. Faster Response. Higher Conversion.
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Personal injury law firms lose cases because injured prospects call competitors who answer faster and follow up better. ClientSurge automates instant response, case qualification, and multi-step follow-up 24/7 so you never lose another case to a faster competitor.
            </p>
            <Link to="/product-signup?package=growth_system" className="cs-btn-primary inline-flex items-center gap-2">
              See Plans & Pricing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Pain Points */}
        <section className="px-4 md:px-6 py-16 md:py-24 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-12 font-titles">The Personal Injury Lead Problem</h2>
          <div className="space-y-4">
            {PAIN_POINTS.map((point, idx) => (
              <div key={idx} className="flex gap-3 p-4 rounded-lg border border-border bg-card">
                <span className="text-primary font-bold flex-shrink-0">•</span>
                <p className="text-foreground">{point}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="px-4 md:px-6 py-16 md:py-24 bg-muted/40 max-w-4xl mx-auto w-full">
          <h2 className="text-3xl font-bold text-foreground mb-12 font-titles">How ClientSurge Fixes It</h2>
          <div className="space-y-4">
            {BENEFITS.map((benefit, idx) => (
              <div key={idx} className="flex gap-3 p-4 rounded-lg bg-card border border-border">
                <span className="text-primary font-bold flex-shrink-0">✓</span>
                <p className="text-foreground">{benefit}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 md:px-6 py-16 md:py-24 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6 font-titles">Ready to automate your personal injury intake?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Choose Growth System or higher to get full automation: instant lead response, case qualification, multi-step follow-up, consultation scheduling, and automated no-show reduction.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/product-signup?package=growth_system" className="cs-btn-primary inline-flex items-center justify-center gap-2">
              Compare Packages <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/book" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-border bg-background hover:bg-muted transition-colors">
              Get a Free Audit
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <MobileCallBar />
    </div>
  );
}