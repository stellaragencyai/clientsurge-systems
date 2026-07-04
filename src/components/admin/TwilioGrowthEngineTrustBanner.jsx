import { ShieldAlert, Database, EyeOff } from "lucide-react";

/**
 * Admin-only trust warning banner for the Twilio Growth Engine area.
 * Reminds operators that capabilities must stay untrusted until backed by proof records.
 * Not shown publicly — only renders inside the admin dashboard.
 */
export default function TwilioGrowthEngineTrustBanner() {
  return (
    <div
      className="rounded-xl p-5 flex items-start gap-4"
      style={{
        background: "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))",
        border: "1px solid rgba(239,68,68,0.20)",
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)" }}
      >
        <ShieldAlert className="w-5 h-5" style={{ color: "#dc2626" }} />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900 mb-1">
          Trust Guard — capabilities stay untrusted until backed by proof records
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">
          No capability on this page may be marked green or trusted unless it has a real{" "}
          <span className="font-semibold text-gray-700">AutomationProofLog</span> pass, a{" "}
          <span className="font-semibold text-gray-700">CommunicationLog</span> with{" "}
          <code className="text-[11px] bg-gray-100 px-1 rounded">delivery_status=delivered</code>, or a{" "}
          <span className="font-semibold text-gray-700">CommunicationEvent</span> with a valid{" "}
          <code className="text-[11px] bg-gray-100 px-1 rounded">provider_message_id</code>.
          Queued or sent SMS is not delivery proof. Provider ID null + sent = weak/unverified.
          Twilio 400 errors and webhook 404/405 responses are blockers, not OK.
        </p>
        <p className="text-[11px] text-gray-400 mt-2">
          This banner is admin-only. Do not replicate this language on public marketing pages.
        </p>
      </div>
    </div>
  );
}