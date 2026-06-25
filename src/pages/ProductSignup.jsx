import { useState } from 'react';

const PLAN_DATA = {
  starter_system: {
    key: 'starter_system',
    shortName: 'Starter',
    name: 'Starter System',
    setup: 797,
    monthly: 497,
    description: 'Core lead capture, instant response, and missed-call recovery for local service businesses that need the money path working fast.',
    features: [
      'Instant lead response',
      'Missed-call text-back',
      'Lead capture handoff',
      'Basic follow-up workflow',
    ],
  },
  growth_system: {
    key: 'growth_system',
    shortName: 'Growth',
    name: 'Growth System',
    setup: 1297,
    monthly: 997,
    description: 'Lead response, missed-call recovery, nurture, booking, and review workflows for businesses that want more appointments booked.',
    features: [
      'Everything in Starter',
      '14-day nurture sequence',
      'AI booking support',
      'Review request workflow',
    ],
  },
  pro_system: {
    key: 'pro_system',
    shortName: 'Pro',
    name: 'Pro System',
    setup: 2497,
    monthly: 1997,
    description: 'Full-stack lead recovery with voice, booking, review, reactivation, and priority support for serious growth operations.',
    features: [
      'Everything in Growth',
      'AI voice-agent workflow',
      'Lead reactivation campaign',
      'Priority implementation support',
    ],
  },
};

const PLAN_ALIASES = {
  starter: 'starter_system',
  growth: 'growth_system',
  pro: 'pro_system',
  elite: 'pro_system',
  elite_system: 'pro_system',
};

const SUPPORT_EMAIL = 'support@clientsurgesystems.com';
const SUPPORT_PHONE = '(602) 584-3227';

function getSelectedPlanKey() {
  if (typeof window === 'undefined') return 'starter_system';

  try {
    const params = new URLSearchParams(window.location.search || '');
    const raw = String(params.get('package') || params.get('plan') || '').toLowerCase();
    if (PLAN_DATA[raw]) return raw;
    if (PLAN_ALIASES[raw]) return PLAN_ALIASES[raw];
  } catch (_) {
    return 'starter_system';
  }

  return 'starter_system';
}

function money(amount) {
  return `$${Number(amount || 0).toLocaleString()}`;
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function ProductSignup() {
  const [selectedKey, setSelectedKey] = useState(getSelectedPlanKey);
  const [form, setForm] = useState({
    name: '',
    email: '',
    business: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const selectedPlan = PLAN_DATA[selectedKey] || PLAN_DATA.starter_system;

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const selectPlan = (key) => {
    const safeKey = PLAN_DATA[key] ? key : 'starter_system';
    setSelectedKey(safeKey);
    if (typeof window !== 'undefined') {
      const nextUrl = `/product-signup?package=${safeKey}`;
      window.history.replaceState({}, '', nextUrl);
    }
  };

  const handleCheckout = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.business.trim()) {
      setMessage({
        type: 'error',
        text: 'Fill in your name, email, and business name before checkout.',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { base44 } = await import('@/api/base44Client');
      const result = await base44.functions.invoke('createCheckoutSession', {
        package_key: selectedPlan.key,
        selected_package_type: selectedPlan.key,
        customer_name: form.name.trim(),
        customer_email: form.email.trim(),
        customer_phone: form.phone.trim(),
        business_name: form.business.trim(),
        success_url: `${window.location.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/product-signup?package=${selectedPlan.key}`,
      });

      const checkoutUrl = result?.data?.url || result?.url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      throw new Error(result?.data?.error || 'Checkout did not return a URL.');
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Checkout could not start safely. Email ${SUPPORT_EMAIL} or call ${SUPPORT_PHONE} and mention ${selectedPlan.name}.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <header className="mb-10 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <a href="/" className="text-lg font-black tracking-tight text-white no-underline">
            ClientSurge Systems
          </a>
          <nav className="flex flex-wrap gap-4 text-sm text-slate-300">
            <a className="hover:text-white" href="/pricing">Pricing</a>
            <a className="hover:text-white" href="/store">Store</a>
            <a className="hover:text-white" href="/industries">Industries</a>
            <a className="hover:text-white" href="/contact">Contact</a>
          </nav>
        </header>

        <div className="mb-8 max-w-3xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">Product Signup</p>
          <h1 className="mb-4 text-4xl font-black tracking-tight md:text-5xl">
            Choose your AI growth system and continue to checkout.
          </h1>
          <p className="text-lg leading-8 text-slate-300">
            This page is intentionally self-contained so buyers can reach the package selection flow even if optional marketing data is unavailable.
          </p>
        </div>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          {Object.values(PLAN_DATA).map((plan) => {
            const active = plan.key === selectedPlan.key;
            return (
              <button
                key={plan.key}
                type="button"
                onClick={() => selectPlan(plan.key)}
                className={`rounded-2xl border p-5 text-left transition ${active ? 'border-cyan-300 bg-cyan-300/10 shadow-lg shadow-cyan-950/40' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black text-white">{plan.name}</h2>
                  {active && <span className="rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-slate-950">Selected</span>}
                </div>
                <p className="mb-4 text-sm leading-6 text-slate-300">{plan.description}</p>
                <div className="text-2xl font-black text-white">{money(plan.monthly)}<span className="text-sm font-semibold text-slate-400">/mo</span></div>
                <div className="text-sm text-slate-400">{money(plan.setup)} setup</div>
              </button>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <h2 className="mb-4 text-2xl font-black">{selectedPlan.name}</h2>
            <p className="mb-6 text-slate-300">{selectedPlan.description}</p>
            <ul className="grid gap-3 md:grid-cols-2">
              {selectedPlan.features.map((feature) => (
                <li key={feature} className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">
                  <span className="mr-2 text-cyan-300">✓</span>{feature}
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-5">
              <div className="flex justify-between gap-4 text-sm text-slate-300">
                <span>One-time setup</span>
                <strong className="text-white">{money(selectedPlan.setup)}</strong>
              </div>
              <div className="mt-2 flex justify-between gap-4 text-sm text-slate-300">
                <span>Monthly management</span>
                <strong className="text-white">{money(selectedPlan.monthly)}/mo</strong>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-2xl md:p-8">
            <h2 className="mb-2 text-2xl font-black">Buyer details</h2>
            <p className="mb-6 text-sm leading-6 text-slate-600">Enter the business contact information for checkout and setup handoff.</p>

            <div className="space-y-4">
              <label className="block text-sm font-bold">
                Full name *
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-cyan-500"
                  value={form.name}
                  onChange={(event) => updateForm('name', event.target.value)}
                  autoComplete="name"
                  placeholder="Jane Smith"
                />
              </label>
              <label className="block text-sm font-bold">
                Email *
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-cyan-500"
                  value={form.email}
                  onChange={(event) => updateForm('email', event.target.value)}
                  autoComplete="email"
                  placeholder="owner@business.com"
                  type="email"
                />
              </label>
              <label className="block text-sm font-bold">
                Business name *
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-cyan-500"
                  value={form.business}
                  onChange={(event) => updateForm('business', event.target.value)}
                  autoComplete="organization"
                  placeholder="ABC Roofing Co."
                />
              </label>
              <label className="block text-sm font-bold">
                Phone
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-cyan-500"
                  value={form.phone}
                  onChange={(event) => updateForm('phone', normalizePhone(event.target.value))}
                  autoComplete="tel"
                  placeholder="(602) 555-0100"
                  type="tel"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-4 text-base font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Starting checkout…' : `Continue to Checkout — ${selectedPlan.shortName}`}
            </button>

            {message && (
              <div className={`mt-4 rounded-xl border p-4 text-sm ${message.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
                {message.text}
                <div className="mt-2 flex flex-col gap-1 font-bold">
                  <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                  <a href="tel:+16025843227">{SUPPORT_PHONE}</a>
                </div>
              </div>
            )}

            <p className="mt-4 text-center text-xs text-slate-500">Secure checkout powered by Stripe.</p>
          </div>
        </section>
      </section>
    </main>
  );
}
