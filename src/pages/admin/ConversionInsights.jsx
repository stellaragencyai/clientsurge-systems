// PL-87/PL-88 - GA4 wiring + structured data status page
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart3, TrendingUp, AlertCircle, Loader2, CheckCircle } from "lucide-react";

export default function ConversionInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.functions.invoke("getConversionInsights", {})
      .then(r => setData(r?.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center gap-2 py-20 justify-center text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" /> Loading conversion insights...
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
      <AlertCircle className="w-4 h-4" /> {error}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Conversion Insights</h2>
        <p className="text-sm text-muted-foreground mt-1">Funnel performance, drop-off analysis, and optimization recommendations.</p>
      </div>

      {/* GA4 Status */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Analytics Status</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "GA4 Active", ok: !!data?.ga4_active },
            { label: "Conversion Tracking", ok: !!data?.conversion_tracking_ready },
            { label: "Checkout Events", ok: !!data?.checkout_events_firing },
            { label: "Lead Events", ok: !!data?.lead_events_firing },
          ].map(item => (
            <div key={item.label} className={`rounded-lg p-3 border ${item.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {item.ok ? <CheckCircle className="w-3 h-3 text-green-600" /> : <AlertCircle className="w-3 h-3 text-red-600" />}
                <span className={`text-xs font-bold ${item.ok ? "text-green-700" : "text-red-700"}`}>{item.ok ? "Active" : "Inactive"}</span>
              </div>
              <p className="text-xs text-foreground font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel metrics */}
      {data?.funnel_stages && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Conversion Funnel</h3>
          </div>
          <div className="space-y-3">
            {data.funnel_stages.map((stage, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground w-28 shrink-0">{stage.name}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${stage.rate || 0}%` }} />
                </div>
                <span className="text-xs font-bold text-foreground w-10 text-right">{stage.rate?.toFixed(1) ?? 0}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {data?.recommendations?.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-3">Optimization Recommendations</h3>
          <div className="space-y-2">
            {data.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary font-bold">→</span>
                <span className="text-foreground">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!data && <p className="text-sm text-muted-foreground">No conversion data available yet. Check back once traffic is flowing.</p>}
    </div>
  );
}