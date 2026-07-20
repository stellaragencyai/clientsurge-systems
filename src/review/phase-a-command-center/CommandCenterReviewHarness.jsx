import { AlertTriangle } from "lucide-react";
import { CSButton, CSCard } from "@/components/design-system";
import CSCommandCenterShell from "@/components/command-center/CSCommandCenterShell";

const actionQueueCopy = {
  verified_zero: "Verified zero",
  not_loaded: "Not loaded",
  failed: "Failed",
  not_connected: "Not connected",
  restricted: "Restricted",
  unsupported: "Unsupported",
  unknown: "Unknown",
};

const freshnessCopy = {
  live: "Live",
  current: "Current",
  delayed: "Delayed",
  stale: "Stale",
  partial: "Partial",
  not_connected: "Not connected",
  unavailable: "Unavailable",
  unknown: "Unknown",
};

export default function CommandCenterReviewHarness() {
  const params = new URLSearchParams(window.location.search);
  const actionState = params.get("actionState") || "unknown";
  const freshnessState = params.get("freshness") || "unknown";
  const withAction = params.get("withAction") === "1";
  const verified = params.get("verified") === "1";
  const withAlert = params.get("alert") !== "0";
  const hasAttention = withAction || withAlert;
  const displayedFreshness = verified && hasAttention && freshnessState === "live"
    ? "Current"
    : freshnessCopy[freshnessState] || "Unknown";
  const workforceFixture = verified ? [
    hasAttention
      ? { id: "response", name: "Response Agent", role: "Lead follow-up", status: "Needs attention", activity: "Waiting on messaging verification", metric: "No delivery proof" }
      : { id: "response", name: "Response Agent", role: "Lead follow-up", status: "Active", activity: "Verified fixture checks are current", metric: "Current" },
  ] : [];
  const verifiedSecondaryEvidence = verified ? {
    opportunities: (
      <CSCard tone="subtle" title="Opportunity source current" description="Source availability is verified for this fixture.">
        <p className="cs-command-center__muted">No opportunity count or revenue claim is inferred from the static Phase A review route.</p>
      </CSCard>
    ),
    websiteIntelligence: (
      <CSCard tone="subtle" title="Tracking fixture current" description="Website intelligence source coverage is present for review.">
        <p className="cs-command-center__muted">Detailed conversion analytics remain outside this Phase A shell validation.</p>
      </CSCard>
    ),
    activity: (
      <CSCard tone="subtle" title="Review activity current" description="The command-center fixture loaded without fabricating customer chronology.">
        <p className="cs-command-center__muted">Live activity history is intentionally not mounted during this remediation.</p>
      </CSCard>
    ),
    systemHealth: (
      <CSCard tone="subtle" title="Fixture checks verified" description="Communications, booking, and website fixture checks are available.">
        <p className="cs-command-center__muted">Operational readiness still depends on Worker #3 review evidence before rows are marked passed.</p>
      </CSCard>
    ),
  } : {};

  return (
    <CSCommandCenterShell
      businessName="Acme Dental"
      status={verified ? "Operational" : "Status being verified"}
      dataReadiness={verified ? "verified" : "unverified"}
      readinessMessage={verified
        ? hasAttention
          ? "Verified sources report an attention-required setup risk."
          : "Verified command-center review fixture."
        : "Status being verified from static review fixtures"}
      freshnessState={freshnessState}
      sourceConnected={verified}
      coverageState={verified ? "current" : "unknown"}
      actionQueueState={actionState}
      actionQueueVerified={actionState === "verified_zero"}
      headerActions={<CSButton variant="secondary">Open source disclosure</CSButton>}
      alerts={withAlert ? [
        {
          id: "missed-call-follow-up",
          tone: "warning",
          title: "Missed-call follow-up may not send",
          message: "Messaging connection is not verified. A missed caller may not receive the expected follow-up until setup is confirmed.",
        },
      ] : []}
      metrics={verified ? [
        { id: "calls", label: "Calls", value: "Verified", helper: "Current source fixture" },
        { id: "bookings", label: "Bookings", value: "Verified", helper: "Current source fixture" },
        { id: "revenue", label: "Revenue", value: "Not attributed", helper: "No revenue claim made" },
        { id: "freshness", label: "Freshness", value: displayedFreshness, helper: "Fixture metadata only" },
      ] : []}
      actions={withAction ? [
        {
          id: "connect-messaging",
          icon: AlertTriangle,
          title: "Verify missed-call messaging",
          description: "Messaging is not verified, so missed-call follow-up may not send.",
          priority: "High",
          owner: "ClientSurge staff",
          urgency: "Today",
          consequence: "Missed callers may not receive follow-up",
          evidence: "Messaging source fixture: not verified",
          destination: "Settings > Messaging verification",
          lifecycle: "Waiting on dependency",
          action: <CSButton variant="secondary">Open messaging verification</CSButton>,
        },
      ] : []}
      workforce={workforceFixture}
      {...verifiedSecondaryEvidence}
    />
  );
}
