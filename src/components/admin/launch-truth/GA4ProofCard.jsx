import { BarChart3, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

const CHECKLIST = [
  { step: 1, text: "Create GA4 property / web stream in Google Analytics (external)" },
  { step: 2, text: "Paste Measurement ID (G-XXXXXXX) into GA4Configuration / Admin Settings" },
  { step: 3, text: "Enable tracking (enabled = true)" },
  { step: 4, text: "Visit the public homepage (generates page_view event)" },
  { step: 5, text: "Click at least one CTA (generates cta_click event)" },
  { step: 6, text: "Confirm ConversionTrackingEvent has recent page_view AND cta_click records" },
];

function Row({ label, value, good, bad }) {
  if (value === null || value === undefined) return null;
  const showIcon = good !== undefined || bad !== undefined;
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="text-muted-foreground font-medium flex-shrink-0">{label}</span>
      <span className="text-foreground text-right flex items-center gap-1">
        {showIcon && (good ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : bad ? <XCircle className="w-3 h-3 text-red-500" /> : null)}
        {String(value)}
      </span>
    </div>
  );
}

export default function GA4ProofCard({ ga4Data, loading }) {
  const configExists = ga4Data?.record_exists;
  const idValid = ga4Data?.measurement_id_valid;
  const enabled = ga4Data?.tracking_enabled;
  const setupActive = ga4Data?.setup_status === "active";
  const hasEvents = ga4Data?.has_real_conversion_events;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">B. GA4 Setup Proof</h3>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${hasEvents ? "bg-green-100 text-green-700" : configExists ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
          {hasEvents ? "Proof Found" : configExists ? "Partial" : "Blocked"}
        </span>
      </div>

      {/* Checklist */}
      <div className="space-y-1.5">
        {CHECKLIST.map(item => {
          let done = null;
          if (item.step === 1) done = configExists;
          if (item.step === 2) done = idValid;
          if (item.step === 3) done = enabled && setupActive;
          if (item.step === 4) done = (ga4Data?.page_view_count || 0) > 0;
          if (item.step === 5) done = (ga4Data?.cta_click_count || 0) > 0;
          if (item.step === 6) done = hasEvents;
          return (
            <div key={item.step} className="flex items-start gap-2 text-xs">
              {done === true ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                : done === false ? <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />}
              <span className={done === true ? "text-green-700" : "text-muted-foreground"}>
                <span className="font-semibold">{item.step}.</span> {item.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* GA4 Status Readout */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
        <p className="text-xs font-bold uppercase text-muted-foreground mb-1">GA4 Status Readout</p>
        <Row label="Config Record Exists" value={configExists ? "✓ Yes" : "✗ No"} good={configExists} bad={!configExists} />
        <Row label="Measurement ID" value={ga4Data?.measurement_id || "Not configured"} good={idValid} bad={configExists && !idValid} />
        <Row label="ID Format Valid" value={idValid ? "✓ Yes (G-XXXXXXX)" : "✗ No"} good={idValid} bad={configExists && !idValid} />
        <Row label="Tracking Enabled" value={enabled ? "✓ Yes" : "✗ No"} good={enabled} bad={configExists && !enabled} />
        <Row label="Setup Status" value={ga4Data?.setup_status || "not_configured"} good={setupActive} bad={configExists && !setupActive} />
        <Row label="Page View Events" value={ga4Data?.page_view_count || 0} good={(ga4Data?.page_view_count || 0) > 0} />
        <Row label="CTA Click Events" value={ga4Data?.cta_click_count || 0} good={(ga4Data?.cta_click_count || 0) > 0} />
      </div>

      {/* Latest Conversion Event */}
      {ga4Data?.latest_conversion_event ? (
        <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-1.5">
          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Latest ConversionTrackingEvent</p>
          <Row label="Event Type" value={ga4Data.latest_conversion_event.event_type} />
          <Row label="Page Key" value={ga4Data.latest_conversion_event.page_key} />
          <Row label="Event Label" value={ga4Data.latest_conversion_event.event_label} />
          <Row label="Device Type" value={ga4Data.latest_conversion_event.device_type} />
          <Row label="Timestamp" value={new Date(ga4Data.latest_conversion_event.timestamp).toLocaleString()} />
        </div>
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-xs text-red-700 font-semibold">⚠ No ConversionTrackingEvent records found.</p>
        </div>
      )}

      {/* Tracked vs Missing Events */}
      <div className="rounded-lg border border-border bg-muted/10 p-3">
        <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Expected Events</p>
        <div className="flex flex-wrap gap-1.5">
          {(ga4Data?.expected_events || []).map(ev => (
            <span key={ev} className={`text-xs px-2 py-0.5 rounded-full font-medium ${(ga4Data?.tracked_events || []).includes(ev) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {(ga4Data?.tracked_events || []).includes(ev) ? "✓" : "✗"} {ev}
            </span>
          ))}
        </div>
        {ga4Data?.missing_events?.length > 0 && (
          <p className="text-xs text-red-600 mt-2">Missing: {ga4Data.missing_events.join(", ")}</p>
        )}
      </div>

      {/* Next action */}
      <p className="text-xs text-primary font-semibold">{ga4Data?.next_action}</p>

      <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ExternalLink className="w-3.5 h-3.5" /> Open Homepage to Generate Events
      </a>
    </div>
  );
}