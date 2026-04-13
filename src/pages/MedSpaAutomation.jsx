import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Hero from '@/components/medspa-automation/Hero';
import ProblemSection from '@/components/medspa-automation/ProblemSection';
import SolutionSection from '@/components/medspa-automation/SolutionSection';
import DemoSection from '@/components/medspa-automation/DemoSection';
import BenefitsSection from '@/components/medspa-automation/BenefitsSection';
import PositioningSection from '@/components/medspa-automation/PositioningSection';
import TrustSection from '@/components/medspa-automation/TrustSection';
import LeadForm from '@/components/medspa-automation/LeadForm';
import CTASection from '@/components/medspa-automation/CTASection';
import FAQ from '@/components/medspa-automation/FAQ';

export default function MedSpaAutomation() {
  useEffect(() => {
    // Track page view
    base44.analytics.track({
      eventName: 'med_spa_page_view',
    });
  }, []);

  return (
    <main className="bg-background">
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <DemoSection />
      <BenefitsSection />
      <PositioningSection />
      <TrustSection />

      {/* Lead Capture Section */}
      <section id="demo-form" className="py-24 md:py-32 px-6 bg-background">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground text-center mb-4">
            Schedule Your Demo
          </h2>
          <p className="text-center text-muted-foreground text-lg mb-12">
            Tell us about your med spa. We'll show you exactly how to convert more leads.
          </p>
          <div className="bg-card rounded-xl border border-border p-8">
            <LeadForm />
          </div>
        </div>
      </section>

      <FAQ />
      <CTASection />

      {/* Footer section with SEO */}
      <section className="py-16 px-6 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="font-semibold text-foreground mb-4">Med Spa Lead Automation System</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Automated lead response, follow-up, and booking system designed for aesthetic practices, med spas, and high-ticket service businesses. Increase consultation bookings, reduce response time, and automate lead nurturing.
          </p>
        </div>
      </section>
    </main>
  );
}