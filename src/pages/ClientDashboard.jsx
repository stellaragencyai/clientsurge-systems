import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SystemProgressTracker from "@/components/dashboard/SystemProgressTracker";
import NextActionsPanel from "@/components/dashboard/NextActionsPanel";
import HorizontalStageTracker from "@/components/dashboard/HorizontalStageTracker";
import { Loader2 } from "lucide-react";

export default function ClientDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const user = await base44.auth.me();
        if (!user) {
          setError("Please log in to view your dashboard.");
          return;
        }

        setUserEmail(user.email);

        // Fetch orders for this user
        const result = await base44.entities.Order.filter({
          customer_email: user.email,
        });

        setOrders(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Unable to load dashboard. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const activeServices = [];
  orders.forEach((order) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item) => {
        if (item.service_key && order.order_status !== "cancelled") {
          activeServices.push({
            serviceKey: item.service_key,
            productName: item.product_name,
            orderId: order.id,
            orderStatus: order.order_status,
            paymentStatus: order.payment_status,
          });
        }
      });
    }
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, paddingTop: "80px" }}>
        <section style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ marginBottom: "40px" }}>
            <h1 style={{ fontSize: "36px", fontWeight: "800", color: "#1b140d", margin: "0 0 8px" }}>
              Your Installation Dashboard
            </h1>
            <p style={{ fontSize: "16px", color: "rgba(27,20,13,0.6)", margin: 0 }}>
              Track your AI automation systems and next steps
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <Loader2 style={{ width: "32px", height: "32px", color: "#9a5c2e", margin: "0 auto", animation: "spin 1s linear infinite" }} />
              <p style={{ marginTop: "16px", color: "rgba(27,20,13,0.6)" }}>Loading your dashboard...</p>
            </div>
          ) : error ? (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
              <p style={{ color: "#dc2626", fontWeight: "600" }}>{error}</p>
            </div>
          ) : activeServices.length === 0 ? (
            <div style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(154,92,46,0.12)", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
              <p style={{ fontSize: "16px", color: "rgba(27,20,13,0.6)", margin: 0 }}>
                You don't have any active orders yet.{" "}
                <a href="/store" style={{ color: "#9a5c2e", fontWeight: "600", textDecoration: "none" }}>
                  Browse the AI Store
                </a>
              </p>
            </div>
          ) : (
            <>
              {/* Primary stage tracker for first service */}
              <HorizontalStageTracker
                serviceKey={activeServices[0].serviceKey}
                currentStage={
                  activeServices[0].orderStatus === "active"
                    ? 4
                    : activeServices[0].orderStatus === "in_progress"
                    ? 3
                    : activeServices[0].paymentStatus === "paid"
                    ? 2
                    : 1
                }
                productName={activeServices[0].productName}
              />

              {/* Remaining services in grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: "32px" }}>
                {activeServices.map((service, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderRadius: "16px",
                      background: "rgba(255,255,255,0.82)",
                      border: "1px solid rgba(148, 163, 184, 0.18)",
                      padding: "24px",
                      boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)",
                    }}
                  >
                    <div style={{ marginBottom: "16px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1b140d", margin: "0 0 4px" }}>
                        {service.productName}
                      </h3>
                      <p style={{ fontSize: "12px", color: "rgba(27,20,13,0.5)", margin: 0 }}>
                        Order: {service.orderId.slice(0, 8)}... •{" "}
                        <span style={{ color: service.paymentStatus === "paid" ? "#22c55e" : "#f59e0b" }}>
                          {service.paymentStatus === "paid" ? "Paid" : "Pending"}
                        </span>
                      </p>
                    </div>

                    <SystemProgressTracker serviceKey={service.serviceKey} currentStage={service.orderStatus === "active" ? 3 : service.orderStatus === "in_progress" ? 2 : 1} />

                    <NextActionsPanel serviceKey={service.serviceKey} />
                  </div>
                ))}
              </div>
            </>
          )}

          {orders.length > 0 && (
            <div style={{ marginTop: "40px", padding: "24px", borderRadius: "16px", background: "rgba(154,92,46,0.08)", border: "1px solid rgba(154,92,46,0.15)" }}>
              <p style={{ fontSize: "13px", color: "#9a5c2e", margin: 0 }}>
                <strong>Need help?</strong> Contact our onboarding team at{" "}
                <a href="mailto:support@clientsurgesystems.com" style={{ color: "#9a5c2e", fontWeight: "600", textDecoration: "none" }}>
                  support@clientsurgesystems.com
                </a>
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}