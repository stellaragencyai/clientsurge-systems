import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertCircle, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import InstallOrderWorkspace from "./InstallOrderWorkspace";
import { getPackageDisplayLabel } from "@/lib/aiProducts";

const STATUS_STYLES = {
  Paid: "bg-slate-100 text-slate-700",
  "Ready for Install": "bg-blue-50 text-blue-700",
  Configuring: "bg-amber-50 text-amber-700",
  Testing: "bg-purple-50 text-purple-700",
  Live: "bg-green-50 text-green-700",
  Error: "bg-red-50 text-red-700",
};

function StatusBadge({ value }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[value] || "bg-slate-100 text-slate-700"}`}>
      {value}
    </span>
  );
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString();
}

export default function InstallQueuePanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const loadQueue = async () => {
    try {
      setError("");
      setLoading(true);
      const response = await base44.functions.invoke("listInstallQueue", {});
      const nextOrders = response.data?.orders || [];
      setOrders(nextOrders);
      setSelectedOrderId((current) => {
        if (nextOrders.length === 0) {
          return "";
        }

        if (current && nextOrders.some((order) => order.id === current)) {
          return current;
        }

        return nextOrders[0].id;
      });
    } catch (err) {
      setError(err?.message || "Unable to load install queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const queueStats = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.total += 1;
        if (order.pipeline_status === "Error") acc.error += 1;
        if (order.pipeline_status === "Live") acc.live += 1;
        if (order.pipeline_status === "Testing") acc.testing += 1;
        if (order.items.some((item) => !item.configuration_complete)) acc.needsConfig += 1;
        return acc;
      },
      { total: 0, error: 0, live: 0, testing: 0, needsConfig: 0 }
    );
  }, [orders]);

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">Paid Install Queue</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Existing canonical post-payment install queue derived from paid orders.
          </p>
        </div>
        <button
          onClick={loadQueue}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <MetricCard label="Queue" value={queueStats.total} />
        <MetricCard label="Needs Config" value={queueStats.needsConfig} tone="amber" />
        <MetricCard label="Testing" value={queueStats.testing} tone="purple" />
        <MetricCard label="Errors" value={queueStats.error} tone="red" />
        <MetricCard label="Live" value={queueStats.live} tone="green" />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-muted-foreground">
          No paid orders currently need tracked installation work.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="space-y-4">
            {orders.map((order) => {
              const isSelected = order.id === selectedOrderId;
              const incompleteServices = order.items.filter((item) => !item.configuration_complete);

              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition-all ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/10"
                      : "border-border hover:border-primary/40 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">{order.business_name}</h3>
                        <StatusBadge value={order.pipeline_status} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {order.customer_name} - {order.customer_email}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Setup ${formatMoney(order.total_setup)} - Monthly ${formatMoney(order.total_monthly)}/mo
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Subscription: <span className="font-semibold capitalize text-foreground">{order.subscription_status || "pending"}</span>
                        {order.current_period_end ? ` · Renews ${new Date(order.current_period_end).toLocaleDateString()}` : ""}
                      </p>
                      <p className="mt-1 text-xs font-medium text-foreground/70">
                        {getPackageDisplayLabel(order.pricing_summary)}
                      </p>
                    </div>
                    <ChevronRight className={`mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground ${isSelected ? "text-primary" : ""}`} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {order.items.map((item) => (
                      <span
                        key={`${order.id}:${item.service_key}`}
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          item.configuration_complete ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {item.display_name}: {item.install_status}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <SummaryTile
                      label="Config"
                      value={`${order.items.length - incompleteServices.length}/${order.items.length} ready`}
                      helper={
                        incompleteServices.length > 0
                          ? `${incompleteServices.length} service${incompleteServices.length === 1 ? "" : "s"} missing required fields`
                          : "All tracked services configured"
                      }
                    />
                    <SummaryTile
                      label="Package / Records"
                      value={order.pricing_summary?.package_name || "Custom bundle"}
                      helper={`${order.pricing_summary?.package_service_keys?.length || order.items.length} installable service(s) | ${order.plan_type || "No plan"} | Project ${order.client_project_id || "pending"} - Onboarding ${order.onboarding_client_id || "pending"}`}
                    />
                  </div>

                  {incompleteServices.length > 0 && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-semibold text-amber-900">Missing configuration</p>
                      <p className="mt-1 text-xs text-amber-800">
                        {Array.from(
                          new Set(
                            incompleteServices.flatMap((item) => item.missing_configuration_labels || [])
                          )
                        ).join(", ")}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <InstallOrderWorkspace orderId={selectedOrder?.id || ""} onQueueRefresh={loadQueue} />
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, tone = "default" }) {
  const tones = {
    default: "bg-slate-50 text-slate-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700",
    red: "bg-red-50 text-red-700",
    green: "bg-green-50 text-green-700",
  };

  return (
    <div className={`rounded-xl border border-border p-4 ${tones[tone]}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}

function SummaryTile({ label, value, helper }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}
