import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import MobileCallBar from '@/components/landing/MobileCallBar';
import { setPageMetadata } from '@/lib/seo';
import { trackCTA } from '@/lib/analytics';
import { base44 } from '@/api/base44Client';
import TrustStrip from '@/components/landing/TrustStrip';

const PACKAGE_LABELS = {
  starter_system: 'Starter System',
  growth_system: 'Growth System',
  pro_system: 'Pro System',
};

const SERVICE_LABELS = {
  instant_lead_response: 'Instant Lead Response',
  missed_call_text_back: 'Missed-Call Text-Back',
  nurture_sequence_14d: '14-Day Nurture Sequence',
  ai_booking_agent: 'AI Booking Agent',
  review_request: 'Review Request Automation',
  lead_reactivation: 'Lead Reactivation',
};

const INDUSTRY_OPTIONS = [
  'Med Spa / Aesthetic Clinic',
  'Dental / Orthodontics',
  'Chiropractic / Physical Therapy',
  'HVAC / Plumbing / Home Services',
  'Roofing / Restoration',
  'Contractors / Trades',
  'Other Service Business',
];

const LEAD_SOURCE_OPTIONS = [
  'Website / Contact Form',
  'Google Ads',
  'Facebook / Instagram Ads',
  'Organic Social',
  'Google My Business',
  'Referrals',
  'Phone Calls',
  'Walk-Ins',
];

const TIMELINE_OPTIONS = [
  'As soon as possible',
  'Within 1–2 weeks',
  'Within 30 days',
  'Just exploring for now',
];

const STEPS = [
  { id: 1, label: 'Choose System' },
  { id: 2, label: 'Business Details' },
  { id: 3, label: 'Lead Sources' },
  { id: 4, label: 'Tools & Access' },
  { id: 5, label: 'Setup Plan' },
  { id: 6, label: 'Confirmation' },
];

export default function Start() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const packageParam = searchParams.get('package') || '';
  const serviceParam = searchParams.get('service') || '';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const [form, setForm] = useState({
    selected_package_key: packageParam,
    selected_service_key: serviceParam,
    contact_name: '',
    business_name: '',
    email: '',
    phone: '',
    website: '',
    business_type: '',
    crm_stack: '',
    booking_link: '',
    lead_sources: [],
    problem: '',
    timeline: '',
    notes: '',
    consent: false,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setPageMetadata({
      title: 'Start Remote AI Automation Setup | ClientSurge Systems',
      description: 'Choose your package or automation system, answer a guided setup intake, and ClientSurge will organize the remote configuration path for your business.',
      canonicalPath: '/start',
      ogTitle: 'Start Remote AI Automation Setup',
      ogDescription: 'Begin your guided AI automation intake and remote setup with ClientSurge Systems.',
    });
  }, []);

  // Keep URL params in form if they change
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      selected_package_key: packageParam || prev.selected_package_key,
      selected_service_key: serviceParam || prev.selected_service_key,
    }));
  }, [packageParam, serviceParam]);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const toggleLeadSource = (src) => {
    setForm(prev => ({
      ...prev,
      lead_sources: prev.lead_sources.includes(src)
        ? prev.lead_sources.filter(s => s !== src)
        : [...prev.lead_sources, src],
    }));
  };

  const validateStep = (s) => {
    const errs = {};
    if (s === 2) {
      if (!form.contact_name.trim()) errs.contact_name = 'Required';
      if (!form.business_name.trim()) errs.business_name = 'Required';
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required';
      if (!form.phone.trim()) errs.phone = 'Required';
    }
    if (s === 5) {
      if (!form.problem.trim()) errs.problem = 'Please describe your biggest lead follow-up problem';
      if (!form.timeline) errs.timeline = 'Please select a timeline';
      if (!form.consent) errs.consent = 'Please consent to contact to continue';
    }
    return errs;
  };

  const nextStep = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep(s => Math.min(s + 1, STEPS.length));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setErrors({});
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    const errs = validateStep(5);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setSubmitError(null);
    try {
      trackCTA('remote_setup_submit', '/start');
      const res = await base44.functions.invoke('submitRemoteSetupIntake', {
        ...form,
        source_page: '/start',
      });
      setSubmittedData({ ...form, lead_id: res?.data?.lead_id });
      setSubmitted(true);
      setStep(6);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err?.data?.error || err.message || 'Something went wrong. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const packageLabel = PACKAGE_LABELS[form.selected_package_key] || null;
  const serviceLabel = SERVICE_LABELS[form.selected_service_key] || null;
  const selectionLabel = packageLabel || serviceLabel;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 px-4 pb-20 pt-[calc(var(--cs-nav-height)+32px)] md:px-6">
        <div className="mx-auto w-full max-w-3xl">

          {/* Page Header */}
          <div className="mb-8 text-left">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">
              Business AI Automation Store
            </p>
            <h1 className="font-titles text-3xl md:text-4xl font-extrabold text-foreground leading-tight mb-3">
              Start Remote AI Automation Setup
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">
              Choose your package or automation system, answer a guided setup intake, and ClientSurge will organize the remote configuration path for your business.
            </p>
          </div>

          {/* Step Progress Bar */}
          <div className="mb-8 overflow-x-auto pb-1">
            <div className="flex items-center gap-0 min-w-max">
              {STEPS.map((s, i) => {
                const done = step > s.id || submitted;
                const active = step === s.id && !submitted;
                const isLast = i === STEPS.length - 1;
                return (
                  <div key={s.id} className="flex items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
                        style={{
                          background: done ? '#00AEEF' : active ? '#003B8F' : '#f1f5f9',
                          borderColor: done || active ? (done ? '#00AEEF' : '#003B8F') : '#e2e8f0',
                          color: done || active ? '#fff' : '#94a3b8',
                        }}
                      >
                        {done && !active ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                      </div>
                      <span className="text-[10px] font-semibold whitespace-nowrap hidden sm:block"
                        style={{ color: active ? '#003B8F' : done ? '#00AEEF' : '#94a3b8' }}>
                        {s.label}
                      </span>
                    </div>
                    {!isLast && (
                      <div className="w-10 md:w-16 h-0.5 mx-1 mb-4"
                        style={{ background: step > s.id ? '#00AEEF' : '#e2e8f0' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Card */}
          <div className="rounded-xl border border-border bg-white shadow-sm p-6 md:p-8">

            {/* ── STEP 1: Choose System ── */}
            {step === 1 && (
              <div className="space-y-6">
                <StepHeader
                  title="What are you starting with?"
                  subtitle="Select a package or a single automation. You can adjust later."
                />

                {selectionLabel && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-primary mb-0.5">Pre-selected</p>
                      <p className="text-sm font-semibold text-foreground">{selectionLabel}</p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">Packages</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.entries(PACKAGE_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => update('selected_package_key', form.selected_package_key === key ? '' : key)}
                        className="rounded-lg border-2 p-4 text-left transition-all"
                        style={{
                          borderColor: form.selected_package_key === key ? '#003B8F' : '#e2e8f0',
                          background: form.selected_package_key === key ? 'rgba(0,59,143,0.05)' : '#fff',
                        }}
                      >
                        <p className="text-sm font-bold text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {key === 'starter_system' && 'Instant response + missed-call recovery'}
                          {key === 'growth_system' && 'Starter + nurture sequence + booking agent'}
                          {key === 'pro_system' && 'Growth + review requests + lead reactivation'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">Or start with a single automation</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(SERVICE_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => update('selected_service_key', form.selected_service_key === key ? '' : key)}
                        className="rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-all text-left"
                        style={{
                          borderColor: form.selected_service_key === key ? '#00AEEF' : '#e2e8f0',
                          background: form.selected_service_key === key ? 'rgba(0,174,239,0.06)' : '#fff',
                          color: form.selected_service_key === key ? '#005f99' : '#475569',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Not sure? <a href="/pricing" className="text-primary underline">Compare packages</a> or <a href="/book" className="text-primary underline">book a free audit</a>.
                </p>
              </div>
            )}

            {/* ── STEP 2: Business Details ── */}
            {step === 2 && (
              <div className="space-y-5">
                <StepHeader title="Your business details" subtitle="We'll use this to configure your setup path." />
                <FormRow>
                  <FormField label="Contact Name" required error={errors.contact_name}>
                    <FInput value={form.contact_name} onChange={v => update('contact_name', v)} placeholder="Jane Smith" />
                  </FormField>
                  <FormField label="Business Name" required error={errors.business_name}>
                    <FInput value={form.business_name} onChange={v => update('business_name', v)} placeholder="ABC Roofing Co." />
                  </FormField>
                </FormRow>
                <FormRow>
                  <FormField label="Business Email" required error={errors.email}>
                    <FInput type="email" value={form.email} onChange={v => update('email', v)} placeholder="owner@yourbusiness.com" />
                  </FormField>
                  <FormField label="Business Phone" required error={errors.phone}>
                    <FInput type="tel" value={form.phone} onChange={v => update('phone', v)} placeholder="(602) 555-0100" />
                  </FormField>
                </FormRow>
                <FormRow>
                  <FormField label="Business Website">
                    <FInput value={form.website} onChange={v => update('website', v)} placeholder="https://yourbusiness.com" />
                  </FormField>
                  <FormField label="Business Type / Industry">
                    <select
                      value={form.business_type}
                      onChange={e => update('business_type', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Select industry...</option>
                      {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </FormField>
                </FormRow>
              </div>
            )}

            {/* ── STEP 3: Lead Sources ── */}
            {step === 3 && (
              <div className="space-y-5">
                <StepHeader title="Where do your leads come from?" subtitle="Select all that apply." />
                <div className="flex flex-wrap gap-2">
                  {LEAD_SOURCE_OPTIONS.map(src => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => toggleLeadSource(src)}
                      className="rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all"
                      style={{
                        borderColor: form.lead_sources.includes(src) ? '#003B8F' : '#e2e8f0',
                        background: form.lead_sources.includes(src) ? 'rgba(0,59,143,0.06)' : '#fff',
                        color: form.lead_sources.includes(src) ? '#003B8F' : '#475569',
                      }}
                    >
                      {form.lead_sources.includes(src) && '✓ '}{src}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 4: Tools & Access ── */}
            {step === 4 && (
              <div className="space-y-5">
                <StepHeader title="Current tools & access" subtitle="Helps us configure integrations for your setup." />
                <FormField label="Current CRM or lead tracking system" hint="e.g. HubSpot, GoHighLevel, spreadsheet, none">
                  <FInput value={form.crm_stack} onChange={v => update('crm_stack', v)} placeholder="e.g. None / Google Sheets / HubSpot" />
                </FormField>
                <FormField label="Current booking / calendar link" hint="e.g. Calendly, Acuity, NexHealth, none">
                  <FInput value={form.booking_link} onChange={v => update('booking_link', v)} placeholder="https://calendly.com/yourbusiness" />
                </FormField>
              </div>
            )}

            {/* ── STEP 5: Setup Plan ── */}
            {step === 5 && (
              <div className="space-y-5">
                <StepHeader title="Setup plan details" subtitle="A few final details to complete your intake." />

                <FormField label="What is your biggest lead follow-up problem?" required error={errors.problem}>
                  <FTextarea
                    value={form.problem}
                    onChange={v => update('problem', v)}
                    placeholder="e.g. We miss calls after hours and never follow up. Leads go cold within 24 hours."
                    rows={3}
                  />
                </FormField>

                <FormField label="How soon do you want this live?" required error={errors.timeline}>
                  <div className="flex flex-wrap gap-2">
                    {TIMELINE_OPTIONS.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => update('timeline', t)}
                        className="rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all"
                        style={{
                          borderColor: form.timeline === t ? '#003B8F' : '#e2e8f0',
                          background: form.timeline === t ? 'rgba(0,59,143,0.06)' : '#fff',
                          color: form.timeline === t ? '#003B8F' : '#475569',
                        }}
                      >
                        {form.timeline === t && '✓ '}{t}
                      </button>
                    ))}
                  </div>
                </FormField>

                <FormField label="Notes or access requirements" hint="Optional — anything else ClientSurge should know">
                  <FTextarea
                    value={form.notes}
                    onChange={v => update('notes', v)}
                    placeholder="e.g. We use Jobber for scheduling. Google Business Profile access can be shared via email."
                    rows={3}
                  />
                </FormField>

                <div className="rounded-lg border border-border p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={e => update('consent', e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-muted-foreground leading-relaxed">
                      I consent to be contacted by ClientSurge Systems via SMS and email regarding my remote setup intake and automation services. Standard messaging rates may apply.
                    </span>
                  </label>
                  {errors.consent && <p className="text-xs text-red-500 mt-2 ml-7">{errors.consent}</p>}
                </div>

                {submitError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex gap-2 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {submitError}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 6: Confirmation ── */}
            {step === 6 && submitted && (
              <ConfirmationView form={submittedData || form} />
            )}

            {/* Navigation */}
            {step < 6 && (
              <div className="flex items-center justify-between mt-8 gap-4">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-5 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    Back
                  </button>
                ) : <div />}

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="cs-btn-primary flex items-center gap-2"
                    style={{ minHeight: 'unset', minWidth: 'unset' }}
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="cs-btn-primary flex items-center gap-2 disabled:opacity-60"
                    style={{ minHeight: 'unset', minWidth: 'unset' }}
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <>Submit Intake <ArrowRight className="w-4 h-4" /></>}
                  </button>
                )}
              </div>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Questions? <a href="mailto:support@clientsurgesystems.com" className="text-primary underline">support@clientsurgesystems.com</a> · <a href="tel:+16025843227" className="text-primary underline">(602) 584-3227</a>
          </p>
        </div>
      </main>

      <TrustStrip />
      <Footer />
      <MobileCallBar />
    </div>
  );
}

function ConfirmationView({ form }) {
  const packageLabel = PACKAGE_LABELS[form.selected_package_key] || null;
  const serviceLabel = SERVICE_LABELS[form.selected_service_key] || null;
  const selectionLabel = packageLabel || serviceLabel || 'Custom Setup';

  return (
    <div className="space-y-6 text-center py-4">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-9 h-9 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Remote Setup Intake Received</h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
          Your remote setup intake has been received. ClientSurge will review your selected package or automation system, business details, lead sources, and required setup access. Your next step is to complete any missing access checklist items so the automation can be configured and tested.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4 text-left max-w-sm mx-auto space-y-2">
        {form.business_name && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground font-medium">Business</span>
            <span className="font-semibold text-foreground">{form.business_name}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground font-medium">Selected</span>
          <span className="font-semibold text-foreground">{selectionLabel}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground font-medium">Status</span>
          <span className="font-semibold text-green-600">Intake Received</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground font-medium">Next Step</span>
          <span className="font-semibold text-foreground">Setup access review</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <a
          href="/login"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        >
          Client Login
        </a>
        <a
          href="/contact"
          className="cs-btn-primary"
          style={{ minHeight: 'unset', minWidth: 'unset', fontSize: '0.875rem' }}
        >
          Contact Support
        </a>
      </div>

      <p className="text-xs text-muted-foreground">
        Need help? <a href="mailto:support@clientsurgesystems.com" className="text-primary underline">support@clientsurgesystems.com</a> · <a href="tel:+16025843227" className="text-primary underline">(602) 584-3227</a>
      </p>
    </div>
  );
}

/* ── Sub-components ── */

function StepHeader({ title, subtitle }) {
  return (
    <div className="mb-2">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

function FormRow({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function FormField({ label, hint, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-foreground">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function FInput({ type = 'text', value, onChange, placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
    />
  );
}

function FTextarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-all"
    />
  );
}