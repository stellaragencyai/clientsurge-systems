import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Activity,
  Megaphone,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

const CHART_COLORS = ["#00AEEF", "#006BB0", "#003B8F", "#66D9FF", "#33BDF1"];

function MetricCard({ icon: Icon, label, value, sublabel, accent }) {
  return (
    <div
      className="rounded-2xl p-5 border bg-white"
      style={{ borderColor: "rgba(0,174,239,0.12)", boxShadow: "0 2px 12px rgba(0,59,143,0.05)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: accent || "rgba(0,174,239,0.1)" }}
        >
          <Icon className="w-5 h-5" style={{ color: "#0079c1" }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
        {value}
      </p>
      <p className="text-xs font-semibold text-muted-foreground mt-1">{label}</p>
      {sublabel && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sublabel}</p>}
    </div>
  );
}

function LiveBadge({ lastUpdated }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span
        className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"
        style={{ boxShadow: "0 0 8px #22c55e", animation: "pulse 2s infinite" }}
      />
      <span className="text-[11px] font-medium text-muted-foreground">
        Live {lastUpdated ? `· Updated ${new Date(lastUpdated).toLocaleTimeString()}` : ""}
      </span>
    </div>
  );
}

function EmptyMetrics({ message }) {
  return (
    <div className="rounded-2xl p-10 text-center border border-dashed" style={{ borderColor: "rgba(0,174,239,0.2)" }}>
      <Activity className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
      <p className="text-sm font-semibold text-foreground mb-1">No Real-Time Data Yet</p>
      <p className="text-xs text-muted-foreground">{message || "Metrics will appear here once your campaigns and funnels are active."}</p>
    </div>
  );
}

export default function RealTimeMetricsPanel({ project, isAdmin, portalState }) {
  const [funnels, setFunnels] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Phase A.4: Proof gate — all revenue/ROI/conversion metrics suppressed until proof-validated
  const cardState = getCardState(portalState, "roi_revenue_impact");
  const isProofLive = cardState.status === CARD_STATUS.LIVE;
  const displayValue = (val) => isProofLive ? val : "Pending";

  const projectId = project?.id || project?._id;
  const clientId = project?.client_id || project?.clientId;
  const clientProjectId = project?.client_project_id || projectId;
  const canViewCampaigns = Boolean(isAdmin);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      // Always scope funnel queries to the client's project
      const funnelQuery = clientProjectId
        ? { client_project_id: clientProjectId }
        : clientId
        ? { client_id: clientId }
        : {};

      // Only query AcquisitionCampaign for admins — clients never see broad campaign data
      const campaignQuery = canViewCampaigns
        ? (clientProjectId ? { client_project_id: clientProjectId } : clientId ? { client_id: clientId } : {})
        : null;

      const requests = [
        base44.entities.ConversionFunnel.filter(funnelQuery, "-computed_at", 10).catch(() => []),
      ];
      if (campaignQuery) {
        requests.push(base44.entities.AcquisitionCampaign.filter(campaignQuery, "-last_activity_at", 20).catch(() => []));
      }

      const results = await Promise.all(requests);
      const funnelResult = results[0];
      const campaignResult = results[1] || [];

      setFunnels(Array.isArray(funnelResult) ? funnelResult : []);
      setCampaigns(Array.isArray(campaignResult) ? campaignResult : []);
      setLastUpdated(new Date());
    } catch (err) {
      setError("Unable to load real-time metrics. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clientProjectId, clientId, canViewCampaigns]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Real-time subscriptions — scoped to client project
  useEffect(() => {
    const unsubFunnel = base44.entities.ConversionFunnel.subscribe((event) => {
      if (event.type === "create" || event.type === "update") {
        // Filter subscription updates by client/project scope
        const eventData = event.data || {};
        const matchesScope =
          (clientProjectId && eventData.client_project_id === clientProjectId) ||
          (clientId && eventData.client_id === clientId);
        if (!matchesScope && !canViewCampaigns) return;

        setFunnels((prev) => {
          const idx = prev.findIndex((f) => f.id === event.data.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = event.data;
            return next;
          }
          return [event.data, ...prev].slice(0, 10);
        });
        setLastUpdated(new Date());
      }
    });

    let unsubCampaign = () => {};
    if (canViewCampaigns) {
      unsubCampaign = base44.entities.AcquisitionCampaign.subscribe((event) => {
        if (event.type === "create" || event.type === "update") {
          const eventData = event.data || {};
          const matchesScope =
            (clientProjectId && eventData.client_project_id === clientProjectId) ||
            (clientId && eventData.client_id === clientId);
          if (!matchesScope) return;

          setCampaigns((prev) => {
            const idx = prev.findIndex((c) => c.id === event.data.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = event.data;
              return next;
            }
            return [event.data, ...prev].slice(0, 20);
          });
          setLastUpdated(new Date());
        }
      });
    }

    return () => {
      unsubFunnel();
      unsubCampaign();
    };
  }, [clientProjectId, clientId, canViewCampaigns]);

  // Aggregate metrics from funnels
  const totalRevenue = funnels.reduce((sum, f) => sum + (f.total_revenue_attributed || 0), 0);
  const totalLeads = funnels.reduce((sum, f) => {
    const leadStage = f.funnel_stages?.find((s) => s.stage_name === "lead_created");
    return sum + (leadStage?.total_count || 0);
  }, 0);
  const avgConversion = funnels.length > 0
    ? funnels.reduce((sum, f) => sum + (f.top_to_bottom_conversion_percent || 0), 0) / funnels.length
    : 0;
  const revenuePerLead = totalLeads > 0 ? totalRevenue / totalLeads : 0;

  // Active campaigns — only for admin
  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const totalCampaignLeads = campaigns.reduce((sum, c) => sum + (c.leads_generated || 0), 0);
  const totalCampaignRevenue = campaigns.reduce((sum, c) => sum + (c.revenue_attributed || 0), 0);
  const totalCampaignCost = campaigns.reduce((sum, c) => sum + (c.cost || 0), 0);
  const overallROI = totalCampaignCost > 0
    ? ((totalCampaignRevenue - totalCampaignCost) / totalCampaignCost * 100)
    : 0;

  // Build funnel chart data from the most recent funnel
  const latestFunnel = funnels[0];
  const funnelChartData = (latestFunnel?.funnel_stages || []).map((stage) => ({
    name: stage.stage_name?.replace(/_/g, " ") || "Stage",
    count: stage.total_count || 0,
    conversion: stage.conversion_from_previous_percent || 0,
  }));

  // Campaign status breakdown for pie chart
  const campaignStatusData = ["active", "paused", "completed", "draft", "archived"]
    .map((status) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: campaigns.filter((c) => c.status === status).length,
    }))
    .filter((d) => d.value > 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading real-time metrics…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Real-Time Metrics
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Live progress metrics {canViewCampaigns ? "and active campaign statuses" : ""} for {project?.business_name || "your project"}.
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-primary text-xs font-semibold transition-opacity disabled:opacity-40 cursor-pointer"
          style={{ background: "rgba(0,174,239,0.07)", border: "1px solid rgba(0,174,239,0.15)" }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <LiveBadge lastUpdated={lastUpdated} />

      {/* Phase A.4: Proof notice — all metrics below are suppressed until proof-validated */}
      {!isProofLive && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3 text-sm text-blue-700 font-medium">
          {cardState.display_text}
        </div>
      )}

      {/* Summary Metric Cards — values suppressed when proof not Live */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={Users}
          label="Total Leads"
          value={displayValue(totalLeads.toLocaleString())}
          sublabel={isProofLive ? `${funnels.length} funnel${funnels.length !== 1 ? "s" : ""} tracked` : "Verifying"}
        />
        <MetricCard
          icon={DollarSign}
          label="Revenue Attributed"
          value={displayValue(`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`)}
          sublabel={isProofLive ? (totalLeads > 0 ? `$${revenuePerLead.toFixed(0)}/lead` : "No leads yet") : "Verifying"}
          accent="rgba(5,150,105,0.1)"
        />
        <MetricCard
          icon={Target}
          label="Avg Conversion"
          value={isProofLive ? `${avgConversion.toFixed(1)}%` : "Pending"}
          sublabel={isProofLive ? "Top-to-bottom funnel" : "Verifying"}
          accent="rgba(212,175,55,0.1)"
        />
        <MetricCard
          icon={TrendingUp}
          label={canViewCampaigns ? "Campaign ROI" : "Funnels Tracked"}
          value={isProofLive ? (canViewCampaigns ? `${overallROI.toFixed(0)}%` : `${funnels.length}`) : "Pending"}
          sublabel={isProofLive ? (canViewCampaigns ? `${activeCampaigns.length} active campaign${activeCampaigns.length !== 1 ? "s" : ""}` : "Conversion funnels") : "Verifying"}
          accent="rgba(0,174,239,0.1)"
        />
      </div>

      {/* Phase A.4: Funnel Performance Chart — suppressed when proof not Live */}
      {isProofLive && funnelChartData.length > 0 ? (
        <div className="rounded-2xl border border-border bg-white p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Funnel Performance — {latestFunnel?.metric_period || "30d"}
            </h3>
          </div>
          {latestFunnel?.biggest_drop_off_stage && (
            <p className="text-xs text-muted-foreground mb-4">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              Biggest drop-off: <span className="font-semibold">{latestFunnel.biggest_drop_off_stage.replace(/_/g, " ")}</span>
              {latestFunnel.biggest_drop_off_percent ? ` (${latestFunnel.biggest_drop_off_percent.toFixed(1)}%)` : ""}
            </p>
          )}
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={funnelChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid rgba(0,174,239,0.2)", fontSize: "12px" }}
              />
              <Bar dataKey="count" fill="#00AEEF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : !isProofLive ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-6 text-center text-sm text-blue-700 font-medium">
          Funnel performance charts will display once your system is verified.
        </div>
      ) : (
        <EmptyMetrics message="No funnel data has been computed yet. Funnel metrics are generated by your automation system." />
      )}

      {/* Phase A.4: Campaign sections — admin only, suppressed when proof not Live */}
      {canViewCampaigns && isProofLive && campaigns.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Campaign Status Pie */}
          {campaignStatusData.length > 0 && (
            <div className="rounded-2xl border border-border bg-white p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Megaphone className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Campaign Status Breakdown
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={campaignStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {campaignStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Campaign Revenue Trend */}
          <div className="rounded-2xl border border-border bg-white p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-primary" />
              <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Campaign Revenue vs Cost
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={campaigns.slice(0, 8).map((c) => ({
                name: c.campaign_name?.substring(0, 15) || "Campaign",
                revenue: c.revenue_attributed || 0,
                cost: c.cost || 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Area type="monotone" dataKey="revenue" stroke="#00AEEF" fill="rgba(0,174,239,0.15)" name="Revenue" />
                <Area type="monotone" dataKey="cost" stroke="#ef4444" fill="rgba(239,68,68,0.1)" name="Cost" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Phase A.4: Active Campaigns Table — admin only, suppressed when proof not Live */}
      {canViewCampaigns && isProofLive && campaigns.length > 0 && (
        <div className="rounded-2xl border border-border bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Active Campaign Statuses
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Leads</th>
                  <th>Revenue</th>
                  <th>ROI</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.slice(0, 10).map((c) => (
                  <tr key={c.id}>
                    <td className="font-semibold text-foreground text-sm">{c.campaign_name || "Unnamed"}</td>
                    <td>
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold"
                        style={{
                          background: c.status === "active" ? "rgba(34,197,94,0.1)" : "rgba(100,116,139,0.1)",
                          color: c.status === "active" ? "#16a34a" : "#64748b",
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: c.status === "active" ? "#22c55e" : "#94a3b8" }}
                        />
                        {c.status}
                      </span>
                    </td>
                    <td className="text-sm text-muted-foreground">{c.campaign_type?.replace(/_/g, " ") || "—"}</td>
                    <td className="text-sm font-semibold text-foreground">{(c.leads_generated || 0).toLocaleString()}</td>
                    <td className="text-sm font-semibold text-foreground">
                      ${(c.revenue_attributed || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                    <td className="text-sm font-semibold" style={{ color: (c.roi || 0) >= 0 ? "#16a34a" : "#ef4444" }}>
                      {(c.roi || 0).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {funnels.length === 0 && !canViewCampaigns && !error && (
        <EmptyMetrics />
      )}

      <PortalAdminDiagnostics card={cardState} isAdmin={isAdmin} />
    </div>
  );
}