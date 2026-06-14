import { useState } from 'react';
import { Zap, CheckCircle2, Clock, Shield, ArrowRight, Sparkles } from 'lucide-react';
import CredentialSetupHub from './CredentialSetupHub';

/**
 * PostPurchaseHub - Landing page after client purchase
 * 
 * Primary focus: Credential setup for instant automation launch
 * Design: Minimal friction, clear path forward
 */

export default function PostPurchaseHub({ project, onComplete, onDismiss }) {
  const [setupStarted, setSetupStarted] = useState(false);

  if (setupStarted) {
    return (
      <CredentialSetupHub
        project={project}
        onComplete={onComplete}
        onDismiss={() => setSetupStarted(false)}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent mx-auto mb-6">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Welcome to {project?.business_name}!
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your AI automation system is ready for setup. Complete credential entry below to launch your lead capture system instantly.
        </p>
      </div>

      {/* Three-Column Value Props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="rounded-xl border border-border p-6 bg-card">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Instant Setup</h3>
          <p className="text-sm text-muted-foreground">
            Add your credentials and go live in minutes, not days.
          </p>
        </div>

        <div className="rounded-xl border border-border p-6 bg-card">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Bank-Level Security</h3>
          <p className="text-sm text-muted-foreground">
            Your API keys are encrypted and never displayed again.
          </p>
        </div>

        <div className="rounded-xl border border-border p-6 bg-card">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Real-Time Status</h3>
          <p className="text-sm text-muted-foreground">
            Watch your system go live as we configure each service.
          </p>
        </div>
      </div>

      {/* What You'll Configure */}
      <div className="rounded-xl border border-border p-8 bg-gradient-to-br from-card to-background mb-12">
        <h2 className="text-xl font-bold text-foreground mb-6">What You'll Configure (3 Steps)</h2>
        <div className="space-y-4">
          {[
            { num: 1, title: 'SMS Setup', desc: 'Your Twilio number & instant response template' },
            { num: 2, title: 'Email Setup', desc: 'Your sending address & lead confirmation email' },
            { num: 3, title: 'Booking Link', desc: 'Your scheduling system (Calendly, Acuity, etc.)' },
          ].map(step => (
            <div key={step.num} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                {step.num}
              </div>
              <div>
                <p className="font-semibold text-foreground">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-border p-8 bg-gradient-to-br from-card to-background mb-12">
        <h2 className="text-xl font-bold text-foreground mb-6">Your Go-Live Timeline</h2>
        <div className="space-y-4">
          {[
            { icon: Clock, time: '5 min', title: 'Credential Entry', desc: 'Complete setup on this page' },
            { icon: Zap, time: '1-2 min', title: 'System Provisioning', desc: 'AI configures your automations' },
            { icon: CheckCircle2, time: '0-5 min', title: 'Live & Ready', desc: 'Start capturing leads instantly' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {item.time} — {item.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => setSetupStarted(true)}
          className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-lg hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
        >
          Begin Credential Setup
          <ArrowRight className="w-5 h-5" />
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-6 py-4 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-colors"
          >
            Skip for Now
          </button>
        )}
      </div>

      {/* Trust Badge */}
      <div className="text-center mt-8 pt-8 border-t border-border">
        <p className="text-xs text-muted-foreground">
          🔒 Your credentials are encrypted with AES-256. Read our <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}