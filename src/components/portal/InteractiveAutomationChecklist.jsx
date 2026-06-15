import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function InteractiveAutomationChecklist({ steps, onStepVerify }) {
  const [verifiedSteps, setVerifiedSteps] = useState(new Set());
  const [expandedStep, setExpandedStep] = useState(null);

  const handleVerify = async (stepId, instructions) => {
    // Self-verification: user confirms they completed the step
    try {
      // Call backend to mark step as verified
      const response = await fetch('/api/automation-checklist-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_id: stepId, verified_at: new Date().toISOString() }),
      });
      
      if (response.ok) {
        setVerifiedSteps(prev => new Set([...prev, stepId]));
        if (onStepVerify) onStepVerify(stepId);
      }
    } catch (err) {
      console.error('Failed to verify step:', err);
    }
  };

  const progressPercent = Math.round((verifiedSteps.size / steps.length) * 100);

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Setup Checklist</h3>
          <span className="text-sm font-bold text-primary">{progressPercent}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary rounded-full h-2 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step) => {
          const isVerified = verifiedSteps.has(step.id);
          const isExpanded = expandedStep === step.id;

          return (
            <button
              key={step.id}
              onClick={() => setExpandedStep(isExpanded ? null : step.id)}
              className="w-full rounded-lg border border-border p-4 text-left hover:bg-muted transition-colors"
            >
              <div className="flex items-start gap-3">
                {isVerified ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-semibold ${isVerified ? 'line-through text-gray-500' : ''}`}>
                    {step.title}
                  </p>
                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-border text-sm text-muted-foreground space-y-2">
                      <p>{step.description}</p>
                      {step.instructions && (
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          {step.instructions.map((instr, idx) => (
                            <li key={idx}>{instr}</li>
                          ))}
                        </ul>
                      )}
                      {!isVerified && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerify(step.id, step.instructions);
                          }}
                          className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90"
                        >
                          ✓ Mark Complete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}