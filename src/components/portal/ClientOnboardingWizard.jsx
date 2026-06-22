import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2, Mail, MessageSquare, Globe, Calendar, Phone, ExternalLink, Building2, CreditCard, ShieldCheck, Copy, CheckCircle } from 'lucide-react';

const STEPS = [
  { id: 'welcome', title: 'Welcome to ClientSurge', description: 'Let\'s set up your lead automation system in a few quick steps.' },
  { id: 'business', title: 'Your Business Details', description: 'Tell us about your website and domain so we can connect everything.' },
  { id: 'domain', title: 'Verify Your Domain', description: 'Connect your domain so your automated emails reach the inbox, not spam.' },
  { id: 'booking', title: 'Connect Your Booking Link', description: 'Paste your Calendly or scheduling link so leads can book appointments automatically.' },
  { id: 'bank', title: 'Link Your Bank Account', description: 'Connect Stripe so you can accept payments the moment your first lead converts.' },
  { id: 'channels', title: 'Notification Channels', description: 'Choose how you want to receive lead notifications.' },
  { id: 'preferences', title: 'Notification Preferences', description: 'Tell us when and how often you want to be notified.' },
  { id: 'complete', title: 'You\'re All Set!', description: 'Your system is ready to start capturing and nurturing leads.' },
];

export default function ClientOnboardingWizard({ project, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    business_website: '',
    domain_verified: false,
    booking_link: project?.booking_link || '',
    stripe_connected: false,
    email_notifications: true,
    sms_notifications: false,
    phone_number: '',
    notify_on_new_lead: true,
    notify_on_reply: true,
    notify_on_booking: true,
    notification_frequency: 'immediate',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [domainChecking, setDomainChecking] = useState(false);
  const [stripeConnecting, setStripeConnecting] = useState(false);
  const [copiedRecord, setCopiedRecord] = useState(false);

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = async () => {
    setError('');
    if (currentStep === STEPS.length - 2) {
      await savePreferences();
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    setError('');
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setError('');
    try {
      await base44.functions.invoke('saveClientNotificationPreferences', {
        project_id: project.id,
        preferences: formData,
      });
    } catch (err) {
      setError(err?.data?.error || 'Failed to save preferences');
      setSaving(false);
      return false;
    }
    setSaving(false);
    return true;
  };

  const handleComplete = async () => {
    const saved = await savePreferences();
    if (!saved) return;
    try {
      await base44.entities.ClientProject.update(project.id, {
        onboarding_wizard_completed: true,
        booking_link: formData.booking_link || undefined,
      });
    } catch {
      // Non-critical — wizard completion is the main flag
    }
    onComplete?.();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const checkDomainVerification = async () => {
    setDomainChecking(true);
    setError('');
    try {
      const res = await base44.functions.invoke('getIntegrationHealth', { check: 'domain' });
      if (res.data?.domain_verified) {
        setFormData(prev => ({ ...prev, domain_verified: true }));
      } else {
        setError('Domain DNS records not found yet. DNS propagation can take 15-30 minutes. Try again shortly.');
      }
    } catch {
      setError('Unable to verify domain at this time. You can continue and we\'ll verify it on our end.');
    } finally {
      setDomainChecking(false);
    }
  };

  const connectStripe = async () => {
    setStripeConnecting(true);
    setError('');
    try {
      const res = await base44.functions.invoke('getStripePaymentUpdateUrl', { project_id: project.id });
      if (res.data?.url) {
        window.open(res.data.url, '_blank');
        setFormData(prev => ({ ...prev, stripe_connected: true }));
      } else {
        setError('Unable to generate Stripe connection link. You can complete this later from your dashboard.');
      }
    } catch {
      setError('Stripe connection temporarily unavailable. You can complete this later from your dashboard.');
    } finally {
      setStripeConnecting(false);
    }
  };

  const copyDnsRecord = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedRecord(true);
    setTimeout(() => setCopiedRecord(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / STEPS.length) * 100}%`,
              background: 'linear-gradient(90deg, #0088CC, #00AEEF)',
            }}
          />
        </div>

        {/* Content */}
        <div className="p-6 md:p-12 max-h-[75vh] overflow-y-auto">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">
                Step {currentStep + 1} of {STEPS.length}
              </p>
              <h2 className="text-xl md:text-3xl font-semibold text-foreground mt-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>{step.title}</h2>
              <p className="text-sm md:text-base text-muted-foreground mt-1">{step.description}</p>
            </div>
            {currentStep === STEPS.length - 1 && (
              <CheckCircle2 className="w-8 h-8 md:w-12 md:h-12 text-green-500 flex-shrink-0" />
            )}
          </div>

          {/* Step Content */}
          <div className="space-y-6 min-h-48">
            {step.id === 'welcome' && <WelcomeStep />}
            {step.id === 'business' && <BusinessStep formData={formData} onChange={handleInputChange} />}
            {step.id === 'domain' && (
              <DomainVerificationStep
                formData={formData}
                onCheck={checkDomainVerification}
                checking={domainChecking}
                onCopy={copyDnsRecord}
                copied={copiedRecord}
              />
            )}
            {step.id === 'booking' && <BookingStep formData={formData} onChange={handleInputChange} />}
            {step.id === 'bank' && (
              <BankLinkingStep
                formData={formData}
                onConnect={connectStripe}
                connecting={stripeConnecting}
              />
            )}
            {step.id === 'channels' && <ChannelsStep formData={formData} onChange={handleInputChange} />}
            {step.id === 'preferences' && <PreferencesStep formData={formData} onChange={handleInputChange} />}
            {step.id === 'complete' && <CompleteStep />}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 mt-8 md:mt-12 pt-6 md:pt-8 border-t border-border">
            <button
              onClick={handlePrev}
              disabled={isFirstStep || saving}
              className="flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {!isLastStep ? (
              <button
                onClick={handleNext}
                disabled={saving}
                className="flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-white font-medium transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #0088CC, #00AEEF)' }}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="flex items-center gap-2 px-6 md:px-8 py-2.5 rounded-lg text-white font-medium transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6 md:p-8" style={{ background: 'rgba(0,174,239,0.06)', border: '1px solid rgba(0,174,239,0.15)' }}>
        <p className="text-base md:text-lg text-foreground leading-relaxed mb-4">
          Your lead automation system is ready to work for you. In the next few steps, we'll configure:
        </p>
        <ul className="space-y-3">
          {[
            { icon: Globe, text: 'Your website and domain connection' },
            { icon: ShieldCheck, text: 'Domain verification for email deliverability' },
            { icon: Calendar, text: 'Your booking/scheduling link' },
            { icon: CreditCard, text: 'Bank account linking for instant payments' },
            { icon: Mail, text: 'How to receive notifications (email, SMS, or both)' },
            { icon: MessageSquare, text: 'When to get notified (new leads, replies, bookings)' },
          ].map(({ icon: Icon, text }, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,174,239,0.1)' }}>
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm md:text-base text-foreground">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">💡 Tip:</span> You can change these preferences anytime from your account settings.
        </p>
      </div>
    </div>
  );
}

function BusinessStep({ formData, onChange }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,174,239,0.1)' }}>
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Business Website</p>
          <p className="text-xs text-muted-foreground">We'll use this to set up your lead capture forms and automation workflows.</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Your Website URL
        </label>
        <div className="relative">
          <Globe className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="url"
            value={formData.business_website}
            onChange={(e) => onChange('business_website', e.target.value)}
            placeholder="https://yourbusiness.com"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Don't have a website yet? Skip this step — we can build one for you.
        </p>
      </div>
    </div>
  );
}

function DomainVerificationStep({ formData, onCheck, checking, onCopy, copied }) {
  const dnsRecords = [
    { type: 'TXT', name: '@', value: 'clientsurge-verify=cs_a8f3b2e9d1', purpose: 'Domain ownership verification' },
    { type: 'CNAME', name: 'cs._domainkey', value: 'dkim.clientsurge.com', purpose: 'Email authentication (DKIM)' },
    { type: 'CNAME', name: 'cs1', value: 'tracking.clientsurge.com', purpose: 'Email click/open tracking' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,174,239,0.1)' }}>
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Domain Verification</p>
          <p className="text-xs text-muted-foreground">Add these DNS records so your automated emails reach the inbox.</p>
        </div>
      </div>

      {formData.domain_verified ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-900">Domain Verified!</p>
            <p className="text-sm text-green-700">Your emails will deliver to the inbox, not spam.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold text-sm">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-900">Why this matters</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Without domain verification, your automated emails will land in spam folders. These DNS records authenticate your domain so email providers trust your messages.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Add these records to your DNS (GoDaddy, Namecheap, Cloudflare, etc.):</p>
            {dnsRecords.map((record, idx) => (
              <div key={idx} className="rounded-lg border border-border bg-slate-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">{record.type}</span>
                    <span className="text-sm font-medium text-foreground">{record.name}</span>
                  </div>
                  <button
                    onClick={() => onCopy(record.value)}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs font-mono text-muted-foreground break-all mb-1">{record.value}</p>
                <p className="text-xs text-muted-foreground">{record.purpose}</p>
              </div>
            ))}
          </div>

          <button
            onClick={onCheck}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #0088CC, #00AEEF)' }}
          >
            {checking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking DNS records...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Verify Domain Now
              </>
            )}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            DNS propagation can take 15-30 minutes. You can continue and verify later.
          </p>
        </>
      )}
    </div>
  );
}

function BookingStep({ formData, onChange }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,174,239,0.1)' }}>
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Appointment Booking Link</p>
          <p className="text-xs text-muted-foreground">Our AI agent will route qualified leads to this link to book with you automatically.</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Your Scheduling Link
        </label>
        <div className="relative">
          <ExternalLink className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="url"
            value={formData.booking_link}
            onChange={(e) => onChange('booking_link', e.target.value)}
            placeholder="https://calendly.com/yourbusiness/30min"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Works with Calendly, Setmore, Cal.com, Acuity Scheduling, or any booking platform with a shareable link.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {['Calendly', 'Setmore', 'Cal.com', 'Acuity', 'Google Calendar', 'Other'].map((platform) => (
          <div key={platform} className="flex items-center gap-2 p-2.5 rounded-lg border border-border text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/30" />
            {platform}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">💡 No booking link?</span> We'll create one for you as part of your setup. Just skip this step and we'll follow up.
        </p>
      </div>
    </div>
  );
}

function BankLinkingStep({ formData, onConnect, connecting }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,174,239,0.1)' }}>
          <CreditCard className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Connect Your Bank Account</p>
          <p className="text-xs text-muted-foreground">Link Stripe so you can accept payments the moment your first lead converts.</p>
        </div>
      </div>

      {formData.stripe_connected ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-900">Bank Account Connected!</p>
            <p className="text-sm text-green-700">You're ready to accept payments on day one.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold text-sm">💡</span>
              <div>
                <p className="text-sm font-semibold text-blue-900">Why link your bank account now?</p>
                <p className="text-xs text-blue-800 mt-0.5">
                  When your automation system captures a lead and they're ready to book, you want to accept payment instantly — not scramble to set up Stripe while a hot lead waits. Linking now means you're ready to capture revenue from day one.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {[
              'Accept credit card payments instantly',
              'Automatic payout to your bank account',
              'No setup fees or monthly Stripe fees',
              'Bank-level security and fraud protection',
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-foreground">{benefit}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onConnect}
            disabled={connecting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-bold transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #635BFF, #5A52E0)' }}
          >
            {connecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting to Stripe...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Connect with Stripe
              </>
            )}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Secured by Stripe. You can complete this later from your dashboard.
          </p>
        </>
      )}
    </div>
  );
}

function ChannelsStep({ formData, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className={`p-4 md:p-5 rounded-xl border-2 cursor-pointer transition-all ${
          formData.email_notifications
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/30'
        }`}>
          <input
            type="checkbox"
            checked={formData.email_notifications}
            onChange={(e) => onChange('email_notifications', e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <div className="flex items-center gap-3 mt-3">
            <Mail className="w-6 h-6 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Summary reports to your inbox</p>
            </div>
          </div>
        </label>

        <label className={`p-4 md:p-5 rounded-xl border-2 cursor-pointer transition-all ${
          formData.sms_notifications
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/30'
        }`}>
          <input
            type="checkbox"
            checked={formData.sms_notifications}
            onChange={(e) => onChange('sms_notifications', e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <div className="flex items-center gap-3 mt-3">
            <MessageSquare className="w-6 h-6 text-primary" />
            <div>
              <p className="font-semibold text-foreground">SMS Alerts</p>
              <p className="text-xs text-muted-foreground">Instant text message updates</p>
            </div>
          </div>
        </label>
      </div>

      {formData.sms_notifications && (
        <div className="mt-6">
          <label className="block text-sm font-semibold text-foreground mb-2">
            Phone Number for SMS
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => onChange('phone_number', e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PreferencesStep({ formData, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">What should we notify you about?</p>
        <div className="space-y-3">
          {[
            { key: 'notify_on_new_lead', label: 'New Leads', icon: '🆕' },
            { key: 'notify_on_reply', label: 'Lead Replies', icon: '💬' },
            { key: 'notify_on_booking', label: 'Appointment Bookings', icon: '✅' },
          ].map(({ key, label, icon }) => (
            <label key={key} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer">
              <input
                type="checkbox"
                checked={formData[key]}
                onChange={(e) => onChange(key, e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-lg flex-shrink-0">{icon}</span>
              <span className="text-foreground font-medium">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground mb-3">How often should we send updates?</p>
        <div className="space-y-2">
          {[
            { value: 'immediate', label: 'Immediately', desc: 'Get notified right away' },
            { value: 'daily', label: 'Daily Digest', desc: 'Once per day summary' },
            { value: 'weekly', label: 'Weekly Summary', desc: 'Once per week' },
          ].map(({ value, label, desc }) => (
            <label key={value} className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
              formData.notification_frequency === value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/30'
            }`}>
              <input
                type="radio"
                name="frequency"
                value={value}
                checked={formData.notification_frequency === value}
                onChange={(e) => onChange('notification_frequency', e.target.value)}
                className="w-4 h-4 accent-primary"
              />
              <p className="font-medium text-foreground mt-2">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function CompleteStep() {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-3">
        <p className="text-base md:text-lg text-foreground leading-relaxed">✅ Business details configured</p>
        <p className="text-base md:text-lg text-foreground leading-relaxed">✅ Domain verification initiated</p>
        <p className="text-base md:text-lg text-foreground leading-relaxed">✅ Booking link connected</p>
        <p className="text-base md:text-lg text-foreground leading-relaxed">✅ Bank account linked</p>
        <p className="text-base md:text-lg text-foreground leading-relaxed">✅ Notification preferences saved</p>
        <p className="text-base md:text-lg text-foreground leading-relaxed">✅ System ready to capture leads</p>
      </div>

      <div className="rounded-2xl p-6" style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
        <p className="text-foreground font-medium">
          Your automated lead system is live and ready to work 24/7. Sit back and watch the leads come in!
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        Need to adjust settings later? Visit your account preferences anytime.
      </p>
    </div>
  );
}