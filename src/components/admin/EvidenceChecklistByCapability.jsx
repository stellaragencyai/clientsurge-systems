import { CheckCircle2, XCircle, MinusCircle, FileText } from "lucide-react";

const YES = "yes";
const NO = "no";
const UNKNOWN = "unknown";

function tri(value) {
  if (value === true) return YES;
  if (value === false) return NO;
  return UNKNOWN;
}

function TriCell({ state }) {
  if (state === YES)
    return (
      <div className="flex items-center justify-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        <span className="text-[10px] font-semibold text-green-600">Yes</span>
      </div>
    );
  if (state === NO)
    return (
      <div className="flex items-center justify-center gap-1">
        <XCircle className="w-3.5 h-3.5 text-red-400" />
        <span className="text-[10px] font-semibold text-red-500">No</span>
      </div>
    );
  return (
    <div className="flex items-center justify-center gap-1">
      <MinusCircle className="w-3.5 h-3.5 text-gray-300" />
      <span className="text-[10px] font-semibold text-gray-400">Unknown</span>
    </div>
  );
}

export default function EvidenceChecklistByCapability({ data }) {
  const capabilities = data?.capabilities || [];
  const proofByService = data?.proof_by_service || {};

  const rows = capabilities.map((cap) => {
    const proof = cap.proof || proofByService[cap.key] || {};
    const hasConfig =
      (cap.evidence_sources?.length || 0) > 0 || (proof.total || 0) > 0;
    const hasEventLog = (cap.evidence_sources || []).some(
      (s) =>
        s.toLowerCase().includes("communicationlog") ||
        s.toLowerCase().includes("communicationevent")
    );
    const hasProof = (proof.passed || 0) > 0;
    const hasBlocker = (cap.blockers?.length || 0) > 0;
    const launchReady =
      cap.status === "green" && hasProof
        ? YES
        : cap.status === "red"
        ? NO
        : UNKNOWN;

    return {
      key: cap.key,
      label: cap.label,
      config: tri(hasConfig),
      eventLog: tri(hasEventLog),
      proof: tri(hasProof),
      blocker: hasBlocker ? YES : NO,
      launchReady,
    };
  });

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-4 flex items-start gap-2"
        style={{
          background: "rgba(59,130,246,0.05)",
          border: "1px solid rgba(59,130,246,0.2)",
        }}
      >
        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Admin-only evidence checklist. Each cell is derived from live audit
          data — yes (green), no (red), or unknown (grey). No value is inferred
          without evidence.
        </p>
      </div>

      <div
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
      >
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">
            Evidence Checklist by Capability
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Compact view of configuration, event/log, proof, blocker, and
            launch-readiness for each capability.
          </p>
        </div>
        {rows.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-xs text-gray-400">
              No capabilities available — run the audit to populate this table.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">
                    Capability
                  </th>
                  <th className="text-center px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">
                    Config Present
                  </th>
                  <th className="text-center px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">
                    Event/Log Present
                  </th>
                  <th className="text-center px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">
                    Proof Artifact
                  </th>
                  <th className="text-center px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">
                    Blocker Present
                  </th>
                  <th className="text-center px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">
                    Launch-Ready
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row) => (
                  <tr key={row.key} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">
                      {row.label}
                    </td>
                    <td className="text-center px-3 py-2.5">
                      <TriCell state={row.config} />
                    </td>
                    <td className="text-center px-3 py-2.5">
                      <TriCell state={row.eventLog} />
                    </td>
                    <td className="text-center px-3 py-2.5">
                      <TriCell state={row.proof} />
                    </td>
                    <td className="text-center px-3 py-2.5">
                      <TriCell state={row.blocker} />
                    </td>
                    <td className="text-center px-3 py-2.5">
                      <TriCell state={row.launchReady} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}