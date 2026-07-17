import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  DollarSign,
  Loader2,
  MessageSquareText,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { CARD_STATUS, getCardState } from "@/lib/portalStateEngine";

const safeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatCurrency = (value) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
}).format(safeNumber(value));

const formatEventLabel = (event) => {
  const raw = event?.friendly_label || event?.label || event?.event_type || event?.type || "System activity";
  return String(raw)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatEventTime = (event) => {
  const raw = event?.created_date || event?.created_at || event?.timestamp;
  if (!raw) return "Time pending";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Time pending";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

function Metric({ icon: Icon, label, value, detail, accent = "#00AEEF" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${accent}20`, border: `1px solid ${accent}40` }}>
          <Icon className="h-4 w-4" style={{ color: accent }} aria-hidden="true" />
        </div>
        <span className="h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 14px ${accent}` }} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-white" style={{ WebkitTextFillColor: "#ffffff" }}>{value}</p>
      <p className="mt-1 text-[11px] leading-5 text-white/55">{detail}</p>
    </div>
  );
}

export default function PremiumCommandCenter({ services = [], healthData, portalState, navigateTab }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const revenueCard = getCardState(portalState, "roi_revenue_impact");
  const isRevenueVerified = revenueCard?.status === CARD_STATUS.LIVE;

  const loadAnalytics = async (manual = false) => {
    manual ? setRefreshing(true) : setLoading(true);
    try {
      const response = await base44.functions.invoke("getClientAnalytics", {});
      setAnalytics(response?.data || response || null);
    } catch {
      setAnalytics(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const totals = analytics?.totals || {};
  const weeksData = Array.isArray(analytics?.weeksData) ? analytics.weeksData : [];
  const currentWeek = weeksData.length ? weeksData[weeksData.length - 1] : null;

  const liveServices = services.filter((service) => service?.install_status === "Live");
  const pendingServices = services.filter((service) => service?.install_status && service.install_status !== "Live");
  const events = Array.isArray(healthData?.recent_events) ? healthData.recent_events : [];
  const recentEvents = events.slice(0, 5);
  const lastActivity = healthData?.last_activity_at || analytics?.lastUpdated || analytics?.last_updated || null;

  const serviceRows = useMemo(() => {
    if (!services.length) return [];
    return services.slice(0, 6).map((service) => ({
      name: service?.name || service?.service_name || service?.automation_name || "Automation system",
      status: service?.install_status || "Status pending",
      live: service?.install_status === "Live",
    }));
  }, [services]);

  const responseRate = safeNumber(totals.responseRate);
  const revenueValue = isRevenueVerified ? formatCurrency(totals.estimatedRevenue) : "Pending proof";
  const weeklyLeads = safeNumber(currentWeek?.leads);

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#0A4F98]/20 bg-white shadow-[0_30px_80px_rgba(0,59,143,0.14)]">
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,#061326_0%,#07326A_52%,#006BB0_100%)] p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative z-10 mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
              </span>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Live command center</p>
            </div>
            <h2 className="text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl" style={{ WebkitTextFillColor: "#ffffff" }}>Your system, at a glance</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">Verified performance, automation health, and recent activity in one operational view.</p>
          </div>
          <button
            type="button"
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/15 disabled:opacity-60"
          >
            {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh data
          </button>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric icon={DollarSign} label="Revenue impact" value={loading ? "Syncing" : revenueValue} detail={isRevenueVerified ? "Verified estimated revenue" : "Hidden until proof is verified"} accent="#4ADE80" />
          <Metric icon={Users} label="Total leads" value={loading ? "—" : safeNumber(totals.totalLeads)} detail="Recorded by connected systems" />
          <Metric icon={CalendarCheck} label="Appointments" value={loading ? "—" : safeNumber(totals.bookedLeads)} detail="Booked from captured leads" accent="#FBBF24" />
          <Metric icon={TrendingUp} label="Response rate" value={loading ? "—" : `${responseRate}%`} detail="Across verified responses" accent="#A78BFA" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-0 lg:grid-cols-5">
        <div className="border-b border-gray-100 p-5 sm:p-6 lg:col-span-3 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#0088CC]">System pulse</p>
              <h3 className="mt-1 text-lg font-black tracking-[-0.03em] text-gray-950">Automation health</h3>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
              {liveServices.length}/{services.length || 0} online
            </span>
          </div>

          {serviceRows.length ? (
            <div className="space-y-2.5">
              {serviceRows.map((service) => (
                <div key={`${service.name}-${service.status}`} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-[linear-gradient(180deg,#ffffff,#f8fcff)] px-4 py-3 shadow-[0_8px_24px_rgba(0,59,143,0.05)]">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${service.live ? "bg-emerald-500" : "bg-amber-400"}`} style={{ boxShadow: service.live ? "0 0 12px rgba(16,185,129,.55)" : "none" }} />
                    <span className="truncate text-sm font-bold text-gray-900">{service.name}</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wide ${service.live ? "text-emerald-700" : "text-amber-700"}`}>{service.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 p-6 text-center">
              <Zap className="mx-auto h-6 w-6 text-sky-400" />
              <p className="mt-2 text-sm font-bold text-gray-900">Automation status is syncing</p>
              <p className="mt-1 text-xs text-gray-500">Connected systems will appear here as soon as status data is available.</p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{lastActivity ? `Last activity ${new Date(lastActivity).toLocaleString()}` : "Last activity pending"}</span>
            {pendingServices.length > 0 && <span>{pendingServices.length} system{pendingServices.length === 1 ? "" : "s"} still being configured</span>}
          </div>
        </div>

        <div className="p-5 sm:p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#0088CC]">Real-time activity</p>
              <h3 className="mt-1 text-lg font-black tracking-[-0.03em] text-gray-950">Latest system actions</h3>
            </div>
            <Activity className="h-5 w-5 text-[#00AEEF]" />
          </div>

          {recentEvents.length ? (
            <div className="space-y-3">
              {recentEvents.map((event, index) => {
                const failed = event?.status === "failed";
                return (
                  <div key={event?.id || event?.event_id || index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${failed ? "bg-red-50 text-red-500" : "bg-sky-50 text-[#0088CC]"}`}>
                        {failed ? <MessageSquareText className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      </div>
                      {index < recentEvents.length - 1 && <div className="mt-1 h-full w-px bg-gray-100" />}
                    </div>
                    <div className="min-w-0 pb-3">
                      <p className="truncate text-sm font-bold text-gray-900">{formatEventLabel(event)}</p>
                      <p className="mt-0.5 text-[11px] text-gray-500">{formatEventTime(event)} · {failed ? "Needs review" : "Completed"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-6 text-center">
              <Activity className="mx-auto h-6 w-6 text-gray-300" />
              <p className="mt-2 text-sm font-bold text-gray-900">No recent activity yet</p>
              <p className="mt-1 text-xs text-gray-500">New calls, messages, bookings, and automation events will appear here.</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 bg-[linear-gradient(90deg,#f8fcff,#ffffff)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#0088CC]">This week</p>
            <h3 className="mt-1 text-lg font-black tracking-[-0.03em] text-gray-950">Weekly performance snapshot</h3>
          </div>
          <button type="button" onClick={() => navigateTab?.("performance")} className="text-xs font-black text-[#006BB0] hover:text-[#003B8F]">View full performance →</button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-sky-100 bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">New leads</p><p className="mt-1 text-2xl font-black text-gray-950">{loading ? "—" : weeklyLeads}</p></div>
          <div className="rounded-2xl border border-sky-100 bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Booked</p><p className="mt-1 text-2xl font-black text-gray-950">{loading ? "—" : safeNumber(totals.bookedLeads)}</p></div>
          <div className="rounded-2xl border border-sky-100 bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Automations fired</p><p className="mt-1 text-2xl font-black text-gray-950">{loading ? "—" : safeNumber(totals.totalAutomations)}</p></div>
          <div className="rounded-2xl border border-sky-100 bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Response rate</p><p className="mt-1 text-2xl font-black text-gray-950">{loading ? "—" : `${responseRate}%`}</p></div>
        </div>
      </div>
    </section>
  );
}
