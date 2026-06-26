import { Check, X, Clock, Users, PhoneCall, Calendar, FileText, Repeat, TrendingUp } from "lucide-react";
import SectionHeader from "@/components/design-system/SectionHeader";

const COMPARISON_ROWS = [
  {
    icon: Clock,
    task: "Lead Response Speed",
    manual: "Hours or days — leads go cold",
    ai: "Under 60 seconds, 24/7",
    manualTime: "~4-8 hrs",
    aiTime: "<60 seconds",
  },
  {
    icon: PhoneCall,
    task: "Missed Call Recovery",
    manual: "Lost revenue — nobody calls back",
    ai: "Instant text-back captures every caller",
    manualTime: "90% lost",
    aiTime: "0% lost",
  },
  {
    icon: Calendar,
    task: "Appointment Booking",
    manual: "Back-and-forth phone tag",
    ai: "AI schedules appointments automatically",
    manualTime: "3-5 calls avg",
    aiTime: "1 text",
  },
  {
    icon: Repeat,
    task: "Follow-Up Sequences",
    manual: "Forgotten after first contact",
    ai: "Multi-step SMS + email nurture on autopilot",
    manualTime: "1 attempt",
    aiTime: "8+ touches",
  },
  {
    icon: Users,
    task: "After-Hours Coverage",
    manual: "Voicemail or nothing",
    ai: "AI voice agent answers every call",
    manualTime: "0 hrs coverage",
    aiTime: "24/7 coverage",
  },
  {
    icon: FileText,
    task: "Lead Data Capture",
    manual: "Scribbled notes, lost details",
    ai: "Every lead stored, tagged & scored",
    manualTime: "Manual entry",
    aiTime: "Automatic",
  },
  {
    icon: TrendingUp,
    task: "Reactivating Old Leads",
    manual: "Never happens — revenue left on table",
    ai: "AI re-engages leads up to 90 days old",
    manualTime: "$0 recovered",
    aiTime: "$ recovered",
  },
];

export default function ManualVsAIComparison() {
  return (
    <section className="py-16 md:py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          eyebrow="The Difference Is Clear"
          title="Manual Work vs. AI Automation"
          subtitle="See exactly what changes when you replace manual business tasks with ClientSurge AI systems. Every row below is revenue you're either capturing or losing right now."
        />

        <div className="mt-12 overflow-x-auto">
          <table className="w-full border-collapse min-w-[680px]">
            <thead>
              <tr>
                <th className="text-left p-4 bg-muted/50 font-titles text-sm font-bold text-foreground uppercase tracking-wide rounded-tl-xl">
                  Business Task
                </th>
                <th className="text-left p-4 bg-red-50 font-titles text-sm font-bold text-red-700 uppercase tracking-wide">
                  <span className="inline-flex items-center gap-2">
                    <X className="w-4 h-4" /> Manual Process
                  </span>
                </th>
                <th className="text-left p-4 bg-blue-50 font-titles text-sm font-bold text-[#00AEEF] uppercase tracking-wide rounded-tr-xl">
                  <span className="inline-flex items-center gap-2">
                    <Check className="w-4 h-4" /> ClientSurge AI
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, idx) => {
                const Icon = row.icon;
                const isLast = idx === COMPARISON_ROWS.length - 1;
                return (
                  <tr
                    key={row.task}
                    className="transition-colors hover:bg-blue-50/40"
                    style={{ borderBottom: isLast ? "none" : "1px solid hsl(var(--border))" }}
                  >
                    {/* Task name + icon */}
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex w-9 h-9 rounded-lg items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(0,174,239,0.08)", border: "1px solid rgba(0,174,239,0.2)" }}
                        >
                          <Icon className="w-4 h-4 text-[#00AEEF]" />
                        </span>
                        <div>
                          <p className="font-bold text-sm text-foreground leading-tight">{row.task}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{row.manualTime} → {row.aiTime}</p>
                        </div>
                      </div>
                    </td>

                    {/* Manual column */}
                    <td className="p-4 align-top">
                      <div className="flex items-start gap-2">
                        <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground leading-snug">{row.manual}</p>
                      </div>
                    </td>

                    {/* AI column */}
                    <td className="p-4 align-top bg-blue-50/30">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#00AEEF] flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-foreground leading-snug">{row.ai}</p>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary stat bar */}
        <div
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-xl"
          style={{
            background: "linear-gradient(135deg, #003B8F 0%, #006BB0 52%, #00AEEF 100%)",
            boxShadow: "0 8px 32px rgba(0,174,239,0.2)",
          }}
        >
          <div className="text-center text-white">
            <p className="text-3xl md:text-4xl font-black font-titles">63%</p>
            <p className="text-xs font-semibold uppercase tracking-wide mt-1 opacity-80">More Leads Captured</p>
          </div>
          <div className="text-center text-white md:border-l md:border-r border-white/20">
            <p className="text-3xl md:text-4xl font-black font-titles">8x</p>
            <p className="text-xs font-semibold uppercase tracking-wide mt-1 opacity-80">Faster Response Time</p>
          </div>
          <div className="text-center text-white">
            <p className="text-3xl md:text-4xl font-black font-titles">24/7</p>
            <p className="text-xs font-semibold uppercase tracking-wide mt-1 opacity-80">Always On Coverage</p>
          </div>
        </div>
      </div>
    </section>
  );
}