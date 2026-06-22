import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle2, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { getStalledInstallWarning } from "@/lib/installQueueStatus";
import { AssignToAdminDropdown, InstallCompletionDate } from "./AdminQueueEnhancements";

const STATUS_COLORS = {
  "Paid": "bg-blue-50 border-blue-200",
  "Ready for Install": "bg-amber-50 border-amber-200",
  "Configuring": "bg-purple-50 border-purple-200",
  "Testing": "bg-cyan-50 border-cyan-200",
  "Live": "bg-green-50 border-green-200",
  "Error": "bg-red-50 border-red-200",
};

const STATUS_ICONS = {
  "Paid": Clock,
  "Ready for Install": Clock,
  "Configuring": Loader2,
  "Testing": Clock,
  "Live": CheckCircle2,
  "Error": AlertCircle,
};

export default function InstallQueuePanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    try {
      const result = await base44.functions.invoke("installPipeline", {
        action: "list_queue",
      });
      setOrders(result.orders || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, serviceKey, newStatus) => {
    try {
      await base44.functions.invoke("installPipeline", {
        action: "update_status",
        order_id: orderId,
        service_key: serviceKey,
        install_status: newStatus,
      });
      await loadQueue();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAssignAdmin = (orderId, admin) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, assigned_admin: admin || "" } : order
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
        {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-600">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No orders in install queue</p>
        <p className="text-sm mt-1">Orders appear here after payment is completed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Install Queue</h3>
        <button
          onClick={loadQueue}
          type="button"
          title="Refresh install queue"
          aria-label="Refresh install queue"
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {orders.map((order) => {
        const StatusIcon = STATUS_ICONS[order.pipeline_status] || Clock;
        const stalledWarning = getStalledInstallWarning(order);
        return (
          <div
            key={order.id}
            className={`border rounded-lg p-4 space-y-3 ${
              STATUS_COLORS[order.pipeline_status] || "bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className="w-4 h-4 text-foreground/60" />
                <div>
                  <p className="font-semibold text-sm text-foreground">{order.business_name}</p>
                  <p className="text-xs text-foreground/60">{order.customer_email}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/50 border border-current/20">
                {order.pipeline_status}
              </span>
            </div>

            {stalledWarning && (
              <div
                title={stalledWarning.title}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {stalledWarning.label}
                <span className="font-medium text-amber-700">{stalledWarning.hoursSincePaid}h</span>
              </div>
            )}

            {/* Services */}
            <div className="space-y-2 border-t border-current/10 pt-3">
              {order.items?.map((item) => (
                <div key={item.service_key} className="flex items-center justify-between text-sm">
                  <span className="text-foreground/70">{item.product_name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      item.install_status === "Live"
                        ? "bg-green-500 text-white font-bold"
                        : item.install_status === "Testing"
                        ? "bg-cyan-100 text-cyan-800"
                        : item.install_status === "Configuring"
                        ? "bg-purple-100 text-purple-800"
                        : item.install_status === "Error"
                        ? "bg-red-100 text-red-800"
                        : "bg-white/40"
                    }`}>
                      {item.install_status === "Live" ? "✓ Live" : (item.install_status || "Paid")}
                    </span>
                    {item.install_status !== "Live" && item.install_status !== "Error" && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            order.id,
                            item.service_key,
                            item.install_status === "Testing" ? "Live" : "Testing"
                          )
                        }
                        className="text-xs px-2 py-0.5 rounded border border-current/30 hover:bg-white/30 transition-colors"
                      >
                        {item.install_status === "Testing" ? "Mark Live" : "Test"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Metadata */}
            <div className="text-xs text-foreground/50 border-t border-current/10 pt-2">
              <p>Order: {order.id.slice(0, 8)}</p>
              <p>Created: {new Date(order.created_date).toLocaleDateString()}</p>
              <p>
                Estimated completion:{" "}
                <InstallCompletionDate install_initialized_at={order.install_initialized_at} />
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-medium text-foreground/70">Assigned admin:</span>
                <AssignToAdminDropdown
                  order_id={order.id}
                  current_admin={order.assigned_admin || ""}
                  onAssign={(admin) => handleAssignAdmin(order.id, admin)}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}