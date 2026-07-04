import { AlertTriangle, CheckCircle2, XCircle, FileText, Database, ShieldAlert, ClipboardCheck } from "lucide-react";

export default function TwilioGrowthEngineWeeklyOperatorReview({ data }) {
  if (!data) return null;

  const caps = data.capabilities || [];
  const delivery = data.delivery_stats || {};
  const missed = data.missed_call_stats || {};
  const voice = data.voice_readiness || {};
  const quarantine = data.quarantine || {};
  const proofEmpty = data.proof_logs_empty;

  const items = [
    {
      icon: AlertTriangle,
      title: "New Blockers",
      what: "Review all capabilities with new blockers since last check.",
      why: "New blockers can silently degrade a previously-working automation and block customer proof.",
      where: "Capability Matrix → expanded rows → Blockers section. Each blocker lists the specific issue.",
      action: "For each blocker: resolve the root cause, then re-run the audit to confirm it's cleared.",
      failing: caps.filter(c => (c.blockers || []).length > 0).length > 0,
      count: caps.filter(c => (c.blockers || []).length > 0).length,
    },
    {
      icon: ClipboardCheck,
      title: "Capabilities Stuck in Same Phase",
      what: "Identify capabilities that haven't advanced in phase since the last review.",
      why: "Stuck capabilities indicate unresolved blockers or missing prerequisites that prevent go-live.",
      where: "Maturity Roadmap → compare phase distribution to previous week. Look for capabilities still in Phase 0–2.",
      action: "Pick the highest-revenue-impact stuck capability and unblock its next required proof or configuration.",
      failing: caps.filter(c => c.status !== "green").length > 0,
      count: caps.filter(c => c.status !== "green").length,
    },
    {
      icon: FileText,
      title: "Evidence Gaps",
      what: "Check which capabilities lack passed AutomationProofLog records.",
      why: "Without proof records, no capability can be marked trusted — customer-facing claims are unsafe.",
      where: "Proof Center → per-service proof counts. Any service with 0 passed proofs is an evidence gap.",
      action: "Create and pass an AutomationProofLog for each gap. Start with instant_lead_response and missed_call_text_back.",
      failing: proofEmpty || caps.some(c => c.proof?.passed === 0),
      count: caps.filter(c => c.proof?.passed === 0).length,
    },
    {
      icon: XCircle,
      title: "Provider Errors",
      what: "Review Twilio 400 errors and failed delivery events.",
      why: "Provider errors indicate misconfigured senders, wrong payload format, or credential issues.",
      where: "Capability Matrix → delivery stats. Check 'Weak Proof', 'No Provider ID', and 'Failed' counts.",
      action: "Inspect request payloads, Twilio credentials, and sender permissions. Fix the root cause, not the symptom.",
      failing: delivery.failed > 0 || (delivery.weak_proof_count || 0) > 0,
      count: (delivery.failed || 0) + (delivery.weak_proof_count || 0),
    },
    {
      icon: Database,
      title: "Internal/Test Record Exclusions",
      what: "Verify that internal, smoke, and test records are excluded from production metrics.",
      why: "If test data leaks into production KPIs, dashboard numbers will be inflated and untrustworthy.",
      where: "Test Data Exclusion panel (top of page). Check excluded vs production lead counts.",
      action: "If excluded count is 0 but test leads exist, update the exclusion rules in the audit function.",
      failing: quarantine.excluded_leads_count === undefined,
      count: quarantine.excluded_leads_count || 0,
    },
    {
      icon: ShieldAlert,
      title: "Public Claim Safety Warnings",
      what: "Review any capabilities that are publicly claimed but not yet trusted.",
      why: "Claiming a feature works before proof exists creates legal and trust risk.",
      where: "Claim Safety tab (if available). Each claim shows safe / setup-only / do-not-claim status.",
      action: "For any 'do-not-claim' item: either build the proof or soften the public wording.",
      failing: caps.some(c => c.status !== "green"),
      count: caps.filter(c => c.status !== "green").length,
    },
    {
      icon: CheckCircle2,
      title: "Asana Workstream Checkoff Review",
      what: "Determine which workstreams should or should not be checked off in Asana.",
      why: "Checking off a workstream that lacks proof signals false completion and hides real risk.",
      where: "Minimum Definition of Done panel + Asana Completion Gate. Each workstream shows done/not-done.",
      action: "Only check off workstreams marked 'Done'. Leave 'Not Done' workstreams open with the missing criteria noted.",
      failing: caps.some(c => c.status !== "green"),
      count: caps.filter(c => c.status !== "green").length,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <h3 className="text-sm font-bold text-gray-900">Weekly Operator Review — Admin Only</h3>
        <p className="text-xs text-gray-500 mt-1">Nolan/admin should review these items weekly. Each item shows what to check, why it matters, where evidence lives, and what to do if failing.</p>
      </div>

      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.failing ? "rgba(220,38,38,0.08)" : "rgba(5,150,105,0.08)", border: `1px solid ${item.failing ? "rgba(220,38,38,0.2)" : "rgba(5,150,105,0.2)"}` }}>
                  <Icon className="w-4 h-4" style={{ color: item.failing ? "#DC2626" : "#059669" }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{item.title}</p>
                  <p className="text-[11px] text-gray-400">{item.count} item(s) need attention</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold flex-shrink-0 ${item.failing ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                {item.failing ? "Needs Review" : "Clear"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">What to Check</p>
                <p className="text-gray-600 leading-relaxed">{item.what}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Why It Matters</p>
                <p className="text-gray-600 leading-relaxed">{item.why}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Where Evidence Is</p>
                <p className="text-gray-600 leading-relaxed">{item.where}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Suggested Action if Failing</p>
                <p className="text-gray-600 leading-relaxed">{item.action}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}