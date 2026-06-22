import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2, Mail, MessageSquare, Globe, Calendar, Phone, ExternalLink, Building2 } from 'lucide-react';

const STEPS = [
  { id: 'welcome', title: 'Welcome to ClientSurge', description: 'Let\'s set up your lead automation system in a few quick steps.' },
  { id: 'business', title: 'Your Business Details', description: 'Tell us about your website and domain so we can connect everything.' },
  { id: 'booking', title: 'Connect Your Booking Link', description: 'Paste your Calendly or scheduling link so leads can book appointments automatically.' },
  { id: 'channels', title: 'Notification Channels', description: 'Choose how you want to receive lead notifications.' },
  { id: 'preferences', title: 'Notification Preferences', description: 'Tell us when and how often you want to be notified.' },
  { id: 'complete', title: 'You\'re All Set!', description: 'Your system is ready to start capturing and nurturing leads.' },
];

export default function ClientOnboardingWizard({ project, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    business_website: '',
    booking_link: project?.booking_link || '',
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
        <div className="p-8 md:p-12 max-h-[75vh] overflow-y-auto">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">
                Step {currentStep + 1} of {STEPS.length}
              </p>
              <h2 className="text-3xl font-semibold text-foreground mt-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>{step.title}</h2>
              <p className="text-muted-foreground mt-1">{step.description}</p>
            </div>
            {currentStep === STEPS.length - 1 && (
              <CheckCircle2 className="w-12 h-12 text-green-500 flex-shrink-0" />
            )}
          </div>

          {/* Step Content */}
          <div className="space-y-6 min-h-48">
            {step.id === 'welcome' && <WelcomeStep />}
            {step.id === 'business' && <BusinessStep formData={formData} onChange={handleInputChange} />}
            {step.id === 'booking' && <BookingStep formData={formData} onChange={handleInputChange} />}
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
          <div className="flex items-center justify-between gap-4 mt-12 pt-8 border-t border-border">
            <button
              onClick={handlePrev}
              disabled={isFirstStep || saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {!isLastStep ? (
              <button
                onClick={handleNext}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium transition-all disabled:opacity-60"
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
                className="flex items-center gap-2 px-8 py-2.5 rounded-lg text-white font-medium transition-all disabled:opacity-60"
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
      <div className="rounded-2xl p-8" style={{ background: 'rgba(0,174,239,0.06)', border: '1px solid rgba(0,174,239,0.15)' }}>
        <p className="text-lg text-foreground leading-relaxed mb-4">
          Your lead automation system is ready to work for you. In the next few steps, we'll configure:
        </p>
        <ul className="space-y-3">
          {[
            { icon: Globe, text: 'Your website and domain connection' },
            { icon: Calendar, text: 'Your booking/scheduling link' },
            { icon: Mail, text: 'How to receive notifications (email, SMS, or both)' },
            { icon: MessageSquare, text: 'When to get notified (new leads, replies, bookings)' },
          ].map(({ icon: Icon, text }, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,174,239,0.1)' }}>
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-foreground">{text}</span>
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

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-2">
          <span className="text-amber-600 font-bold text-sm">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-900">Domain Verification</p>
            <p className="text-xs text-amber-800 mt-0.5">
              If you want us to send emails from your domain (e.g., leads@yourbusiness.com), we'll send you DNS instructions after this wizard.
            </p>
          </div>
        </div>
      </div>
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

      <div className="grid grid-cols-2 gap-3">
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

function ChannelsStep({ formData, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
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

        <label className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
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
        <p className="text-lg text-foreground leading-relaxed">
          ✅ Business details configured
        </p>
        <p className="text-lg text-foreground leading-relaxed">
          ✅ Booking link connected
        </p>
        <p className="text-lg text-foreground leading-relaxed">
          ✅ Notification preferences saved
        </p>
        <p className="text-lg text-foreground leading-relaxed">
          ✅ System ready to capture leads
        </p>
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