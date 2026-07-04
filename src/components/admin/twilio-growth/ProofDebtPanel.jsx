import { TrendingDown, AlertOctagon, AlertTriangle, ArrowRight, ShieldX } from "lucide-react";
import EvidenceQualityBadge from "./EvidenceQualityBadge";
import { overallEvidenceQuality } from "./evidenceQuality";

const STATUS_COLOR = {
  red: "#DC2626",
  yellow: "#D97706",
  green: "#059669",
};

/**
 * Determine if a capability's blockers are proof-related (missing or weak evidence),
 * as opposed to pure configuration gaps (e.g. missing webhook URL).
 */
function isProofDebt(cap) {
  if (cap.status === "green") return false;
  const blockers = (cap.blockers || []).join(" ").toLowerCase();
  const hasProofBlocker =
    blockers.includes("proof") ||
    blockers.includes("evidence") ||
    blockers.includes("no automationprooflog") ||
    blockers.includes("no delivered") ||
    blockers.includes("weak") ||
    blockers.includes("transcript") ||
    blockers.includes("provider_message_id") ||
    blockers.includes("no real") ||
    blockers.includes("no passed");
  // If the capability has a proof object with 0 passed, it's always proof debt
  if (cap.proof && cap.proof.passed === 0) return true;
  return hasProofBlocker;
}

function debtSeverity(cap) {
  const proof = cap.proof || { total: 0, passed: 0 };
  const quality = overallEvidenceQuality(cap);

  // Critical: red status + no proof records at all + no/weak evidence
  if (cap.status === "red" && proof.total === 0 && (quality === "none" || quality === "weak")) {
    return "critical";
  }

  // Critical: red status + proof records exist but none passed + no evidence
  if (cap.status === "red" && proof.total > 0 && proof.passed === 0 && quality === "none") {
    return "critical";
  }

  // High: yellow or red with proof records that haven't passed, or weak/medium evidence
  if (cap.status === "red" || cap.status === "yellow") {
    if (proof.total > 0 && proof.passed === 0) return "high";
    if (quality === "weak" || quality === "none") return "high";
    return "high";
  }

  return "medium";
}

function buildDebtItems(capabilities) {
  if (!capabilities) return [];
  return capabilities
    .filter(isProofDebt)
    .map((cap) => {
      const proof = cap.proof || { total: 0, passed: 0, pending: 0, failed: 0 };
      const quality = overallEvidenceQuality(cap);
      const severity = debtSeverity(cap);

      let debtType = "Missing proof record";
      if (proof.total > 0 && proof.passed === 0) {
        debtType = "Proof record exists but none passed";
      } else if (quality === "weak") {
        debtType = "Weak evidence — incomplete or internal-only";
      } else if (quality === "none") {
        debtType = "No evidence found";
      } else if (proof.pending > 0 && proof.passed === 0) {
        debtType = "Proof pending — not yet passed";
      }

      return {
        key: cap.key,
        label: cap.label,
        status: cap.status,
        severity,
        debtType,
        quality,
        proofTotal: proof.total,
        proofPassed: proof.passed,
        proofPending: proof.pending,
        proofFailed: proof.failed,
        blockers: cap.blockers || [],
        nextAction: cap.next_action || "",
      };
    })
    .sort((a, b) => {
      // Sort: critical first, then high, then medium
      const order = { critical: 0, high: 1, medium: 2 };
      return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
    });
}

function recommendedPayDownOrder(debtItems) {
  // The recommended order prioritizes:
  // 1. Capabilities with zero proof records (nothing to verify against)
  // 2. Capabilities where proof exists but hasn't passed (quickest wins)
  // 3. Capabilities with weak/medium evidence (needs evidence strengthening)
  return [...debtItems].sort((a, b) => {
    // Zero proof records = highest priority within same severity
    const aZero = a.proofTotal === 0 ? 0 : 1;
    const bZero = b.proofTotal === 0 ? 0 : 1;
    if (aZero !== bZero) return aZero - bZero;

    // Then by quality: none < weak < medium
    const qOrder = { none: 0, weak: 1, medium: 2, strong: 3 };
    return (qOrder[a.quality] ?? 4) - (qOrder[b.quality] ?? 4);
  });
}

export default function ProofDebtPanel({ data }) {
  const capabilities = data?.capabilities || [];
  const debtItems = buildDebtItems(capabilities);
  const payDownOrder = recommendedPayDownOrder(debtItems);

  const totalDebt = debtItems.length;
  const criticalDebt = debtItems.filter((d) => d.severity === "critical").length;
  const highDebt = debtItems.filter((d) => d.severity === "high").length;
  const mediumDebt = debtItems.filter((d) => d.severity === "medium").length;

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-2 mb-1">
          <TrendingDown className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900">Proof Debt — Admin Only</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          Proof Debt summarizes how many capabilities are blocked because proof is missing or weak.
          Each debt item is derived from live audit data — no status is inferred without evidence.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DebtStatCard label="Total Proof Debt" value={totalDebt} color="#6B7280" icon={ShieldX} />
          <DebtStatCard label="Critical" value={criticalDebt} color="#DC2626" icon={AlertOctagon} />
          <DebtStatCard label="High" value={highDebt} color="#D97706" icon={AlertTriangle} />
          <DebtStatCard label="Medium" value={mediumDebt} color="#6B7280" icon={AlertTriangle} />
        </div>

        {totalDebt === 0 && (
          <div className="mt-4 bg-green-50 rounded-lg border border-green-200 p-3 flex items-center gap-2">
            <ShieldX className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-700 font-semibold">
              No proof debt — all capabilities have passed proof records.
            </p>
          </div>
        )}
      </div>

      {/* Proof debt by capability */}
      {debtItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Proof Debt by Capability</h3>
          <div className="space-y-3">
            {debtItems.map((item) => (
              <DebtItemCard key={item.key} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Recommended pay-down order */}
      {payDownOrder.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <h3 className="text-sm font-bold text-gray-900 mb-1">Recommended Order to Pay Down Proof Debt</h3>
          <p className="text-xs text-gray-400 mb-3 leading-relaxed">
            Prioritized by: zero proof records first (nothing to verify against), then by evidence quality (none → weak → medium).
          </p>
          <div className="space-y-2">
            {payDownOrder.map((item, idx) => (
              <div key={item.key} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-500">{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.label}</p>
                  <p className="text-[11px] text-gray-400 truncate">{item.debtType}</p>
                </div>
                <SeverityBadge severity={item.severity} />
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DebtStatCard({ label, value, color, icon: Icon }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3" style={{ color }} />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      </div>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const styles = {
    critical: { color: "#DC2626", bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.2)", label: "Critical" },
    high: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", label: "High" },
    medium: { color: "#6B7280", bg: "rgba(107,114,128,0.06)", border: "rgba(107,114,128,0.2)", label: "Medium" },
  };
  const s = styles[severity] || styles.medium;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

function DebtItemCard({ item }) {
  const statusColor = STATUS_COLOR[item.status] || STATUS_COLOR.red;
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-bold text-gray-900">{item.label}</p>
          <p className="text-[11px] text-gray-400 font-mono mt-0.5">{item.key}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <EvidenceQualityBadge quality={item.quality} />
          <SeverityBadge severity={item.severity} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <ProofMetric label="Proof Records" value={item.proofTotal} />
        <ProofMetric label="Passed" value={item.proofPassed} color="#059669" />
        <ProofMetric label="Pending" value={item.proofPending} color="#D97706" />
        <ProofMetric label="Failed" value={item.proofFailed} color="#DC2626" />
      </div>

      <div className="mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Debt Type</p>
        <p className="text-xs text-gray-600">{item.debtType}</p>
      </div>

      {item.blockers.length > 0 && (
        <div className="mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1">Blockers</p>
          <ul className="space-y-1">
            {item.blockers.map((b, i) => (
              <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                <span className="text-red-300 mt-0.5 flex-shrink-0">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.nextAction && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Next Action</p>
          <p className="text-xs text-gray-600">{item.nextAction}</p>
        </div>
      )}
    </div>
  );
}

function ProofMetric({ label, value, color }) {
  return (
    <div className="rounded border border-gray-100 bg-white p-2">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm font-bold mt-0.5" style={{ color: color || "#111827" }}>{value}</p>
    </div>
  );
}