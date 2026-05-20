/**
 * RevenueMetricsPanel — #314
 * Reads from real Order entities. Falls back to zeros if fetch fails.
 * NO mock data.
 */
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function RevenueMetricsPanel() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Real data from Order entities
        const res = await base44.functions.invoke("getClientAnalytics", {});
        if (res?.metrics) {
          setMetrics(res.metrics);
        } else {
          // Fallback: compute from Orders directly
          const orders = await base44.functions.invoke("listOrders", { payment_status: "paid" }).catch(() => ({ orders: [] }));
          const paid = orders?.orders || [];
          setMetrics({
            mrr: paid.reduce((s, o) => s + (o.monthly_rate || 0), 0),
            total_clients: paid.length,
            setup_revenue: paid.reduce((s, o) => s + (o.setup_fee || 0), 0),
            arr: paid.reduce((s, o) => s + ((o.monthly_rate || 0) * 12), 0),
          });
        }
      } catch {
        // #314: zero-state fallback — never show mock data
        setMetrics({ mrr: 0, total_clients: 0, setup_revenue: 0, arr: 0 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ color: "#9CA3AF", padding: 24 }}>Loading revenue metrics...</div>;
  if (!metrics) return null;

  const cards = [
    { label: "MRR", value: `$${(metrics.mrr || 0).toLocaleString()}` },
    { label: "ARR", value: `$${(metrics.arr || 0).toLocaleString()}` },
    { label: "Active Clients", value: metrics.total_clients || 0 },
    { label: "Setup Revenue", value: `$${(metrics.setup_revenue || 0).toLocaleString()}` },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
      {cards.map(({ label, value }) => (
        <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 20px" }}>
          <p style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 600, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
          <p style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: 0 }}>{value}</p>
        </div>
      ))}
    </div>
  );
}
