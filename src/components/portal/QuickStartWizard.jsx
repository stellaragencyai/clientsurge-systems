import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  ArrowRight, ArrowLeft, CheckCircle2, Loader2,
  Building2, MessageSquare, Mail, Calendar, Rocket, Sparkles, X,
} from 'lucide-react';

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { id: 'welcome',        icon: Sparkles,      title: 'Welcome to Quick Start',         desc: 'Get your lead system live in under 10 minutes.' },
  { id: 'business',       icon: Building2,     title: 'Your Business Details',           desc: 'Tell us about your business so we can personalise your system.' },
  { id: 'sms',            icon: MessageSquare, title: 'Connect SMS',                     desc: 'Set up automated text messaging for new leads.' },
  { id: 'email',          icon: Mail,          title: 'Connect Email',                   desc: 'Configure outbound emails for confirmations and follow-ups.' },
  { id: 'booking',        icon: Calendar,      title: 'Booking Flow',                    desc: 'Configure how leads get turned into booked appointments.' },
  { id: 'complete',       icon: Rocket,        title: 'You\'re All Set!',               desc: 'Your system is configured and ready to capture leads.' },
];

const STEP_HELP_RESOURCES = {
  business: [
    { label: "Brand voice examples", href: "/contact" },
    { label: "Need help with business hours?", href: "mailto:support@clientsurgesystems.com?subject=Quick%20Start%20Help%20-%20Business%20Details" },
  ],
  sms: [
    { label: "Get Twilio setup help", href: "mailto:support@clientsurgesystems.com?subject=Quick%20Start%20Help%20-%20SMS%20Setup" },
    { label: "Book a setup walkthrough", href: "/book" },
  ],
  email: [
    { label: "Email template examples", href: "mailto:support@clientsurgesystems.com?subject=Quick%20Start%20Help%20-%20Email%20Templates" },
    { label: "Verify your sending domain with us", href: "/contact" },
  ],
  booking: [
    { label: "Calendar integration help", href: "mailto:support@clientsurgesystems.com?subject=Quick%20Start%20Help%20-%20Booking%20Flow" },
    { label: "Review your booking flow live", href: "/book" },
  ],
};

// ── Field helpers ─────────────────────────────────────────────────────────────

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', prefix }) {
  return (
    <div className={`flex items-center rounded-xl border border-border focus-within:ring-2 focus-within:ring-primary overflow-hidden bg-white ${prefix ? 'pl-3' : ''}`}>
      {prefix && <span className="text-muted-foreground text-sm mr-1 flex-shrink-0">{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-4 py-2.5 text-sm outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
      />
    </div>
  );
}

function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="">— Select —</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function OptionCard({ icon: Icon, title, desc, selected, onClick, color = '#0088CC' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selected ? 'bg-primary/5' : 'border-border hover:border-primary/30'}`}
      style={selected ? { borderColor: color } : {}}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: selected ? `${color}20` : '#f3f4f6' }}>
          <Icon className="w-4 h-4" style={{ color: selected ? color : '#9ca3af' }} />
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
        {selected && <CheckCircle2 className="w-4 h-4 ml-auto flex-shrink-0 mt-0.5" style={{ color }} />}
      </div>
    </button>
  );
}

// ── Step components ───────────────────────────────────────────────────────────

function WelcomeStep({ project }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-6" style={{ background: 'rgba(0,174,239,0.06)', border: '1px solid rgba(0,174,239,0.15)' }}>
        <p className="font-semibold text-foreground mb-4">
          Hi {project.business_name} 👋 — let's get your system fully configured in 5 steps:
        </p>
        <div className="space-y-3">
          {[
            { icon: Building2, label: 'Business Details', desc: 'Name, industry, brand voice & hours' },
            { icon: MessageSquare, label: 'SMS Setup', desc: 'Twilio number & instant response template' },
            { icon: Mail, label: 'Email Setup', desc: 'From address & confirmation template' },
            { icon: Calendar, label: 'Booking Flow', desc: 'Booking link, calendar system & consultation settings' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,174,239,0.12)' }}>
                <Icon className="w-4 h-4" style={{ color: '#0088CC' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <span className="font-semibold">💡 Tip:</span> You can come back and edit any of these settings at any time from the Settings tab.
      </div>
    </div>
  );
}

function BusinessStep({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Business Name">
          <TextInput value={data.business_name} onChange={v => onChange('business_name', v)} placeholder="Acme Landscaping" />
        </Field>
        <Field label="Industry / Niche">
          <TextInput value={data.industry} onChange={v => onChange('industry', v)} placeholder="e.g. Landscaping, Med Spa…" />
        </Field>
        <Field label="Business Phone" hint="The number customers call you on">
          <TextInput value={data.phone} onChange={v => onChange('phone', v)} placeholder="+1 (555) 000-0000" type="tel" />
        </Field>
        <Field label="Website URL">
          <TextInput value={data.website} onChange={v => onChange('website', v)} placeholder="https://yourbusiness.com" prefix="🌐" />
        </Field>
      </div>
      <Field label="Brand Voice" hint="How should your automated messages sound?">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {['Professional', 'Friendly', 'Luxury', 'Casual'].map(v => (
            <button
              key={v}
              type="button"
              onClick={() => onChange('brand_voice', v)}
              className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${data.brand_voice === v ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Business Hours" hint="When are you available?">
        <TextInput value={data.business_hours} onChange={v => onChange('business_hours', v)} placeholder="Mon–Fri 9am–6pm, Sat 10am–4pm" />
      </Field>
    </div>
  );
}

function SmsStep({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <span className="font-semibold">📱 How SMS works:</span> When a new lead contacts you, your system sends an instant automated text within seconds. Provide your Twilio number and message template below.
      </div>
      <Field label="Twilio Phone Number" hint="The number your automated SMS messages are sent from">
        <TextInput value={data.twilio_number} onChange={v => onChange('twilio_number', v)} placeholder="+1 (555) 000-0000" type="tel" />
      </Field>
      <Field label="Instant Response SMS Template" hint="Use {first_name} to personalise. Keep it short and friendly.">
        <textarea
          value={data.sms_template}
          onChange={e => onChange('sms_template', e.target.value)}
          placeholder={`Hi {first_name}! Thanks for reaching out to [Your Business]. We got your message and will be in touch shortly. Want to book a time? [Booking Link]`}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">{data.sms_template?.length || 0} / 160 characters recommended</p>
      </Field>
      <Field label="Missed Call Text-Back Template" hint="Sent automatically when a call is missed">
        <textarea
          value={data.missed_call_sms}
          onChange={e => onChange('missed_call_sms', e.target.value)}
          placeholder={`Hi! Sorry I missed your call. I'm with a client right now — can I text you back? What's the best time to reach you?`}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </Field>
    </div>
  );
}

function EmailStep({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <span className="font-semibold">✉️ How email works:</span> Confirmation and follow-up emails go out automatically. Configure your sending address and default template below.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="From Email Address" hint="The address emails are sent from">
          <TextInput value={data.from_email} onChange={v => onChange('from_email', v)} placeholder="hello@yourbusiness.com" type="email" />
        </Field>
        <Field label="Reply-To Address" hint="Where replies from leads go">
          <TextInput value={data.reply_to_email} onChange={v => onChange('reply_to_email', v)} placeholder="you@yourbusiness.com" type="email" />
        </Field>
      </div>
      <Field label="Lead Confirmation Email Subject">
        <TextInput value={data.email_subject} onChange={v => onChange('email_subject', v)} placeholder="Thanks for reaching out, {first_name}!" />
      </Field>
      <Field label="Lead Confirmation Email Body" hint="Sent to every new lead. Use {first_name}, {business_name}, {booking_link}.">
        <textarea
          value={data.email_template}
          onChange={e => onChange('email_template', e.target.value)}
          placeholder={`Hi {first_name},\n\nThank you for contacting {business_name}! We've received your message and will be in touch shortly.\n\nWant to schedule a time to chat? Book here: {booking_link}\n\nTalk soon,\nThe {business_name} Team`}
          rows={6}
          className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </Field>
    </div>
  );
}

function BookingStep({ data, onChange }) {
  return (
    <div className="space-y-5">
      <Field label="Booking / Scheduling Link" hint="Where leads go to book an appointment (Calendly, Acuity, etc.)">
        <TextInput value={data.booking_link} onChange={v => onChange('booking_link', v)} placeholder="https://calendly.com/yourbusiness" prefix="🔗" />
      </Field>
      <Field label="Calendar System">
        <SelectInput
          value={data.calendar_system}
          onChange={v => onChange('calendar_system', v)}
          options={[
            { value: 'Calendly', label: 'Calendly' },
            { value: 'Acuity', label: 'Acuity Scheduling' },
            { value: 'Google Calendar', label: 'Google Calendar' },
            { value: 'Outlook', label: 'Outlook / Microsoft 365' },
            { value: 'Square Appointments', label: 'Square Appointments' },
            { value: 'HoneyBook', label: 'HoneyBook' },
            { value: 'other', label: 'Other' },
          ]}
        />
      </Field>
      <Field label="Does a client need a consultation before booking?">
        <div className="grid grid-cols-2 gap-3">
          {['Yes', 'No'].map(v => (
            <button
              key={v}
              type="button"
              onClick={() => onChange('requires_consultation', v)}
              className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${data.requires_consultation === v ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Typical Response Speed" hint="How fast do you normally respond to new leads?">
        <div className="grid grid-cols-2 gap-2">
          {['Immediately', 'Within 1 hour', 'Same day', 'Longer'].map(v => (
            <button
              key={v}
              type="button"
              onClick={() => onChange('response_speed', v)}
              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all text-left px-3 ${data.response_speed === v ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Common Customer Questions" hint="What do leads usually ask you? We'll train your system to answer these.">
        <textarea
          value={data.customer_questions}
          onChange={e => onChange('customer_questions', e.target.value)}
          placeholder="e.g. What are your prices? Do you service my area? How long does it take?"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </Field>
    </div>
  );
}

function CompleteStep({ data }) {
  const completedSections = [
    { label: 'Business Details', done: !!data.business_name },
    { label: 'SMS Setup', done: !!data.twilio_number && !!data.sms_template },
    { label: 'Email Setup', done: !!data.from_email && !!data.email_template },
    { label: 'Booking Flow', done: !!data.booking_link },
  ];
  const allDone = completedSections.every(s => s.done);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {completedSections.map(s => (
          <div key={s.label} className={`flex items-center gap-3 p-3 rounded-xl border ${s.done ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
            {s.done
              ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              : <span className="w-5 h-5 flex-shrink-0 text-amber-600 font-bold text-sm">!</span>}
            <p className={`text-sm font-semibold ${s.done ? 'text-green-900' : 'text-amber-900'}`}>{s.label}</p>
            <span className="ml-auto text-xs font-medium">{s.done ? 'Configured ✓' : 'Incomplete'}</span>
          </div>
        ))}
      </div>

      <div
        className="rounded-2xl p-6 text-center"
        style={{ background: allDone ? 'rgba(16,185,129,0.06)' : 'rgba(0,174,239,0.06)', border: `1px solid ${allDone ? 'rgba(16,185,129,0.2)' : 'rgba(0,174,239,0.15)'}` }}
      >
        <p className="text-2xl mb-2">{allDone ? '🚀' : '🎯'}</p>
        <p className="font-semibold text-foreground">
          {allDone
            ? 'Your system is fully configured and ready to capture leads!'
            : 'Good start! You can complete the remaining steps from the Settings tab anytime.'}
        </p>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Our team will review your configuration and have your system live within 24–48 hours.
      </p>
    </div>
  );
}

// ── Step nav dot ──────────────────────────────────────────────────────────────

function StepDot({ index, currentStep, total }) {
  const done = index < currentStep;
  const active = index === currentStep;
  return (
    <div className="flex items-center gap-1">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
          done ? 'bg-green-500 text-white' : active ? 'text-white' : 'bg-muted text-muted-foreground'
        }`}
        style={active ? { background: 'linear-gradient(135deg,#003B8F,#0088CC)' } : {}}
      >
        {done ? '✓' : index + 1}
      </div>
      {index < total - 1 && (
        <div className={`h-0.5 w-6 sm:w-10 rounded-full transition-all ${done ? 'bg-green-400' : 'bg-border'}`} />
      )}
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function QuickStartWizard({ project, onComplete, onDismiss }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [data, setData] = useState({
    // Business
    business_name: project?.business_name || '',
    industry: project?.industry || '',
    phone: project?.phone || '',
    website: project?.website || '',
    brand_voice: project?.brand_voice || 'Friendly',
    business_hours: project?.business_hours || '',
    // SMS
    twilio_number: project?.twilio_number || '',
    sms_template: project?.sms_template || '',
    missed_call_sms: project?.missed_call_sms_template || '',
    // Email
    from_email: project?.resend_from_email || '',
    reply_to_email: project?.lead_notification_email || '',
    email_subject: '',
    email_template: project?.email_confirmation_template || '',
    // Booking
    booking_link: project?.booking_link || '',
    calendar_system: project?.calendar_system || '',
    requires_consultation: project?.requires_consultation || '',
    response_speed: project?.response_speed || '',
    customer_questions: project?.customer_questions || '',
  });

  const onChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;
  const helpLinks = STEP_HELP_RESOURCES[step.id] || [];

  const saveAndAdvance = async () => {
    setError('');
    setSaving(true);
    try {
      await base44.functions.invoke('saveQuickStartConfig', {
        project_id: project.id,
        business_name: data.business_name,
        industry: data.industry,
        phone: data.phone,
        website: data.website,
        brand_voice: data.brand_voice,
        business_hours: data.business_hours,
        booking_link: data.booking_link,
        calendar_system: data.calendar_system,
        requires_consultation: data.requires_consultation,
        response_speed: data.response_speed,
        customer_questions: data.customer_questions,
        quick_start_completed: true,
        twilio_number: data.twilio_number,
        sms_template: data.sms_template,
        missed_call_sms_template: data.missed_call_sms,
        resend_from_email: data.from_email,
        lead_notification_email: data.reply_to_email,
        email_confirmation_template: data.email_template,
      });
      onComplete?.();
    } catch (err) {
      setError(err?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (isLast) {
      await saveAndAdvance();
    } else {
      setCurrentStep(s => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Top bar */}
        <div style={{ background: 'linear-gradient(135deg,#003B8F 0%,#006BB0 60%,#00AEEF 100%)' }} className="px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-xs font-bold text-blue-200/70 uppercase tracking-widest">Quick Start Setup</p>
            <p className="text-white font-semibold mt-0.5">{project.business_name}</p>
          </div>
          {onDismiss && (
            <button onClick={onDismiss} className="text-white/60 hover:text-white transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 flex-shrink-0">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%`, background: 'linear-gradient(90deg,#003B8F,#00AEEF)' }}
          />
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-0 px-6 py-4 border-b border-border flex-shrink-0">
          {STEPS.map((_, i) => (
            <StepDot key={i} index={i} currentStep={currentStep} total={STEPS.length} />
          ))}
        </div>

        {/* Step header */}
        <div className="px-8 pt-6 pb-2 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,174,239,0.1)' }}>
              {(() => { const Icon = step.icon; return <Icon className="w-5 h-5" style={{ color: '#0088CC' }} />; })()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{step.title}</h2>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          </div>
        </div>

        {/* Step content — scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-4">
          {step.id === 'welcome'  && <WelcomeStep project={project} />}
          {step.id === 'business' && <BusinessStep data={data} onChange={onChange} />}
          {step.id === 'sms'      && <SmsStep data={data} onChange={onChange} />}
          {step.id === 'email'    && <EmailStep data={data} onChange={onChange} />}
          {step.id === 'booking'  && <BookingStep data={data} onChange={onChange} />}
          {step.id === 'complete' && <CompleteStep data={data} />}

          {helpLinks.length > 0 && (
            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Need help?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {helpLinks.map((item) => (
                  <a
                    key={`${step.id}-${item.label}`}
                    href={item.href}
                    className="inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 px-8 py-5 border-t border-border flex-shrink-0">
          <button
            onClick={() => setCurrentStep(s => s - 1)}
            disabled={isFirst || saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <span className="text-xs text-muted-foreground">
            Step {currentStep + 1} of {STEPS.length}
          </span>

          <button
            onClick={handleNext}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{ background: isLast ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#003B8F,#0088CC)' }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isLast ? (
              <><Rocket className="w-4 h-4" /> Launch My System</>
            ) : (
              <>Next <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}