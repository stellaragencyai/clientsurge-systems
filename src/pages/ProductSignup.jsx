import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Loader2, AlertCircle, Shield, Zap } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import MobileCallBar from '@/components/landing/MobileCallBar';
import TrustStrip from '@/components/landing/TrustStrip';
import { setPageMetadata } from '@/lib/seo';
import { trackCTA } from '@/lib/analytics';
import { base44 } from '@/api/base44Client';

const PACKAGES = {
  starter_system: {
    name: 'Starter System',
    setup: 797,
    monthly: 497,
    description: 'Instant lead response + missed-call recovery foundation.',
    services: ['Instant Lead Response', 'Missed-Call Text-Back'],
  },
  growth_system: {
    name: 'Growth System',
    setup: 1297,
    monthly: 997,
    description: 'Complete lead-to-booking system with AI nurture and booking agent.',
    services: ['Instant Lead Response', 'Missed-Call Text-Back', '14-Day Nurture Sequence', 'AI Booking Agent'],
  },
  pro_system: {
    name: 'Pro System',
    setup: 2497,
    monthly: 1997,
    description: 'Full revenue recovery engine with reviews, reactivation, and the entire stack.',
    services: ['Instant Lead Response', 'Missed-Call Text-Back', '14-Day Nurture Sequence', 'AI Booking Agent', 'Lead Reactivation', 'Review Request Automation'],
  },
};

const PACKAGE_ALIASES = {
  starter: 'starter_system',
  growth: 'growth_system',
  pro: 'pro_system',
  elite: 'pro_system',
  elite_system: 'pro_system',
};

function formatPhone(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export default function ProductSignup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawPackage = searchParams.get('package') || '';
  const resolvedKey = PACKAGE_ALIASES[rawPackage] || (PACKAGES[rawPackage] ? rawPackage : '');
  const hasValidPackage = Boolean(resolvedKey) && PACKAGES[resolvedKey];
  const packageKey = hasValidPackage ? resolvedKey : '';
  const pkg = hasValidPackage ? PACKAGES[resolvedKey] : null;

  const [form, setForm] = useState({ name: '', email: '', business: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPageMetadata({
      title: 'Sign Up — AI Automation Package | ClientSurge Systems',
      description: 'Complete your ClientSurge automation package signup and proceed to secure Stripe checkout.',
      canonicalPath: '/product-signup',
      ogTitle: 'Sign Up for ClientSurge Automation',
      ogDescription: 'Choose your package and complete secure checkout for your AI automation system.',
    });
  }, []);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleCheckout = async () => {
    if (!hasValidPackage || !pkg) {
      setError('No package selected. Please choose a package below to get started.');
      return;
    }
    if (!form.name.trim() || !form.email.trim() || !form.business.trim()) {
      setError('Please fill in your name, email, and business name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Iframe sandbox check
      if (window.self !== window.top) {
        setError('Checkout only works on the published app, not in the editor preview.');
        setLoading(false);
        return;
      }

      trackCTA(`product_signup_checkout_${packageKey}`, 'product-signup');

      const response = await base44.functions.invoke('createCheckoutSession', {
        package_key: packageKey,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        business_name: form.business,
        success_url: `${window.location.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/product-signup?package=${packageKey}`,
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        setError(response.data?.error || 'Failed to start checkout. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  // When no valid package is resolved from the URL, show all three default packages
  // so the user can pick one instead of seeing a blank or failed page.
  if (!hasValidPackage || !pkg) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <TrustStrip />
        <main className="px-4 pb-24 pt-[calc(var(--cs-nav-height)+32px)] md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-10 text-center">
              <p className="cs-section-eyebrow mb-3">Product Signup</p>
              <h1 className="font-titles text-3xl md:text-4xl font-extrabold text-foreground mb-3">
                Choose Your Package
              </h1>
              <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
                Select a package to continue. All systems include remote setup, testing, and launch support.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(PACKAGES).map(([key, data]) => (
                <div
                  key={key}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-primary" />
                    <h2 className="font-titles text-lg font-bold text-foreground">{data.name}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{data.description}</p>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-foreground">${data.monthly.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground font-semibold">/mo</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">${data.setup.toLocaleString()} one-time setup</p>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {data.services.map((service) => (
                      <li key={service} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground/85">{service}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => navigate(`/product-signup?package=${key}`)}
                    className="cs-btn-primary w-full flex items-center justify-center gap-2"
                    style={{ minHeight: 'unset', minWidth: 'unset' }}
                  >
                    Choose {data.name.replace(' System', '')} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => navigate('/pricing')}
                className="text-sm text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer"
                style={{ minHeight: 'unset', minWidth: 'unset' }}
              >
                ← Back to Pricing
              </button>
            </div>
          </div>
        </main>
        <Footer />
        <MobileCallBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <TrustStrip />

      <main className="px-4 pb-24 pt-[calc(var(--cs-nav-height)+32px)] md:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <p className="cs-section-eyebrow mb-3">Product Signup</p>
            <h1 className="font-titles text-3xl md:text-4xl font-extrabold text-foreground mb-3">
              Complete Your {pkg.name} Signup
            </h1>
            <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
              {pkg.description} Enter your details below and continue to secure Stripe checkout.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Package Summary */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="font-titles text-lg font-bold text-foreground">Package Summary</h2>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/15 p-4 mb-5">
                <p className="text-sm font-bold text-foreground mb-3">{pkg.name}</p>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-2xl font-extrabold text-foreground">${pkg.monthly.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground font-semibold">/mo</span>
                </div>
                <p className="text-xs text-muted-foreground">${pkg.setup.toLocaleString()} one-time setup fee</p>
              </div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Included Services</p>
              <ul className="space-y-2">
                {pkg.services.map((service) => (
                  <li key={service} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/85">{service}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 pt-5 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">One-time setup</span>
                  <span className="font-semibold text-foreground">${pkg.setup.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly service</span>
                  <span className="font-semibold text-primary">${pkg.monthly.toLocaleString()}/mo</span>
                </div>
              </div>
            </div>

            {/* Customer Info Form */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-titles text-lg font-bold text-foreground mb-4">Your Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="Jane Smith"
                    autoComplete="name"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="owner@yourbusiness.com"
                    autoComplete="email"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Business Name *</label>
                  <input
                    type="text"
                    value={form.business}
                    onChange={(e) => update('business', e.target.value)}
                    placeholder="ABC Roofing Co."
                    autoComplete="organization"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Phone (optional)</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', formatPhone(e.target.value))}
                    placeholder="(602) 555-0100"
                    autoComplete="tel"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="cs-btn-primary w-full flex items-center justify-center gap-2 mt-6 disabled:opacity-60"
                style={{ minHeight: 'unset', minWidth: 'unset' }}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <>Continue to Payment <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              {error && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5" />
                <span>Secure checkout powered by Stripe</span>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/pricing')}
              className="text-sm text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer"
              style={{ minHeight: 'unset', minWidth: 'unset' }}
            >
              ← Back to Pricing
            </button>
          </div>
        </div>
      </main>

      <Footer />
      <MobileCallBar />
    </div>
  );
}