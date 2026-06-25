import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Loader2, AlertCircle, Shield, Zap } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import MobileCallBar from '@/components/landing/MobileCallBar';
import TrustStrip from '@/components/landing/TrustStrip';

const PACKAGES = {
  starter_system: {
    name: 'Starter System',
    setup: 797,
    monthly: 497,
    description: 'Instant lead response + missed-call recovery foundation.',
    features: ['Instant Lead Response', 'Missed-Call Text-Back'],
  },
  growth_system: {
    name: 'Growth System',
    setup: 1297,
    monthly: 997,
    description: 'Complete lead-to-booking system with AI nurture and booking agent.',
    features: ['Instant Lead Response', 'Missed-Call Text-Back', '14-Day Nurture Sequence', 'AI Booking Agent'],
  },
  pro_system: {
    name: 'Pro System',
    setup: 2497,
    monthly: 1997,
    description: 'Full revenue recovery engine with reviews, reactivation, and the entire stack.',
    features: ['Instant Lead Response', 'Missed-Call Text-Back', '14-Day Nurture Sequence', 'AI Booking Agent', 'Lead Reactivation', 'Review Request Automation'],
  },
};

const ALIASES = { starter: 'starter_system', growth: 'growth_system', pro: 'pro_system', elite: 'pro_system', elite_system: 'pro_system' };

function resolvePackageKey(raw) {
  if (!raw) return 'starter_system';
  const key = String(raw).toLowerCase();
  return PACKAGES[key] ? key : (ALIASES[key] || 'starter_system');
}

const SUPPORT_EMAIL = 'support@clientsurgesystems.com';
const SUPPORT_PHONE = '(602) 584-3227';

function formatPhone(value) {
  const d = String(value || '').replace(/\D/g, '');
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

export default function ProductSignup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const packageKey = resolvePackageKey(searchParams.get('package'));
  const pkg = PACKAGES[packageKey];

  const [form, setForm] = useState({ name: '', email: '', business: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleCheckout = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.business.trim()) {
      setError('Please fill in your name, email, and business name.');
      return;
    }
    if (window.self !== window.top) {
      setError('Checkout only works on the published app, not in the editor preview.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { base44 } = await import('@/api/base44Client');
      const res = await base44.functions.invoke('createCheckoutSession', {
        package_key: packageKey,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        business_name: form.business,
        success_url: `${window.location.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/product-signup?package=${packageKey}`,
      });
      if (res?.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError(res?.data?.error || `We couldn't start checkout. Please try again or contact ${SUPPORT_EMAIL}.`);
      }
    } catch (err) {
      setError(`We couldn't start checkout right now. Please try again, or contact ${SUPPORT_EMAIL} / ${SUPPORT_PHONE}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <TrustStrip />

      <main className="px-4 pb-24 pt-[calc(var(--cs-nav-height)+32px)] md:px-6">
        <div className="max-w-4xl mx-auto">
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
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Included Features</p>
              <ul className="space-y-2">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/85">{feature}</span>
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
                  <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Jane Smith" autoComplete="name" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="owner@yourbusiness.com" autoComplete="email" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Business Name *</label>
                  <input type="text" value={form.business} onChange={(e) => update('business', e.target.value)} placeholder="ABC Roofing Co." autoComplete="organization" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Phone (optional)</label>
                  <input type="tel" value={form.phone} onChange={(e) => update('phone', formatPhone(e.target.value))} placeholder="(602) 555-0100" autoComplete="tel" className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              <button onClick={handleCheckout} disabled={loading} className="cs-btn-primary w-full flex items-center justify-center gap-2 mt-6 disabled:opacity-60" style={{ minHeight: 'unset', minWidth: 'unset' }}>
                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>) : (<>Continue to Checkout <ArrowRight className="w-4 h-4" /></>)}
              </button>

              {error && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                  {(error.includes(SUPPORT_EMAIL) || error.includes('contact')) && (
                    <div className="mt-2 flex flex-col gap-1 pl-6 text-xs font-semibold">
                      <a href={`mailto:${SUPPORT_EMAIL}`} className="text-red-700 hover:underline">{SUPPORT_EMAIL}</a>
                      <a href={`tel:+1${SUPPORT_PHONE.replace(/\D/g, '')}`} className="text-red-700 hover:underline">{SUPPORT_PHONE}</a>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5" />
                <span>Secure checkout powered by Stripe</span>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <button onClick={() => navigate('/pricing')} className="text-sm text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer" style={{ minHeight: 'unset', minWidth: 'unset' }}>← Back to Pricing</button>
          </div>
        </div>
      </main>

      <Footer />
      <MobileCallBar />
    </div>
  );
}