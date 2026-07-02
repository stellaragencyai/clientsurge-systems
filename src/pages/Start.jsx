import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import MobileCallBar from '@/components/landing/MobileCallBar';
import TrustStrip from '@/components/landing/TrustStrip';
import { setPageMetadata } from '@/lib/seo';
import { trackCTA } from '@/lib/analytics';
import { base44 } from '@/api/base44Client';

const PACKAGE_LABELS = { starter_system: 'Starter System', growth_system: 'Growth System', pro_system: 'Pro System' };
const SERVICE_LABELS = { instant_lead_response: 'Instant Lead Response', missed_call_text_back: 'Missed-Call Text-Back', nurture_sequence_14d: '14-Day Nurture Sequence', ai_booking_agent: 'AI Booking Agent', review_request: 'Review Request Automation', lead_reactivation: 'Lead Reactivation' };
const LEAD_SOURCE_OPTIONS = ['Website / Contact Form', 'Google Ads', 'Facebook / Instagram Ads', 'Organic Social', 'Google Business Profile', 'Referrals', 'Phone Calls', 'Walk-Ins'];
const TIMELINE_OPTIONS = ['As soon as possible', 'Within 1–2 weeks', 'Within 30 days', 'Just exploring for now'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneDigits = (value) => String(value || '').replace(/\D/g, '');

export default function Start() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    selected_package_key: searchParams.get('package') || '',
    selected_service_key: searchParams.get('service') || '',
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

  useEffect(() => {
    return setPageMetadata({
      title: 'Start Your ClientSurge Installation',
      description: 'Choose your ClientSurge system, answer the setup questions, and move into a clear configuration path before launch.',
      canonicalPath: '/start',
      ogTitle: 'Start Your ClientSurge Installation',
      ogDescription: 'Begin guided setup for your ClientSurge AI system.',
    });
  }, []);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError(null);
  };
  const toggleLeadSource = (src) => update('lead_sources', form.lead_sources.includes(src) ? form.lead_sources.filter((s) => s !== src) : [...form.lead_sources, src]);

  const validate = () => {
    const errors = {};
    if (!form.selected_package_key && !form.selected_service_key) errors.selected_package_key = 'Choose a package or service to start.';
    if (form.contact_name.trim().length < 2) errors.contact_name = 'Enter your contact name.';
    if (form.business_name.trim().length < 2) errors.business_name = 'Enter your business name.';
    if (!form.email.trim()) errors.email = 'Email is required.';
    else if (!EMAIL_REGEX.test(form.email.trim())) errors.email = 'Enter a valid email.';
    if (!form.phone.trim()) errors.phone = 'Phone is required.';
    else if (phoneDigits(form.phone).length < 10) errors.phone = 'Enter a valid phone number.';
    if (!form.business_type.trim()) errors.business_type = 'Enter your industry or business type.';
    if (form.lead_sources.length === 0) errors.lead_sources = 'Select at least one lead source.';
    if (form.problem.trim().length < 8) errors.problem = 'Describe the lead flow gap you want fixed first.';
    if (!form.timeline) errors.timeline = 'Please select a launch timeline.';
    if (form.consent !== true) errors.consent = 'Please approve follow-up about your setup intake.';
    return errors;
  };

  const submit = async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError('Please fix the highlighted fields before submitting.');
      return;
    }
    setLoading(true);
    setSubmitError(null);
    setFieldErrors({});
    try {
      trackCTA('remote_setup_submit', '/start');
      const result = await base44.functions.invoke('submitRemoteSetupIntake', {
        ...form,
        contact_name: form.contact_name.trim(),
        business_name: form.business_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        business_type: form.business_type.trim(),
        crm_stack: form.crm_stack.trim(),
        booking_link: form.booking_link.trim(),
        problem: form.problem.trim(),
        notes: form.notes.trim(),
        consent: form.consent === true,
        source_page: '/start',
      });
      if (result?.data?.success === false) {
        throw new Error(result.data.error || 'Setup intake failed');
      }
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err?.data?.error || err.message || 'Something went wrong. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col"><Navbar /><main className="flex-1 px-4 py-24 pt-[calc(var(--cs-nav-height)+48px)]"><div className="mx-auto max-w-xl rounded-2xl border border-border bg-white p-8 text-center shadow-sm"><CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-600" /><h1 className="font-titles text-2xl font-bold text-foreground mb-3">Installation Intake Received</h1><p className="text-sm text-muted-foreground leading-relaxed mb-6">ClientSurge will review your selected system, business details, lead sources, tools, and setup requirements. The next step is confirming any missing access or launch details.</p><Link to="/pricing" className="cs-btn-primary">Back to Packages <ArrowRight className="w-4 h-4" /></Link></div></main><Footer /><MobileCallBar /></div>
    );
  }

  const inputClass = (field) => `mt-1 w-full rounded-lg border px-3 py-2.5 text-sm ${fieldErrors[field] ? 'border-red-500' : 'border-border'}`;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 pb-20 pt-[calc(var(--cs-nav-height)+32px)] md:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-8 text-left">
            <p className="cs-section-eyebrow mb-3">Guided Installation Intake</p>
            <h1 className="font-titles text-3xl md:text-4xl font-extrabold text-foreground leading-tight mb-3">Start Your ClientSurge Installation</h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">Choose your system, answer the setup questions, and we will map the configuration path before launch.</p>
          </div>

          <div className="rounded-xl border border-border bg-white shadow-sm p-6 md:p-8 space-y-8">
            <section>
              <h2 className="font-titles text-xl font-bold text-foreground mb-3">What do you want ClientSurge to fix first?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(PACKAGE_LABELS).map(([key, label]) => (
                  <button key={key} type="button" onClick={() => update('selected_package_key', key)} className="rounded-lg border-2 p-4 text-left" style={{ borderColor: form.selected_package_key === key ? '#003B8F' : fieldErrors.selected_package_key ? '#ef4444' : '#e2e8f0', background: form.selected_package_key === key ? 'rgba(0,59,143,0.05)' : '#fff' }}><p className="text-sm font-bold text-foreground">{label}</p><p className="text-xs text-muted-foreground mt-1">{key === 'starter_system' ? 'Response gaps' : key === 'growth_system' ? 'Follow-up and booking' : 'Full recovery layer'}</p></button>
                ))}
              </div>
              {fieldErrors.selected_package_key && <p className="mt-2 text-xs text-red-600">{fieldErrors.selected_package_key}</p>}
              <div className="mt-4 flex flex-wrap gap-2">{Object.entries(SERVICE_LABELS).map(([key, label]) => <button key={key} type="button" onClick={() => update('selected_service_key', form.selected_service_key === key ? '' : key)} className="rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: form.selected_service_key === key ? '#00AEEF' : '#e2e8f0', color: form.selected_service_key === key ? '#005f99' : '#475569' }}>{label}</button>)}</div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              {[['contact_name', 'Contact Name'], ['business_name', 'Business Name'], ['email', 'Business Email'], ['phone', 'Business Phone'], ['website', 'Business Website'], ['business_type', 'Business Type / Industry'], ['crm_stack', 'Current CRM or lead tracking'], ['booking_link', 'Booking / calendar link']].map(([field, label]) => <label key={field} className="text-sm font-semibold text-foreground">{label}<input value={form[field]} onChange={(e) => update(field, e.target.value)} className={inputClass(field)} aria-invalid={Boolean(fieldErrors[field])} />{fieldErrors[field] && <span className="mt-1 block text-xs text-red-600">{fieldErrors[field]}</span>}</label>)}
            </section>

            <section>
              <h2 className="font-titles text-lg font-bold text-foreground mb-3">Lead sources</h2>
              <div className="flex flex-wrap gap-2">{LEAD_SOURCE_OPTIONS.map((src) => <button key={src} type="button" onClick={() => toggleLeadSource(src)} className="rounded-lg border-2 px-4 py-2 text-sm font-semibold" style={{ borderColor: form.lead_sources.includes(src) ? '#003B8F' : fieldErrors.lead_sources ? '#ef4444' : '#e2e8f0', background: form.lead_sources.includes(src) ? 'rgba(0,59,143,0.06)' : '#fff' }}>{form.lead_sources.includes(src) ? '✓ ' : ''}{src}</button>)}</div>
              {fieldErrors.lead_sources && <p className="mt-2 text-xs text-red-600">{fieldErrors.lead_sources}</p>}
            </section>

            <section className="space-y-4">
              <label className="block text-sm font-semibold text-foreground">What lead flow gap should this system fix first?<textarea value={form.problem} onChange={(e) => update('problem', e.target.value)} rows={3} className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm ${fieldErrors.problem ? 'border-red-500' : 'border-border'}`} placeholder="Example: missed calls after hours, slow follow-up, quote follow-up, booking friction, old leads." />{fieldErrors.problem && <span className="mt-1 block text-xs text-red-600">{fieldErrors.problem}</span>}</label>
              <div><p className="text-sm font-semibold text-foreground mb-2">How soon do you want this live?</p><div className="flex flex-wrap gap-2">{TIMELINE_OPTIONS.map((t) => <button key={t} type="button" onClick={() => update('timeline', t)} className="rounded-lg border-2 px-4 py-2 text-sm font-semibold" style={{ borderColor: form.timeline === t ? '#003B8F' : fieldErrors.timeline ? '#ef4444' : '#e2e8f0', background: form.timeline === t ? 'rgba(0,59,143,0.06)' : '#fff' }}>{form.timeline === t ? '✓ ' : ''}{t}</button>)}</div>{fieldErrors.timeline && <p className="mt-2 text-xs text-red-600">{fieldErrors.timeline}</p>}</div>
              <label className="block text-sm font-semibold text-foreground">Notes or access requirements<textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm" /></label>
              <label className={`flex items-start gap-3 rounded-lg border p-4 ${fieldErrors.consent ? 'border-red-500' : 'border-border'}`}><input type="checkbox" checked={form.consent} onChange={(e) => update('consent', e.target.checked)} className="mt-1" aria-invalid={Boolean(fieldErrors.consent)} /><span className="text-sm text-muted-foreground leading-relaxed">I consent to be contacted by ClientSurge Systems via SMS and email regarding my setup intake and automation services. Standard messaging rates may apply.</span></label>
              {fieldErrors.consent && <p className="text-xs text-red-600">{fieldErrors.consent}</p>}
            </section>

            {submitError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex gap-2 text-sm text-red-700"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{submitError}</div>}
            <div className="flex justify-end"><button type="button" onClick={submit} disabled={loading} className="cs-btn-primary flex items-center gap-2 disabled:opacity-60">{loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <>Submit Installation Intake <ArrowRight className="w-4 h-4" /></>}</button></div>
          </div>
        </div>
      </main>
      <TrustStrip />
      <Footer />
      <MobileCallBar />
    </div>
  );
}
