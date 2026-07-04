import { TrendingUp, Plus, ArrowUpRight, Ban, ClipboardList } from "lucide-react";

const ADMIN_COMPONENTS_ADDED = [
  "SetupVsVerifiedReminder",
  "CoreLaunchFirstWarning",
  "CurrentSprintFocusCard",
  "ProjectUpdateSummaryCard",
  "OwnerAttentionNeededPanel",
  "CoreSystemHealthCard",
  "ProgressSinceLastAudit",
  "EvidenceChecklistByCapability",
];

const WORKSTREAMS_IMPROVED = [
  "Evidence logging visibility — proof logs now surfaced in Proof Center",
  "Internal record exclusion — test/smoke records quarantined from production metrics",
  "Speed-to-lead readiness — delivery stats and provider message IDs tracked",
  "Recovery flow reliability — missed-call webhook health and 404/405 detection",
  "Voice readiness — ElevenLabs agent ID and transcript proof checks",
];

function getStillBlocked(data) {
  const caps = data?.capabilities || [];
  return caps.filter((c) => c.status !== "green").map((c) => c.label);
}

function getAsanaKeepIncomplete(data) {
  const items = [];
  if (data?.proof_logs_empty) {
    items.push("Create AutomationProofLog pass records — do not close until real proof exists");
  }
  const caps = data?.capabilities || [];
  const voice = caps.find((c) => c.key === "ai_voice_receptionist");
  if (voice && voice.status !== "green") {
    items.push("AI Voice Receptionist — keep open until transcript evidence exists");
  }
  const review = caps.find((c) => c.key === "review_request");
  if (review && review.status !== "green") {
    items.push("Review Request — keep open until review link + outbound event logged");
  }
  const reactivation = caps.find((c) => c.key === "lead_reactivation");
  if (reactivation && reactivation.status !== "green") {
    items.push("Lead Reactivation — keep open until reactivation workflow event logged");
  }
  const nurture = caps.find((c) => c.key === "nurture_sequence_14d");
  if (nurture && nurture.status !== "green") {
    items.push("Nurture Sequence — keep open until step proofs exist");
  }
  return items;
}

export default function ProgressSinceLastAudit({ data }) {
  const stillBlocked = getStillBlocked(data);
  const asanaKeepIncomplete = getAsanaKeepIncomplete(data);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-gray-900">Progress Since Last Audit — Admin Only</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Admin components added/updated */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Plus className="w-3.5 h-3.5 text-green-500" />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600">Admin Components Added/Updated</p>
          </div>
          <ul className="space-y-1">
            {ADMIN_COMPONENTS_ADDED.map((name) => (
              <li key={name} className="text-xs text-gray-600 flex items-center gap-1.5">
                <span className="text-gray-300">•</span>
                <span className="font-mono">{name}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Workstreams improved */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">Workstreams Improved</p>
          </div>
          <ul className="space-y-1">
            {WORKSTREAMS_IMPROVED.map((ws, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                <span className="text-gray-300 mt-0.5">•</span>
                <span>{ws}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Still blocked */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Ban className="w-3.5 h-3.5 text-red-400" />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500">Still-Blocked Workstreams</p>
          </div>
          {stillBlocked.length === 0 ? (
            <p className="text-xs text-gray-400">No blocked workstreams — all capabilities proven.</p>
          ) : (
            <ul className="space-y-1">
              {stillBlocked.map((label) => (
                <li key={label} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-red-300 mt-0.5">•</span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Asana items to keep incomplete */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Items to Keep Incomplete in Asana</p>
          </div>
          {asanaKeepIncomplete.length === 0 ? (
            <p className="text-xs text-gray-400">No items need to stay open.</p>
          ) : (
            <ul className="space-y-1">
              {asanaKeepIncomplete.map((item) => (
                <li key={item} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-amber-300 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}