import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import SetupRoadmapStepper from "@/components/setup/SetupRoadmapStepper";
import Navbar from "@/components/landing/Navbar";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";

const POLL_INTERVAL_MS = 30_000;

export default function SetupStatus() {
  const { orderId: routeOrderId } = useParams();
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = routeOrderId || urlParams.get("order_id");

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const fetchRecord = async () => {
    if (!orderId || orderId === "status") {
      setError("No order ID provided.");
      setLoading(false);
      return;
    }
    try {
      const results = await base44.entities.ClientInstallationOS.filter({ order_id: orderId });
      if (results && results.length > 0) {
        setRecord(results[0]);
        setError(null);
      } else {
        setError("No installation record found for this order. It may still be initializing — please check back in a few minutes.");
      }
    } catch (e) {
      setError("Unable to load your installation status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
    // Poll every 30 seconds for real-time updates
    pollRef.current = setInterval(fetchRecord, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [orderId]);

  return (
    <DemoBookingProvider>
      <div style={{ minHeight: "100vh", background: "#f5f7fc", fontFamily: "'Inter', sans-serif" }}>
        <Navbar />

        <div style={{ maxWidth: "680px", margin: "0 auto", padding: "clamp(5rem,10vw,7rem) 20px 60px" }}>

          {/* Back link */}
          <a
            href="/client-portal"
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              fontSize: "13px", fontWeight: "600", color: "#0088CC",
              textDecoration: "none", marginBottom: "24px",
              opacity: 0.8,
            }}
          >
            <ArrowLeft style={{ width: "14px", height: "14px" }} />
            Back to Portal
          </a>

          {/* Page title */}
          <div style={{ marginBottom: "28px" }}>
            <p style={{ fontSize: "11px", fontWeight: "700", color: "#00AEEF", textTransform: "uppercase", letterSpacing: "0.2em", margin: "0 0 6px" }}>
              ClientSurge Systems
            </p>
            <h1 style={{ fontSize: "clamp(1.6rem,5vw,2.2rem)", fontWeight: "800", color: "#0A1628", margin: 0, lineHeight: 1.2, fontFamily: "Montserrat, sans-serif" }}>
              Your Setup Roadmap
            </h1>
            {record?.business_name && (
              <p style={{ fontSize: "14px", color: "rgba(10,22,40,0.5)", margin: "6px 0 0" }}>
                {record.business_name}
              </p>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "60px 20px", background: "#ffffff", borderRadius: "20px",
              border: "1.5px solid rgba(0,174,239,0.12)",
              boxShadow: "0 4px 20px rgba(0,59,143,0.07)",
            }}>
              <Loader2 style={{ width: "32px", height: "32px", color: "#0088CC", animation: "roadmap-spin 1s linear infinite", marginBottom: "14px" }} />
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#0A1628", margin: "0 0 4px" }}>Loading your roadmap…</p>
              <p style={{ fontSize: "12px", color: "rgba(10,22,40,0.45)", margin: 0 }}>Fetching your installation status</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "48px 24px", background: "#ffffff", borderRadius: "20px",
              border: "1.5px solid rgba(239,68,68,0.18)",
              boxShadow: "0 4px 20px rgba(0,59,143,0.07)",
              textAlign: "center",
            }}>
              <AlertCircle style={{ width: "28px", height: "28px", color: "#ef4444", marginBottom: "12px" }} />
              <p style={{ fontSize: "14px", fontWeight: "700", color: "#0A1628", margin: "0 0 6px" }}>Can't load installation record</p>
              <p style={{ fontSize: "13px", color: "rgba(10,22,40,0.55)", margin: "0 0 20px", lineHeight: 1.6, maxWidth: "420px" }}>{error}</p>
              <button
                onClick={fetchRecord}
                style={{
                  padding: "10px 24px", borderRadius: "9999px", border: "1.5px solid rgba(0,136,204,0.3)",
                  background: "rgba(0,136,204,0.06)", color: "#0088CC", fontWeight: "700", fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Main stepper */}
          {!loading && !error && record && (
            <div style={{
              borderRadius: "20px",
              border: "1.5px solid rgba(0,174,239,0.15)",
              boxShadow: "0 6px 32px rgba(0,59,143,0.09)",
              overflow: "hidden",
            }}>
              <SetupRoadmapStepper record={record} />
            </div>
          )}

          {/* Order ID footer */}
          {orderId && orderId !== "status" && (
            <p style={{ textAlign: "center", fontSize: "11px", color: "rgba(10,22,40,0.3)", marginTop: "20px" }}>
              Order ID: {orderId} · Updates automatically every 30 seconds
            </p>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes roadmap-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }` }} />
    </DemoBookingProvider>
  );
}