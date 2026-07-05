import AdminShell from "@/components/admin/AdminShell";
import InboundLeadReadinessCard from "@/components/admin/InboundLeadReadinessCard";
import DuplicateSendProtectionCard from "@/components/admin/DuplicateSendProtectionCard";
import AnalyticsDiagnosticsPanel from "@/components/admin/AnalyticsDiagnosticsPanel";
import { ShieldCheck } from "lucide-react";

export default function InboundReadinessDashboard() {
  return (
    <AdminShell title="Inbound Readiness & Analytics Diagnostics" activeId="inbound-readiness">
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #003B8F, #00AEEF)" }}>
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Inbound Readiness & Analytics Diagnostics</h1>
            <p className="text-xs text-gray-400">Read-only safety configuration and trusted analytics verification — no external providers contacted</p>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <InboundLeadReadinessCard />
          <DuplicateSendProtectionCard />
          <AnalyticsDiagnosticsPanel />
        </div>

        {/* Footer note */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-[11px] text-gray-400">
            Safe Patch — This panel is read-only. It creates default rate-limit guardrails and simulation-only idempotency keys on demand.
            No SMS, email, Twilio, Resend, Stripe, or external provider calls are triggered. All provider settings, templates, webhook URLs,
            existing leads, logs, and jobs are preserved unchanged. Simulation-only IdempotencyKey records contain metadata_json with
            simulation_only:true and no_provider_call:true — they do not imply a real provider send occurred.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}