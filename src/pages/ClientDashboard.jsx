import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import HorizontalStageTracker from "@/components/dashboard/HorizontalStageTracker";
import ServiceCard from "@/components/dashboard/ServiceCard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Loader2, ShoppingBag, Mail, Phone, MessageCircle } from "lucide-react";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";

function LoadingState() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{
        width: "64px", height: "64px", borderRadius: "16px",
        background: "linear-gradient(135deg,rgba(154,92,46,0.1),rgba(200,150,92,0.05))",
        border: "1px solid rgba(154,92,46,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px",
      }}>
        <Loader2 style={{ width: "28px", height: "28px", color: "#9a5c2e", animation: "spin 1s linear infinite" }} />
      </div>
      <p style={{ fontSize: "15px", fontWeight: "600", color: "#1b140d", margin: "0 0 4px" }}>Loading your dashboard…</p>
      <p style={{ fontSize: "13px", color: "rgba(27,20,13,0.5)", margin: 0 }}>Fetching your orders and installation status</p>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div style={{
      background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
      borderRadius: "16px", padding: "32px", textAlign: "center",
    }}>
      <p style={{ fontSize: "16px", fontWeight: "700", color: "#dc2626", margin: "0 0 8px" }}>⚠ Unable to Load Dashboard</p>
      <p style={{ fontSize: "14px", color: "rgba(27,20,13,0.6)", margin: 0 }}>{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      borderRadius: "20px", textAlign: "center", padding: "60px 32px",
      background: "rgba(255,255,255,0.85)",
      border: "1px solid rgba(154,92,46,0.1)",
      boxShadow: "0 4px 24px rgba(15,23,42,0.06)",
    }}>
      <div style={{
        width: "72px", height: "72px", borderRadius: "20px", margin: "0 auto 20px",
        background: "linear-gradient(135deg,rgba(154,92,46,0.1),rgba(200,150,92,0.06))",
        border: "1px solid rgba(154,92,46,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <ShoppingBag style={{ width: "32px", height: "32px", color: "#9a5c2e" }} />
      </div>
      <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#1b140d", margin: "0 0 8px" }}>No Services Yet</h3>
      <p style={{ fontSize: "14px", color: "rgba(27,20,13,0.55)", margin: "0 0 24px", maxWidth: "360px", display: "inline-block", lineHeight: 1.6 }}>
        You don't have any active orders yet. Browse our AI automation store to get started.
      </p>
      <a
        href="/store"
        style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "12px 28px", borderRadius: "9999px",
          background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)",
          color: "#f5e6d0", fontWeight: "700", fontSize: "14px",
          textDecoration: "none", boxShadow: "0 4px 18px rgba(120,70,20,0.28)",
        }}
      >
        Browse the AI Store →
      </a>
    </div>
  );
}

function SupportCard() {
  return (
    <div style={{
      borderRadius: "16px",
      background: "linear-gradient(135deg, rgba(154,92,46,0.07) 0%, rgba(200,150,92,0.04) 100%)",
      border: "1px solid rgba(154,92,46,0.14)",
      padding: "24px 28px",
      marginTop: "32px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: "16px",
    }}>
      <div>
        <p style={{ fontSize: "13px", fontWeight: "800", color: "#9a5c2e", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>
          Need Help?
        </p>
        <p style={{ fontSize: "15px", fontWeight: "700", color: "#1b140d", margin: "0 0 2px" }}>
          Our onboarding team is here for you
        </p>
        <p style={{ fontSize: "13px", color: "rgba(27,20,13,0.55)", margin: 0 }}>
          Average response time: under 4 hours
        </p>
      </div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {[
          { icon: Mail, label: "Email Support", href: "mailto:support@clientsurgesystems.com" },
          { icon: Phone, label: "(602) 587-4608", href: "tel:+16025874608" },
        ].map(({ icon: Icon, label, href }) => (
          <a key={label} href={href} style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "9px 16px", borderRadius: "9999px",
            background: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(154,92,46,0.18)",
            color: "#9a5c2e", fontWeight: "600", fontSize: "13px",
            textDecoration: "none", transition: "all 0.2s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(154,92,46,0.15)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.85)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <Icon style={{ width: "14px", height: "14px" }} />
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

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
        if (!user) { setError("Please log in to view your dashboard."); return; }
        setUserEmail(user.email);
        const result = await base44.entities.Order.filter({ customer_email: user.email });
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
    <DemoBookingProvider>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(180deg, #fdfbf8 0%, #f8f3eb 50%, #fdfbf8 100%)" }}>
        <Navbar />

        <main style={{ flex: 1, paddingTop: "72px" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "clamp(24px,4vw,48px) clamp(16px,4vw,32px)" }}>

            {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
              <>
                <DashboardHeader userEmail={userEmail} activeServices={activeServices} orders={orders} />

                {activeServices.length === 0 ? <EmptyState /> : (
                  <>
                    {/* Primary service — full stage tracker */}
                    <HorizontalStageTracker
                      serviceKey={activeServices[0].serviceKey}
                      currentStage={
                        activeServices[0].orderStatus === "active" ? 4
                        : activeServices[0].orderStatus === "in_progress" ? 2
                        : activeServices[0].paymentStatus === "paid" ? 1 : 0
                      }
                      productName={activeServices[0].productName}
                    />

                    {/* All service cards */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))",
                      gap: "20px",
                    }}>
                      {activeServices.map((service, idx) => (
                        <ServiceCard key={idx} service={service} />
                      ))}
                    </div>

                    <SupportCard />
                  </>
                )}
              </>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </DemoBookingProvider>
  );
}