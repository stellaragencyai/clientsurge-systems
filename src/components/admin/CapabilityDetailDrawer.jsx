import { useState } from "react";
import { Database, FileText, ClipboardList, MessageSquare, XCircle } from "lucide-react";
import EvidenceQualityBadge, { classifyCapabilityEvidence } from "./EvidenceQualityBadge";

const STATUS_STYLES = {
  green: { color: "#059669", label: "Proven" },
  yellow: { color: "#D97706", label: "Partial" },
  red: { color: "#DC2626", label: "Missing" },
};

const ENTITY_ICONS = {
  AutomationProofLog: FileText,
  CommunicationLog: MessageSquare,
  CommunicationEvent: MessageSquare,
  AutomationChecklist: ClipboardList,
  AdminSettings: Database,
};

export default function CapabilityDetailDrawer({ data }) {
  const capabilities = data?.capabilities || [];
  const capabilityDetails = data?.capability_details || {};
  const [selectedKey, setSelectedKey] = useState(capabilities[0]?.key || "");

  const cap = capabilities.find(c => c.key === selectedKey) || capabilities[0];
  if (!cap) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-400">No capabilities available.</p>
      </div>
    );
  }

  const detail = capabilityDetails[cap.key] || null;
  const statusStyle = STATUS_STYLES[cap.status] || STATUS_STYLES.red;
  const evidenceQuality = classifyCapabilityEvidence(cap);

  return (
    <div className="space-y-4">
      {/* Capability selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Select a Capability</h3>
        <div className="flex flex-wrap gap-2">
          {capabilities.map(c => {
            const s = STATUS_STYLES[c.status] || STATUS_STYLES.red;
            return (
              <button
                key={c.key}
                onClick={() => setSelectedKey(c.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${c.key === selectedKey ? "text-white" : "text-gray-600 hover:bg-gray-50"}`}
                style={c.key === selectedKey ? { background: "#3b4450", borderColor: "#3b4450" } : { borderColor: "#e5e7eb" }}
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block mr-1.5" style={{ background: s.color }} />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h4 className="text-base font-bold text-gray-900">{cap.label}</h4>
            <p className="text-xs text-gray-400 mt-0.5">Capability Key: <code className="font-mono">{cap.key}</code></p>
          </div>
          <div className="flex items-center gap-2">
            <EvidenceQualityBadge quality={evidenceQuality} />
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ color: statusStyle.color, background: `${statusStyle.color}11`, border: `1px solid ${statusStyle.color}30` }}
            >
              {statusStyle.label}
            </span>
          </div>
        </div>

        {/* Entities used */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Entities Used to Evaluate</p>
          <div className="flex flex-wrap gap-2">
            {(detail?.entities_used || ["AutomationProofLog", "CommunicationLog", "CommunicationEvent", "AutomationChecklist", "AdminSettings"]).map((e, i) => {
              const Icon = ENTITY_ICONS[e] || Database;
              return (
                <span key={i} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600">
                  <Icon className="w-3 h-3 text-gray-400" /> {e}
                </span>
              );
            })}
          </div>
        </div>

        {/* Evidence summary */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Evidence Summary</p>
          <p className="text-xs text-gray-600 leading-relaxed">{detail?.evidence_summary || cap.evidence_sources?.join("; ") || "No evidence found"}</p>
        </div>

        {/* Blockers */}
        {(detail?.blockers?.length > 0 || cap.blockers?.length > 0) && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1">Blockers</p>
            <ul className="space-y-1">
              {(detail?.blockers || cap.blockers).map((b, i) => (
                <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                  <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" /> {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Incomplete setup fields */}
        {detail?.incomplete_setup_fields?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-1">Incomplete Setup Fields</p>
            <div className="flex flex-wrap gap-1.5">
              {detail.incomplete_setup_fields.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-mono text-amber-700">{f}</span>
              ))}
            </div>
          </div>
        )}

        {/* Latest records */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RecordCard title="Latest Checklist Record" icon={ClipboardList} record={detail?.latest_checklist} fields={[
            { key: "business_name", label: "Business" },
            { key: "service_key", label: "Service" },
            { key: "status", label: "Status" },
            { key: "client_approved", label: "Client Approved", type: "bool" },
          ]} />
          <RecordCard title="Latest Proof Record" icon={FileText} record={detail?.latest_proof} fields={[
            { key: "service_key", label: "Service" },
            { key: "status", label: "Status" },
            { key: "tested_at", label: "Tested At", type: "date" },
          ]} />
          <RecordCard title="Latest Communication Log" icon={MessageSquare} record={detail?.latest_communication} fields={[
            { key: "channel", label: "Channel" },
            { key: "delivery_status", label: "Delivery Status" },
            { key: "provider_message_id", label: "Provider Msg ID" },
            { key: "created_date", label: "Created", type: "date" },
          ]} />
        </div>

        {/* Next action */}
        {(detail?.next_admin_action || cap.next_action) && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 mb-0.5">Next Admin Action</p>
            <p className="text-xs text-blue-700">{detail?.next_admin_action || cap.next_action}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RecordCard({ title, icon: Icon, record, fields }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      </div>
      {record ? (
        <dl className="space-y-1">
          {fields.map(f => {
            const val = record[f.key];
            if (val === null || val === undefined || val === "") return null;
            const display = f.type === "date" ? new Date(val).toLocaleString() : f.type === "bool" ? (val ? "Yes" : "No") : String(val);
            return (
              <div key={f.key} className="flex items-start gap-2 text-xs">
                <dt className="font-semibold text-gray-400 flex-shrink-0">{f.label}:</dt>
                <dd className="text-gray-700 break-all">{display}</dd>
              </div>
            );
          })}
        </dl>
      ) : (
        <p className="text-xs text-gray-400">No record found.</p>
      )}
    </div>
  );
}