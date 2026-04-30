import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, DollarSign, Target, Zap, Loader2 } from "lucide-react";

export default function RevenueAttributionDashboard({ projectId }) {
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState("this_month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke("getRevenueAnalytics", {
        project_id: projectId,
        period,
      });
      if (result.data?.success) {
        setAnalytics(result.data);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        <p className="text-muted-foreground">Loading revenue analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">No revenue data yet</p>
      </div>
    );
  }

  const { by_source, summary } = analytics;

  // Sort sources by revenue
  const sortedSources = Object.entries(by_source).sort(
    ([, a], [, b]) => b.total_revenue - a.total_revenue
  );

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {["today", "this_week", "this_month", "all_time"].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              period === p
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border hover:border-primary/50"
            }`}
          >
            {p === "today"
              ? "Today"
              : p === "this_week"
              ? "This Week"
              : p === "this_month"
              ? "This Month"
              : "All Time"}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Total Revenue
            </p>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            ${summary.total_revenue.toLocaleString()}
          </p>
        </div>

        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Leads Captured
            </p>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            {summary.total_leads}
          </p>
        </div>

        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Booking Rate
            </p>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            {summary.overall_booking_rate}%
          </p>
        </div>

        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Avg Lead Value
            </p>
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            ${parseFloat(summary.average_lead_value).toFixed(0)}
          </p>
        </div>
      </div>

      {/* By Source Breakdown */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-foreground">Revenue by Source</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left font-semibold text-foreground">
                  Source
                </th>
                <th className="px-6 py-3 text-right font-semibold text-foreground">
                  Leads
                </th>
                <th className="px-6 py-3 text-right font-semibold text-foreground">
                  Booked
                </th>
                <th className="px-6 py-3 text-right font-semibold text-foreground">
                  Rate
                </th>
                <th className="px-6 py-3 text-right font-semibold text-foreground">
                  Revenue
                </th>
                <th className="px-6 py-3 text-right font-semibold text-foreground">
                  Avg LTV
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedSources.map(([source, stats]) => (
                <tr key={source} className="border-b border-border hover:bg-muted/50">
                  <td className="px-6 py-4 font-medium text-foreground capitalize">
                    {source}
                  </td>
                  <td className="px-6 py-4 text-right text-muted-foreground">
                    {stats.total_leads}
                  </td>
                  <td className="px-6 py-4 text-right text-muted-foreground">
                    {stats.booked_leads}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-semibold">
                      {stats.booking_rate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-foreground">
                    ${stats.total_revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-muted-foreground">
                    ${parseFloat(stats.average_ltv).toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performer */}
      {sortedSources.length > 0 && (
        <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-primary uppercase mb-2">
                Top Performing Source
              </p>
              <p className="text-2xl font-bold text-foreground capitalize">
                {sortedSources[0][0]}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                ${sortedSources[0][1].total_revenue.toLocaleString()} revenue •{" "}
                {sortedSources[0][1].booking_rate}% conversion
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
        </div>
      )}
    </div>
  );
}