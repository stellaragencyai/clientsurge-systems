import { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { setPageMetadata } from '@/lib/seo';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import MobileCallBar from '@/components/landing/MobileCallBar';

const PAIN_POINTS = [
  'Slow response to lead inquiries — competitors answer first',
  'Manual follow-up slips through cracks — leads go cold',
  'Missed calls never get recovered — lost showings and commissions',
  'No automated showing scheduling — admin burden slows growth',
  'Old leads never get reactivated — past prospects never contacted again'
];

const BENEFITS = [
  'Instant lead response — answer prospects in 60 seconds 24/7',
  'Automated follow-up sequences — SMS & email until they reply or book',
  'Missed call recovery — text leads back before competitors do',
  'Automated showing scheduler — lead books directly into your calendar',
  'Lead reactivation — wake up old prospects from days or months ago'
];

export default function RealEstate() {
  useEffect(() => {
    const cleanup = setPageMetadata({
      title: 'Real Estate Automation Systems | ClientSurge Systems',
      description: 'AI automation for real estate agents and brokers: faster lead response, automated follow-up, and more scheduled showings.',
      canonicalPath: '/real-estate',
      ogTitle: 'Real Estate Automation Systems',
      ogDescription: 'Automate lead response, follow-up, and showing scheduling for real estate agents and teams.'
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
            <p className="text-sm font-bold uppercase tracking-wider text-primary mb-3">Real Estate Automation</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-titles">
              More Leads. Faster Response. More Showings Booked.
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Real estate agents lose deals because they miss calls and don't follow up fast. ClientSurge automates lead capture, response, follow-up, and showing scheduling 24/7 so you never miss another opportunity.
            </p>
            <Link to="/product-signup?package=growth_system" className="cs-btn-primary inline-flex items-center gap-2">
              See Plans & Pricing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Pain Points */}
        <section className="px-4 md:px-6 py-16 md:py-24 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-12 font-titles">The Real Estate Lead Problem</h2>
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
          <h2 className="text-3xl font-bold text-foreground mb-6 font-titles">Ready to automate your real estate lead flow?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Choose Growth System or higher to get full automation: instant lead response, multi-step follow-up, booking scheduling, and reactivation campaigns.
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