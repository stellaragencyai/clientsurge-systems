import { useState } from 'react';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import OnboardingProgressTracker from '../onboarding/OnboardingProgressTracker';
import ExpectationsChecklist from '../onboarding/ExpectationsChecklist';

/**
 * Post-Onboarding Flow
 * Displayed after form submission to set expectations and provide next steps
 */
export default function PostOnboardingFlow({ businessName, email }) {
  const [activeTab, setActiveTab] = useState('expectations');

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Success header */}
        <div className="text-center mb-12">
          <div className="mb-6 flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-primary" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Onboarding Submitted!
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            Thank you, {businessName} — your system is being set up now.
          </p>
          <p className="text-sm text-muted-foreground">
            We've sent confirmation to <span className="font-semibold text-foreground">{email}</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          {[
            { id: 'expectations', label: 'What to Expect' },
            { id: 'timeline', label: 'Setup Timeline' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-2xl border border-border p-8 mb-8">
          {activeTab === 'expectations' && <ExpectationsChecklist />}
          {activeTab === 'timeline' && <OnboardingProgressTracker currentStep={2} completedSteps={[1]} />}
        </div>

        {/* Next steps */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">What Happens Next</h3>

          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-white p-5 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 font-semibold text-primary text-sm">
                1
              </div>
              <div>
                <p className="font-semibold text-foreground">Check your email</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We've sent your portal login credentials and a guide to the email you provided. Check your spam folder if you don't see it.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-5 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 font-semibold text-primary text-sm">
                2
              </div>
              <div>
                <p className="font-semibold text-foreground">AI generates your messaging</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Within 1 hour, our system creates personalized SMS and email templates based on your brand voice and business details.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-5 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 font-semibold text-primary text-sm">
                3
              </div>
              <div>
                <p className="font-semibold text-foreground">Admin review & approval</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Our team reviews your setup within 24 hours. You'll get a message if we need any adjustments.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-5 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 font-semibold text-primary text-sm">
                4
              </div>
              <div>
                <p className="font-semibold text-foreground">Testing & go-live</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We run final tests to make sure everything works perfectly. Once confirmed, your system goes live and starts capturing leads.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-foreground mb-1">Portal Ready to Explore</h4>
            <p className="text-sm text-muted-foreground">
              Log into your portal to track setup progress and view your lead system in real time.
            </p>
          </div>
          <a
            href="/client-portal"
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap ml-4 flex-shrink-0"
          >
            Go to Portal
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Support note */}
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Have questions?</p>
              <p className="text-sm text-blue-700 mt-1">
                Visit your portal's Support & Messaging tab or reply to the setup email. Our team responds within 2 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}