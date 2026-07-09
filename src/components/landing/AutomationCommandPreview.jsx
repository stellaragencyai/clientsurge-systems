import { useState } from "react";
import { CalendarDays, CheckCircle2, MessageSquare, PhoneCall, Repeat2, Star, Zap } from "lucide-react";

const TABS = [
  {
    key: "lead-response",
    label: "New Leads",
    icon: MessageSquare,
    title: "Instant lead response",
    description: "Website forms and new inquiries get routed into an immediate response path instead of waiting in an inbox.",
    alert: "SMS response queued in 14 seconds",
    metric: "< 60 sec",
    metricLabel: "target response window",
  },
  {
    key: "missed-calls",
    label: "Missed Calls",
    icon: PhoneCall,
    title: "Missed-call recovery",
    description: "When a prospect calls and nobody answers, the system can trigger a text-back workflow that keeps the conversation alive.",
    alert: "Missed-call text-back ready",
    metric: "24/7",
    metricLabel: "coverage layer",
  },
  {
    key: "booking",
    label: "Bookings",
    icon: CalendarDays,
    title: "Booking handoff",
    description: "Qualified leads can be routed toward a booking link, intake path, or owner handoff instead of staying stuck in open-ended follow-up.",
    alert: "Booking link sent to qualified lead",
    metric: "1 path",
    metricLabel: "to the next step",
  },
  {
    key: "reactivation",
    label: "Old Leads",
    icon: Repeat2,
    title: "Lead reactivation",
    description: "Dormant contacts, past inquiries, and cold opportunities can be re-engaged with a structured sequence instead of forgotten.",
    alert: "Dormant lead reactivation sequence active",
    metric: "30–90d",
    metricLabel: "lead recovery window",
  },
  {
    key: "reviews",
    label: "Reviews",
    icon: Star,
    title: "Review request workflow",
    description: "Completed jobs can trigger a review request flow so reputation growth does not depend on manual memory.",
    alert: "Review request scheduled after completion",
    metric: "Auto",
    metricLabel: "post-job request",
  },
];

function FloatingAlert({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-white/15 bg-white/12 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

export default function AutomationCommandPreview() {
  const [activeKey, setActiveKey] = useState(TABS[0].key);
  const active = TABS.find((tab) => tab.key === activeKey) || TABS[0];
  const ActiveIcon = active.icon;

  return (
    <section className="relative overflow-hidden bg-white px-4 py-16 md:py-24" id="automation-command-preview">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 82% 16%, rgba(0,174,239,0.13), transparent 28%), radial-gradient(circle at 12% 70%, rgba(0,107,176,0.10), transparent 32%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#006BB0]">
            Automation Command Center
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.055em] text-slate-950 md:text-5xl">
            The homepage should show the system working, not just explain it.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-8 text-slate-500 md:text-lg">
            IdentityIQ uses product visuals and floating alert cards to make protection feel tangible. ClientSurge needs the same pattern for lead capture, missed-call recovery, booking, reviews, and reactivation.
          </p>
        </div>

        <div className="mt-10 grid items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[2rem] border border-sky-100 bg-white/85 p-4 shadow-[0_24px_70px_rgba(0,107,176,0.10)] backdrop-blur-sm md:p-6">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const selected = tab.key === activeKey;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveKey(tab.key)}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-300 ${
                      selected
                        ? "border-sky-200 bg-sky-50 shadow-[0_14px_34px_rgba(0,107,176,0.10)]"
                        : "border-slate-100 bg-white hover:border-sky-100 hover:bg-sky-50/50"
                    }`}
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${selected ? "bg-[#00AEEF] text-white" : "bg-slate-100 text-slate-500"}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-black text-slate-950">{tab.label}</span>
                      <span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-500">{tab.title}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative min-h-[520px] rounded-[2.25rem] bg-[#071632] p-5 shadow-[0_34px_90px_rgba(2,8,23,0.34)] md:p-8">
            <div
              className="absolute inset-0 rounded-[2.25rem] opacity-80"
              style={{
                background:
                  "radial-gradient(circle at 78% 18%, rgba(0,174,239,0.25), transparent 30%), radial-gradient(circle at 18% 80%, rgba(0,107,176,0.28), transparent 36%), linear-gradient(180deg, #08204b 0%, #071836 52%, #041029 100%)",
              }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 rounded-[2.25rem] border border-white/10" aria-hidden="true" />

            <div className="relative z-10 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#7DD3FC]">ClientSurge Demo UI</p>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.045em] text-white md:text-4xl">{active.title}</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00AEEF] text-white shadow-[0_16px_38px_rgba(0,174,239,0.32)]">
                <ActiveIcon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>

            <p className="relative z-10 mt-5 max-w-xl text-sm font-medium leading-7 text-slate-300 md:text-base">
              {active.description}
            </p>

            <div className="relative z-10 mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Primary Metric</p>
                <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-white">{active.metric}</p>
                <p className="mt-2 text-xs font-semibold text-slate-300">{active.metricLabel}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Workflow Status</p>
                <div className="mt-4 space-y-3 text-xs font-bold text-white">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#7DD3FC]" />Lead captured</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#7DD3FC]" />Automation selected</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#7DD3FC]" />Next step queued</div>
                </div>
              </div>
            </div>

            <FloatingAlert className="absolute right-5 top-[43%] z-20 max-w-[260px] md:right-10">
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#00AEEF] text-white">
                  <Zap className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/45">Automation Popup</p>
                  <p className="mt-1 text-sm font-black leading-5 text-white">{active.alert}</p>
                </div>
              </div>
            </FloatingAlert>

            <FloatingAlert className="absolute bottom-7 left-5 z-20 max-w-[230px] md:left-10">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/45">Owner View</p>
              <p className="mt-1 text-sm font-black leading-5 text-white">One clean status card per automation instead of a messy app directory.</p>
            </FloatingAlert>
          </div>
        </div>
      </div>
    </section>
  );
}
