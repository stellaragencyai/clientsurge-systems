/**
 * WebsiteSpecPreview.jsx — #420 #420a
 * Page: /setup/preview/[order_id]
 * Shows AI-generated WebsiteSpec as visual mockup with approve button.
 * #420a: approve handler sets status="approved", advances workflow.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function WebsiteSpecPreview() {
  const { order_id } = useParams();
  const navigate = useNavigate();
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("getWebsiteSpec", { order_id });
        if (res?.spec) setSpec(res.spec);
      } catch {} finally { setLoading(false); }
    })();
  }, [order_id]);

  // #420a: approve handler
  const handleApprove = async () => {
    setApproving(true);
    try {
      await base44.functions.invoke("applyWebsiteSpec", { order_id });
      setApproved(true);
      setTimeout(() => navigate(`/setup/status/${order_id}`), 2000);
    } catch (e) {
      alert("Error approving spec. Please try again.");
    } finally { setApproving(false); }
  };

  if (loading) return <div style={{ color: "#9CA3AF", padding: 60, textAlign: "center" }}>Loading your website preview...</div>;

  const pages = spec?.pages ? (typeof spec.pages === "string" ? JSON.parse(spec.pages) : spec.pages) : [];
  const brand = spec?.brand ? (typeof spec.brand === "string" ? JSON.parse(spec.brand) : spec.brand) : {};

  if (approved) return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h2 style={{ color: "#00FFB3", fontSize: 22, fontWeight: 800 }}>Spec approved!</h2>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>Building your site now...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", padding: "40px 20px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Your Website Plan</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            Review the structure below, then approve to start building.
          </p>
        </div>

        {/* Brand card */}
        <div style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.12)", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
          <p style={{ color: "rgba(0,212,255,0.6)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 8px" }}>Brand</p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Business: <b style={{ color: "#fff" }}>{brand.business_name || "—"}</b></span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Tier: <b style={{ color: "#fff" }}>{spec?.package_key}</b></span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Color: <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", background: brand.primary_color || "#00D4FF", verticalAlign: "middle", margin: "0 4px" }} /><b style={{ color: "#fff" }}>{brand.primary_color || "#00D4FF"}</b></span>
          </div>
        </div>

        {/* Pages */}
        {pages.map((page, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 20px", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ background: "rgba(0,212,255,0.1)", color: "#00D4FF", borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>Page {i + 1}</span>
              <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>{page.name}</h3>
              <code style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginLeft: "auto" }}>{page.slug}</code>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(page.sections || []).map((s, j) => (
                <span key={j} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)", fontSize: 11, borderRadius: 6, padding: "3px 10px" }}>
                  {s.type}
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* Approve CTA */}
        <div style={{ marginTop: 28, textAlign: "center" }}>
          <button
            onClick={handleApprove}
            disabled={approving}
            style={{ background: approving ? "rgba(0,212,255,0.3)" : "linear-gradient(135deg,#00D4FF,#00FFB3)", color: "#0A0F1E", border: "none", borderRadius: 9999, padding: "14px 36px", fontSize: 15, fontWeight: 800, cursor: approving ? "not-allowed" : "pointer", boxShadow: "0 8px 28px rgba(0,212,255,0.3)" }}>
            {approving ? "Approving..." : "✅ Approve & Start Building"}
          </button>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 10 }}>
            Need changes? Email nolan@clientsurgesystems.com before approving.
          </p>
        </div>
      </div>
    </div>
  );
}
