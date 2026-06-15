import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { setPageMetadata } from '@/lib/seo';
import { ChevronRight, Check, ShieldCheck } from 'lucide-react';

/* ── Live activity ticker ── */
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
      setTimeout(() => { setIndex(i => (i + 1) % ACTIVITY_MESSAGES.length); setVisible(true); }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border mx-auto max-w-lg"
      style={{ borderColor: 'rgba(0,174,239,0.22)', background: 'rgba(0,174,239,0.05)' }}>
      <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: '#00AEEF' }} />
      <p className="text-xs font-medium text-center"
        style={{ color: '#005f99', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(4px)', transition: 'opacity 0.4s ease, transform 0.4s ease' }}>
        {ACTIVITY_MESSAGES[index]}
      </p>
    </div>
  );
}

/* ── Underline input with animated focus beam ── */
function UnderlineInput({ label, name, type, placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: focused ? '#00AEEF' : '#6b7280' }}>{label}</label>
      <div className="relative pb-0.5">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent py-2 text-foreground focus:outline-none placeholder:text-gray-300"
          style={{ fontSize: '16px', borderBottom: '1px solid #e5e7eb' }}
        />
        {/* animated beam */}
        <span className="absolute bottom-0 left-0 h-[2px] rounded-full transition-all duration-400"
          style={{
            width: focused ? '100%' : '0%',
            background: 'linear-gradient(90deg,#0088CC,#00AEEF)',
            boxShadow: focused ? '0 0 8px rgba(0,174,239,0.6)' : 'none',
            transition: 'width 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease',
          }} />
      </div>
    </div>
  );
}

/* ── Plans ── */
const PLANS = {
  starter_system: { name: 'Starter System', setup: 797, monthly: 497, badge: null, features: ['Instant Lead Response SMS', 'Missed Call Text-Back', 'Basic Email Follow-Up'] },
  growth_system:  { name: 'Growth System',  setup: 1297, monthly: 997,  badge: 'Most Popular', features: ['Everything in Starter', '14-Day Nurture Sequence', 'AI Booking Agent', 'Lead Reactivation'] },
  pro_system:     { name: 'Pro System',     setup: 2497, monthly: 1997, badge: 'Best Value',   features: ['Everything in Growth', 'Review Automation', 'Priority Support', 'Advanced AI Routing'] },
};

const STEP_LABELS = ['Your Info', 'Choose Plan', 'Checkout'];

const GLOW_BTN = {
  background: 'linear-gradient(135deg, #0088CC 0%, #006BB0 40%, #003B8F 100%)',
  boxShadow: '0 0 0 1px rgba(0,174,239,0.5), 0 0 18px rgba(0,174,239,0.4), 0 2px 8px rgba(0,107,176,0.3)',
  border: 'none', color: '#ffffff', fontWeight: '700', cursor: 'pointer',
  transition: 'box-shadow 0.25s ease, transform 0.25s ease',
};

/* ── Progress bar helper ── */
function useFormProgress(formData) {
  const fields = ['full_name', 'business_name', 'email', 'phone'];
  const filled = fields.filter(f => formData[f]?.trim()).length;
  return Math.round((filled / fields.length) * 100);
}

export default function ProductSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(searchParams.get('plan') || 'starter_system');
  const [formData, setFormData] = useState({ full_name: '', business_name: '', email: '', phone: '', industry: 'Services' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const progress = useFormProgress(formData);

  useEffect(() => {
    setPageMetadata({ title: 'Start Your Free Trial | ClientSurge Systems', description: '14-day free trial of AI lead automation. No credit card required.', canonicalPath: '/signup' });
    setTimeout(() => setMounted(true), 60);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContinue = async () => {
    if (!formData.full_name || !formData.business_name || !formData.email || !formData.phone) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      await base44.entities.WebsiteLead.create({ full_name: formData.full_name, business_name: formData.business_name, email: formData.email, phone_number: formData.phone, business_type: formData.industry, source: 'product_signup_flow', lead_status: 'new', consent_given: true, consent_given_at: new Date().toISOString() });
      setStep(2);
    } catch (err) { setError('Failed to process. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleCheckout = async () => {
    setLoading(true); setError('');
    try {
      const response = await base44.functions.invoke('createCheckoutSession', { email: formData.email, business_name: formData.business_name, selected_package_type: selectedPlan });
      if (response.data.checkout_url) { window.location.href = response.data.checkout_url; }
      else { setError('Failed to create checkout session'); }
    } catch (err) { setError('Failed to initiate checkout. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(0,136,204,0.07) 0%, #f8fbff 40%, rgba(0,59,143,0.05) 100%)' }}>

      {/* Ambient orbs — subtle background depth */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,174,239,0.10) 0%, transparent 70%)', animation: 'orbDrift1 18s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,59,143,0.08) 0%, transparent 70%)', animation: 'orbDrift2 22s ease-in-out infinite alternate' }} />
      </div>

      {/* Top nav bar */}
      <div className="relative z-10 border-b border-white/40 bg-white/60 backdrop-blur-md px-6 py-2 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png" alt="ClientSurge Systems" className="h-28 w-auto object-contain" />
        </Link>
        <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
          Already a client? Log in →
        </Link>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-10"
        style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.55s ease, transform 0.55s ease' }}>

        {/* ── Header — left-aligned, editorial style (Enhancement 1+2+5) ── */}
        <div className="mb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] mb-3" style={{ color: '#00AEEF' }}>START YOUR JOURNEY</p>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-1 rounded-full flex-shrink-0 mt-1" style={{ height: '3.5rem', background: 'linear-gradient(180deg,#0088CC,#003B8F)', boxShadow: '0 0 12px rgba(0,174,239,0.5)' }} />
            <h1 className="font-black leading-none tracking-tight text-foreground" style={{ fontSize: 'clamp(2.5rem, 7vw, 4rem)', letterSpacing: '-0.03em' }}>
              FREE TRIAL
            </h1>
          </div>
          <p className="text-base text-muted-foreground font-medium">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEP_LABELS.map((label, i) => {
            const num = i + 1; const active = step >= num;
            return (
              <div key={num} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300"
                    style={active ? { background: 'linear-gradient(135deg,#0088CC,#003B8F)', color: '#fff', boxShadow: '0 0 14px rgba(0,174,239,0.45)' } : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                    {step > num ? <Check className="w-4 h-4" /> : num}
                  </div>
                  <span className="text-xs font-semibold whitespace-nowrap" style={{ color: active ? '#005f99' : 'hsl(var(--muted-foreground))' }}>{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className="h-0.5 w-12 mx-2 mb-5 transition-all duration-500" style={{ background: step > num ? 'linear-gradient(90deg,#0088CC,#003B8F)' : 'hsl(var(--muted))' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Glass Card (Enhancement 6) ── */}
        <div className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(20px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
            border: '1px solid rgba(0,174,239,0.18)',
            boxShadow: '0 8px 40px rgba(0,136,204,0.12), 0 1px 0 rgba(255,255,255,0.9) inset',
          }}>

          {/* ── Progress bar at top of card (Enhancement 10) ── */}
          {step === 1 && (
            <div className="w-full h-1" style={{ background: 'rgba(0,174,239,0.10)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#0088CC,#00AEEF)', boxShadow: progress > 0 ? '0 0 8px rgba(0,174,239,0.6)' : 'none' }} />
            </div>
          )}

          <div className="p-8">
            {/* Step 1: Business Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: '#00AEEF' }}>TELL US ABOUT YOUR BUSINESS</p>
                  {/* Industry pill selector */}
                  <div className="flex flex-wrap gap-2">
                    {['Med Spa', 'Dental', 'HVAC', 'Roofing', 'Plumbing', 'Chiropractic', 'Contractor', 'Other'].map(ind => (
                      <button key={ind} type="button"
                        onClick={() => setFormData(prev => ({ ...prev, industry: ind }))}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200"
                        style={formData.industry === ind
                          ? { borderColor: '#00AEEF', background: 'rgba(0,174,239,0.12)', color: '#005f99', boxShadow: '0 0 0 1px rgba(0,174,239,0.25)' }
                          : { borderColor: 'hsl(var(--border))', background: 'transparent', color: 'hsl(var(--muted-foreground))' }}>
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── 2-column grid (Enhancement 4) — underline inputs (Enhancement 3) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <UnderlineInput label="Your Name" name="full_name" type="text" placeholder="John Doe" value={formData.full_name} onChange={handleInputChange} />
                  <UnderlineInput label="Business Name" name="business_name" type="text" placeholder="Your Business LLC" value={formData.business_name} onChange={handleInputChange} />
                  <UnderlineInput label="Phone No." name="phone" type="tel" placeholder="(555) 123-4567" value={formData.phone} onChange={handleInputChange} />
                  <UnderlineInput label="Email Address" name="email" type="email" placeholder="you@business.com" value={formData.email} onChange={handleInputChange} />
                </div>

                {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

                <button onClick={handleContinue} disabled={loading}
                  className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  style={GLOW_BTN}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 0 1.5px rgba(0,174,239,0.85), 0 0 32px rgba(0,159,212,0.7)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = GLOW_BTN.boxShadow; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  {loading ? 'Saving...' : (<>Continue to Plan Selection <ChevronRight className="w-4 h-4" /></>)}
                </button>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <ShieldCheck className="w-4 h-4 text-[#00AEEF]" />
                  <span className="text-xs text-muted-foreground">30-day money-back guarantee • Secure & private</span>
                </div>
              </div>
            )}

            {/* Step 2: Plan Selection */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: '#00AEEF' }}>SELECT YOUR PACKAGE</p>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg,#0088CC,#003B8F)' }} />
                    <h2 className="text-2xl font-black tracking-tight text-foreground">CHOOSE YOUR PLAN</h2>
                  </div>
                </div>
                <div className="space-y-3">
                  {Object.entries(PLANS).map(([key, plan]) => {
                    const selected = selectedPlan === key;
                    return (
                      <label key={key} className="block p-4 rounded-xl border-2 cursor-pointer transition-all duration-200"
                        style={{ borderColor: selected ? '#00AEEF' : 'rgba(0,0,0,0.08)', background: selected ? 'rgba(0,174,239,0.06)' : 'rgba(255,255,255,0.5)', boxShadow: selected ? '0 0 0 1px rgba(0,174,239,0.2), 0 4px 16px rgba(0,174,239,0.12)' : 'none' }}>
                        <input type="radio" name="plan" value={key} checked={selected} onChange={(e) => setSelectedPlan(e.target.value)} className="sr-only" />
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-foreground">{plan.name}</span>
                              {plan.badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ background: 'rgba(0,174,239,0.12)', color: '#005f99' }}>{plan.badge}</span>}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">${plan.setup.toLocaleString()} setup + ${plan.monthly.toLocaleString()}/mo</div>
                            <ul className="space-y-1">
                              {plan.features.map(f => (
                                <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Check className="w-3 h-3 flex-shrink-0 text-[#00AEEF]" />{f}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                            style={{ borderColor: selected ? '#00AEEF' : 'hsl(var(--border))', background: selected ? '#00AEEF' : 'transparent' }}>
                            {selected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 border-2 border-border text-foreground rounded-xl font-semibold hover:bg-muted transition-colors text-sm">Back</button>
                  <button onClick={handleCheckout} disabled={loading} className="flex-1 py-3 rounded-xl font-semibold disabled:opacity-50 text-sm"
                    style={GLOW_BTN}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 0 1.5px rgba(0,174,239,0.85), 0 0 32px rgba(0,159,212,0.7)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = GLOW_BTN.boxShadow; e.currentTarget.style.transform = 'translateY(0)'; }}>
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
        </div>

        {/* Social proof strip */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {[{ emoji: '🔒', text: 'Secure & Private' }, { emoji: '🚀', text: 'Live in 48 Hours' }, { emoji: '💪', text: '14-Day Free Trial' }, { emoji: '⭐', text: '4.9/5 Client Rating' }].map(({ emoji, text }) => (
            <span key={text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold"
              style={{ borderColor: 'rgba(0,174,239,0.2)', background: 'rgba(255,255,255,0.6)', color: 'hsl(var(--muted-foreground))', backdropFilter: 'blur(8px)' }}>
              <span>{emoji}</span>{text}
            </span>
          ))}
        </div>

        <LiveActivityTicker />
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes orbDrift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px, 60px) scale(1.15); } }
        @keyframes orbDrift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(-50px,-40px) scale(1.1); } }
      `}</style>
    </div>
  );
}