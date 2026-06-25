import { Users, CheckCircle2, XCircle, MessageSquare, Mail, Activity } from "lucide-react";

function Row({ label, value, good, bad }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="text-muted-foreground font-medium flex-shrink-0">{label}</span>
      <span className="text-foreground text-right flex items-center gap-1">
        {good !== undefined && (good ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : bad ? <XCircle className="w-3 h-3 text-red-500" /> : null)}
        {String(value)}
      </span>
    </div>
  );
}

export default function LeadCaptureProofCard({ leadCaptureData }) {
  const wl = leadCaptureData?.latest_website_lead;
  const cl = leadCaptureData?.latest_canonical_lead;
  const consent = leadCaptureData?.consent_proof;
  const smsLog = leadCaptureData?.latest_lead_sms;
  const emailLog = leadCaptureData?.latest_lead_email;
  const commEvents = leadCaptureData?.latest_comm_events || [];
  const linkedLogs = leadCaptureData?.linked_comm_logs || [];

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">D. Lead Capture Proof</h3>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${wl && (smsLog || emailLog) ? "bg-green-100 text-green-700" : wl ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
          {wl && (smsLog || emailLog) ? "Proof Found" : wl ? "Partial" : "Blocked"}
        </span>
      </div>

      {/* Latest WebsiteLead */}
      {wl ? (
        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Latest Production-Trusted WebsiteLead</p>
          <Row label="Name" value={wl.name} />
          <Row label="Email" value={wl.email} />
          <Row label="Source" value={wl.source} />
          <Row label="Lead ID" value={wl.id} />
          <Row label="Created" value={wl.created_date ? new Date(wl.created_date).toLocaleString() : "—"} />
        </div>
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-xs text-red-700 font-semibold">⚠ No production-trusted WebsiteLead records found.</p>
          <p className="text-xs text-red-600 mt-1">Submit a real lead through the public form at /contact or any industry page.</p>
        </div>
      )}

      {/* Canonical Lead Linkage */}
      {cl ? (
        <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-1.5">
          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Linked CRM / Canonical Lead</p>
          <Row label="Name" value={cl.name} />
          <Row label="Email" value={cl.email} />
          <Row label="Lead State" value={cl.lead_state} good={cl.lead_state !== "NEW"} />
          <Row label="Quality Status" value={cl.quality_review_status} good={cl.quality_review_status === "verified_outbound_ready"} />
        </div>
      ) : (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs text-yellow-700 font-semibold">⚠ No linked Leads record found for the latest WebsiteLead.</p>
        </div>
      )}

      {/* Consent */}
      {consent ? (
        <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-1.5">
          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Consent Fields</p>
          <Row label="Consent Given" value={consent.consent_given ? "✓ Yes" : "✗ No"} good={consent.consent_given} bad={!consent.consent_given} />
          <Row label="Consent At" value={consent.consent_given_at ? new Date(consent.consent_given_at).toLocaleString() : "—"} />
          <Row label="Consent Source" value={consent.consent_source} />
        </div>
      ) : (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs text-yellow-700 font-semibold">⚠ Consent fields not captured on latest lead.</p>
        </div>
      )}

      {/* SMS CommunicationLog */}
      {smsLog ? (
        <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-1.5">
          <p className="text-xs font-bold uppercase text-muted-foreground mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Latest SMS CommunicationLog</p>
          <Row label="To" value={smsLog.to_address} />
          <Row label="Delivery Status" value={smsLog.delivery_status} good={smsLog.delivery_status === "delivered"} />
          <Row label="Provider ID" value={smsLog.provider_message_id} good={smsLog.provider_message_id !== "—"} />
          <Row label="Trigger" value={smsLog.trigger_name} />
          <Row label="Sent At" value={smsLog.sent_at ? new Date(smsLog.sent_at).toLocaleString() : "—"} />
        </div>
      ) : (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs text-yellow-700 font-semibold flex items-center gap-1"><MessageSquare className="w-3 h-3" /> No SMS CommunicationLog linked to this lead.</p>
        </div>
      )}

      {/* Email CommunicationLog */}
      {emailLog ? (
        <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-1.5">
          <p className="text-xs font-bold uppercase text-muted-foreground mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Latest Email CommunicationLog</p>
          <Row label="To" value={emailLog.to_address} />
          <Row label="Delivery Status" value={emailLog.delivery_status} good={emailLog.delivery_status === "delivered"} />
          <Row label="Provider ID" value={emailLog.provider_message_id} good={emailLog.provider_message_id !== "—"} />
          <Row label="Subject" value={emailLog.subject} />
          <Row label="Sent At" value={emailLog.sent_at ? new Date(emailLog.sent_at).toLocaleString() : "—"} />
        </div>
      ) : (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs text-yellow-700 font-semibold flex items-center gap-1"><Mail className="w-3 h-3" /> No Email CommunicationLog linked to this lead.</p>
        </div>
      )}

      {/* CommunicationEvent Records */}
      {commEvents.length > 0 ? (
        <div className="rounded-lg border border-border bg-muted/10 p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1"><Activity className="w-3 h-3" /> CommunicationEvent Records ({commEvents.length})</p>
          <div className="space-y-1">
            {commEvents.map((e, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-white/50 rounded px-2 py-1">
                <span className="text-foreground">{e.event_type} — {e.channel} ({e.direction})</span>
                <span className={e.status === "sent" || e.status === "delivered" ? "text-green-600" : e.status === "failed" ? "text-red-600" : "text-yellow-700"}>{e.status}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs text-yellow-700 font-semibold flex items-center gap-1"><Activity className="w-3 h-3" /> No CommunicationEvent records linked to this lead.</p>
        </div>
      )}

      {/* Summary */}
      <div className="pt-2 border-t border-border flex items-center gap-4 text-xs">
        <span className="text-muted-foreground">Production-trusted leads: <span className="font-bold text-foreground">{leadCaptureData?.production_trusted_leads || 0}</span></span>
        <span className="text-muted-foreground">Test/internal excluded: <span className="font-bold text-foreground">{leadCaptureData?.test_internal_excluded || 0}</span></span>
      </div>
      <p className="text-xs text-primary font-semibold">{leadCaptureData?.next_action}</p>
    </div>
  );
}