import { AlertTriangle, CheckCircle2, XCircle, AlertOctagon } from "lucide-react";

/**
 * Weekly Operator Review — admin-only panel listing what Nolan/admin should review weekly.
 * Each item shows: what to check, why it matters, where evidence is located, suggested action if failing.
 */
export default function WeeklyOperatorReview({ data }) {
  if (!data) return null;

  const caps = data.capabilities || [];
  const delivery = data.delivery_stats || {};
  const events = data.event_stats || {};
  const missed = data.missed_call_stats || {};
  const voice = data.voice_readiness || {};
  const quarantine = data.quarantine || {};
  const proofEmpty = data.proof_logs_empty;

  // Derive conditions
  const newBlockers = caps.filter(c => (c.blockers || []).length > 0);
  const stuckCaps = caps.filter(c => c.status === "yellow" || c.status === "red");
  const evidenceGaps = caps.filter(c => !c.evidence_sources?.some(s => s.includes("passed") || s.includes("delivered")));
  const providerErrors = (events.twilio_400_errors || 0) + (delivery.failed || 0) + (events.failed_events || 0);
  const testExclusions = quarantine.excluded_leads_count || 0;
  const publicClaimWarnings = caps.filter(c => c.status !== "green");

  // Build review items
  const reviewItems = [
    {
      id: "new_blockers",
      title: "New Blockers",
      icon: AlertOctagon,
      iconColor: "#DC2626",
      whatToCheck: `Review all capabilities with active blockers. Currently ${newBlockers.length} capabilities have blockers.`,
      whyItMatters: "Blockers prevent capabilities from reaching trusted (green) status. Unaddressed blockers compound and delay launch readiness.",
      whereEvidence: "Capability Matrix tab — expand any capability with a red or yellow status to see its blocker list. Each blocker is derived from real database records.",
      failingAction: newBlockers.length > 0
        ? `Address the top blocker for: ${newBlockers.slice(0, 3).map(c => c.label).join(", ")}. Resolve each blocker with a real fix, then re-run the audit to confirm it's cleared.`
        : "No active blockers detected this cycle. Continue monitoring.",
      status: newBlockers.length > 0 ? "failing" : "passing",
    },
    {
      id: "stuck_capabilities",
      title: "Capabilities Stuck in Same Phase",
      icon: AlertTriangle,
      iconColor: "#D97706",
      whatToCheck: `Identify capabilities that haven't progressed since the last review. Currently ${stuckCaps.length} capabilities are partial or missing.`,
      whyItMatters: "Capabilities that stay partial or missing week-over-week indicate stalled work or missing prerequisites. They block overall launch readiness.",
      whereEvidence: "Capability Matrix tab — compare current statuses against the previous week's snapshot. Maturity Roadmap tab shows phase distribution.",
      failingAction: stuckCaps.length > 0
        ? `Prioritize the highest-revenue-impact stuck capability. Use the Fastest Path to Green tab to find the shortest safe next step for each.`
        : "All capabilities are progressing or trusted. Continue monitoring.",
      status: stuckCaps.length > 0 ? "failing" : "passing",
    },
    {
      id: "evidence_gaps",
      title: "Evidence Gaps",
      icon: XCircle,
      iconColor: "#DC2626",
      whatToCheck: `Check for capabilities missing proof artifacts. Currently ${evidenceGaps.length} capabilities have no passed evidence source.`,
      whyItMatters: "Without real evidence (AutomationProofLog passes, delivered SMS, transcripts), a capability cannot be marked trusted. Evidence gaps are the primary reason capabilities stay partial.",
      whereEvidence: "Proof Center tab — shows required evidence and current proof log status per service. Capability Matrix — evidence_sources field per capability.",
      failingAction: evidenceGaps.length > 0
        ? `Create AutomationProofLog records for: ${evidenceGaps.slice(0, 3).map(c => c.label).join(", ")}. Do not mark any capability green without a passed proof log.`
        : "All capabilities have at least one evidence source. Verify proof logs are still passing.",
      status: evidenceGaps.length > 0 ? "failing" : "passing",
    },
    {
      id: "provider_errors",
      title: "Provider Errors",
      icon: AlertTriangle,
      iconColor: "#D97706",
      whatToCheck: `Review Twilio 400 errors, failed SMS deliveries, and failed communication events. Currently ${providerErrors} provider errors detected.`,
      whyItMatters: "Provider errors indicate integration misconfiguration, bad request payloads, or credential/sender permission issues. They silently break automation without visible failure.",
      whereEvidence: "Capability Matrix tab — delivery stats grid shows failed count and weak proof count. Repair Queue tab — provider error repair items.",
      failingAction: providerErrors > 0
        ? `Inspect Twilio request payloads and sender permissions. Check CommunicationLog and CommunicationEvent for error_message fields containing '400' or 'bad request'.`
        : "No provider errors detected this cycle.",
      status: providerErrors > 0 ? "failing" : "passing",
    },
    {
      id: "test_exclusions",
      title: "Internal/Test Record Exclusions",
      icon: CheckCircle2,
      iconColor: testExclusions > 0 ? "#059669" : "#6B7280",
      whatToCheck: `Verify internal/smoke/test records are excluded from production metrics. Currently ${testExclusions} records excluded.`,
      whyItMatters: "Test data in production metrics inflates numbers and creates false confidence. If test records aren't excluded, production KPIs are unreliable.",
      whereEvidence: "Test Data Exclusion panel at top of dashboard — shows excluded vs production lead counts and exclusion rules.",
      failingAction: "Verify exclusion rules are catching all test patterns. If excluded count is 0 but you've run tests, the exclusion logic may be broken.",
      status: "passing",
    },
    {
      id: "public_claim_safety",
      title: "Public Claim Safety Warnings",
      icon: AlertTriangle,
      iconColor: "#D97706",
      whatToCheck: `Review which capabilities are NOT safe for public claims. Currently ${publicClaimWarnings.length} capabilities should not be claimed as working.`,
      whyItMatters: "Claiming a feature works publicly when it's not backed by proof creates legal, reputational, and customer trust risk. Every non-green capability is a claim safety warning.",
      whereEvidence: "Claim Safety tab — evaluates public marketing claims against real app data. Capability Matrix — any non-green capability should not be publicly claimed.",
      failingAction: publicClaimWarnings.length > 0
        ? `Do not publicly claim these features as working: ${publicClaimWarnings.slice(0, 3).map(c => c.label).join(", ")}. Use setup-only or do-not-claim wording instead.`
        : "All capabilities are trusted. Public claims are safe.",
      status: publicClaimWarnings.length > 0 ? "failing" : "passing",
    },
    {
      id: "asana_workstreams",
      title: "Asana Workstream Check-off Review",
      icon: CheckCircle2,
      iconColor: "#059669",
      whatToCheck: "Determine which workstreams should or should not be checked off in Asana based on real proof, not just task completion.",
      whyItMatters: "Checking off an Asana task for a capability that lacks proof creates false confidence that the work is done. Only workstreams with real evidence should be checked off.",
      whereEvidence: "Asana Sync tab — evaluates each workstream's completion eligibility against real app data. Minimum Definition of Done tab — strict completion criteria per workstream.",
      failingAction: "Do not check off any Asana workstream unless: (1) AutomationProofLog passed, (2) checklist flags are true and client approved, (3) no active blockers. If any criterion is unmet, leave the task open.",
      status: proofEmpty ? "failing" : "passing",
    },
  ];

  const failingCount = reviewItems.filter(r => r.status === "failing").length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl p-5 flex items-start gap-3" style={{
        background: failingCount > 0
          ? "linear-gradient(135deg, rgba(217,119,6,0.06), rgba(217,119,6,0.02))"
          : "linear-gradient(135deg, rgba(5,150,105,0.06), rgba(5,150,105,0.02))",
        border: `1px solid ${failingCount > 0 ? "rgba(217,119,6,0.2)" : "rgba(5,150,105,0.2)"}`,
      }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{
          background: failingCount > 0 ? "rgba(217,119,6,0.1)" : "rgba(5,150,105,0.1)",
          border: `1px solid ${failingCount > 0 ? "rgba(217,119,6,0.25)" : "rgba(5,150,105,0.25)"}`,
        }}>
          {failingCount > 0
            ? <AlertTriangle className="w-4 h-4 text-amber-600" />
            : <CheckCircle2 className="w-4 h-4 text-green-600" />}
        </div>
        <div>
          <p className="text-sm font-bold mb-1" style={{ color: failingCount > 0 ? "#D97706" : "#059669" }}>
            {failingCount > 0
              ? `${failingCount} of ${reviewItems.length} review items need attention this week`
              : "All weekly review items are passing"}
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            This is a private weekly checklist for Nolan/admin. Each item is derived from live app data — not configuration.
            Review every item weekly and address failing items before moving to lower-priority work.
          </p>
        </div>
      </div>

      {/* Review items */}
      {reviewItems.map(item => {
        const Icon = item.icon;
        const isFailing = item.status === "failing";
        return (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                background: isFailing ? "rgba(220,38,38,0.06)" : "rgba(5,150,105,0.06)",
                border: `1px solid ${isFailing ? "rgba(220,38,38,0.15)" : "rgba(5,150,105,0.15)"}`,
              }}>
                <Icon className="w-4 h-4" style={{ color: isFailing ? "#DC2626" : item.iconColor }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{
                    color: isFailing ? "#DC2626" : "#059669",
                    background: isFailing ? "rgba(220,38,38,0.06)" : "rgba(5,150,105,0.06)",
                    border: `1px solid ${isFailing ? "rgba(220,38,38,0.15)" : "rgba(5,150,105,0.15)"}`,
                  }}>
                    {isFailing ? "Needs Attention" : "Passing"}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2.5 ml-11">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">What to Check</p>
                <p className="text-xs text-gray-600 leading-relaxed">{item.whatToCheck}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Why It Matters</p>
                <p className="text-xs text-gray-600 leading-relaxed">{item.whyItMatters}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Where Evidence Is Located</p>
                <p className="text-xs text-gray-600 leading-relaxed">{item.whereEvidence}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Suggested Action if Failing</p>
                <p className="text-xs leading-relaxed" style={{ color: isFailing ? "#DC2626" : "#6B7280" }}>{item.failingAction}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}