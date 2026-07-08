import { useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { trackCTA } from '@/lib/analytics';
import { normalizeIndustryLeadPayload } from '@/lib/normalizeIndustryLeadPayload';
import FloatingConfirmation from '@/components/ui/FloatingConfirmation';
import CSConfirmationCard from '@/components/design-system/CSConfirmationCard';

const formatPhone = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Industry-specific qualifying questions
const INDUSTRY_QUESTIONS = {
  roofing: {
    label: 'How many roofing leads do you receive per month?',
    options: ['1–10 leads/mo', '11–30 leads/mo', '31–60 leads/mo', '60+ leads/mo'],
    problem_prompt: 'What is your biggest challenge following up on roofing leads? (e.g. missed calls, slow response, no-shows)',
  },
  hvac: {
    label: 'What is your peak lead volume per month?',
    options: ['1–15 leads/mo', '16–40 leads/mo', '41–80 leads/mo', '80+ leads/mo'],
    problem_prompt: 'Describe your biggest HVAC lead follow-up problem (e.g. missed calls after hours, seasonal swings)',
  },
  plumbing: {
    label: 'How many inbound calls or leads do you receive per month?',
    options: ['1–10 calls/mo', '11–30 calls/mo', '31–60 calls/mo', '60+ calls/mo'],
    problem_prompt: 'What happens to leads who call and get no answer?',
  },
  dental: {
    label: 'How many new patient inquiries do you receive per month?',
    options: ['1–20 inquiries/mo', '21–50 inquiries/mo', '51–100 inquiries/mo', '100+ inquiries/mo'],
    problem_prompt: 'What is your biggest patient follow-up or no-show challenge?',
  },
  'med-spa': {
    label: 'How many consultation or booking requests per month?',
    options: ['1–20/mo', '21–50/mo', '51–100/mo', '100+/mo'],
    problem_prompt: 'What follow-up challenge costs your Med Spa the most revenue?',
  },
  chiropractic: {
    label: 'How many new patient inquiries do you receive per month?',
    options: ['1–15/mo', '16–40/mo', '41–80/mo', '80+/mo'],
    problem_prompt: 'What is your biggest missed-opportunity challenge? (e.g. no-shows, cold leads, missed calls)',
  },
  contractors: {
    label: 'How many quote requests or inquiries do you receive per month?',
    options: ['1–10/mo', '11–30/mo', '31–60/mo', '60+/mo'],
    problem_prompt: 'What happens to quote requests that go unanswered for more than 24 hours?',
  },
  'real-estate': {
    label: 'How many buyer or seller leads do you receive per month?',
    options: ['1–20/mo', '21–50/mo', '51–100/mo', '100+/mo'],
    problem_prompt: 'What is your biggest lead follow-up or engagement challenge?',
  },
  'personal-injury': {
    label: 'How many case inquiries do you receive per month?',
    options: ['1–15/mo', '16–40/mo', '41–80/mo', '80+/mo'],
    problem_prompt: 'What is your biggest challenge converting inquiries into signed cases?',
  },
};

const DEFAULT_QUESTION = {
  label: 'How many leads do you receive per month?',
  options: ['1–10/mo', '11–30/mo', '31–60/mo', '60+/mo'],
  problem_prompt: 'What is your biggest lead follow-up challenge?',
};

export default function IndustryQualificationForm({ industrySlug = '', industryName = 'Your Industry' }) {
  const q = INDUSTRY_QUESTIONS[industrySlug] || DEFAULT_QUESTION;

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    business_name: '',
    lead_volume: '',
    problem: '',
    consent: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showFloat, setShowFloat] = useState(false);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const allValid = Boolean(
    form.full_name.trim() &&
    EMAIL_RE.test(form.email) &&
    form.phone.replace(/\D/g, '').length >= 10 &&
    form.business_name.trim() &&
    form.lead_volume &&
    form.problem.trim() &&
    form.consent
  );

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Required';
    if (!form.email.trim() || !EMAIL_RE.test(form.email)) e.email = 'Valid email required';
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) e.phone = 'Valid phone required';
    if (!form.business_name.trim()) e.business_name = 'Required';
    if (!form.lead_volume) e.lead_volume = 'Please select an option';
    if (!form.problem.trim()) e.problem = 'Required';
    if (!form.consent) e.consent = 'Consent required to continue';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      trackCTA(`industry_qualification_submit_${industrySlug}`, `/${industrySlug}`);
      // PART 3 FIX: Normalize lead payload to ensure all required fields are present
      const normalizedPayload = normalizeIndustryLeadPayload({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        business_name: form.business_name,
        industrySlug,
        leadType: 'industry_qualification',
        urgency: form.lead_volume || 'not_selected',
        serviceRequested: 'automation_audit',
        sourcePage: `/${industrySlug}`,
        packageTier: 'not_selected',
        problem: `[Volume: ${form.lead_volume}] ${form.problem}`,
        consent_given: form.consent,
        consent_source: `industry_page_${industrySlug}`,
      });
      await base44.functions.invoke('submitLeadCapture', {
        ...normalizedPayload,
        business_type: industryName,
        source: 'industry_qualification_form',
        intake_type: 'industry_qualification',
      });
      setSubmitted(true);
      setShowFloat(true);
    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <CSConfirmationCard
        title="We'll Be In Touch"
        message="Your qualification has been received. Our team will review your answers and reach out within one business day to discuss your automation options."
        responseTime="within 1 business day"
        nextSteps={[
          'Our team reviews your qualification answers',
          'We reach out to discuss your automation options',
          'No demos, no sales pressure — just a tailored recommendation',
        ]}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Your Name" required error={errors.full_name}>
          <QInput
            value={form.full_name}
            onChange={v => update('full_name', v)}
            placeholder="Jane Smith"
            autoComplete="name"
            allValid={allValid}
          />
        </Field>
        <Field label="Business Name" required error={errors.business_name}>
          <QInput
            value={form.business_name}
            onChange={v => update('business_name', v)}
            placeholder="ABC Roofing Co."
            autoComplete="organization"
            allValid={allValid}
          />
        </Field>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Business Email" required error={errors.email}>
          <QInput
            type="email"
            value={form.email}
            onChange={v => update('email', v)}
            placeholder="owner@yourbiz.com"
            autoComplete="email"
            allValid={allValid}
          />
        </Field>
        <Field label="Business Phone" required error={errors.phone}>
          <QInput
            type="tel"
            value={form.phone}
            onChange={v => update('phone', formatPhone(v))}
            placeholder="(602) 555-0100"
            autoComplete="tel"
            allValid={allValid}
          />
        </Field>
      </div>

      {/* Industry-specific volume question */}
      <Field label={q.label} required error={errors.lead_volume}>
        <div className="flex flex-wrap gap-2 pt-1">
          {q.options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => update('lead_volume', opt)}
              className="rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all"
              style={{
                borderColor: form.lead_volume === opt ? '#003B8F' : '#e2e8f0',
                background: form.lead_volume === opt ? 'rgba(0,59,143,0.06)' : '#fff',
                color: form.lead_volume === opt ? '#003B8F' : '#475569',
              }}
            >
              {form.lead_volume === opt && '✓ '}{opt}
            </button>
          ))}
        </div>
      </Field>

      {/* Industry-specific problem prompt */}
      <Field label={q.problem_prompt} required error={errors.problem}>
        <div className="relative">
          <textarea
            value={form.problem}
            onChange={e => update('problem', e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 pr-9 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-all"
            placeholder="Describe what's happening now with your leads..."
          />
          {allValid && !errors.problem && form.problem.trim() && (
            <CheckCircle2 className="absolute right-2.5 top-3 w-4 h-4 text-green-500 pointer-events-none" />
          )}
        </div>
      </Field>

      {/* Consent */}
      <div className="rounded-lg border border-border p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={e => update('consent', e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-sm text-muted-foreground leading-relaxed">
            I consent to be contacted by ClientSurge Systems via SMS and email about automation options for my business. Reply STOP to opt out at any time.{' '}
            <a href="/privacy-policy" className="text-primary underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          </span>
        </label>
        {errors.consent && <p className="text-xs text-red-500 mt-2 ml-7">{errors.consent}</p>}
      </div>

      {errors.submit && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full cs-btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ minHeight: '48px', borderRadius: '9999px' }}
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
          : <>Get My Free Automation Audit <ArrowRight className="w-4 h-4" /></>
        }
      </button>

      <p className="text-center text-xs text-muted-foreground">
        No spam. No pressure. Just a tailored recommendation from our team.
      </p>

      <FloatingConfirmation
        show={showFloat}
        onDismiss={() => setShowFloat(false)}
        title="Audit Request Received"
        message="Our team will review your answers and reach out within one business day to discuss your automation options."
      />
    </form>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-foreground">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function QInput({ type = 'text', value, onChange, placeholder, autoComplete = '', allValid = false }) {
  const showCheck = allValid && value && value.trim().length > 0;

  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-3 py-2.5 pr-9 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
      />
      {showCheck && (
        <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 pointer-events-none" />
      )}
    </div>
  );
}