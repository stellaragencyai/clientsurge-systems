import { useState } from "react";
import {
  ChevronDown, ChevronUp, CheckCircle2, Circle, Sparkles,
  Phone, Mail, Globe, Instagram, DollarSign, Calendar,
  Loader2
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import AIGenerateModal from "./AIGenerateModal";

const STEPS = [
  { key: "step_twilio", label: "Twilio Configured", desc: "Phone number provisioned and connected" },
  { key: "step_lead_sources", label: "Lead Sources Connected", desc: "Google, Facebook, Instagram, etc." },
  { key: "step_instant_response", label: "Instant Response Built", desc: "SMS fires within 60s of new lead" },
  { key: "step_followup_sequence", label: "Follow-Up Sequence Built", desc: "Day 1, Day 3, Day 7 messages ready" },
  { key: "step_missed_call", label: "Missed Call Text-Back Active", desc: "Fires on every missed inbound call" },
  { key: "step_messages_customized", label: "Messages Customized", desc: "All copy uses client's voice and info" },
  { key: "step_tested", label: "End-to-End Tested", desc: "Full QA pass — all triggers confirmed" },
  { key: "step_dashboard", label: "Dashboard Delivered", desc: "Client portal access sent and confirmed" },
  { key: "step_live", label: "Went Live", desc: "System fully active and monitoring" },
];

const STEP_KEYS = STEPS.map(s => s.key);

export default function ClientOnboardingCard({ client, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState({});
  const [aiStep, setAiStep] = useState(null);

  const completedCount = STEP_KEYS.filter(k => client[k]).length;
  const allDone = completedCount === 9;
  const pct = Math.round((completedCount / 9) * 100);

  const toggleStep = async (key, current) => {
    setSaving(p => ({ ...p, [key]: true }));
    const newVal = !current;
    const update = { [key]: newVal };
    // Auto set status to Live when all done
    const newCounts = STEP_KEYS.filter(k => k === key ? newVal : client[k]).length;
    if (newCounts === 9) update.status = "Live";
    else if (newCounts < 9 && client.status === "Live") update.status = "In Setup";
    await base44.entities.OnboardingClient.update(client.id, update);
    onUpdate();
    setSaving(p => ({ ...p, [key]: false }));
  };

  return (
    <div
      className="bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200"
      style={{ borderColor: allDone ? "rgba(34,197,94,0.4)" : "hsl(var(--border))" }}
    >
      {/* Go-live banner */}
      {allDone && (
        <div className="px-6 py-3 flex items-center gap-2 text-sm font-semibold text-green-800" style={{ background: "rgba(34,197,94,0.12)", borderBottom: "1px solid rgba(34,197,94,0.25)" }}>
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          🎉 {client.business_name} is LIVE — all 9 steps complete!
        </div>
      )}

      {/* Card Header */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-white text-sm"
            style={{ background: allDone ? "linear-gradient(135deg,#16a34a,#22c55e)" : "linear-gradient(135deg,#9a5c2e,#c8965c)" }}
          >
            {client.business_name?.[0]?.toUpperCase() || "C"}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{client.business_name}</p>
            <p className="text-xs text-muted-foreground truncate">{client.owner_name} · {client.industry || "—"}</p>
          </div>
          <span
            className="hidden sm:inline text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{
              background: allDone ? "rgba(34,197,94,0.12)" : client.status === "In Setup" ? "rgba(154,92,46,0.1)" : "rgba(0,0,0,0.05)",
              color: allDone ? "#16a34a" : client.status === "In Setup" ? "#9a5c2e" : "#6b7280",
            }}
          >
            {client.status || "Onboarding"}
          </span>
        </div>

        <div className="flex items-center gap-4 ml-4">
          <div className="hidden md:flex flex-col items-end gap-1">
            <div className="w-28 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: allDone ? "linear-gradient(90deg,#16a34a,#22c55e)" : "linear-gradient(90deg,#9a5c2e,#c8965c)",
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{completedCount}/9 steps</span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-border px-6 py-6 space-y-8">

          {/* Client Info Grid */}
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Client Details</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
              <InfoItem icon={Phone} label="Phone" value={client.phone} />
              <InfoItem icon={Mail} label="Email" value={client.email} />
              <InfoItem icon={Globe} label="Website" value={client.website} link />
              <InfoItem icon={Instagram} label="Instagram" value={client.instagram} />
              <InfoItem icon={null} label="Industry" value={client.industry} />
              <InfoItem icon={null} label="Tone of Voice" value={client.tone_of_voice} />
              <InfoItem icon={null} label="Services" value={client.services} wide />
              <InfoItem icon={null} label="Lead Sources" value={client.lead_sources} />
              <InfoItem icon={null} label="Booking Platform" value={client.booking_platform} />
              <InfoItem icon={Globe} label="Booking Link" value={client.booking_link} link />
              <InfoItem icon={Phone} label="Twilio Number" value={client.twilio_number} />
              <InfoItem icon={DollarSign} label="Monthly Rate" value={client.monthly_rate ? `$${client.monthly_rate}/mo` : null} />
              <InfoItem icon={DollarSign} label="Setup Fee" value={client.setup_fee ? `$${client.setup_fee}` : null} />
              <InfoItem icon={Calendar} label="Start Date" value={client.start_date} />
            </div>
          </div>

          {/* 9-Step Checklist */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Setup Checklist</p>
              <span className="text-xs font-semibold text-muted-foreground">{completedCount}/9 complete</span>
            </div>
            <div className="space-y-2">
              {STEPS.map((step, i) => {
                const done = !!client[step.key];
                const isSaving = saving[step.key];
                return (
                  <div
                    key={step.key}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{
                      background: done ? "rgba(34,197,94,0.06)" : "rgba(0,0,0,0.02)",
                      border: done ? "1px solid rgba(34,197,94,0.2)" : "1px solid transparent",
                    }}
                  >
                    <button
                      onClick={() => toggleStep(step.key, done)}
                      disabled={isSaving}
                      className="flex-shrink-0 transition-transform hover:scale-110"
                    >
                      {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      ) : done ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/40 hover:text-primary transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${done ? "text-green-800 line-through opacity-60" : "text-foreground"}`}>
                        {i + 1}. {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                    <button
                      onClick={() => setAiStep(step.key)}
                      className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      AI Draft
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {aiStep && (
        <AIGenerateModal
          stepKey={aiStep}
          client={client}
          onClose={() => setAiStep(null)}
        />
      )}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, link, wide }) {
  if (!value) return null;
  return (
    <div className={wide ? "col-span-2" : ""}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3 text-primary flex-shrink-0" />}
        {link ? (
          <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noopener noreferrer"
            className="text-sm text-primary hover:underline truncate">{value}</a>
        ) : (
          <p className="text-sm text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}