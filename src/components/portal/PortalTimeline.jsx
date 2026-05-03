import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Clock, Loader2, Zap, MessageSquare, Mail, Phone, AlertCircle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

// ── Stage definitions ────────────────────────────────────────────────────────
const INSTALL_STAGES = [
  { key: "Paid",             label: "Payment Confirmed",      icon: "✓",  desc: "Your order was received and payment processed." },
  { key: "Ready for Install", label: "Installer Assigned",    icon: "👷", desc: "A dedicated team member has been assigned to your project." },
  { key: "Configuring",      label: "System Being Built",     icon: "⚙️", desc: "Your automation flows, SMS, and email sequences are being configured." },
  { key: "Testing",          label: "Final Testing",          icon: "🧪", desc: "We're running end-to-end tests to verify every automation fires correctly." },
  { key: "Live",             label: "You're Live!",           icon: "🚀", desc: "Your system is active and capturing leads 24/7." },
];

const STAGE_ORDER = ["Paid", "Ready for Install", "Configuring", "Testing", "Live"];

const EVENT_TYPE_LABELS = {
  sms_sent:          { label: "SMS Sent",           icon: MessageSquare, color: "#3b82f6" },
  sms_delivered:     { label: "SMS Delivered",      icon: MessageSquare, color: "#22c55e" },
  sms_failed:        { label: "SMS Failed",          icon: AlertCircle,   color: "#ef4444" },
  email_sent:        { label: "Email Sent",          icon: Mail,          color: "#8b5cf6" },
  email_failed:      { label: "Email Failed",        icon: AlertCircle,   color: "#ef4444" },
  order_paid:        { label: "Payment Received",    icon: CheckCircle2,  color: "#22c55e" },
  install_initialized: { label: "Setup Started",    icon: Zap,           color: "#f59e0b" },
  service_status_changed: { label: "Status Updated", icon: Zap,          color: "#0ea5e9" },
  status_update:     { label: "Status Updated",      icon: Zap,           color: "#0ea5e9" },
  lead_created:      { label: "New Lead Captured",   icon: CheckCircle2,  color: "#22c55e" },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StageRow({ stage, status, isLast, estimatedDate }) {
  const isComplete = status === "complete";
  const isCurrent  = status === "current";
  const isPending  = status === "pending";

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", position: "relative" }}>
      {/* Vertical connector */}
      {!isLast && (
        <div style={{
          position: "absolute", left: "17px", top: "36px",
          width: "2px", height: "calc(100% - 8px)",
          background: isComplete ? "linear-gradient(to bottom,#22c55e80,#22c55e30)" : "rgba(0,0,0,0.08)",
        }} />
      )}

      {/* Circle icon */}
      <div style={{
        width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0, zIndex: 1,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
        background: isComplete ? "linear-gradient(135deg,#16a34a,#22c55e)"
                  : isCurrent  ? "linear-gradient(135deg,#0ea5e9,#0284c7)"
                  : "rgba(0,0,0,0.05)",
        border: isComplete ? "2px solid rgba(34,197,94,0.5)"
              : isCurrent  ? "2px solid rgba(14,165,233,0.6)"
              : "2px solid rgba(0,0,0,0.1)",
        boxShadow: isComplete ? "0 0 12px rgba(34,197,94,0.25)"
                 : isCurrent  ? "0 0 14px rgba(14,165,233,0.35)"
                 : "none",
      }}>
        {isCurrent
          ? <Loader2 style={{ width: "16px", height: "16px", color: "#fff", animation: "spin 1.5s linear infinite" }} />
          : <span style={{ color: isComplete ? "#fff" : "rgba(0,0,0,0.3)" }}>{stage.icon}</span>
        }
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : "28px", opacity: isPending ? 0.4 : 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "2px" }}>
          <span style={{
            fontSize: "14px", fontWeight: "700",
            color: isComplete ? "#15803d" : isCurrent ? "#0369a1" : "rgba(0,0,0,0.45)",
          }}>
            {stage.label}
          </span>
          {isComplete && (
            <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "9999px", background: "rgba(34,197,94,0.12)", color: "#16a34a" }}>
              Complete
            </span>
          )}
          {isCurrent && (
            <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "9999px", background: "rgba(14,165,233,0.12)", color: "#0369a1", animation: "pulse 2s infinite" }}>
              In Progress
            </span>
          )}
          {isPending && estimatedDate && (
            <span style={{ fontSize: "10px", color: "rgba(0,0,0,0.35)" }}>Estimated: {estimatedDate}</span>
          )}
        </div>
        <p style={{ fontSize: "12px", color: "rgba(0,0,0,0.5)", margin: 0, lineHeight: 1.5 }}>{stage.desc}</p>
      </div>
    </div>
  );
}

function ActivityRow({ event }) {
  const typeInfo = EVENT_TYPE_LABELS[event.event_type] || { label: event.event_type, icon: Zap, color: "#94a3b8" };
  const Icon = typeInfo.icon;
  const date = event.created_date ? new Date(event.created_date) : null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
      <div style={{
        width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
        background: `${typeInfo.color}18`, border: `1px solid ${typeInfo.color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon style={{ width: "12px", height: "12px", color: typeInfo.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "12px", fontWeight: "600", color: "#1b140d", margin: 0, truncate: true }}>
          {typeInfo.label}
          {event.service_key && <span style={{ color: "rgba(0,0,0,0.4)", fontWeight: "400" }}> · {event.service_key.replace(/_/g, " ")}</span>}
        </p>
        {event.message_body && (
          <p style={{ fontSize: "11px", color: "rgba(0,0,0,0.45)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {event.message_body}
          </p>
        )}
      </div>
      {date && (
        <span style={{ fontSize: "10px", color: "rgba(0,0,0,0.35)", flexShrink: 0, whiteSpace: "nowrap" }}>
          {formatDistanceToNow(date, { addSuffix: true })}
        </span>
      )}
    </div>
  );
}

function UpcomingTaskRow({ service }) {
  const nextStageIdx = STAGE_ORDER.indexOf(service.install_status) + 1;
  const nextStage = INSTALL_STAGES[nextStageIdx];
  if (!nextStage || service.install_status === "Live") return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px",
      borderRadius: "10px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
      marginBottom: "8px",
    }}>
      <div style={{
        width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
        background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Clock style={{ width: "13px", height: "13px", color: "#d97706" }} />
      </div>
      <div>
        <p style={{ fontSize: "12px", fontWeight: "700", color: "#92400e", margin: 0 }}>
          Up Next: {nextStage.label}
        </p>
        <p style={{ fontSize: "11px", color: "rgba(0,0,0,0.45)", margin: 0 }}>
          {service.display_name || service.serviceKey}
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PortalTimeline({ order, project }) {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const services = order?.services || [];
  const primaryStatus = services[0]?.install_status || order?.pipeline_status || "Paid";

  // Current stage index
  const currentStageIdx = STAGE_ORDER.indexOf(primaryStatus);
  const stages = INSTALL_STAGES.map((stage, idx) => ({
    ...stage,
    status: idx < currentStageIdx ? "complete" : idx === currentStageIdx ? "current" : "pending",
  }));

  // Fetch real CommunicationEvents for this order
  useEffect(() => {
    if (!order?.id) { setLoadingEvents(false); return; }
    const load = async () => {
      try {
        const results = await base44.entities.CommunicationEvent.filter(
          { order_id: order.id },
          "-created_date",
          20
        );
        setEvents(results || []);
      } catch {
        setEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };
    load();

    // Real-time updates
    const unsub = base44.entities.CommunicationEvent.subscribe((evt) => {
      if (evt.data?.order_id === order.id) {
        setEvents(prev => {
          if (evt.type === "create") return [evt.data, ...prev].slice(0, 20);
          if (evt.type === "update") return prev.map(e => e.id === evt.id ? evt.data : e);
          return prev;
        });
      }
    });
    return unsub;
  }, [order?.id]);

  const hasUpcomingTasks = services.some(s => s.install_status !== "Live" && STAGE_ORDER.indexOf(s.install_status) < STAGE_ORDER.length - 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Project Timeline</h2>
        <p className="text-sm text-muted-foreground">Where your project stands in the installation process.</p>
      </div>

      {/* Stage tracker */}
      <div style={{
        background: "rgba(255,255,255,0.95)", borderRadius: "20px",
        border: "1px solid rgba(0,0,0,0.08)", padding: "28px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
      }}>
        <p style={{ fontSize: "10px", fontWeight: "800", color: "#0369a1", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 20px" }}>
          Install Stages
        </p>
        <div>
          {stages.map((stage, idx) => (
            <StageRow
              key={stage.key}
              stage={stage}
              status={stage.status}
              isLast={idx === stages.length - 1}
            />
          ))}
        </div>
        {project?.go_live_date && primaryStatus !== "Live" && (
          <div style={{
            marginTop: "16px", padding: "10px 14px", borderRadius: "10px",
            background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <Zap style={{ width: "14px", height: "14px", color: "#0369a1", flexShrink: 0 }} />
            <p style={{ fontSize: "12px", color: "#0369a1", fontWeight: "600", margin: 0 }}>
              Target go-live: {format(new Date(project.go_live_date), "MMMM d, yyyy")}
            </p>
          </div>
        )}
      </div>

      {/* Per-service breakdown */}
      {services.length > 1 && (
        <div style={{
          background: "rgba(255,255,255,0.95)", borderRadius: "20px",
          border: "1px solid rgba(0,0,0,0.08)", padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}>
          <p style={{ fontSize: "10px", fontWeight: "800", color: "#6b21a8", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 14px" }}>
            Per-Service Status
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {services.map((svc, i) => {
              const svcStageIdx = STAGE_ORDER.indexOf(svc.install_status);
              const isLive = svc.install_status === "Live";
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: "10px",
                  background: isLive ? "rgba(34,197,94,0.06)" : "rgba(0,0,0,0.03)",
                  border: `1px solid ${isLive ? "rgba(34,197,94,0.2)" : "rgba(0,0,0,0.07)"}`,
                }}>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: "700", color: "#1b140d", margin: 0 }}>
                      {svc.display_name || svc.service_key}
                    </p>
                    <p style={{ fontSize: "11px", color: "rgba(0,0,0,0.45)", margin: 0 }}>
                      Stage {Math.max(svcStageIdx, 0) + 1} of {STAGE_ORDER.length}
                    </p>
                  </div>
                  <span style={{
                    fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "9999px",
                    background: isLive ? "rgba(34,197,94,0.15)" : "rgba(14,165,233,0.12)",
                    color: isLive ? "#15803d" : "#0369a1",
                  }}>
                    {isLive ? "✦ Live" : svc.install_status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming tasks */}
      {hasUpcomingTasks && (
        <div style={{
          background: "rgba(255,255,255,0.95)", borderRadius: "20px",
          border: "1px solid rgba(0,0,0,0.08)", padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}>
          <p style={{ fontSize: "10px", fontWeight: "800", color: "#d97706", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 14px" }}>
            What Happens Next
          </p>
          {services.map((svc, i) => <UpcomingTaskRow key={i} service={svc} />)}
        </div>
      )}

      {/* Activity log */}
      <div style={{
        background: "rgba(255,255,255,0.95)", borderRadius: "20px",
        border: "1px solid rgba(0,0,0,0.08)", padding: "24px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
      }}>
        <p style={{ fontSize: "10px", fontWeight: "800", color: "#9a5c2e", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 14px" }}>
          Activity Log
        </p>
        {loadingEvents ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "16px 0" }}>
            <Loader2 style={{ width: "14px", height: "14px", color: "#9a5c2e", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.4)" }}>Loading activity…</span>
          </div>
        ) : events.length === 0 ? (
          <p style={{ fontSize: "12px", color: "rgba(0,0,0,0.4)", padding: "16px 0", margin: 0 }}>
            No recorded activity yet — events will appear here as your system is configured.
          </p>
        ) : (
          <div>
            {events.map((evt) => <ActivityRow key={evt.id} event={evt} />)}
          </div>
        )}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}`}</style>
    </div>
  );
}