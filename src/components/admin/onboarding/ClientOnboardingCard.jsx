import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Sparkles,
  Phone,
  Mail,
  Globe,
  Instagram,
  DollarSign,
  Calendar,
  Loader2,
  Lock,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import AIGenerateModal from "./AIGenerateModal";

const STEPS = [
  {
    key: "step_twilio",
    label: "Twilio Configured",
    desc: "Derived from the order-backed business phone and install config.",
    mode: "derived",
  },
  {
    key: "step_lead_sources",
    label: "Lead Sources Connected",
    desc: "Manual internal checklist for source connection readiness.",
    mode: "manual",
  },
  {
    key: "step_instant_response",
    label: "Instant Response Built",
    desc: "Derived from the canonical install status for Instant Lead Response.",
    mode: "derived",
  },
  {
    key: "step_followup_sequence",
    label: "Follow-Up Sequence Built",
    desc: "Manual internal checklist for supporting nurture work.",
    mode: "manual",
  },
  {
    key: "step_missed_call",
    label: "Missed Call Text-Back Active",
    desc: "Derived from the canonical install status for Missed Call Text-Back.",
    mode: "derived",
  },
  {
    key: "step_messages_customized",
    label: "Messages Customized",
    desc: "Derived from canonical service configuration completeness.",
    mode: "derived",
  },
  {
    key: "step_tested",
    label: "End-to-End Tested",
    desc: "Derived from canonical service testing progress.",
    mode: "derived",
  },
  {
    key: "step_dashboard",
    label: "Client Portal Delivered",
    desc: "Manual internal checklist for client portal delivery and confirmation.",
    mode: "manual",
  },
  {
    key: "step_live",
    label: "Went Live",
    desc: "Derived from canonical order/install live status.",
    mode: "derived",
  },
];

const STEP_KEYS = STEPS.map((step) => step.key);

export default function ClientOnboardingCard({ client, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState({});
  const [aiStep, setAiStep] = useState(null);
  const [error, setError] = useState("");

  const completedCount = STEP_KEYS.filter((key) => client[key]).length;
  const pct = Math.round((completedCount / STEP_KEYS.length) * 100);
  const isLive = !!client.step_live || client.status === "Live";

  const toggleStep = async (step, current) => {
    if (step.mode !== "manual") {
      return;
    }

    setError("");
    setSaving((prev) => ({ ...prev, [step.key]: true }));

    try {
      await base44.functions.invoke("updateAdminOnboardingChecklistStep", {
        onboarding_client_id: client.id,
        step_key: step.key,
        value: !current,
      });
      onUpdate();
    } catch (invokeError) {
      setError(
        invokeError?.message ||
          "Unable to update this onboarding checklist item right now."
      );
    } finally {
      setSaving((prev) => ({ ...prev, [step.key]: false }));
    }
  };

  return (
    <div
      className="bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200"
      style={{
        borderColor: isLive ? "rgba(34,197,94,0.4)" : "hsl(var(--border))",
      }}
    >
      {isLive && (
        <div
          className="px-6 py-3 flex items-center gap-2 text-sm font-semibold text-green-800"
          style={{
            background: "rgba(34,197,94,0.12)",
            borderBottom: "1px solid rgba(34,197,94,0.25)",
          }}
        >
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          {client.business_name} is live in the canonical install pipeline.
        </div>
      )}

      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-white text-sm"
            style={{
              background: isLive
                ? "linear-gradient(135deg,#16a34a,#22c55e)"
                : "linear-gradient(135deg,#9a5c2e,#c8965c)",
            }}
          >
            {client.business_name?.[0]?.toUpperCase() || "C"}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">
              {client.business_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {client.owner_name} · {client.industry || "-"}
            </p>
          </div>
          <span
            className="hidden sm:inline text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{
              background: isLive
                ? "rgba(34,197,94,0.12)"
                : client.status === "In Setup"
                  ? "rgba(154,92,46,0.1)"
                  : "rgba(0,0,0,0.05)",
              color: isLive
                ? "#16a34a"
                : client.status === "In Setup"
                  ? "#9a5c2e"
                  : "#6b7280",
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
                  background: isLive
                    ? "linear-gradient(90deg,#16a34a,#22c55e)"
                    : "linear-gradient(90deg,#9a5c2e,#c8965c)",
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {completedCount}/{STEP_KEYS.length} steps
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-6 py-6 space-y-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">
              Canonical install steps are read-only here
            </p>
            <p className="text-xs text-amber-800 mt-1">
              Twilio, Instant Lead Response, Missed Call Text-Back, testing,
              message customization, and go-live status mirror the paid order
              install pipeline. Use the install workspace to change install
              truth.
            </p>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4">
              Client Details
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
              <InfoItem icon={Phone} label="Phone" value={client.phone} />
              <InfoItem icon={Mail} label="Email" value={client.email} />
              <InfoItem icon={Globe} label="Website" value={client.website} link />
              <InfoItem
                icon={Instagram}
                label="Instagram"
                value={client.instagram}
              />
              <InfoItem icon={null} label="Industry" value={client.industry} />
              <InfoItem
                icon={null}
                label="Tone of Voice"
                value={client.tone_of_voice}
              />
              <InfoItem icon={null} label="Services" value={client.services} wide />
              <InfoItem
                icon={null}
                label="Lead Sources"
                value={client.lead_sources}
              />
              <InfoItem
                icon={null}
                label="Booking Platform"
                value={client.booking_platform}
              />
              <InfoItem
                icon={Globe}
                label="Booking Link"
                value={client.booking_link}
                link
              />
              <InfoItem
                icon={Phone}
                label="Twilio Number"
                value={client.twilio_number}
              />
              <InfoItem
                icon={DollarSign}
                label="Monthly Rate"
                value={client.monthly_rate ? `$${client.monthly_rate}/mo` : null}
              />
              <InfoItem
                icon={DollarSign}
                label="Setup Fee"
                value={client.setup_fee ? `$${client.setup_fee}` : null}
              />
              <InfoItem
                icon={Calendar}
                label="Start Date"
                value={client.start_date}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-primary uppercase tracking-widest">
                Setup Checklist
              </p>
              <span className="text-xs font-semibold text-muted-foreground">
                {completedCount}/{STEP_KEYS.length} complete
              </span>
            </div>
            <div className="space-y-2">
              {STEPS.map((step, index) => {
                const done = !!client[step.key];
                const isSaving = saving[step.key];
                const isDerived = step.mode === "derived";

                return (
                  <div
                    key={step.key}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{
                      background: done
                        ? "rgba(34,197,94,0.06)"
                        : "rgba(0,0,0,0.02)",
                      border: done
                        ? "1px solid rgba(34,197,94,0.2)"
                        : "1px solid transparent",
                    }}
                  >
                    <button
                      onClick={() => toggleStep(step, done)}
                      disabled={isSaving || isDerived}
                      className={`flex-shrink-0 transition-transform ${
                        isDerived ? "cursor-not-allowed opacity-80" : "hover:scale-110"
                      }`}
                      title={
                        isDerived
                          ? "Derived from canonical order/install state"
                          : "Toggle manual checklist item"
                      }
                    >
                      {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      ) : done ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle
                          className={`w-5 h-5 transition-colors ${
                            isDerived
                              ? "text-muted-foreground/40"
                              : "text-muted-foreground/40 hover:text-primary"
                          }`}
                        />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`text-sm font-semibold ${
                            done
                              ? "text-green-800 line-through opacity-60"
                              : "text-foreground"
                          }`}
                        >
                          {index + 1}. {step.label}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            isDerived
                              ? "bg-slate-100 text-slate-600"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {isDerived ? <Lock className="w-3 h-3" /> : null}
                          {isDerived ? "Derived" : "Manual"}
                        </span>
                      </div>
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
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3 text-primary flex-shrink-0" />}
        {link ? (
          <a
            href={value.startsWith("http") ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline truncate"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}
