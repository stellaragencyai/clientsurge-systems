import { Check, X, Clock, Users, PhoneCall, Calendar, FileText, Repeat, TrendingUp } from "lucide-react";
import SectionHeader from "@/components/design-system/SectionHeader";

const COMPARISON_ROWS = [
  { icon: Clock, task: "Lead Response", manual: "Response depends on staff availability", ai: "Approved response path triggers quickly", manualTime: "manual timing", aiTime: "structured timing" },
  { icon: PhoneCall, task: "Missed-Call Recovery", manual: "Voicemail or delayed callback", ai: "Text-back and routing path after missed calls", manualTime: "easy to miss", aiTime: "logged and routed" },
  { icon: Calendar, task: "Appointment Booking", manual: "Back-and-forth scheduling", ai: "Booking handoff with confirmations and reminders", manualTime: "manual coordination", aiTime: "guided handoff" },
  { icon: Repeat, task: "Follow-Up Sequences", manual: "Follow-up depends on memory", ai: "Defined sequence with stop conditions", manualTime: "inconsistent", aiTime: "structured" },
  { icon: Users, task: "After-Hours Coverage", manual: "New inquiries wait", ai: "Approved response flow can run after hours", manualTime: "limited coverage", aiTime: "expanded coverage" },
  { icon: FileText, task: "Lead Data Capture", manual: "Details spread across channels", ai: "Lead source and next step stored in one flow", manualTime: "scattered", aiTime: "organized" },
  { icon: TrendingUp, task: "Old Lead Reactivation", manual: "Dormant leads sit untouched", ai: "Reactivation campaigns revive qualified lists", manualTime: "ignored", aiTime: "campaign-ready" },
];

export default function ManualVsAIComparison() {
  return (
    <section className="py-16 md:py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          eyebrow="The Difference Is Clear"
          title="Manual Lead Flow vs. ClientSurge Systems"
          subtitle="The goal is not hype. The goal is a cleaner operating path for response, follow-up, booking, reviews, and reactivation."
        />

        <div className="mt-12 overflow-x-auto">
          <table className="w-full border-collapse min-w-[680px]">
            <thead>
              <tr>
                <th className="text-left p-4 bg-muted/50 font-titles text-sm font-bold text-foreground uppercase tracking-wide rounded-tl-xl">Business Task</th>
                <th className="text-left p-4 bg-red-50 font-titles text-sm font-bold text-red-700 uppercase tracking-wide"><span className="inline-flex items-center gap-2"><X className="w-4 h-4" /> Manual Process</span></th>
                <th className="text-left p-4 bg-blue-50 font-titles text-sm font-bold text-[#00AEEF] uppercase tracking-wide rounded-tr-xl"><span className="inline-flex items-center gap-2"><Check className="w-4 h-4" /> ClientSurge System</span></th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, idx) => {
                const Icon = row.icon;
                const isLast = idx === COMPARISON_ROWS.length - 1;
                return (
                  <tr key={row.task} className="transition-colors hover:bg-blue-50/40" style={{ borderBottom: isLast ? "none" : "1px solid hsl(var(--border))" }}>
                    <td className="p-4 align-top"><div className="flex items-center gap-3"><span className="inline-flex w-9 h-9 rounded-lg items-center justify-center flex-shrink-0" style={{ background: "rgba(0,174,239,0.08)", border: "1px solid rgba(0,174,239,0.2)" }}><Icon className="w-4 h-4 text-[#00AEEF]" /></span><div><p className="font-bold text-sm text-foreground leading-tight">{row.task}</p><p className="text-xs text-muted-foreground mt-0.5">{row.manualTime} → {row.aiTime}</p></div></div></td>
                    <td className="p-4 align-top"><div className="flex items-start gap-2"><X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" /><p className="text-sm text-muted-foreground leading-snug">{row.manual}</p></div></td>
                    <td className="p-4 align-top bg-blue-50/30"><div className="flex items-start gap-2"><Check className="w-4 h-4 text-[#00AEEF] flex-shrink-0 mt-0.5" /><p className="text-sm font-medium text-foreground leading-snug">{row.ai}</p></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-xl" style={{ background: "linear-gradient(135deg, #003B8F 0%, #006BB0 52%, #00AEEF 100%)", boxShadow: "0 8px 32px rgba(0,174,239,0.2)" }}>
          {[
            ["Response", "Faster approved reply paths"],
            ["Follow-Up", "Cleaner sequences and stop rules"],
            ["Visibility", "Better launch and activity proof"],
          ].map(([title, body]) => (
            <div key={title} className="text-center text-white"><p className="text-2xl md:text-3xl font-black font-titles">{title}</p><p className="text-xs font-semibold uppercase tracking-wide mt-1 opacity-80">{body}</p></div>
          ))}
        </div>
      </div>
    </section>
  );
}
