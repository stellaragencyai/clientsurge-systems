import { useState, useCallback } from "react";
import { ShieldCheck, AlertTriangle, XCircle, HelpCircle, RefreshCw, Loader2, CreditCard, BarChart3, LayoutDashboard, Phone, Calendar, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_CONFIG = {
  trusted: { label: "Trusted", icon: ShieldCheck, color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
  ready: { label: "Ready", icon: ShieldCheck, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  warning: { label: "Warning", icon: AlertTriangle, color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  blocked: { label: "Blocked", icon: XCircle, color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  unknown: { label: "Unknown", icon: HelpCircle, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" },
};

const PROOF_CARDS = [
  { key: "stripe", label: "Stripe Payment Proof", icon: CreditCard },
  { key: "analytics", label: "Analytics Proof", icon: BarChart3 },
  { key: "dashboard_truth", label: "Dashboard Truth Proof", icon: LayoutDashboard },
  { key: "voice", label: "Voice Proof", icon: Phone },
  { key: "booking", label: "Booking Proof", icon: Calendar },
  { key: "site_readiness", label: "Site Readiness Proof", icon: Globe },
];

const findGate = (gates, ...gateKeys) => {
  if (!Array.isArray(gates)) return null;
  return gateKeys.map((key) => gates.find((gate) => gate.gate_key === key)).find(Boolean) || null;
};

const gateStatusToCardStatus = (gate) => {
  if (!gate) return "unknown";
  if (gate.status === "approved" || gate.status === "proof_passed") return "trusted";
  if (gate.status === "ready_for_proof") return "ready";
  if (gate.status === "partial" || gate.status === "proof_running") return "warning";
  if (gate.status === "blocked" || gate.status === "proof_failed" || gate.status === "locked") return "blocked";
  return "unknown";
};

function ProofCard({ card, status, nextAction }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  const Icon = card.icon;
  const StatusIcon = config.icon;

  return (
    <div className={`rounded-xl border-2 p-5 ${config.bg} ${config.border}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.color}`} />
          <h3 className="text-sm font-bold text-foreground">{card.label}</h3>
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
          <StatusIcon className="w-3 h-3" />
          <span className="text-xs font-bold uppercase tracking-wide">{config.label}</span>
        </div>
      </div>
      {status !== "trusted" && nextAction && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Next Action</p>
          <p className="text-xs text-foreground/80 leading-relaxed">{nextAction}</p>
        </div>
      )}
    </div>
  );
}

export default function LaunchProofDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchProof = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("runLaunchTruthSprint", {});
      setData(res?.data || res);
    } catch (err) {
      setError(err?.message || "Failed to load launch proof data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useState(() => {
    fetchProof();
  }, []);

  // Map sprint data to 6 proof card statuses
  const getCardStatus = (cardKey) => {
    if (!data) return { status: "unknown", nextAction: "" };

    switch (cardKey) {
      case "stripe": {
        const gate = findGate(data.gates, "stripe_payment_gate", "stripe_payments");
        const status = gateStatusToCardStatus(gate);
        return {
          status,
          nextAction: status === "trusted" ? "" : gate?.next_action || "Complete a real Stripe checkout. Verify payment_status=paid on a production order.",
        };
      }
      case "analytics": {
        const ga4 = data.evidence?.ga4 || data.sections?.ga4 || {};
        const pageViewCount = Number(ga4.page_view_count || 0);
        const ctaClickCount = Number(ga4.cta_click_count || 0);
        const hasRealConversionEvents = Boolean(
          ga4.has_real_conversion_events ||
          ga4.has_tracking_proof ||
          (pageViewCount > 0 && ctaClickCount > 0)
        );
        const ga4Active = Boolean(
          ga4.ga4_active ||
          ga4.status === "ready_for_proof" ||
          ga4.status === "trusted" ||
          (
            ga4.record_exists &&
            ga4.measurement_id_valid &&
            ga4.tracking_enabled &&
            ga4.setup_status === "active"
          )
        );

        if (ga4Active && hasRealConversionEvents) return { status: "trusted", nextAction: "" };
        if (ga4Active && !hasRealConversionEvents) {
          return {
            status: "ready",
            nextAction: ga4.next_action || "GA4 is configured, but no real page_view + cta_click proof has been recorded yet. Generate traffic and verify in GA4 Realtime.",
          };
        }
        return {
          status: "blocked",
          nextAction: ga4.next_action || "Configure GA4 with a valid measurement ID and enable tracking.",
        };
      }
      case "dashboard_truth": {
        const gate = findGate(data.gates, "dashboard_truth_gate");
        const dashboardTruth = data.evidence?.dashboard_truth || data.sections?.dashboard_truth || {};
        const leadCapture = data.evidence?.lead_capture || data.sections?.lead_capture || {};
        const productionFailed = Number(dashboardTruth.failed_jobs_production || 0);
        const productionStuck = Number(dashboardTruth.stuck_jobs_production || 0);
        const productionDeadLetters = Number(dashboardTruth.dead_letter_production || 0);
        const unresolvedProductionIssues = productionFailed + productionStuck + productionDeadLetters;
        const hasTrustedLead = Boolean(leadCapture?.latest_website_lead?.is_production_trusted);

        if (gate?.status === "approved" || gate?.status === "proof_passed") {
          return { status: "trusted", nextAction: "" };
        }
        if (
          gate?.status === "ready_for_proof" ||
          (
            dashboardTruth.safe_to_show_admin === true &&
            dashboardTruth.safe_to_launch === true &&
            unresolvedProductionIssues === 0
          )
        ) {
          return {
            status: "ready",
            nextAction: gate?.next_action || "Admin approval required after reviewing dashboard truth evidence.",
          };
        }
        if (gate?.status === "blocked" || unresolvedProductionIssues > 0) {
          return {
            status: "blocked",
            nextAction: gate?.next_action || "Resolve production-trusted failed/stuck jobs and dead-letter records before launch.",
          };
        }
        if (hasTrustedLead || dashboardTruth.safe_to_show_admin === true || leadCapture?.latest_website_lead) {
          return {
            status: "warning",
            nextAction: gate?.next_action || "Dashboard truth evidence exists, but it is not ready for proof yet.",
          };
        }
        return { status: "unknown", nextAction: "No dashboard truth evidence returned yet. Run Re-verify All." };
      }
      case "voice": {
        const gate = findGate(data.gates, "voice_frontline_gate", "twilio_voice_gate", "elevenlabs_postcall_logging_gate", "elevenlabs_voice");
        const status = gateStatusToCardStatus(gate);
        return {
          status,
          nextAction: status === "trusted" ? "" : gate?.next_action || "Configure ElevenLabs/Twilio voice, make a real inbound test call, then rerun proof.",
        };
      }
      case "booking": {
        const gate = findGate(data.gates, "booking_flow_gate");
        const booking = data.evidence?.booking_proof || data.sections?.booking_proof || {};
        const linkPresent = Boolean(booking.has_booking_link || booking.link_present || booking.booking_link_default);
        const linkValid = Boolean(booking.link_valid || booking.link_looks_valid || booking.status === "ready_for_proof");
        const gateStatus = gateStatusToCardStatus(gate);

        if (gateStatus === "trusted") return { status: "trusted", nextAction: "" };
        if (gateStatus === "ready" || (linkPresent && linkValid)) {
          return {
            status: "ready",
            nextAction: gate?.next_action || booking.next_action || "Open the booking link, verify the calendar loads, complete a test booking/click, then approve proof.",
          };
        }
        if (linkPresent && !linkValid) {
          return {
            status: "warning",
            nextAction: gate?.next_action || booking.next_action || "Booking link is set but appears invalid. Update in Admin Settings.",
          };
        }
        return {
          status: "blocked",
          nextAction: gate?.next_action || booking.next_action || "Set a valid booking link (Calendly or similar) in Admin Settings.",
        };
      }
      case "site_readiness": {
        const publicSite = data.sections?.public_site;
        if (publicSite?.public_routes_verified && publicSite?.internal_routes_hidden) return { status: "trusted", nextAction: "" };
        if (publicSite?.public_routes_verified) return { status: "warning", nextAction: "Public routes are live but internal routes may be exposed. Review robots.txt and sitemap." };
        return { status: "blocked", nextAction: "Verify public routes are accessible and internal routes are hidden from search engines." };
      }
      default:
        return { status: "unknown", nextAction: "Proof has not been evaluated." };
    }
  };

  // Sort cards: blocked first, then unknown, warning, ready, trusted
  const statusOrder = { blocked: 0, unknown: 1, warning: 2, ready: 3, trusted: 4 };
  const sortedCards = [...PROOF_CARDS].sort((a, b) => {
    const sa = statusOrder[getCardStatus(a.key).status] ?? 5;
    const sb = statusOrder[getCardStatus(b.key).status] ?? 5;
    return sa - sb;
  });

  const blockedCount = PROOF_CARDS.filter(c => getCardStatus(c.key).status === "blocked").length;
  const warningCount = PROOF_CARDS.filter(c => getCardStatus(c.key).status === "warning").length;
  const readyCount = PROOF_CARDS.filter(c => getCardStatus(c.key).status === "ready").length;
  const trustedCount = PROOF_CARDS.filter(c => getCardStatus(c.key).status === "trusted").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Launch Proof Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Evidence-based proof that each system gate is verified before launch.</p>
        </div>
        <button
          onClick={fetchProof}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? "Checking..." : "Re-verify All"}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
          <p className="text-2xl font-bold text-red-700">{blockedCount}</p>
          <p className="text-xs font-semibold uppercase text-red-700 tracking-wide">Blocked</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-center">
          <p className="text-2xl font-bold text-yellow-700">{warningCount}</p>
          <p className="text-xs font-semibold uppercase text-yellow-700 tracking-wide">Warning</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{readyCount}</p>
          <p className="text-xs font-semibold uppercase text-blue-700 tracking-wide">Ready</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{trustedCount}</p>
          <p className="text-xs font-semibold uppercase text-green-700 tracking-wide">Trusted</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Proof Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedCards.map((card) => {
          const { status, nextAction } = getCardStatus(card.key);
          return <ProofCard key={card.key} card={card} status={status} nextAction={nextAction} />;
        })}
      </div>

      {loading && !data && (
        <div className="text-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Verifying launch proof...</p>
        </div>
      )}
    </div>
  );
}
