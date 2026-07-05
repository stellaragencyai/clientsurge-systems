import { CheckCircle2, AlertTriangle, XCircle, Circle, Clock } from "lucide-react";

// ── Safe JSON parsing ──
export function safeJsonParse(str, fallback) {
  if (!str || typeof str !== "string") return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback ?? str;
  }
}

// ── Evidence quality classification (mirrors backend patterns) ──
const INTERNAL_PATTERNS = /clientsurge-install\.internal|clientsurge\.test|test\+|test-|^test\b|smoke|\bqa\b|internal|backfill|example\.com/i;
const OWNER_PATTERNS = /nolanf|nolan\./i;

export function classifyEvidenceQuality(record) {
  if (!record) return "unknown";
  const email = (record.client_email || record.customer_email || "").toLowerCase();
  const name = (record.business_name || "").toLowerCase();
  if (OWNER_PATTERNS.test(email) || OWNER_PATTERNS.test(name)) return "owner";
  if (INTERNAL_PATTERNS.test(email) || INTERNAL_PATTERNS.test(name)) return "internal_test";
  return "production_customer";
}

export function isQaEvidence(quality) {
  return quality === "internal_test" || quality === "owner" || quality === "unknown" || quality === "mixed";
}

// ── Verification lifecycle model ──
export function deriveLifecycleStage(gate, proofLog, checklist) {
  if (!gate && !proofLog && !checklist) return "Not Configured";
  if (gate?.status === "blocked" || gate?.status === "proof_failed") return "Blocked";

  const eq = gate?.evidence_quality || (proofLog ? classifyEvidenceQuality(proofLog) : "unknown");
  const hasProof = proofLog?.status === "pass" || gate?.status === "proof_passed";
  const approved = gate?.status === "approved" || checklist?.client_approved;
  const wentLive = checklist?.went_live_at || gate?.status === "approved";

  if (wentLive && approved) return "Live";
  if (approved && eq === "production_customer") return "Approved for Public/Client Launch";
  if (approved) return "Approved for Internal Launch";
  if (hasProof && eq === "production_customer") return "Production Proof Passed";
  if (hasProof) return "QA Proof Passed";
  if (checklist?.twilio_configured || gate?.status === "partial" || gate?.status === "ready_for_proof") return "Configured";
  return "Not Configured";
}

// ── Status pill component ──
const PILL_META = {
  green: { bg: "rgba(34,197,94,0.10)", border: "rgba(34,197,94,0.30)", color: "#15803d", icon: CheckCircle2, label: "" },
  yellow: { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.30)", color: "#b45309", icon: AlertTriangle, label: "" },
  red: { bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.30)", color: "#b91c1c", icon: XCircle, label: "" },
  gray: { bg: "rgba(107,114,128,0.10)", border: "rgba(107,114,128,0.25)", color: "#4b5563", icon: Circle, label: "" },
  blue: { bg: "rgba(0,174,239,0.08)", border: "rgba(0,174,239,0.25)", color: "#0369a1", icon: Clock, label: "" },
};

export function StatusPill({ color = "gray", label, icon: CustomIcon }) {
  const meta = PILL_META[color] || PILL_META.gray;
  const Icon = CustomIcon || meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap"
      style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export function statusColorFromGate(gate) {
  if (!gate) return "gray";
  const s = gate.status;
  if (s === "approved" || s === "waived") return "green";
  if (s === "proof_passed") {
    return isQaEvidence(gate.evidence_quality) ? "yellow" : "green";
  }
  if (s === "partial" || s === "ready_for_proof" || s === "proof_running") return "yellow";
  if (s === "blocked" || s === "proof_failed") return "red";
  if (s === "locked") return "gray";
  return "gray";
}

// ── Date formatting ──
export function fmtDate(dt) {
  if (!dt) return "—";
  try {
    const d = typeof dt === "string" ? new Date(dt) : dt;
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export function timeAgo(dt) {
  if (!dt) return "never";
  try {
    const d = typeof dt === "string" ? new Date(dt) : dt;
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return "—";
  }
}

// ── Compact evidence table row ──
export function EvidenceRow({ label, value, warning }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400 w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-xs leading-relaxed flex-1 ${warning ? "text-amber-700" : "text-gray-700"}`}>
        {value || "—"}
      </span>
    </div>
  );
}