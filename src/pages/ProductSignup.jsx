import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { setPageMetadata } from '@/lib/seo';
import { ChevronRight, Check, ShieldCheck, Zap } from 'lucide-react';

const ACTIVITY_MESSAGES = [
  '🔥 Mike T. from Phoenix just signed up for the Growth System',
  '⚡ Sarah K. from Dallas activated Missed Call Text-Back',
  '📈 A roofing company in Austin captured 3 leads in the last hour',
  '🚀 James R. from Denver just went live with AI Booking',
  '💬 A med spa in Scottsdale recovered $4,200 in missed leads this week',
];

function LiveActivityTicker() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % ACTIVITY_MESSAGES.length);
        setVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border mx-auto max-w-md"
      style={{ borderColor: 'rgba(0,174,239,0.22)', background: 'rgba(0,174,239,0.05)' }}>
      <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: '#00AEEF' }} />
      <p
        className="text-xs font-medium text-center transition-all duration-400"
        style={{ color: '#005f99', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(4px)', transition: 'opacity 0.4s ease, transform 0.4s ease' }}
      >
        {ACTIVITY_MESSAGES[index]}
      </p>
    </div>
  );
}

const PLANS = {
  starter_system: {
    name: 'Starter System',
    setup: 797,
    monthly: 497,
    badge: null,
    features: ['Instant Lead Response SMS', 'Missed Call Text-Back', 'Basic Email Follow-Up'],
  },
  growth_system: {
    name: 'Growth System',
    setup: 1297,
    monthly: 997,
    badge: 'Most Popular',
    features: ['Everything in Starter', '14-Day Nurture Sequence', 'AI Booking Agent', 'Lead Reactivation'],
  },
  pro_system: {
    name: 'Pro System',
    setup: 2497,
    monthly: 1997,
    badge: 'Best Value',
    features: ['Everything in Growth', 'Review Automation', 'Priority Support', 'Advanced AI Routing'],
  },
};

const STEP_LABELS = ['Your Info', 'Choose Plan', 'Checkout'];

const GLOW_BTN = {
  background: 'linear-gradient(135deg, #0088CC 0%, #006BB0 40%, #003B8F 100%)',
  boxShadow: '0 0 0 1px rgba(0,174,239,0.5), 0 0 18px rgba(0,174,239,0.4), 0 2px 8px rgba(0,107,176,0.3)',
  border: 'none',
  color: '#ffffff',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'box-shadow 0.25s ease, transform 0.25s ease',
};

export default function ProductSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(
    searchParams.get('plan') || 'starter_system'
  );
  const [formData, setFormData] = useState({
    full_name: '',
    business_name: '',
    email: '',
    phone: '',
    industry: 'Services',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPageMetadata({
      title: 'Start Your Free Trial | ClientSurge Systems',
      description: '14-day free trial of AI lead automation. No credit card required.',
      canonicalPath: '/signup',
    });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContinue = async () => {
    if (!formData.full_name || !formData.business_name || !formData.email || !formData.phone) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await base44.entities.WebsiteLead.create({
        full_name: formData.full_name,
        business_name: formData.business_name,
        email: formData.email,
        phone_number: formData.phone,
        business_type: formData.industry,
        source: 'product_signup_flow',
        lead_status: 'new',
        consent_given: true,
        consent_given_at: new Date().toISOString(),
      });

      if (step === 1) {
        setStep(2);
      } else {
        handleCheckout();
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await base44.functions.invoke('createCheckoutSession', {
        email: formData.email,
        business_name: formData.business_name,
        selected_package_type: selectedPlan,
      });

      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to initiate checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, rgba(0,136,204,0.06) 0%, #ffffff 50%, rgba(0,59,143,0.04) 100%)' }}>
      {/* Top nav bar */}
      <div className="border-b border-border/50 bg-white/80 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png"
            alt="ClientSurge Systems"
            className="h-28 w-auto object-contain"
          />
        </Link>
        <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
          Already a client? Log in →
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3 text-foreground">Start Your Free Trial</h1>
          <p className="text-muted-foreground text-lg">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>

        {/* Progress Indicator — with labels */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEP_LABELS.map((label, i) => {
            const num = i + 1;
            const active = step >= num;
            return (
              <div key={num} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300"
                    style={active
                      ? { background: 'linear-gradient(135deg, #0088CC, #003B8F)', color: '#fff', boxShadow: '0 0 14px rgba(0,174,239,0.45)' }
                      : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
                    }
                  >
                    {step > num ? <Check className="w-4 h-4" /> : num}
                  </div>
                  <span className="text-xs font-semibold whitespace-nowrap" style={{ color: active ? '#005f99' : 'hsl(var(--muted-foreground))' }}>
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className="h-0.5 w-12 mx-2 mb-5 transition-all duration-300" style={{ background: step > num ? 'linear-gradient(90deg,#0088CC,#003B8F)' : 'hsl(var(--muted))' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="bg-white border border-border rounded-xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-foreground mb-1">Tell us about your business</h2>
              {/* Industry pill selector */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Your Industry *</label>
                <div className="flex flex-wrap gap-2">
                  {['Med Spa', 'Dental', 'HVAC', 'Roofing', 'Plumbing', 'Chiropractic', 'Contractor', 'Other'].map(ind => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, industry: ind }))}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200"
                      style={formData.industry === ind
                        ? { borderColor: '#00AEEF', background: 'rgba(0,174,239,0.12)', color: '#005f99', boxShadow: '0 0 0 1px rgba(0,174,239,0.25)' }
                        : { borderColor: 'hsl(var(--border))', background: 'transparent', color: 'hsl(var(--muted-foreground))' }
                      }
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              {[
                { label: 'Your Name', name: 'full_name', type: 'text', placeholder: 'John Doe' },
                { label: 'Business Name', name: 'business_name', type: 'text', placeholder: 'Your Business LLC' },
                { label: 'Email', name: 'email', type: 'email', placeholder: 'you@business.com' },
                { label: 'Phone Number', name: 'phone', type: 'tel', placeholder: '(555) 123-4567' },
              ].map(({ label, name, type, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-semibold mb-1.5 text-foreground">{label} *</label>
                  <input
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none transition-all"
                    style={{ fontSize: '16px' }}
                    onFocus={e => { e.target.style.borderColor = '#00AEEF'; e.target.style.boxShadow = '0 0 0 3px rgba(0,174,239,0.15)'; }}
                    onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                  />
                </div>
              ))}

              {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

              <button
                onClick={handleContinue}
                disabled={loading}
                className="w-full py-3.5 rounded-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                style={GLOW_BTN}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 0 1.5px rgba(0,174,239,0.85), 0 0 32px rgba(0,159,212,0.7)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = GLOW_BTN.boxShadow; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {loading ? 'Saving...' : (<>Continue to Plan Selection <ChevronRight className="w-4 h-4" /></>)}
              </button>

              {/* Guarantee inline */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <ShieldCheck className="w-4 h-4 text-[#00AEEF]" />
                <span className="text-xs text-muted-foreground">30-day money-back guarantee • Secure & private</span>
              </div>
            </div>
          )}

          {/* Step 2: Plan Selection */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-foreground mb-1">Choose Your Plan</h2>
              <div className="space-y-3">
                {Object.entries(PLANS).map(([key, plan]) => {
                  const selected = selectedPlan === key;
                  return (
                    <label
                      key={key}
                      className="block p-4 rounded-xl border-2 cursor-pointer transition-all duration-200"
                      style={{
                        borderColor: selected ? '#00AEEF' : 'hsl(var(--border))',
                        background: selected ? 'rgba(0,174,239,0.05)' : '#fff',
                        boxShadow: selected ? '0 0 0 1px rgba(0,174,239,0.2), 0 4px 16px rgba(0,174,239,0.12)' : 'none',
                      }}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={key}
                        checked={selected}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-foreground">{plan.name}</span>
                            {plan.badge && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ background: 'rgba(0,174,239,0.12)', color: '#005f99' }}>
                                {plan.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            ${plan.setup.toLocaleString()} setup + ${plan.monthly.toLocaleString()}/mo
                          </div>
                          <ul className="space-y-1">
                            {plan.features.map(f => (
                              <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Check className="w-3 h-3 flex-shrink-0 text-[#00AEEF]" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div
                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                          style={{ borderColor: selected ? '#00AEEF' : 'hsl(var(--border))', background: selected ? '#00AEEF' : 'transparent' }}
                        >
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border-2 border-border text-foreground rounded-lg font-semibold hover:bg-muted transition-colors text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex-1 py-3 rounded-lg font-semibold disabled:opacity-50 text-sm"
                  style={GLOW_BTN}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 0 1.5px rgba(0,174,239,0.85), 0 0 32px rgba(0,159,212,0.7)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = GLOW_BTN.boxShadow; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {loading ? 'Processing...' : 'Proceed to Checkout'}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <ShieldCheck className="w-4 h-4 text-[#00AEEF]" />
                <span className="text-xs text-muted-foreground">30-day money-back guarantee • Secure Stripe checkout</span>
              </div>
            </div>
          )}
        </div>

        {/* Social proof strip */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          {[
            { emoji: '🔒', text: 'Secure & Private' },
            { emoji: '🚀', text: 'Live in 48 Hours' },
            { emoji: '💪', text: '14-Day Free Trial' },
            { emoji: '⭐', text: '4.9/5 Client Rating' },
          ].map(({ emoji, text }) => (
            <span key={text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border" style={{ borderColor: 'rgba(0,174,239,0.2)', background: 'rgba(0,174,239,0.04)' }}>
              <span>{emoji}</span>
              <span className="font-semibold">{text}</span>
            </span>
          ))}
        </div>

        {/* Live activity ticker */}
        <LiveActivityTicker />
      </div>
    </div>
  );
}