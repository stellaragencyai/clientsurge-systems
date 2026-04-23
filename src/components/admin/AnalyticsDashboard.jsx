import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Clock, Flame, Target, TrendingUp } from "lucide-react";
import { fetchLeadPipelineSummary, getLeadPipelineError } from "@/lib/leadPipelineApi";

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState({
    total_leads: 0,
    status_counts: {},
    segment_counts: {},
    recommended_offer_counts: {},
    priority_queue: [],
    last7Days: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetchLeadPipelineSummary({ limit: 25, offset: 0 });
      setSummary(response.summary || {});
      setError("");
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError(getLeadPipelineError(err, "Unable to load lead analytics right now."));
    } finally {
      setLoading(false);
    }
  };

  const totalLeads = summary.total_leads || 0;
  const booked = summary.status_counts?.Booked || 0;
  const qualified = summary.status_counts?.Qualified || 0;
  const bookedRate = totalLeads > 0 ? Math.round((booked / totalLeads) * 100) : 0;
  const followUpDue = summary.segment_counts?.follow_up || 0;
  const demoRequested = summary.segment_counts?.demo_requested || 0;
  const awaitingClose = summary.segment_counts?.awaiting_close || 0;
  const highValueOutreach = summary.segment_counts?.high_value_outreach || 0;

  const pipelineData = [
    { name: "New", value: summary.status_counts?.New || 0, fill: "#3b82f6" },
    { name: "Contacted", value: summary.status_counts?.Contacted || 0, fill: "#8b5cf6" },
    { name: "Qualified", value: qualified, fill: "#10b981" },
    { name: "Booked", value: booked, fill: "#059669" },
  ];

  if (loading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground">Lead Analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Backend-derived lead counts and actionability across the canonical Leads pipeline.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard icon={TrendingUp} label="Booked Rate" value={`${bookedRate}%`} color="blue" />
        <MetricCard icon={Target} label="Qualified Leads" value={qualified} color="green" />
        <MetricCard icon={Clock} label="Follow-Up Due" value={followUpDue} color="purple" />
        <MetricCard icon={Flame} label="Awaiting Close" value={awaitingClose} color="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-6">
          <h3 className="mb-4 font-semibold text-foreground">Lead Volume (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={summary.last7Days || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip />
              <Bar dataKey="leads" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-white p-6">
          <h3 className="mb-4 font-semibold text-foreground">Pipeline Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pipelineData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                {pipelineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {pipelineData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  {item.name}
                </span>
                <span className="font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-6">
        <h3 className="mb-4 font-semibold text-foreground">Actionability Summary</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <SummaryValue
            label="Reactivation Ready"
            value={summary.segment_counts?.reactivation || 0}
            helper="Dormant leads available for Old Lead Reactivation."
          />
          <SummaryValue
            label="Nurture Ready"
            value={summary.segment_counts?.nurture || 0}
            helper="Leads that can feed nurture and follow-up services."
          />
          <SummaryValue
            label="High-Value Outreach"
            value={highValueOutreach}
            helper="High-score or high-intent leads worth immediate attention."
          />
          <SummaryValue
            label="Demo Requested"
            value={demoRequested}
            helper="Demo-booking leads still waiting on qualification or booking follow-up."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-6">
          <h3 className="mb-4 font-semibold text-foreground">Recommended Offer Mix</h3>
          <div className="grid grid-cols-2 gap-4">
            <SummaryValue
              label="Starter"
              value={summary.recommended_offer_counts?.starter_system || 0}
              helper="Response + booking fit."
            />
            <SummaryValue
              label="Growth"
              value={summary.recommended_offer_counts?.growth_system || 0}
              helper="Response + nurture fit."
            />
            <SummaryValue
              label="Pro"
              value={summary.recommended_offer_counts?.pro_system || 0}
              helper="Full-stack fit."
            />
            <SummaryValue
              label="Single Service"
              value={summary.recommended_offer_counts?.single_service || 0}
              helper="One clear first-service fit."
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-6">
          <h3 className="mb-4 font-semibold text-foreground">Priority Queue Snapshot</h3>
          <div className="space-y-3">
            {(summary.priority_queue || []).slice(0, 5).map((lead) => (
              <div key={lead.id} className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{lead.full_name}</p>
                    <p className="text-xs text-muted-foreground">{lead.business_name}</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-foreground">
                    {lead.activation_priority}
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium text-foreground">{lead.next_action?.label || "Review lead"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {lead.recommended_offer?.package_name || lead.recommended_offer?.primary_service_name || "No advisory offer"}
                </p>
              </div>
            ))}
            {!(summary.priority_queue || []).length ? (
              <p className="text-sm text-muted-foreground">No priority queue data yet.</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className={`rounded-xl border border-border p-4 ${colors[color]}`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium opacity-75">{label}</p>
        <Icon className="h-4 w-4 opacity-75" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function SummaryValue({ label, value, helper }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}
