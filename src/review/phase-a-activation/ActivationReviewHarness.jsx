import CSActivationShell from "@/components/activation/CSActivationShell";
import { CSAlert, CSButton, CSCard, CSField } from "@/components/design-system";

const steps = [
  { id: "profile", label: "Profile", status: "complete", stage: "Basics" },
  { id: "market", label: "Market", status: "complete", stage: "Basics" },
  { id: "services", label: "Services", status: "current", stage: "Offer" },
  {
    id: "payments",
    label: "Payments",
    status: "blocked",
    stage: "Launch",
    blockedReason: "Payments are blocked because checkout setup is incomplete.",
    missingRequirement: "Stripe checkout proof",
    unlockAction: "Complete checkout verification",
    unlockLocation: "Settings > Billing",
  },
  { id: "calendar", label: "Calendar", status: "available", stage: "Launch" },
  { id: "messaging", label: "Messaging", status: "available", stage: "Launch" },
  { id: "website", label: "Website", status: "available", stage: "Experience" },
  { id: "handoff", label: "Team handoff", status: "available", stage: "Experience" },
  { id: "review", label: "Final review", status: "available", stage: "Review" },
];

const statusCopy = {
  dirty: "Unsaved changes",
  saving: "Saving changes",
  saved_local: "Saved locally",
  saved_remote: "Saved to service",
  offline: "Offline - changes are local only",
  error: "Save failed - retry available",
};

export default function ActivationReviewHarness() {
  const params = new URLSearchParams(window.location.search);
  const saveState = params.get("state") || "dirty";
  const keyboardMode = params.get("keyboard") === "1";

  return (
    <CSActivationShell
      steps={steps}
      currentStep={3}
      title="Activate lead response"
      description="Review fixture for the nine-step Activation OS shell. It preserves the approved structure while making blocked steps, persistence truth, and mobile actions reviewable."
      saveState={saveState}
      saveMessage={statusCopy[saveState]}
      lastSavedAt={saveState === "saved_local" ? "Local fixture, 9:41 AM" : saveState === "saved_remote" ? "Service fixture, 9:42 AM" : undefined}
      validationMessage={keyboardMode ? "The business description is intentionally long so Worker #3 can verify validation copy does not cover the sticky actions." : undefined}
      resumeNotice={{
        preservation: saveState === "saved_remote" ? "Progress is represented as saved to the service in this fixture." : "Progress is represented as local-only until the service save succeeds.",
        resume: "Leaving returns the user to step 3, Services, with completed steps compressed in the rail.",
        risk: saveState === "dirty" || saveState === "offline" || saveState === "error" ? "The latest edit may be lost unless it is saved or retried first." : "No unsaved change is represented for this fixture state.",
      }}
      onPrevious={() => {}}
      onContinue={() => {}}
      headerActions={<CSButton variant="secondary">Open blocker summary</CSButton>}
    >
      <CSCard title="Stage summary" headingLevel={2}>
        <div className="cs-design-gallery__row">
          <strong>Basics complete</strong>
          <span>Offer in progress</span>
          <span>Launch blocked by checkout proof</span>
          <span>Review not started</span>
        </div>
      </CSCard>

      <CSAlert tone="warning" title="Blocked step summary">
        Payments cannot open yet. Missing requirement: Stripe checkout proof. Unlock action: complete checkout verification. Where: Settings &gt; Billing.
      </CSAlert>

      <CSCard title="Step content" headingLevel={2}>
        <div className="cs-design-gallery__form-grid">
          <CSField id="activation-business-description" label="Business description" hint="Used for lead-response context." required>
            <textarea defaultValue="We provide same-day service appointments and want missed-call follow-up to preserve urgent lead context." />
          </CSField>
          <CSField id="activation-service-area" label="Service area" hint="This field stays above sticky actions in reduced-height mobile checks.">
            <input defaultValue="Phoenix metro" />
          </CSField>
        </div>
      </CSCard>
    </CSActivationShell>
  );
}
