import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Wrench,
} from "lucide-react";
import InstallOrderWorkspace from "./InstallOrderWorkspace";
import {
  INSTALL_QUEUE_PRIMARY_ACTION_LABEL,
  INSTALL_QUEUE_REFRESH_MS,
  resolveSelectedInstallOrderId,
} from "@/lib/installQueueConfig";
import { buildBillingSummary, formatBillingDate } from "@/lib/billingSummary";

const STATUS_COLORS = {
  Paid: "bg-blue-50 border-blue-200",
  "Ready for Install": "bg-amber-50 border-amber-200",
  Configuring: "bg-purple-50 border-purple-200",
  Testing: "bg-cyan-50 border-cyan-200",
  Live: "bg-green-50 border-green-200",
  Error: "bg-red-50 border-red-200",
};

const STATUS_ICONS = {
  Paid: Clock,
  "Ready for Install": Clock,
  Configuring: Loader2,
  Testing: Clock,
  Live: CheckCircle2,
  Error: AlertCircle,
};

function OrderRow({ order, selected, onSelect }) {
  const StatusIcon = STATUS_ICONS[order.pipeline_status] || Clock;
  const trackedServices = order.items || [];
  const incompleteServices = trackedServices.filter(
    (item) => item.install_status !== "Live"
  ).length;
  const billing = buildBillingSummary({ order });
  const interactive = typeof onSelect === "function";
  const Element = interactive ? "button" : "div";

  return (
    <Element
      {...(interactive
        ? {
            type: "button",
            onClick: () => onSelect(order.id),
          }
        : {})}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : STATUS_COLORS[order.pipeline_status] || "bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-white/80 p-2">
            <StatusIcon className="h-4 w-4 text-foreground/60" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{order.business_name}</p>
            <p className="text-xs text-muted-foreground">{order.customer_email}</p>
            <p className="text-xs text-muted-foreground">
              {trackedServices.length} tracked service{trackedServices.length === 1 ? "" : "s"}
              {incompleteServices > 0
                ? ` · ${incompleteServices} still need install work`
                : " · all tracked services are live"}
            </p>
            <p className="text-xs text-muted-foreground">
              {billing.currentPlan} · Subscription {billing.subscriptionStatus} · Billing {billing.billingStatus}
              {billing.renewalDate ? ` · Renews ${formatBillingDate(billing.renewalDate)}` : ""}
            </p>
            {billing.warnings.length > 0 ? (
              <p className="text-xs font-semibold text-amber-700">
                {billing.warnings.join(" · ")}
              </p>
            ) : null}
          </div>
        </div>
        <span className="rounded-full border border-current/10 bg-white/70 px-2.5 py-1 text-[11px] font-semibold">
          {order.pipeline_status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {trackedServices.map((item) => (
          <span
            key={item.service_key}
            className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-foreground/80"
          >
            {item.display_name || item.product_name} · {item.install_status || "Paid"}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-current/10 pt-3">
        <div className="text-[11px] text-muted-foreground">
          Order {order.id.slice(0, 8)} · Created {new Date(order.created_date).toLocaleDateString()}
        </div>
        {interactive ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-primary">
            <Wrench className="h-3 w-3" />
            {selected ? "Workspace Open" : INSTALL_QUEUE_PRIMARY_ACTION_LABEL}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
            Queue summary only
          </span>
        )}
      </div>
    </Element>
  );
}

export default function InstallQueuePanel({
  selectedOrderId = "",
  onSelectOrder,
  showWorkspace = false,
}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadQueue = async () => {
    try {
      const result = await base44.functions.invoke("listInstallQueue", {});
      setOrders(result.orders || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, INSTALL_QUEUE_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const resolvedSelectedOrderId = useMemo(
    () => resolveSelectedInstallOrderId(orders, selectedOrderId),
    [orders, selectedOrderId]
  );

  useEffect(() => {
    if (
      showWorkspace &&
      resolvedSelectedOrderId &&
      resolvedSelectedOrderId !== selectedOrderId
    ) {
      onSelectOrder?.(resolvedSelectedOrderId);
    }
  }, [onSelectOrder, resolvedSelectedOrderId, selectedOrderId, showWorkspace]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border bg-white p-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
        <Clock className="mx-auto mb-3 h-12 w-12 opacity-30" />
        <p className="font-medium">No orders in install queue</p>
        <p className="mt-1 text-sm">Paid orders appear here after canonical payment and install initialization.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Canonical Install Queue</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a paid order to open the canonical install workspace. Status changes, testing, AI setup assist, the event timeline, and billing truth now run only through the guarded install and billing APIs.
            </p>
          </div>
          <button
            type="button"
            onClick={loadQueue}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Queue
          </button>
        </div>
      </div>

      <div className={showWorkspace ? "grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]" : "space-y-4"}>
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              selected={resolvedSelectedOrderId === order.id}
              onSelect={showWorkspace ? (orderId) => onSelectOrder?.(orderId) : null}
            />
          ))}
        </div>

        {showWorkspace ? (
          <InstallOrderWorkspace
            orderId={resolvedSelectedOrderId}
            onQueueRefresh={loadQueue}
          />
        ) : null}
      </div>
    </div>
  );
}
