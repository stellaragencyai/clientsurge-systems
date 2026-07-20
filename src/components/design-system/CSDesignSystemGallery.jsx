import {
  CSAlert,
  CSButton,
  CSCard,
  CSEmptyState,
  CSField,
  CSLoadingState,
  CSMetricCard,
  CSPageHeader,
  CSProgressSteps,
  CSSkeleton,
  CSStatusBadge,
  EMPTY_STATE_COPY,
} from "./CSProductPrimitives";
import { CSDataState } from "./CSDataDisplayPrimitives";
import { CSCommerceButton } from "./CSPricingPrimitives";

const EMPTY_STATE_REASONS = Object.keys(EMPTY_STATE_COPY);

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
        <CSMetricCard label="New leads" value="-" helper="No verified data yet" />
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
          <CSCommerceButton>Add to Cart</CSCommerceButton>
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
          <CSField label="Fallback identity" hint="This fixture intentionally omits the caller id." required>
            <input className="cs-input" placeholder="Generated id" />
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
        <CSAlert tone="warning" title="Dynamic save status" announce>Saved after reconnecting.</CSAlert>
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

      <CSCard title="Composition-safe headings" headingLevel={2}>
        <div className="cs-design-gallery__stack">
          <CSCard title="Nested card can render h3" headingLevel={3}>
            <CSEmptyState
              reason="unknown"
              headingLevel={4}
              action={<CSButton variant="secondary">Inspect source status</CSButton>}
            />
          </CSCard>
        </div>
      </CSCard>

      <CSCard title="Truth-specific empty states">
        <div className="cs-design-gallery__state-grid">
          {EMPTY_STATE_REASONS.map((reason) => (
            <CSEmptyState key={reason} reason={reason} headingLevel={3} />
          ))}
        </div>
      </CSCard>

      <CSCard title="Data state semantics">
        <div className="cs-design-gallery__state-grid">
          <CSDataState state="verified_zero" />
          <CSDataState state="filtered_zero" />
          <CSDataState state="permission_restricted" />
          <CSDataState state="query_error" action={<CSButton variant="secondary">Retry query</CSButton>} />
        </div>
      </CSCard>

      <CSCard title="Loading states">
        <CSLoadingState label="Loading design-system fixture" description="One polite loading announcement wraps hidden skeleton decoration.">
          <CSSkeleton width="42%" height="1.5rem" />
          <CSSkeleton width="100%" height="0.9rem" />
          <CSSkeleton width="76%" height="0.9rem" />
        </CSLoadingState>
      </CSCard>
    </div>
  );
}
