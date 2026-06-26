import { useState, useCallback } from "react";
import { ShieldCheck, AlertTriangle, XCircle, HelpCircle, RefreshCw, Loader2, CreditCard, BarChart3, LayoutDashboard, Phone, Calendar, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_CONFIG = {
  trusted: { label: "Trusted", icon: ShieldCheck, color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
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
        const gate = data.gates?.find(g => g.gate_key === "stripe_payments");
        const proofPassed = gate?.proof_passed || gate?.status === "approved";
        const blocked = gate?.status === "blocked" || (gate?.blockers?.length > 0);
        if (proofPassed) return { status: "trusted", nextAction: "" };
        if (blocked) return { status: "blocked", nextAction: "Complete a real Stripe checkout. Verify payment_status=paid on a production order." };
        if (gate?.status === "ready_for_proof") return { status: "warning", nextAction: "Run a live test checkout to generate proof." };
        return { status: "unknown", nextAction: "Stripe payment proof has not been verified yet." };
      }
      case "analytics": {
        const ga4 = data.evidence?.ga4;
        if (ga4?.ga4_active && ga4?.has_real_conversion_events) return { status: "trusted", nextAction: "" };
        if (ga4?.ga4_active && !ga4?.has_real_conversion_events) return { status: "warning", nextAction: "GA4 is configured but no real conversion events found. Generate traffic and verify in GA4 Realtime." };
        return { status: "blocked", nextAction: "Configure GA4 with a valid measurement ID and enable tracking." };
      }
      case "dashboard_truth": {
        const leadCapture = data.evidence?.lead_capture;
        const hasTrustedLead = leadCapture?.latest_website_lead?.is_production_trusted;
        if (hasTrustedLead) return { status: "trusted", nextAction: "" };
        if (leadCapture?.latest_website_lead) return { status: "warning", nextAction: "Latest lead exists but is not production-trusted. Verify it is a real customer inquiry." };
        return { status: "unknown", nextAction: "No leads captured yet. Submit a real lead through the website form." };
      }
      case "voice": {
        const gate = data.gates?.find(g => g.gate_key === "elevenlabs_voice");
        if (gate?.proof_passed || gate?.status === "approved") return { status: "trusted", nextAction: "" };
        if (gate?.status === "ready_for_proof") return { status: "warning", nextAction: "Voice agent is configured. Place a test call to verify." };
        return { status: "blocked", nextAction: "Configure ElevenLabs agent and phone number for voice automation." };
      }
      case "booking": {
        const booking = data.evidence?.booking_proof;
        if (booking?.has_booking_link && booking?.link_valid) return { status: "trusted", nextAction: "" };
        if (booking?.has_booking_link && !booking?.link_valid) return { status: "warning", nextAction: "Booking link is set but appears invalid. Update in Admin Settings." };
        return { status: "blocked", nextAction: "Set a valid booking link (Calendly or similar) in Admin Settings." };
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

  // Sort cards: blocked first, then unknown, then warning, then trusted
  const statusOrder = { blocked: 0, unknown: 1, warning: 2, trusted: 3 };
  const sortedCards = [...PROOF_CARDS].sort((a, b) => {
    const sa = statusOrder[getCardStatus(a.key).status] ?? 4;
    const sb = statusOrder[getCardStatus(b.key).status] ?? 4;
    return sa - sb;
  });

  const blockedCount = PROOF_CARDS.filter(c => getCardStatus(c.key).status === "blocked").length;
  const warningCount = PROOF_CARDS.filter(c => getCardStatus(c.key).status === "warning").length;
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
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
          <p className="text-2xl font-bold text-red-700">{blockedCount}</p>
          <p className="text-xs font-semibold uppercase text-red-700 tracking-wide">Blocked</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-center">
          <p className="text-2xl font-bold text-yellow-700">{warningCount}</p>
          <p className="text-xs font-semibold uppercase text-yellow-700 tracking-wide">Warning</p>
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