import { AlertTriangle } from "lucide-react";
import { CSButton } from "@/components/design-system";
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

  return (
    <CSCommandCenterShell
      businessName="Acme Dental"
      status={verified ? "Operational" : "Status being verified"}
      dataReadiness={verified ? "verified" : "unverified"}
      readinessMessage={verified ? "Verified command-center review fixture" : "Status being verified from static review fixtures"}
      freshnessState={freshnessState}
      sourceConnected={verified}
      coverageState={verified ? "current" : "unknown"}
      actionQueueState={actionState}
      actionQueueVerified={actionState === "verified_zero"}
      headerActions={<CSButton variant="secondary">Open source disclosure</CSButton>}
      alerts={[
        {
          id: "missed-call-follow-up",
          tone: "warning",
          title: "Missed-call follow-up may not send",
          message: "Messaging connection is not verified. A missed caller may not receive the expected follow-up until setup is confirmed.",
        },
      ]}
      metrics={verified ? [
        { id: "calls", label: "Calls", value: "Verified", helper: "Current source fixture" },
        { id: "bookings", label: "Bookings", value: "Verified", helper: "Current source fixture" },
        { id: "revenue", label: "Revenue", value: "Not attributed", helper: "No revenue claim made" },
        { id: "freshness", label: "Freshness", value: freshnessCopy[freshnessState] || "Unknown", helper: "Fixture metadata only" },
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
      workforce={verified ? [
        { id: "response", name: "Response Agent", role: "Lead follow-up", status: "Needs attention", activity: "Waiting on messaging verification", metric: "No delivery proof" },
      ] : []}
    />
  );
}
