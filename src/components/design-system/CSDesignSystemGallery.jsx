import {
  CSAlert,
  CSButton,
  CSCard,
  CSEmptyState,
  CSField,
  CSMetricCard,
  CSPageHeader,
  CSProgressSteps,
  CSSkeleton,
  CSStatusBadge,
} from "./CSProductPrimitives";

export default function CSDesignSystemGallery() {
  return (
    <div className="cs-design-gallery">
      <CSPageHeader
        eyebrow="Design System 2.1"
        title="ClientSurge product primitives"
        description="Isolated validation surface for visual hierarchy, responsive behavior, semantic states, and accessibility."
        actions={<CSButton>Primary action</CSButton>}
      />

      <section className="cs-design-gallery__grid" aria-label="Metric cards">
        <CSMetricCard label="New leads" value="—" helper="No verified data yet" />
        <CSMetricCard label="Appointments" value="12" change="+20%" helper="vs. prior period" status="positive" />
        <CSMetricCard label="Response time" value="38 sec" helper="Last 7 days" />
      </section>

      <CSCard title="Actions and status" description="Every action and state must remain clear without relying on color alone.">
        <div className="cs-design-gallery__row">
          <CSButton>Primary</CSButton>
          <CSButton variant="secondary">Secondary</CSButton>
          <CSButton variant="ghost">Ghost</CSButton>
          <CSButton variant="danger">Danger</CSButton>
          <CSButton loading>Working</CSButton>
        </div>
        <div className="cs-design-gallery__row">
          <CSStatusBadge tone="success">Active</CSStatusBadge>
          <CSStatusBadge tone="warning">Needs attention</CSStatusBadge>
          <CSStatusBadge tone="danger">Blocked</CSStatusBadge>
          <CSStatusBadge tone="info">Installing</CSStatusBadge>
        </div>
      </CSCard>

      <CSCard title="Form behavior">
        <div className="cs-design-gallery__form-grid">
          <CSField id="gallery-business-name" label="Business name" hint="Use the customer-facing name." required>
            <input className="cs-input" placeholder="Acme Dental" />
          </CSField>
          <CSField id="gallery-email" label="Notification email" error="Enter a valid email address.">
            <input className="cs-input" defaultValue="invalid-email" />
          </CSField>
        </div>
      </CSCard>

      <section className="cs-design-gallery__stack" aria-label="System messages">
        <CSAlert tone="info" title="Connection in progress">Calendar verification may take a few seconds.</CSAlert>
        <CSAlert tone="success" title="System ready">Required service checks passed.</CSAlert>
        <CSAlert tone="warning" title="Customer action required">Domain access is still needed.</CSAlert>
        <CSAlert tone="danger" title="Launch blocked">A required messaging test failed.</CSAlert>
      </section>

      <CSCard title="Activation progress">
        <CSProgressSteps
          currentStep={3}
          steps={[
            { id: "profile", label: "Business profile" },
            { id: "website", label: "Website" },
            { id: "connections", label: "Connected services" },
            { id: "review", label: "Review" },
          ]}
        />
      </CSCard>

      <CSEmptyState
        title="No verified activity yet"
        description="Results will appear after the system is live and production events have been received."
        action={<CSButton>Review activation</CSButton>}
        secondaryAction={<CSButton variant="secondary">View requirements</CSButton>}
      />

      <CSCard title="Loading states">
        <div className="cs-design-gallery__stack">
          <CSSkeleton width="42%" height="1.5rem" />
          <CSSkeleton width="100%" height="0.9rem" />
          <CSSkeleton width="76%" height="0.9rem" />
        </div>
      </CSCard>
    </div>
  );
}
