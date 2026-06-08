import { motion } from "framer-motion";
import { Activity, BarChart3, CheckCircle2, Clock, MessageSquare, Phone, TrendingUp, Zap } from "lucide-react";

const metrics = [
  { label: "Leads Captured", value: "247", delta: "+18 today", color: "#00AEEF" },
  { label: "AI Responses Sent", value: "1,842", delta: "+34 this week", color: "#10B981" },
  { label: "Appointments Booked", value: "89", delta: "+6 today", color: "#8B5CF6" },
  { label: "Reviews Requested", value: "63", delta: "+4 today", color: "#F59E0B" },
];

const recentLeads = [
  { name: "Sarah M.", biz: "Peak Dental", status: "Booked", time: "4 min ago", priority: "Hot" },
  { name: "James T.", biz: "ProRoof AZ", status: "Replied", time: "12 min ago", priority: "High" },
  { name: "Lisa R.", biz: "Glow Med Spa", status: "Contacted", time: "28 min ago", priority: "Medium" },
  { name: "Kevin D.", biz: "CleanAir HVAC", status: "New", time: "41 min ago", priority: "High" },
];

const automations = [
  { label: "Missed Call Text-Back", status: "Live", icon: Phone, color: "#10B981" },
  { label: "Instant Lead Response", status: "Live", icon: Zap, color: "#10B981" },
  { label: "AI Follow-Up Sequence", status: "Live", icon: MessageSquare, color: "#10B981" },
  { label: "Booking Agent", status: "Live", icon: Clock, color: "#10B981" },
  { label: "Review Automation", status: "Live", icon: CheckCircle2, color: "#10B981" },
  { label: "Lead Reactivation", status: "Active", icon: Activity, color: "#00AEEF" },
];

const statusColors = {
  Booked: "bg-emerald-100 text-emerald-700",
  Replied: "bg-purple-100 text-purple-700",
  Contacted: "bg-blue-100 text-blue-700",
  New: "bg-slate-100 text-slate-600",
};

const priorityColors = {
  Hot: "text-red-500",
  High: "text-orange-500",
  Medium: "text-amber-500",
};

export default function AIDashboardPreview() {
  return (
    <section id="ai-dashboard-preview" className="px-4 py-16 md:px-6 md:py-24" style={{ background: "#f0f7ff" }}>
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: "#005f99" }}>
            Real-Time Visibility
          </p>
          <h2 className="font-bold text-foreground leading-tight" style={{ fontFamily: "Montserrat, sans-serif", fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}>
            Monitor Every Lead, Response & Booking
          </h2>
          <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your AI status dashboard shows every automation running in real time — leads captured, responses sent, appointments booked, and reviews requested.
          </p>
        </div>

        {/* Dashboard mock */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200"
          style={{ background: "#0f172a" }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10" style={{ background: "#0a1628" }}>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <p className="text-xs font-bold text-white/60">ClientSurge AI Dashboard — Live Mode</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold" style={{ background: "rgba(16,185,129,0.15)", color: "#4ade80", border: "1px solid rgba(16,185,129,0.3)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              All Systems Live
            </span>
          </div>

          <div className="p-5 space-y-5">
            {/* Metrics row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {metrics.map((m) => (
                <div key={m.label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{m.label}</p>
                  <p className="text-2xl font-black" style={{ color: m.color }}>{m.value}</p>
                  <p className="text-[11px] font-semibold mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{m.delta}</p>
                </div>
              ))}
            </div>

            {/* Main grid */}
            <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
              {/* Recent leads */}
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" style={{ color: "#00AEEF" }} />
                    <p className="text-sm font-bold text-white">Recent Lead Activity</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "rgba(0,174,239,0.12)", color: "#66d9ff" }}>Live feed</span>
                </div>
                <div className="space-y-2">
                  {recentLeads.map((lead) => (
                    <div key={lead.name} className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #0088CC, #003B8F)" }}>
                          {lead.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{lead.name} <span className="font-normal text-white/40">· {lead.biz}</span></p>
                          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{lead.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusColors[lead.status]}`}>{lead.status}</span>
                        <span className={`text-[10px] font-bold ${priorityColors[lead.priority] || "text-white/40"}`}>{lead.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Automations status */}
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4" style={{ color: "#10B981" }} />
                  <p className="text-sm font-bold text-white">Automation Status</p>
                </div>
                <div className="space-y-2">
                  {automations.map(({ label, status, icon: Icon, color }) => (
                    <div key={label} className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                          <Icon style={{ width: 13, height: 13, color }} />
                        </div>
                        <p className="text-xs font-semibold text-white/80">{label}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5" style={{ color, background: `${color}15` }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversion bar */}
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: "#F59E0B" }} />
                  <p className="text-sm font-bold text-white">This Week's Conversion Flow</p>
                </div>
                <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>247 total leads</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[["Captured", 247, "#00AEEF", "100%"], ["Responded", 231, "#8B5CF6", "94%"], ["Qualified", 148, "#10B981", "60%"], ["Booked", 89, "#F59E0B", "36%"]].map(([label, count, color, pct]) => (
                  <div key={label}>
                    <div className="flex items-end justify-between mb-1.5">
                      <p className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
                      <p className="text-[10px] font-bold" style={{ color }}>{pct}</p>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full" style={{ width: pct, background: color }} />
                    </div>
                    <p className="text-sm font-black mt-1.5" style={{ color }}>{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-4">Illustrative dashboard — your actual data will vary based on lead volume and service configuration.</p>
      </div>
    </section>
  );
}