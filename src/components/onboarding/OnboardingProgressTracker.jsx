import { CheckCircle2, Clock } from 'lucide-react';

const SETUP_STEPS = [
  { id: 1, label: 'Business Info Submitted', time: '2 min' },
  { id: 2, label: 'Twilio SMS Configured', time: '5 min' },
  { id: 3, label: 'Email Templates Set', time: '5 min' },
  { id: 4, label: 'Booking Flow Linked', time: '3 min' },
  { id: 5, label: 'AI Message Generation', time: 'Automatic' },
  { id: 6, label: 'Admin Review & Approval', time: '24 hours' },
  { id: 7, label: 'Final Testing', time: '1-2 hours' },
  { id: 8, label: 'System Live', time: '✓ Go-Live' },
];

export default function OnboardingProgressTracker({ currentStep = 1, completedSteps = [] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Setup Timeline</h3>
        <span className="text-sm text-muted-foreground">{Math.round((completedSteps.length / SETUP_STEPS.length) * 100)}% Complete</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(completedSteps.length / SETUP_STEPS.length) * 100}%` }}
        />
      </div>

      {/* Steps list */}
      <div className="space-y-3">
        {SETUP_STEPS.map((step, idx) => {
          const isCompleted = completedSteps.includes(step.id);
          const isActive = currentStep === step.id;
          const isPast = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-start gap-4">
              {/* Connector line */}
              {idx < SETUP_STEPS.length - 1 && (
                <div
                  className="absolute left-6 top-12 w-0.5 h-6"
                  style={{ background: isPast ? '#0077B6' : '#e5e7eb' }}
                />
              )}

              {/* Step indicator */}
              <div className="relative flex-shrink-0">
                {isCompleted ? (
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                ) : (
                  <div
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-semibold text-sm transition-all ${
                      isActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background'
                    }`}
                  >
                    {step.id}
                  </div>
                )}
              </div>

              {/* Step info */}
              <div className="flex-1 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <p className={`font-medium ${isCompleted || isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </p>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {step.time}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current step helper */}
      <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-medium text-foreground mb-1">
          Current Step: {SETUP_STEPS.find(s => s.id === currentStep)?.label}
        </p>
        <p className="text-xs text-muted-foreground">
          You're {currentStep} of {SETUP_STEPS.length} steps through the setup process. {currentStep === SETUP_STEPS.length ? 'Your system is live!' : 'Keep going — almost there!'}
        </p>
      </div>
    </div>
  );
}