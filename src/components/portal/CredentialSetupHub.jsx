import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Lock, Shield, Zap, MessageSquare, Mail, Calendar, 
  ArrowRight, CheckCircle2, AlertCircle, X, Loader2
} from 'lucide-react';

/**
 * CredentialSetupHub - Post-Purchase Credential Entry Hub
 * 
 * Guides clients through essential credential setup for immediate automation launch.
 * Focuses on: SMS (Twilio), Email (Resend), and Booking Link
 * 
 * Features:
 * - Clean checklist-style layout
 * - Security-focused messaging
 * - One credential set at a time
 * - Instant "Launch" button when essentials complete
 */

const CREDENTIAL_SETS = [
  {
    id: 'sms',
    icon: MessageSquare,
    title: 'SMS Setup',
    description: 'Enable instant text responses to new leads',
    essential: true,
    fields: [
      { name: 'twilio_number', label: 'Twilio Phone Number', placeholder: '+1 (555) 000-0000', type: 'tel', hint: 'Your Twilio-assigned number' },
      { name: 'sms_template', label: 'Instant Response Template', placeholder: 'Hi {first_name}! We got your message...', type: 'textarea', hint: 'Keep under 160 characters' },
    ]
  },
  {
    id: 'email',
    icon: Mail,
    title: 'Email Setup',
    description: 'Send confirmation & follow-up emails automatically',
    essential: true,
    fields: [
      { name: 'from_email', label: 'From Email Address', placeholder: 'hello@yourbusiness.com', type: 'email', hint: 'Where automated emails come from' },
      { name: 'email_template', label: 'Lead Confirmation Email', placeholder: 'Hi {first_name}, thanks for reaching out...', type: 'textarea', hint: 'Sent to every new lead automatically' },
    ]
  },
  {
    id: 'booking',
    icon: Calendar,
    title: 'Booking Link',
    description: 'Direct leads to your scheduling system',
    essential: true,
    fields: [
      { name: 'booking_link', label: 'Booking / Scheduling Link', placeholder: 'https://calendly.com/yourbusiness', type: 'url', hint: 'Calendly, Acuity, Google Calendar, etc.' },
    ]
  },
];

function CredentialCard({ set, completed, active, onClick }) {
  const Icon = set.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        completed
          ? 'border-green-300 bg-green-50'
          : active
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/30'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          completed ? 'bg-green-200' : active ? 'bg-primary/20' : 'bg-muted'
        }`}>
          {completed ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-foreground">{set.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{set.description}</p>
          {set.essential && (
            <span className="text-xs font-bold text-primary mt-1 inline-block">⚡ Essential</span>
          )}
        </div>
        {completed && <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />}
      </div>
    </button>
  );
}

function FieldInput({ field, value, onChange }) {
  if (field.type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={3}
        className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
      />
    );
  }
  return (
    <input
      type={field.type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder}
      className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
}

export default function CredentialSetupHub({ project, onComplete, onDismiss }) {
  const [activeSet, setActiveSet] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState({});

  const [credentials, setCredentials] = useState({
    twilio_number: project?.twilio_number || '',
    sms_template: project?.sms_template || '',
    from_email: project?.resend_from_email || '',
    email_template: project?.email_confirmation_template || '',
    booking_link: project?.booking_link || '',
  });

  const currentSet = CREDENTIAL_SETS[activeSet];
  const essentialsComplete = CREDENTIAL_SETS.filter(s => s.essential).every(
    s => completed[s.id]
  );

  const validateSet = (setId) => {
    if (setId === 'sms') {
      return credentials.twilio_number.trim() && credentials.sms_template.trim();
    }
    if (setId === 'email') {
      return credentials.from_email.trim() && credentials.email_template.trim();
    }
    if (setId === 'booking') {
      return credentials.booking_link.trim();
    }
    return false;
  };

  const handleSaveSet = async () => {
    if (!validateSet(currentSet.id)) {
      setError(`Please fill in all required fields for ${currentSet.title}`);
      return;
    }

    setError('');
    setSaving(true);
    try {
      await base44.functions.invoke('saveClientCredentials', {
        project_id: project.id,
        twilio_number: credentials.twilio_number,
        sms_template: credentials.sms_template,
        from_email: credentials.from_email,
        email_template: credentials.email_template,
        booking_link: credentials.booking_link,
      });

      setCompleted(prev => ({ ...prev, [currentSet.id]: true }));
      
      // Move to next incomplete set or show completion
      const nextIncomplete = CREDENTIAL_SETS.findIndex(
        s => !completed[s.id] && s.id !== currentSet.id
      );
      if (nextIncomplete !== -1) {
        setActiveSet(nextIncomplete);
      }
    } catch (err) {
      setError(err?.data?.error || 'Failed to save credentials. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLaunchAutomation = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke('saveClientCredentials', {
        project_id: project.id,
        credentials_complete: true,
        twilio_number: credentials.twilio_number,
        sms_template: credentials.sms_template,
        from_email: credentials.from_email,
        email_template: credentials.email_template,
        booking_link: credentials.booking_link,
      });
      onComplete?.();
    } catch (err) {
      setError(err?.data?.error || 'Launch failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Secure Credential Setup</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter your business credentials below. All data is encrypted and never shared.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credential Checklist */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Setup Checklist</p>
          {CREDENTIAL_SETS.map((set, idx) => (
            <CredentialCard
              key={set.id}
              set={set}
              completed={completed[set.id]}
              active={activeSet === idx}
              onClick={() => setActiveSet(idx)}
            />
          ))}

          {/* Launch Button */}
          <button
            onClick={handleLaunchAutomation}
            disabled={!essentialsComplete || saving}
            className={`w-full mt-4 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-white ${
              essentialsComplete
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Launch Automation Now
              </>
            )}
          </button>
          
          {!essentialsComplete && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Complete all fields to launch
            </p>
          )}
        </div>

        {/* Credential Entry Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-border p-6">
            {/* Step Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
                {(() => {
                  const Icon = currentSet.icon;
                  return <Icon className="w-6 h-6 text-primary" />;
                })()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{currentSet.title}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{currentSet.description}</p>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-5 mb-6">
              {currentSet.fields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    {field.label}
                  </label>
                  {field.hint && (
                    <p className="text-xs text-muted-foreground mb-2">{field.hint}</p>
                  )}
                  <FieldInput
                    field={field}
                    value={credentials[field.name] || ''}
                    onChange={v => setCredentials(prev => ({ ...prev, [field.name]: v }))}
                  />
                </div>
              ))}
            </div>

            {/* Security Note */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-6">
              <div className="flex gap-3">
                <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900">
                  <p className="font-semibold">🔒 Your data is secure</p>
                  <p className="mt-1">All credentials are encrypted in transit and at rest. We never display your keys after saving.</p>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-4 flex gap-3">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSaveSet}
              disabled={saving}
              className="w-full py-2.5 px-4 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Save {currentSet.title}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}