import { Zap, PhoneMissed, Mail, CalendarCheck, RotateCcw, Star } from "lucide-react";

const iconMap = {
  instant_lead_response: { Icon: Zap, color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  missed_call_text_back: { Icon: PhoneMissed, color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  nurture_sequence_14d: { Icon: Mail, color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  ai_booking_agent: { Icon: CalendarCheck, color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  lead_reactivation: { Icon: RotateCcw, color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  review_request: { Icon: Star, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
};

export default function ServiceIcon({ serviceKey, size = 40 }) {
  const cfg = iconMap[serviceKey] || { Icon: Zap, color: "#0088CC", bg: "rgba(0,136,204,0.12)" };
  const { Icon } = cfg;
  return (
    <div style={{
      width: `${size}px`, height: `${size}px`, borderRadius: "12px",
      background: cfg.bg, border: `1px solid ${cfg.color}33`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <Icon style={{ width: `${size * 0.45}px`, height: `${size * 0.45}px`, color: cfg.color }} />
    </div>
  );
}