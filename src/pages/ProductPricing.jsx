import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { setPageMetadata } from '@/lib/seo';
import { Check } from 'lucide-react';

const PLANS = [
  {
    name: 'Starter System',
    setup_fee: 797,
    monthly_fee: 497,
    description: 'Perfect for getting started',
    features: [
      'Instant lead response via SMS',
      '14-day nurture sequence',
      'Missed call follow-up',
      'Basic analytics',
      'Email support',
      'Up to 500 leads/month',
    ],
    cta_text: 'Get Free Automation Audit',
    highlighted: false,
  },
  {
    name: 'Growth System',
    setup_fee: 1297,
    monthly_fee: 997,
    description: 'For growing businesses',
    features: [
      'Everything in Starter',
      'AI booking automation',
      'Advanced lead scoring',
      'Custom automations',
      'Priority support',
      'Unlimited leads',
      'Lead reactivation',
      'Voice call automation',
    ],
    cta_text: 'Get Free Automation Audit',
    highlighted: true,
  },
  {
    name: 'Pro System',
    setup_fee: 2497,
    monthly_fee: 1997,
    description: 'For maximum revenue',
    features: [
      'Everything in Growth',
      'AI receptionist',
      'Custom integrations',
      'Dedicated account manager',
      'Custom workflows',
      'API access',
      'White-label options',
      'Advanced reporting',
    ],
    cta_text: 'Get Free Automation Audit',
    highlighted: false,
  },
];

export default function ProductPricing() {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  useEffect(() => {
    setPageMetadata({
      title: 'ClientSurge Systems Pricing | Simple, Transparent Plans',
      description: 'Compare ClientSurge automation packages, then book a free automation audit to confirm the right fit before checkout.',
      canonicalPath: '/pricing',
    });
  }, []);

  const handleSelectPlan = (planName) => {
    navigate(`/book?plan=${planName.toLowerCase().replace(/\s+/g, '_')}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-muted-foreground text-lg">
              Compare plans, then book a free automation audit to confirm the right fit.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl">
            {PLANS.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-lg border transition-all ${
                  plan.highlighted
                    ? 'border-primary shadow-lg scale-105 bg-card'
                    : 'border-border bg-card hover:shadow-md'
                }`}
              >
                {plan.highlighted && (
                  <div className="px-6 py-2 bg-primary text-white text-center text-sm font-semibold rounded-t-lg">
                    Most Popular
                  </div>
                )}

                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-bold">${plan.setup_fee}</span>
                      <span className="text-muted-foreground">one-time setup</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${plan.monthly_fee}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(plan.name)}
                    className={`w-full py-3 rounded-lg font-semibold mb-8 transition-colors ${
                      plan.highlighted
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'border-2 border-primary text-primary hover:bg-primary/5'
                    }`}
                  >
                    {plan.cta_text}
                  </button>

                  <div className="space-y-4">
                    {plan.features.map((feature, fidx) => (
                      <div key={fidx} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto mt-16 pt-12 border-t border-border">
            <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Do I need a credit card for the free trial?</h4>
                <p className="text-muted-foreground">No. Start your 14-day free trial with just your business email.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Can I change plans later?</h4>
                <p className="text-muted-foreground">Yes. Upgrade or downgrade anytime. Changes take effect on your next billing date.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">What if I need to cancel?</h4>
                <p className="text-muted-foreground">Cancel anytime with one click. No contracts, no penalties.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Is setup included?</h4>
                <p className="text-muted-foreground">Yes. Our team guides you through setup, integrations, and customization included in your plan.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
